/**
 * ARROW OF MATHEMATICS — Live Class Client Engine
 * Handles WebSocket connection, auto-reconnect, and all live class interactions
 * Used by both student.html and staff.html
 */

(function (global) {
  'use strict';

  // ─── Configuration ─────────────────────────────────────────────────────────
  const LIVE_SERVER_URL = window.LIVE_SERVER_URL || 'http://localhost:3001';
  const RECONNECT_DELAY = [1000, 2000, 5000, 10000, 30000]; // backoff ms
  const MAX_RECONNECT   = 10;

  // ─── LiveClassClient ────────────────────────────────────────────────────────
  class LiveClassClient {
    constructor() {
      this.socket       = null;
      this.sessionId    = null;
      this.role         = null;       // 'student' | 'staff'
      this.user         = null;       // { uid, name, email }
      this.reconnectCount = 0;
      this.reconnectTimer = null;
      this.listeners  = {};           // event → [callbacks]
      this._connected = false;
    }

    // ── Connect ──────────────────────────────────────────────────────────────
    connect({ token, role, user }) {
      if (this.socket) this.socket.disconnect();

      this.role = role;
      this.user = user;

      // Dynamically load Socket.IO client if needed
      const load = () => {
        this.socket = io(LIVE_SERVER_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: false, // We handle reconnect manually
        });

        this._bindSocketEvents();
      };

      if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/dist/socket.io.min.js';
        script.onload = load;
        document.head.appendChild(script);
      } else {
        load();
      }
    }

    // ── Bind Core Socket Events ───────────────────────────────────────────────
    _bindSocketEvents() {
      const s = this.socket;

      s.on('connect', () => {
        this._connected = true;
        this.reconnectCount = 0;
        clearTimeout(this.reconnectTimer);
        this._emit('connected', { socketId: s.id });
        console.log('🟢 Live Server connected:', s.id);
      });

      s.on('disconnect', (reason) => {
        this._connected = false;
        this._emit('disconnected', { reason });
        console.warn('🟡 Disconnected:', reason);

        if (reason !== 'io client disconnect') {
          this._scheduleReconnect();
        }
      });

      s.on('connect_error', (err) => {
        this._emit('connection_error', { message: err.message });
        this._scheduleReconnect();
      });

      // ── Session Events ──
      s.on('teacher:session_started', (data) => {
        this.sessionId = data.sessionId;
        this._emit('session:started', data);
      });

      s.on('session:state', (data) => {
        this.sessionId = data.sessionId;
        this._emit('session:state', data);
      });

      s.on('session:student_count', (data) => this._emit('session:student_count', data));
      s.on('session:ended',         (data) => { this.sessionId = null; this._emit('session:ended', data); });

      // ── Live class start notification ──
      s.on('live:class_started', (data) => this._emit('live:class_started', data));

      // ── Chat Events ──
      s.on('chat:new_message',  (msg)  => this._emit('chat:message', msg));
      s.on('chat:mute_state',   (data) => this._emit('chat:mute', data));
      s.on('chat:user_typing',  (data) => this._emit('chat:typing', data));
      s.on('user:muted',        (data) => this._emit('user:muted', data));
      s.on('user:kicked',       (data) => { this.sessionId = null; this._emit('user:kicked', data); });

      // ── Reactions ──
      s.on('reaction:new', (data) => this._emit('reaction', data));

      // ── Raise Hand ──
      s.on('student:hand_raised',  (data) => this._emit('hand:raised', data));
      s.on('student:hand_lowered', (data) => this._emit('hand:lowered', data));
      s.on('hand:acknowledged',    ()     => this._emit('hand:ack', {}));

      // ── Poll Events ──
      s.on('poll:new',    (data) => this._emit('poll:new', data));
      s.on('poll:update', (data) => this._emit('poll:update', data));
      s.on('poll:ended',  (data) => this._emit('poll:ended', data));

      // ── Resources ──
      s.on('resource:shared', (data) => this._emit('resource:shared', data));

      // ── Active Sessions ──
      s.on('active_sessions', (data) => this._emit('active_sessions', data));

      // ── Errors ──
      s.on('error', (data) => this._emit('error', data));
    }

    // ── Auto Reconnect ────────────────────────────────────────────────────────
    _scheduleReconnect() {
      if (this.reconnectCount >= MAX_RECONNECT) {
        this._emit('reconnect_failed', { attempts: this.reconnectCount });
        return;
      }
      const delay = RECONNECT_DELAY[Math.min(this.reconnectCount, RECONNECT_DELAY.length - 1)];
      this.reconnectCount++;
      this._emit('reconnecting', { attempt: this.reconnectCount, delay });

      this.reconnectTimer = setTimeout(() => {
        console.log(`🔄 Reconnecting (attempt ${this.reconnectCount})...`);
        this.socket.connect();
      }, delay);
    }

    // ── Event System ─────────────────────────────────────────────────────────
    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
      return this; // chainable
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    _emit(event, data) {
      (this.listeners[event] || []).forEach(cb => cb(data));
    }

    // ── Student Actions ───────────────────────────────────────────────────────
    joinSession(sessionId) {
      this.sessionId = sessionId;
      this.socket.emit('student:join', { sessionId });
    }

    joinBatch(batchId) {
      this.socket.emit('batch:join', { batchId });
    }

    sendMessage(message) {
      if (!this.sessionId) return;
      this.socket.emit('chat:message', { sessionId: this.sessionId, message });
    }

    sendReaction(emoji) {
      if (!this.sessionId) return;
      this.socket.emit('reaction:send', { sessionId: this.sessionId, emoji });
    }

    raiseHand() {
      if (!this.sessionId) return;
      this.socket.emit('student:raise_hand', { sessionId: this.sessionId });
    }

    lowerHand() {
      if (!this.sessionId) return;
      this.socket.emit('student:lower_hand', { sessionId: this.sessionId });
    }

    votePoll(pollId, optionIndex) {
      if (!this.sessionId) return;
      this.socket.emit('student:vote_poll', { sessionId: this.sessionId, pollId, optionIndex });
    }

    sendTypingIndicator() {
      if (!this.sessionId) return;
      this.socket.emit('chat:typing', { sessionId: this.sessionId });
    }

    getActiveSessions() {
      this.socket.emit('get:active_sessions');
    }

    // ── Teacher Actions ───────────────────────────────────────────────────────
    startSession({ batchId, batchName, streamKey }) {
      this.socket.emit('teacher:start_session', { batchId, batchName, streamKey });
    }

    stopSession() {
      if (!this.sessionId) return;
      this.socket.emit('teacher:stop_session', { sessionId: this.sessionId });
      this.sessionId = null;
    }

    muteChat(mute) {
      if (!this.sessionId) return;
      this.socket.emit('teacher:mute_chat', { sessionId: this.sessionId, mute });
    }

    muteUser(targetUid) {
      if (!this.sessionId) return;
      this.socket.emit('teacher:mute_user', { sessionId: this.sessionId, targetUid });
    }

    kickUser(targetUid) {
      if (!this.sessionId) return;
      this.socket.emit('teacher:kick_user', { sessionId: this.sessionId, targetUid });
    }

    createPoll(question, options) {
      if (!this.sessionId) return;
      this.socket.emit('teacher:create_poll', { sessionId: this.sessionId, question, options });
    }

    endPoll() {
      if (!this.sessionId) return;
      this.socket.emit('teacher:end_poll', { sessionId: this.sessionId });
    }

    shareResource(title, url, type = 'pdf') {
      if (!this.sessionId) return;
      this.socket.emit('teacher:share_resource', { sessionId: this.sessionId, title, url, type });
    }

    disconnect() {
      clearTimeout(this.reconnectTimer);
      if (this.socket) this.socket.disconnect();
      this._connected = false;
    }

    get connected() { return this._connected; }
  }

  // ─── Expose globally ─────────────────────────────────────────────────────────
  global.LiveClass = new LiveClassClient();

})(window);
