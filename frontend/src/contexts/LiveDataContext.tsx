import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import io from 'socket.io-client';
import { notification } from 'antd';
import { BellOutlined, WarningOutlined } from '@ant-design/icons';

export interface MachineMetrics {
  machineId: string;
  machineType: string;
  machineCode?: string;
  machineName?: string;
  status: string;
  temperature: number;
  rpm: number;
  power: number;
  cycleTime: number;
  totalProduced: number;
  rejectedCount: number;
  isAlarmActive: boolean;
  timestamp: string;
  [key: string]: string | number | boolean | undefined;
}

interface LiveDataContextType {
  liveMachineData: MachineMetrics[];
  isWebSocketConnected: boolean;
  isSocketIOConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined);

const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/`
  : 'ws://localhost:8765';
const SOCKETIO_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin
  : 'http://localhost:5055';

interface LiveDataProviderProps {
  children: ReactNode;
}

export const LiveDataProvider: React.FC<LiveDataProviderProps> = ({ children }) => {
  const [liveMachineData, setLiveMachineData] = useState<MachineMetrics[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isSocketIOConnected, setIsSocketIOConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  
  const liveMachineDataRef = useRef<MachineMetrics[]>([]);

  useEffect(() => {
    let websocket: WebSocket | null = null;
    let socketConnection: any = null;
    let reconnectTimeout: NodeJS.Timeout;
    let pingInterval: NodeJS.Timeout;

    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      websocket = new WebSocket(WEBSOCKET_URL);

      websocket.addEventListener('open', () => {
        setIsWebSocketConnected(true);
        setError(null);
        setConnectionStatus('connected');
        
        pingInterval = setInterval(() => {
          if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      });

      websocket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'ping') {
            websocket?.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          if (message.type === 'pong' || message.message === 'Connected to machine data server') {
            return;
          }

          let data: MachineMetrics[] = [];
          
          try {
            if (!message || (typeof message === 'object' && 'message' in message)) {
              return;
            }

            if (Array.isArray(message)) {
              data = message;
            } else if (message.data && Array.isArray(message.data)) {
              data = message.data;
            } else if (message.data) {
              data = [message.data];
            } else if (typeof message === 'object' && message.machineId) {
              data = [message];
            } else {
              return;
            }
            
            data = data.filter(item => {
              if (!item || typeof item !== 'object') return false;
              
              const hasRequiredFields = [
                'machineId',
                'machineType',
                'status',
                'temperature',
                'rpm',
                'power',
                'cycleTime',
                'totalProduced',
                'rejectedCount',
                'isAlarmActive',
                'timestamp'
              ].every(field => field in item);
              
              if (!hasRequiredFields) return false;
              
              const numericFields = ['temperature', 'rpm', 'power', 'cycleTime', 'totalProduced', 'rejectedCount'] as const;
              return numericFields.every(field => 
                typeof (item as any)[field] === 'number' && !isNaN((item as any)[field])
              );
            });
            
            if (data.length === 0) return;
            
            liveMachineDataRef.current = data;
            setLiveMachineData(data);
            setLastUpdate(new Date());
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

      websocket.addEventListener('error', () => {
        setError('WebSocket bağlantı hatası');
        setIsWebSocketConnected(false);
        setConnectionStatus('error');
      });

      websocket.addEventListener('close', (event) => {
        setIsWebSocketConnected(false);
        setConnectionStatus('disconnected');
        
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        
        if (!event.wasClean) {
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      });
    };

    const connectSocketIO = () => {
      socketConnection = io(SOCKETIO_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 0,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        forceNew: false
      });

      socketConnection.on('connect', () => {
        setIsSocketIOConnected(true);
      });

      socketConnection.on('connect_error', () => {
        setIsSocketIOConnected(false);
      });

      socketConnection.on('disconnect', () => {
        setIsSocketIOConnected(false);
      });

      socketConnection.on('machine-anomaly-broadcast', (anomalyData: any) => {
        notification.warning({
          message: `🚨 Sistem Geneli Uyarı - ${anomalyData.machineName || anomalyData.machineId}`,
          description: Array.isArray(anomalyData.anomalies) ? anomalyData.anomalies.join(', ') : 'Anomali tespit edildi',
          icon: <WarningOutlined />,
          duration: 8,
          placement: 'topRight',
        });
      });

      socketConnection.on('notification', (notificationData: any) => {
        notification.info({
          message: notificationData.title,
          description: notificationData.message,
          icon: <BellOutlined />,
          duration: 6,
          placement: 'topRight',
        });
      });
    };

    connectWebSocket();
    connectSocketIO();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);
      if (websocket) websocket.close(1000, 'Component unmounting');
      if (socketConnection) socketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    liveMachineDataRef.current = liveMachineData;
  }, [liveMachineData]);

  const contextValue: LiveDataContextType = {
    liveMachineData,
    isWebSocketConnected,
    isSocketIOConnected,
    error,
    lastUpdate,
    connectionStatus
  };

  return (
    <LiveDataContext.Provider value={contextValue}>
      {children}
    </LiveDataContext.Provider>
  );
};

export const useLiveData = (): LiveDataContextType => {
  const context = useContext(LiveDataContext);
  if (context === undefined) {
    throw new Error('useLiveData must be used within a LiveDataProvider');
  }
  return context;
};

export default LiveDataContext;
