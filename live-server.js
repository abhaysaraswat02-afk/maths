/**
 * ARROW OF MATHEMATICS - Live Class Server
 * WebSocket-based real-time live class engine
 * Supports 10,000+ concurrent users via horizontal scaling + Redis pub/sub
 * 
 * Architecture:
 * Client → Load Balancer → WebSocket Servers (N) → Redis Pub/Sub → Services → Firebase
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// ─── Redis Pub/Sub for Multi-Server Scaling ───────────────────────────────────
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

async function initRedis() {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log('✅ Redis adapter connected — multi-server mode ACTIVE');
}

// ─── Socket.IO with CORS ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  // Connection pooling
  maxHttpBufferSize: 1e6, // 1MB max message size
  connectTimeout: 10000,
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' }
});

app.use(express.json());
app.use('/api/', apiLimiter);

// ─── In-Memory Session Store (Replace with Redis in prod) ────────────────────
const activeSessions = new Map(); // sessionId → { teacherId, batchId, startTime, students }
const userSockets   = new Map(); // userId → socketId
const socketUsers   = new Map(); // socketId → userId

// ─── JWT Middleware for Socket.IO ─────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('AUTH_REQUIRED'));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arrow-math-secret-2025');
    socket.user = decoded; // { uid, name, role, email }
    next();
  } catch (err) {
    next(new Error('INVALID_TOKEN'));
  }
});

// ─── Connection Handler ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const { uid, name, role } = socket.user;
  
  // Track user ↔ socket mapping
  userSockets.set(uid, socket.id);
  socketUsers.set(socket.id, uid);
  
  console.log(`🟢 ${role.toUpperCase()} connected: ${name} (${uid})`);

  // ── JOIN LIVE CLASS ──
  socket.on('student:join', async ({ sessionId }) => {
    if (role !== 'student') return socket.emit('error', { code: 'FORBIDDEN' });
    
    const session = activeSessions.get(sessionId);
    if (!session) return socket.emit('error', { code: 'SESSION_NOT_FOUND' });
    if (session.isMuted && session.mutedUsers?.has(uid)) {
      return socket.emit('error', { code: 'MUTED' });
    }
    
    socket.join(`session:${sessionId}`);
    session.students = session.students || new Set();
    session.students.add(uid);
    
    // Notify teacher of new student
    io.to(`session:${sessionId}`).emit('session:student_count', {
      count: session.students.size,
      newStudent: { uid, name }
    });
    
    // Send current session state to joining student
    socket.emit('session:state', {
      sessionId,
      batchName: session.batchName,
      teacherName: session.teacherName,
      startTime: session.startTime,
      chatHistory: session.chatHistory?.slice(-50) || [],
      activePoll: session.activePoll || null,
      isChatMuted: session.isChatMuted || false,
      studentCount: session.students.size,
    });
    
    console.log(`👨‍🎓 ${name} joined session ${sessionId} (${session.students.size} students live)`);
  });

  // ── START LIVE CLASS (Teacher only) ──
  socket.on('teacher:start_session', ({ batchId, batchName, streamKey }) => {
    if (role !== 'staff' && role !== 'teacher') return socket.emit('error', { code: 'FORBIDDEN' });
    
    const sessionId = `sess_${batchId}_${Date.now()}`;
    activeSessions.set(sessionId, {
      sessionId,
      batchId,
      batchName,
      teacherId: uid,
      teacherName: name,
      streamKey,
      startTime: Date.now(),
      students: new Set(),
      chatHistory: [],
      isChatMuted: false,
      mutedUsers: new Set(),
      activePoll: null,
    });
    
    socket.join(`session:${sessionId}`);
    socket.join(`teacher:${sessionId}`); // exclusive teacher room
    
    socket.emit('teacher:session_started', { sessionId, streamKey });
    
    // Broadcast to batch channel (students waiting in batch room)
    io.to(`batch:${batchId}`).emit('live:class_started', {
      sessionId,
      batchName,
      teacherName: name,
      startTime: Date.now()
    });
    
    console.log(`📡 LIVE CLASS STARTED: ${batchName} by ${name} | Session: ${sessionId}`);
  });

  // ── STOP LIVE CLASS (Teacher only) ──
  socket.on('teacher:stop_session', ({ sessionId }) => {
    if (role !== 'staff' && role !== 'teacher') return socket.emit('error', { code: 'FORBIDDEN' });
    
    const session = activeSessions.get(sessionId);
    if (!session || session.teacherId !== uid) return;
    
    io.to(`session:${sessionId}`).emit('session:ended', {
      message: 'The live class has ended. Thank you for attending!',
      duration: Math.floor((Date.now() - session.startTime) / 1000 / 60) + ' minutes'
    });
    
    activeSessions.delete(sessionId);
    console.log(`🔴 LIVE CLASS ENDED: ${session.batchName} | Session: ${sessionId}`);
  });

  // ── LIVE CHAT MESSAGE ──
  socket.on('chat:message', ({ sessionId, message }) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    // Check if chat is muted globally or user is muted
    if (session.isChatMuted && role === 'student') {
      return socket.emit('error', { code: 'CHAT_MUTED', message: 'Chat is currently muted by the teacher.' });
    }
    if (session.mutedUsers?.has(uid) && role === 'student') {
      return socket.emit('error', { code: 'USER_MUTED', message: 'You have been muted.' });
    }
    
    // Sanitize message
    const sanitized = String(message).substring(0, 300).trim();
    if (!sanitized) return;
    
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      uid, name, role, message: sanitized, ts: Date.now()
    };
    
    // Store last 100 messages in session
    session.chatHistory = session.chatHistory || [];
    session.chatHistory.push(msg);
    if (session.chatHistory.length > 100) session.chatHistory.shift();
    
    // Broadcast to all in session (including sender for delivery confirmation)
    io.to(`session:${sessionId}`).emit('chat:new_message', msg);
  });

  // ── LIVE REACTIONS ──
  socket.on('reaction:send', ({ sessionId, emoji }) => {
    const validEmojis = ['🔥', '👍', '❤️', '😮', '👏', '🎉', '💯', '🤔'];
    if (!validEmojis.includes(emoji)) return;
    
    io.to(`session:${sessionId}`).emit('reaction:new', {
      uid, name, emoji, ts: Date.now()
    });
  });

  // ── RAISE HAND ──
  socket.on('student:raise_hand', ({ sessionId }) => {
    io.to(`teacher:${sessionId}`).emit('student:hand_raised', { uid, name, ts: Date.now() });
    socket.emit('hand:acknowledged');
  });

  socket.on('student:lower_hand', ({ sessionId }) => {
    io.to(`teacher:${sessionId}`).emit('student:hand_lowered', { uid });
  });

  // ── TEACHER CONTROLS ──
  socket.on('teacher:mute_chat', ({ sessionId, mute }) => {
    if (role !== 'staff' && role !== 'teacher') return;
    const session = activeSessions.get(sessionId);
    if (!session || session.teacherId !== uid) return;
    session.isChatMuted = mute;
    io.to(`session:${sessionId}`).emit('chat:mute_state', { muted: mute });
  });

  socket.on('teacher:mute_user', ({ sessionId, targetUid }) => {
    if (role !== 'staff' && role !== 'teacher') return;
    const session = activeSessions.get(sessionId);
    if (!session || session.teacherId !== uid) return;
    session.mutedUsers = session.mutedUsers || new Set();
    session.mutedUsers.add(targetUid);
    
    // Notify the muted user
    const targetSocketId = userSockets.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user:muted', { message: 'You have been muted by the teacher.' });
    }
  });

  socket.on('teacher:kick_user', ({ sessionId, targetUid }) => {
    if (role !== 'staff' && role !== 'teacher') return;
    const session = activeSessions.get(sessionId);
    if (!session || session.teacherId !== uid) return;
    
    const targetSocketId = userSockets.get(targetUid);
    if (targetSocketId) {
      io.to(targetSocketId).emit('user:kicked', { message: 'You have been removed from the live class.' });
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) targetSocket.leave(`session:${sessionId}`);
    }
    session.students.delete(targetUid);
  });

  // ── LIVE POLL ──
  socket.on('teacher:create_poll', ({ sessionId, question, options }) => {
    if (role !== 'staff' && role !== 'teacher') return;
    const session = activeSessions.get(sessionId);
    if (!session || session.teacherId !== uid) return;
    
    const poll = {
      id: `poll_${Date.now()}`,
      question: String(question).substring(0, 200),
      options: options.slice(0, 4).map(o => ({ text: String(o).substring(0, 100), votes: 0, voters: [] })),
      active: true,
      ts: Date.now()
    };
    session.activePoll = poll;
    io.to(`session:${sessionId}`).emit('poll:new', poll);
  });

  socket.on('student:vote_poll', ({ sessionId, pollId, optionIndex }) => {
    const session = activeSessions.get(sessionId);
    if (!session?.activePoll || session.activePoll.id !== pollId) return;
    
    const poll = session.activePoll;
    // Prevent double voting
    const alreadyVoted = poll.options.some(o => o.voters.includes(uid));
    if (alreadyVoted) return;
    
    if (poll.options[optionIndex]) {
      poll.options[optionIndex].votes++;
      poll.options[optionIndex].voters.push(uid);
      io.to(`session:${sessionId}`).emit('poll:update', { pollId, options: poll.options.map(o => ({ text: o.text, votes: o.votes })) });
    }
  });

  socket.on('teacher:end_poll', ({ sessionId }) => {
    const session = activeSessions.get(sessionId);
    if (!session?.activePoll) return;
    session.activePoll.active = false;
    io.to(`session:${sessionId}`).emit('poll:ended', session.activePoll);
  });

  // ── TEACHER: UPLOAD NOTES DURING CLASS ──
  socket.on('teacher:share_resource', ({ sessionId, title, url, type }) => {
    if (role !== 'staff' && role !== 'teacher') return;
    io.to(`session:${sessionId}`).emit('resource:shared', {
      title, url, type, teacherName: name, ts: Date.now()
    });
  });

  // ── JOIN BATCH ROOM (for live class notifications) ──
  socket.on('batch:join', ({ batchId }) => {
    socket.join(`batch:${batchId}`);
  });

  // ── GET ACTIVE SESSIONS ──
  socket.on('get:active_sessions', () => {
    const sessions = [];
    for (const [id, sess] of activeSessions.entries()) {
      sessions.push({
        sessionId: id,
        batchId: sess.batchId,
        batchName: sess.batchName,
        teacherName: sess.teacherName,
        studentCount: sess.students?.size || 0,
        startTime: sess.startTime,
      });
    }
    socket.emit('active_sessions', sessions);
  });

  // ── TYPING INDICATOR ──
  socket.on('chat:typing', ({ sessionId }) => {
    socket.to(`session:${sessionId}`).emit('chat:user_typing', { uid, name });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    userSockets.delete(uid);
    socketUsers.delete(socket.id);
    
    // Remove from all active sessions
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.students?.has(uid)) {
        session.students.delete(uid);
        io.to(`session:${sessionId}`).emit('session:student_count', { count: session.students.size });
      }
    }
    console.log(`🔴 ${role.toUpperCase()} disconnected: ${name}`);
  });
});

// ─── REST API Endpoints ───────────────────────────────────────────────────────

// Get all active live sessions (for student portal polling)
app.get('/api/live/sessions', (req, res) => {
  const sessions = [];
  for (const [id, sess] of activeSessions.entries()) {
    sessions.push({
      sessionId: id,
      batchId: sess.batchId,
      batchName: sess.batchName,
      teacherName: sess.teacherName,
      studentCount: sess.students?.size || 0,
      startTime: sess.startTime,
    });
  }
  res.json(sessions);
});

// Server health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: activeSessions.size,
    connectedUsers: io.engine.clientsCount,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initRedis();
  } catch (e) {
    console.warn('⚠️  Redis not available — running in SINGLE-SERVER mode');
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Arrow of Mathematics Live Server running on port ${PORT}`);
    console.log(`📡 WebSocket ready | REST API ready`);
    console.log(`⚡ Scaling mode: ${pubClient.isOpen ? 'MULTI-SERVER (Redis)' : 'SINGLE-SERVER'}`);
  });
}

start();

module.exports = { app, server, io };
