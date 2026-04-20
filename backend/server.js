import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Authrouter from './routes/authRoutes.js';
import Userrouter from './routes/userRoutes.js';
import Messagerouter from './routes/messageRoutes.js';
import Servicesrouter from './routes/serviceRoutes.js';
import Orderrouter from './routes/orderRoutes.js';
import Message from './models/Message.js';
import 'dotenv/config'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    // 1. Database Connect
    await connectDB();

    const app = express();
    const httpServer = createServer(app);

    const PORT = process.env.PORT || 5000;

    // 2. Socket.io Setup
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'https://mern-seven-olive.vercel.app',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // 3. Middlewares
    app.use(cors({
        origin: process.env.CLIENT_URL || 'https://mern-seven-olive.vercel.app',
        credentials: true,
    }));
    app.use(express.json());

    // ✅ Socket.io instance ko routes mein use karne ke liye
    app.set('io', io);

    // 4. API Routes
    app.use('/api/auth', Authrouter);
    app.use('/api/users', Userrouter);
    app.use('/api/messages', Messagerouter);
    app.use('/api/services', Servicesrouter);
    app.use('/api/orders', Orderrouter);

    app.get('/', (req, res) => {
        res.json({ status: 'ok', message: 'Server is running smoothly' });
    });

    // 5. Socket.io Logic
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // User apne room mein join ho
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`👤 User joined room: ${userId}`);
        });

        // Admin dashboard room
        socket.on('admin_join', () => {
            socket.join('admin_dashboard');
            console.log('🛡️ Admin connected to dashboard');
        });

        // User ne message bheja
        socket.on('send_message', async (data) => {
            try {
                const { userId, sender, message } = data;

                // ✅ Validation
                if (!userId || !sender || !message) {
                    return socket.emit('error', { message: 'Missing required fields' });
                }

                const newMsg = await Message.create({ userId, sender, message });

                // User ko apna message wapis bhejo (confirmation)
                io.to(userId).emit('receive_message', newMsg);

                // Admin ko notify karo
                io.to('admin_dashboard').emit('receive_message_admin', newMsg);
            } catch (error) {
                console.error('❌ Socket error (send_message):', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Admin ne reply kiya
        socket.on('admin_reply', async (data) => {
            try {
                const { userId, message } = data;

                if (!userId || !message) {
                    return socket.emit('error', { message: 'Missing required fields' });
                }

                const newMsg = await Message.create({ userId, sender: 'admin', message });

                // User ko reply bhejo
                io.to(userId).emit('receive_message', newMsg);

                // Admin dashboard pe bhi show karo
                io.to('admin_dashboard').emit('receive_message_admin', newMsg);
            } catch (error) {
                console.error('❌ Socket error (admin_reply):', error);
                socket.emit('error', { message: 'Failed to send reply' });
            }
        });

        // Order status update
        socket.on('order_update', (data) => {
            const { userId, orderId, status } = data;
            if (!userId || !orderId || !status) return;
            io.to(userId).emit('order_updated', { orderId, status });
            console.log(`📦 Order ${orderId} updated to ${status} for user ${userId}`);
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { userId, sender, isTyping } = data;
            if (!userId || !sender) return;

            if (sender === 'user') {
                io.to('admin_dashboard').emit('user_typing', { userId, isTyping });
            } else {
                io.to(userId).emit('admin_typing', { isTyping });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Client disconnected: ${socket.id} — reason: ${reason}`);
        });

        // ✅ Socket error handler
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
    });

    // 6. Static Files (Production)
    if (process.env.NODE_ENV === 'production') {
        const distPath = path.join(__dirname, '../client/dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // 7. Server Start
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use.`);
            process.exit(1);
        } else {
            console.error(err);
        }
    });
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
});