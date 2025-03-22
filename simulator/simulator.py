#!/usr/bin/env python3
"""
MESSS - Machine Simulator WebSocket Server
Simulates real-time factory machine telemetry (temperature, rpm, power, cycle time, production counts).
Broadcasts telemetry to Backend and Frontend on port 8765.
"""

import os
import sys
from pathlib import Path

# Yerel venv'deki paketleri doğrudan sys.path'e ekle
_venv_libs = list((Path(__file__).parent / "venv" / "lib").glob("python*/site-packages"))
if _venv_libs and str(_venv_libs[0]) not in sys.path:
    sys.path.insert(0, str(_venv_libs[0]))

import asyncio
import json
import random
from datetime import datetime, timezone
import websockets

try:
    from pymongo import MongoClient
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

PORT = int(os.environ.get("SIMULATOR_PORT", 8765))
HOST = os.environ.get("SIMULATOR_HOST", "0.0.0.0")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/mes_db")
INTERVAL = float(os.environ.get("SIMULATOR_INTERVAL", 2.0))

# Fallback machines if MongoDB is not reachable
DEFAULT_MACHINES = [
    {
        "_id": "6acf994ae9e31660bd564cf3",
        "code": "CNC-001",
        "name": "CNC Torna",
        "type": "CNC",
        "status": "Operational"
    },
    {
        "_id": "6acf9d64a29c4f9f7a790d83",
        "code": "PRS-002",
        "name": "Hidrolik Pres",
        "type": "Press",
        "status": "Operational"
    },
    {
        "_id": "6acf9d64a29c4f9f7a790d86",
        "code": "LZR-003",
        "name": "Lazer Kesim Tezgahı",
        "type": "Laser",
        "status": "Operational"
    },
    {
        "_id": "6acf9d64a29c4f9f7a790d89",
        "code": "ENJ-004",
        "name": "Plastik Enjeksiyon",
        "type": "Injection",
        "status": "Operational"
    }
]

# In-memory dynamic states for machines
machine_states = {}
connected_clients = set()
_cached_client = None


def get_mongo_client():
    global _cached_client
    if not HAS_PYMONGO:
        return None
    if _cached_client is None:
        try:
            _cached_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            _cached_client.admin.command('ping')
        except Exception:
            _cached_client = None
    return _cached_client


def get_machines_from_db():
    """Fetch registered machines from MongoDB, fallback to defaults."""
    client = get_mongo_client()
    if client:
        try:
            db = client.get_database("mes_db")
            machines = list(db.machines.find({}))
            if machines:
                result = []
                for m in machines:
                    result.append({
                        "_id": str(m.get("_id")),
                        "code": m.get("code", "M-UNKNOWN"),
                        "name": m.get("name", "Unnamed Machine"),
                        "type": m.get("type", "General"),
                        "status": m.get("status", "Operational")
                    })
                return result
        except Exception as e:
            global _cached_client
            _cached_client = None

    return DEFAULT_MACHINES


def init_machine_state(m):
    """Initialize state tracking for a machine."""
    m_id = str(m["_id"])
    if m_id not in machine_states:
        # Initial production values based on machine type
        base_temp = 62.0 if m["type"] == "CNC" else (72.0 if m["type"] == "Injection" else 55.0)
        base_rpm = 2100 if m["type"] == "CNC" else (800 if m["type"] == "Press" else 1500)
        machine_states[m_id] = {
            "totalProduced": random.randint(120, 350),
            "rejectedCount": random.randint(2, 9),
            "temperature": base_temp,
            "rpm": base_rpm,
            "power": random.uniform(12.0, 22.0),
            "cycleTime": random.uniform(32.0, 48.0),
            "status": "Running"
        }


def generate_machine_metrics(machines):
    """Generate realistic synthetic metrics for all machines."""
    data = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for m in machines:
        m_id = str(m["_id"])
        init_machine_state(m)
        st = machine_states[m_id]

        # Simulate small random walks for live gauges
        st["temperature"] = round(max(30.0, min(95.0, st["temperature"] + random.uniform(-0.9, 0.9))), 1)
        st["rpm"] = max(0, min(3500, int(st["rpm"] + random.randint(-35, 35))))
        st["power"] = round(max(0.5, min(35.0, st["power"] + random.uniform(-0.6, 0.6))), 1)
        st["cycleTime"] = round(max(20.0, min(80.0, st["cycleTime"] + random.uniform(-0.4, 0.4))), 1)

        # 95% Running, occasional Idle
        if random.random() < 0.03:
            st["status"] = random.choice(["Running", "Operational", "Idle"])
        elif st["status"] == "Idle" and random.random() < 0.35:
            st["status"] = "Running"

        # Production increment
        if st["status"] in ["Running", "Operational"] and random.random() < 0.70:
            st["totalProduced"] += 1
            if random.random() < 0.03:  # 3% defect rate
                st["rejectedCount"] += 1

        # Alarm active if temperature is abnormally high (>88°C)
        is_alarm = st["temperature"] > 88.0

        metric = {
            "machineId": m_id,
            "machineCode": m["code"],
            "machineName": m["name"],
            "machineType": m["type"],
            "status": st["status"],
            "temperature": st["temperature"],
            "rpm": st["rpm"],
            "power": st["power"],
            "cycleTime": st["cycleTime"],
            "totalProduced": st["totalProduced"],
            "rejectedCount": st["rejectedCount"],
            "isAlarmActive": is_alarm,
            "timestamp": now_iso
        }
        data.append(metric)

    return data


async def client_handler(websocket):
    """Handle new client connections."""
    connected_clients.add(websocket)
    client_ip = getattr(websocket, "remote_address", ("unknown", 0))[0]
    print(f"✅ Yeni istemci bağlandı [{client_ip}] (Aktif İstemciler: {len(connected_clients)})")

    try:
        # Welcome message expected by frontend LiveDataContext
        await websocket.send(json.dumps({"message": "Connected to machine data server"}))

        async for message in websocket:
            try:
                msg_json = json.loads(message)
                if msg_json.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"❌ İstemci ayrıldı [{client_ip}] (Kalan: {len(connected_clients)})")


async def broadcast_loop():
    """Continuously broadcast simulated metrics to all connected clients."""
    print(f"🚀 Telemetri yayını başlatıldı (Aralık: {INTERVAL}s)...")
    loop_count = 0
    while True:
        try:
            machines = get_machines_from_db()
            metrics = generate_machine_metrics(machines)
            payload = json.dumps(metrics)

            loop_count += 1
            if loop_count % 15 == 0 and connected_clients:
                print(f"📡 [Canlı Telemetri] {len(metrics)} makine için veriler yayınlanıyor ({len(connected_clients)} bağlı istemci)")

            if connected_clients:
                to_remove = set()
                for ws in connected_clients:
                    try:
                        await ws.send(payload)
                    except Exception:
                        to_remove.add(ws)

                connected_clients.difference_update(to_remove)

        except Exception as e:
            print(f"Hata: {e}", file=sys.stderr)

        await asyncio.sleep(INTERVAL)


async def main():
    print("=" * 60)
    print(f"🏭 MESSS Makine Veri Simülatörü Başlatılıyor")
    print(f"📡 WebSocket Dinleniyor: ws://{HOST}:{PORT}")
    print(f"🗄️  MongoDB: {MONGO_URI}")
    print("=" * 60)

    async with websockets.serve(client_handler, HOST, PORT):
        await broadcast_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Simülatör durduruldu.")
