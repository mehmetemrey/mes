const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const notificationService = require('./services/notificationService');
const announcementService = require('./services/announcementService');
const metricsCollectionService = require('./services/metricsCollectionService');
const mongoose = require('mongoose');

dotenv.config();

connectDB();

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const jobOrderRoutes = require('./routes/jobOrders');
const machineRoutes = require('./routes/machines');
const productionStageRoutes = require('./routes/productionStages');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcements');
const productionLineRoutes = require('./routes/productionLine');
const mailRoutes = require('./routes/mail');
const contactRoutes = require('./routes/contactRoutes');
const reportsRoutes = require('./routes/reports');

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: message });
    }
  });
};

const generalLimiter = createRateLimit(
  15 * 60 * 1000,
  10000,
  'Too many requests from this IP, please try again later.'
);

const authLimiter = createRateLimit(
  15 * 60 * 1000,
  500,
  'Too many authentication attempts, please try again later.'
);

const machineDataLimiter = createRateLimit(
  1 * 60 * 1000,
  6000,
  'Too many machine data requests, please slow down.'
);

app.use(generalLimiter);

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

const getAllowedOrigins = () => {
  const defaultOrigins = [
    process.env.FRONTEND_URL || "http://localhost:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000"
  ];
  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    defaultOrigins.push(...customOrigins);
  }
  return defaultOrigins;
};

const socketOrigins = getAllowedOrigins();
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  socketOrigins.push("*");
}

const io = new Server(httpServer, {
  cors: {
    origin: socketOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

notificationService.setIO(io);
announcementService.setIO(io);

io.on('connection', (socket) => {
  const connectionTimeout = setTimeout(() => {
    socket.disconnect(true);
  }, 300000);

  socket.on('join-user-room', (userId) => {
    if (!userId || typeof userId !== 'string') {
      socket.emit('error', { message: 'Invalid user ID' });
      return;
    }
    socket.join(userId.toString());
  });

  socket.on('machine-anomaly', async (anomalyData) => {
    try {
      if (!anomalyData || !anomalyData.machineId || !anomalyData.anomalies) {
        socket.emit('anomaly-error', { message: 'Invalid anomaly data format' });
        return;
      }
      
      await notificationService.sendMachineAnomalyNotifications([{
        machineId: anomalyData.machineId,
        machineType: anomalyData.machineType,
        issues: anomalyData.anomalies,
        severity: anomalyData.severity,
        timestamp: anomalyData.timestamp
      }]);
      
      io.emit('machine-anomaly-broadcast', {
        ...anomalyData,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('anomaly-error', { message: 'Failed to process anomaly' });
    }
  });

  socket.on('monitor-production-line', async (lineData) => {
    try {
      if (!lineData || !lineData.lineId) {
        socket.emit('error', { message: 'Invalid production line data' });
        return;
      }

      const status = await notificationService.monitorProductionLine(
        lineData.lineId, 
        lineData.machineData
      );
      
      socket.emit('production-line-status', {
        lineId: lineData.lineId,
        status
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to monitor production line' });
    }
  });

  socket.on('machine-data-update', async (machineData) => {
    try {
      if (!machineData || (!Array.isArray(machineData) && !machineData.machineId)) {
        socket.emit('error', { message: 'Invalid machine data format' });
        return;
      }
      io.emit('machine-data-broadcast', machineData);
    } catch (error) {
      socket.emit('error', { message: 'Failed to process machine data' });
    }
  });

  socket.on('disconnect', () => {
    clearTimeout(connectionTimeout);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error.message);
  });
});

let isSimulatorConnected = false;
let hasLoggedSimulatorOffline = false;

const connectToSimulator = () => {
  const wsUrl = process.env.SIMULATOR_WS_URL || 'ws://localhost:8765';

  const ws = new WebSocket(wsUrl, {
    rejectUnauthorized: false,
    headers: {
      'User-Agent': 'MESSS-Backend',
    }
  });

  ws.on('open', () => {
    isSimulatorConnected = true;
    hasLoggedSimulatorOffline = false;
    console.log(`[Simulator] Connected to machine simulator at ${wsUrl}`);
  });

  let lastAnomalyCheck = 0;
  const ANOMALY_CHECK_INTERVAL = 300000;
  
  ws.on('message', (data) => {
    try {
      const machineData = JSON.parse(data);
      
      if (Array.isArray(machineData)) {
        machineData.forEach(machine => {
          if (machine && (machine.machineId || machine.machineCode)) {
            metricsCollectionService.updateMachineMetrics(machine);
          }
        });
      } else if (machineData && (machineData.machineId || machineData.machineCode)) {
        metricsCollectionService.updateMachineMetrics(machineData);
      }
      
      io.emit('machine-data-broadcast', machineData);
      
      const now = Date.now();
      if (now - lastAnomalyCheck > ANOMALY_CHECK_INTERVAL) {
        lastAnomalyCheck = now;
        const machineDataArray = Array.isArray(machineData) ? machineData : [machineData];
        notificationService.checkMachineAnomalies(machineDataArray).then(anomalies => {
          if (anomalies.length > 0) {
            io.emit('machine-anomalies-detected', anomalies);
          }
        }).catch(err => {
          console.error('Error checking anomalies:', err.message);
        });
      }
    } catch (error) {
      console.error('Error processing machine data:', error.message);
    }
  });
  
  ws.on('close', () => {
    if (isSimulatorConnected) {
      console.log('[Simulator] Disconnected from machine simulator. Retrying in background...');
      isSimulatorConnected = false;
    } else if (!hasLoggedSimulatorOffline) {
      console.log(`[Simulator] Machine simulator offline (${wsUrl}). Retrying in background...`);
      hasLoggedSimulatorOffline = true;
    }
    setTimeout(connectToSimulator, 5000);
  });
  
  ws.on('error', (error) => {
    if (error.code !== 'ECONNREFUSED' && !error.message?.includes('ECONNREFUSED')) {
      console.error('Simulator WebSocket error:', error.message);
    }
  });
};

connectToSimulator();

app.set('io', io);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = getAllowedOrigins();
    
    if (allowedOrigins.indexOf(origin) !== -1 || (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/job-orders', jobOrderRoutes);
app.use('/api/machines', machineDataLimiter, machineRoutes);
app.use('/api/production-stages', productionStageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/production-lines', productionLineRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      socketio: 'active',
      connectedClients: io.engine.clientsCount || 0
    },
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthcheck);
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Central error handling middleware
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err.message);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  metricsCollectionService.stopCollection();
  
  if (httpServer.listening) {
    httpServer.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  }
};

const PORT = process.env.PORT || 5055;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[MES Server] Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  
  setTimeout(() => {
    metricsCollectionService.startCollection();
    notificationService.startCooldownCleanup();
  }, 2000);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, httpServer, io };
