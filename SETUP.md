# Arrow of Mathematics — Live Class System
## Complete Setup & Deployment Guide

---

## 🏗️ Architecture

```
Student Browser ──┐
Staff Browser ────┤──→ Load Balancer (Nginx) ──→ [WS Server 1]  ─┐
Mobile Browser ───┘                             [WS Server 2]  ─┼──→ Redis Pub/Sub ──→ Firebase
                                                [WS Server N]  ─┘
```

### Files Delivered

| File | Purpose |
|------|---------|
| `live-server.js` | WebSocket server (Socket.IO + Redis) |
| `cluster.js` | Multi-CPU process spawner |
| `live-class.js` | **Client-side** WebSocket engine (copy to public folder) |
| `student.html` | Updated student portal with live class tab |
| `staff.html` | Updated staff portal with teacher controls |
| `api/live-token.js` | JWT token endpoint for WebSocket auth |
| `package.json` | Node dependencies |

---

## ⚡ Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start Redis (required for multi-server sync)
docker run -d -p 6379:6379 redis:latest

# 3. Set environment variables
export JWT_SECRET="your-secret-key-here"
export REDIS_URL="redis://localhost:6379"
export PORT=3001

# 4. Start the live server
node live-server.js

# 5. Open student.html and staff.html in your browser
# Make sure LIVE_SERVER_URL matches your server URL
```

---

## 🚀 Production Deployment (10,000+ users)

### Option A: Cluster Mode (Single Machine, All CPU Cores)
```bash
# Uses all CPU cores, Redis syncs messages between workers
node cluster.js

# Better: Use PM2 for auto-restart
npm install -g pm2
pm2 start cluster.js --name "arrow-math-live" -i max
pm2 save
pm2 startup
```

### Option B: Docker + Kubernetes (Recommended for 10K+)
```yaml
# docker-compose.yml
version: '3.8'
services:
  live-server:
    build: .
    environment:
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    deploy:
      replicas: 4  # Scale to N instances
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --save 900 1 --loglevel warning
```

### Nginx Load Balancer Config
```nginx
upstream live_servers {
  ip_hash;  # Sticky sessions for WebSocket
  server live-server-1:3001;
  server live-server-2:3001;
  server live-server-3:3001;
  server live-server-4:3001;
}

server {
  listen 443 ssl;
  
  location /socket.io/ {
    proxy_pass http://live_servers;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
  }
  
  location /api/live/ {
    proxy_pass http://live_servers;
  }
}
```

---

## 🔧 Configuration

### In student.html and staff.html (top of file):
```html
<script>
  // Point this to your live server URL
  window.LIVE_SERVER_URL = 'https://live.yourdomain.com';
</script>
<script src="live-class.js"></script>
```

### Environment Variables:
```bash
JWT_SECRET=your-super-secret-key-change-this
REDIS_URL=redis://your-redis-server:6379
PORT=3001
NODE_ENV=production
```

---

## 📡 Live Class Flow

### Teacher Starts Class:
1. Opens Staff Portal → Live Classes tab
2. Selects batch → clicks "Go Live Now"
3. Control panel opens fullscreen
4. All students in that batch receive instant notification
5. Teacher can: chat, mute users, kick users, create polls, share resources

### Student Joins Class:
1. Sees "LIVE" badge in Student Portal sidebar
2. Clicks "Join Class" button
3. Fullscreen view opens: stream + chat + reactions
4. Can: send messages, send reactions 🔥❤️👍, raise hand, vote in polls

---

## 🎯 Feature Summary

### Real-Time Features (WebSocket):
- ✅ Live Chat (instant, <50ms latency)
- ✅ Live Reactions (floating emojis)
- ✅ Raise Hand / Lower Hand
- ✅ Live Polls & Quizzes
- ✅ Chat Mute (global + per-user)
- ✅ Kick Students
- ✅ Real-time student count
- ✅ Resource sharing during class
- ✅ Typing indicators
- ✅ Auto-reconnect (exponential backoff)

### Teacher Controls:
- ✅ Start / Stop Live Class
- ✅ Mute entire chat
- ✅ Mute individual users
- ✅ Kick disruptive students
- ✅ Launch live polls
- ✅ See all raised hands
- ✅ Share notes/resources live
- ✅ Live student count
- ✅ Duration timer

### Scalability:
- ✅ Multi-server (Redis pub/sub)
- ✅ Horizontal scaling (cluster/Kubernetes)
- ✅ Auto-reconnect for dropped connections
- ✅ Rate limiting
- ✅ Connection pooling
- ✅ Stateless backend
- ✅ Backpressure handling
- ✅ Load balancer ready

---

## 🧪 Stress Testing

```bash
# Install artillery
npm install -g artillery

# Run stress test (1000 concurrent WebSocket users)
artillery quick --count 1000 --num 100 ws://localhost:3001

# Check server health
curl http://localhost:3001/health
```

---

## 📞 Support

Live server health endpoint: `GET /api/live/sessions`
Server health: `GET /health`
Active connections: shown in health endpoint response
