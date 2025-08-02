/**
 * Smart POS Server Startup Script
 * Starts the main backend server with all required middleware and routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');

// Import middleware
const { identifyDevice, apiLimiter } = require('./middleware/rateLimiter');
const helmetConfig = require('./middleware/helmetConfig');
const errorLogger = require('./middleware/errorLogger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmetConfig);
app.use(identifyDevice);
app.use(apiLimiter);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Smart POS API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Mobile scanner connection handling
const scannerRooms = new Map();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle mobile scanner room joining
    socket.on('join_scanner_room', (data) => {
        const { roomCode, deviceType, token } = data;
        
        if (!roomCode) {
            socket.emit('error', { message: 'Room code is required' });
            return;
        }
        
        socket.join(roomCode);
        
        // Store room info
        if (!scannerRooms.has(roomCode)) {
            scannerRooms.set(roomCode, {
                created: Date.now(),
                devices: new Map()
            });
        }
        
        const room = scannerRooms.get(roomCode);
        room.devices.set(socket.id, {
            deviceType: deviceType || 'unknown',
            token: token,
            connectedAt: Date.now()
        });
        
        // Notify room about new connection
        socket.to(roomCode).emit('device_connected', {
            roomCode,
            deviceId: socket.id,
            deviceType,
            connectedDevices: room.devices.size
        });
        
        socket.emit('scanner_room_joined', {
            roomCode,
            deviceId: socket.id,
            status: 'connected'
        });
        
        console.log(`Device ${socket.id} joined scanner room: ${roomCode}`);
    });
    
    // Handle scan data from mobile
    socket.on('scan_data', (data) => {
        const { roomCode, scanType, content, timestamp } = data;
        
        if (!roomCode || !content) {
            socket.emit('error', { message: 'Room code and scan content are required' });
            return;
        }
        
        // Broadcast scan to all devices in room except sender
        socket.to(roomCode).emit('scan_received', {
            roomCode,
            scanType: scanType || 'barcode',
            content,
            timestamp: timestamp || Date.now(),
            deviceId: socket.id
        });
        
        console.log(`Scan received in room ${roomCode}: ${content} (type: ${scanType})`);
    });
    
    // Handle heartbeat
    socket.on('heartbeat', (data) => {
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove from all scanner rooms
        for (const [roomCode, room] of scannerRooms) {
            if (room.devices.has(socket.id)) {
                room.devices.delete(socket.id);
                
                // Notify room about disconnection
                socket.to(roomCode).emit('device_disconnected', {
                    roomCode,
                    deviceId: socket.id,
                    connectedDevices: room.devices.size
                });
                
                // Clean up empty rooms
                if (room.devices.size === 0) {
                    scannerRooms.delete(roomCode);
                    console.log(`Scanner room ${roomCode} cleaned up`);
                }
                break;
            }
        }
    });
});

// Error handling middleware
app.use(errorLogger);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                    SMART POS SYSTEM                     ║
║                      SERVER STARTED                     ║
╠══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║   API Base URL: http://localhost:${PORT}/api                ║
║  Admin Dashboard: http://localhost:${PORT}/pages/admin-dashboard.html ║
║  POS System: http://localhost:${PORT}/pages/pos.html            ║
╠══════════════════════════════════════════════════════════╣
║  Features:                                               ║
║    REST API Server                                       ║
║    Socket.IO for real-time communication                 ║
║    Authentication & Authorization                        ║
║    File Upload Support                                   ║
║    Security Middleware                                   ║
║    Error Logging                                         ║
╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io };
