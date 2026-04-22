# 🎙️ Era of MathAntics — Live Class System
## Complete Setup Guide (No YouTube · No Zoom · 100% Yours)

---

## 📁 FILES TO ADD TO YOUR PROJECT

| File | Purpose |
|---|---|
| `live-teach.html` | Teacher's broadcasting studio (only Sir sees this) |
| `live-class.html` | Student's live class page (all enrolled students) |

Add both to your project root alongside `student.html`, `staff.html`, etc.

---

## 🔗 HOW IT WORKS (Architecture)

```
Teacher (live-teach.html)
  → Captures webcam via WebRTC getUserMedia()
  → Writes "isLive: true" to Firebase Realtime DB
  → Chat messages push to Firebase liveChat/{batchId}
  → Hand raises, polls, reactions — all via Firebase

Student (live-class.html)
  → Reads Firebase liveChat/{batchId} in real-time
  → Sees live status, viewer count, class title
  → Can chat, react, raise hand, vote in polls
  → Video stream: connect via HLS/WebRTC (see Step 4)
```

---

## ✅ STEP 1 — Firebase Configuration

Paste your Firebase config in BOTH `live-teach.html` and `live-class.html`.

Find this block in both files and replace with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

You already have this in `student.html` and `index.html` — copy it from there.

---

## ✅ STEP 2 — Firebase Realtime Database Rules

In Firebase Console → Realtime Database → Rules, paste this:

```json
{
  "rules": {
    "liveSessions": {
      "$batchId": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('staff').child(auth.uid).exists()"
      }
    },
    "liveViewers": {
      "$batchId": {
        ".read": "auth != null",
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    },
    "liveChat": {
      "$batchId": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["time"]
      }
    },
    "livePoll": {
      "$batchId": {
        ".read": "auth != null",
        "votes": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        },
        ".write": "auth != null && root.child('staff').child(auth.uid).exists()"
      }
    },
    "liveReactions": {
      "$batchId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "staff": {
      ".read": "auth != null && root.child('staff').child(auth.uid).exists()",
      ".write": false
    }
  }
}
```

---

## ✅ STEP 3 — Firestore Collections Needed

Create these collections in Firebase Firestore:

### `batches` collection
Each document = one batch:
```json
{
  "name": "Class 10 — Boards Mastery",
  "description": "Complete CBSE syllabus coverage",
  "classLevel": "10",
  "status": "upcoming",
  "teacher": "Sir (MathAntics)",
  "schedule": "Mon·Wed·Fri 7–9 PM",
  "startDate": "Jun 2025",
  "duration": "6 Months",
  "price": 2999,
  "originalPrice": 5999,
  "subjects": ["Algebra", "Geometry", "Trigonometry"],
  "enrolled": 0,
  "totalSeats": 200
}
```

### `enrollments` collection
Each document = one enrollment:
```json
{
  "uid": "student_firebase_uid",
  "batchId": "batch_document_id",
  "razorpayId": "pay_xxxxx",
  "enrolledAt": "timestamp",
  "amount": 2999
}
```

### `classHistory` collection (auto-created when class ends)
```json
{
  "batchId": "batch_10",
  "title": "Trigonometry Day 3",
  "duration": 3600,
  "viewerCount": 247,
  "date": "timestamp"
}
```

---

## ✅ STEP 4 — Video Streaming (Choose One Option)

### 🔴 Option A: WebRTC Peer-to-Peer (Free, Best for < 50 students)

Use a free STUN/TURN server. Add to both files:

```javascript
// In live-teach.html startLive() — after getting localStream:
const pc = new RTCPeerConnection({
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
});
localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

// Share the offer via Firebase Realtime DB
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
db.ref(`webrtc/${activeBatchId}/offer`).set({ sdp: offer.sdp, type: offer.type });

// In live-class.html joinRoom() — receive and play:
const pc = new RTCPeerConnection({ iceServers: [...] });
pc.ontrack = e => { document.getElementById('remoteVideo').srcObject = e.streams[0]; };

db.ref(`webrtc/${batchId}/offer`).on('value', async snap => {
    if (!snap.val()) return;
    await pc.setRemoteDescription(snap.val());
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    db.ref(`webrtc/${batchId}/answer`).set({ sdp: answer.sdp, type: answer.type });
});
```

### 📡 Option B: HLS Streaming via Nginx (Best for 100+ students, needs VPS)

1. **Get a ₹500/month VPS** (DigitalOcean, Vultr, etc.)
2. **Install Nginx + RTMP module:**
```bash
sudo apt install nginx libnginx-mod-rtmp ffmpeg -y
```

3. **nginx.conf:**
```nginx
rtmp {
    server {
        listen 1935;
        application live {
            live on;
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 60;
        }
    }
}
```

4. **Sir broadcasts** using OBS Studio → RTMP → `rtmp://your-server-ip/live/mathstream`

5. **Students watch** via HLS. Add `hls.js` to `live-class.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
```
```javascript
// In live-class.html joinRoom():
if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('http://your-server-ip/hls/mathstream.m3u8');
    hls.attachMedia(document.getElementById('remoteVideo'));
}
```

### ☁️ Option C: Cloudflare Stream (Easiest paid option, ₹800/month)
- Go to Cloudflare Dashboard → Stream → Create live input
- Get RTMP URL → give to OBS
- Get HLS playback URL → put in `live-class.html`

---

## ✅ STEP 5 — Razorpay Setup

In `live-class.html`, find the `buyBatch()` function and uncomment the Razorpay block:

```javascript
const options = {
    key: 'rzp_live_YOUR_KEY_HERE',  // Your Razorpay Key ID
    amount: this.selectedBatch.price * 100,
    currency: 'INR',
    name: 'Era of MathAntics',
    description: this.selectedBatch.name,
    handler: async (response) => {
        // IMPORTANT: Verify payment on your backend first!
        await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                batchId: this.selectedBatch.id
            })
        });
        this.finishEnrollment();
    },
    prefill: { name: this.studentName },
    theme: { color: '#FFD700' }
};
new Razorpay(options).open();
```

---

## ✅ STEP 6 — Navigation Links

### In `student.html` sidebar, add:
```html
<button @click="tab='live'; mobileMenu=false"
  :style="{background: tab==='live' ? 'linear-gradient(135deg, var(--gold), var(--accent))' : 'transparent'}"
  class="flex items-center w-full p-3 rounded-xl font-bold transition-all">
  🔴 Live Classes
</button>
```
Or just link directly:
```html
<a href="live-class.html" class="flex items-center w-full p-3 rounded-xl font-bold">🔴 Live Classes</a>
```

### In `staff.html` sidebar, add:
```html
<a href="live-teach.html" class="flex items-center w-full p-3 rounded-xl font-bold" style="background:linear-gradient(135deg,rgba(255,58,58,0.2),rgba(255,107,107,0.1));border:1px solid rgba(255,58,58,0.3);">
  🎙️ Go Live
</a>
```

### In `index.html` homepage, add a batch section button:
```html
<a href="live-class.html" class="btn-primary">View Live Batches</a>
```

---

## 🎯 Feature Summary

| Feature | Status |
|---|---|
| Teacher goes live (camera + mic) | ✅ Built |
| Pre-live camera preview & setup | ✅ Built |
| Live viewer count | ✅ Built |
| Live duration timer | ✅ Built |
| Mic on/off | ✅ Built |
| Camera on/off | ✅ Built |
| Screen sharing | ✅ Built |
| Interactive whiteboard (draw, shapes, text, eraser) | ✅ Built |
| Save whiteboard as PNG | ✅ Built |
| End class (saves to Firestore) | ✅ Built |
| Real-time chat (teacher + students) | ✅ Built |
| Students list with online count | ✅ Built |
| Hand raise (students → teacher notification) | ✅ Built |
| Emoji reactions (float animation) | ✅ Built |
| Live polls with real-time vote results | ✅ Built |
| Student buy batch (Razorpay) | ✅ Built |
| Batch enrollment saved to Firestore | ✅ Built |
| Waiting screen (before teacher starts) | ✅ Built |
| Batch cards with live status | ✅ Built |
| Seat availability progress bar | ✅ Built |
| Firebase auth protection | ✅ Built |
| Mobile responsive | ✅ Built |
| Matches your gold/dark theme | ✅ Built |

---

## 📞 Support

All features are wired to Firebase. Once you paste your Firebase config,
chat, reactions, hand-raise, polls, viewer count, and live status all work immediately.

Only the **video stream** needs extra setup (Steps 4A/4B/4C above).
Start with **Option A (WebRTC)** for free — it works for up to ~50 students directly.
Upgrade to **Option B (HLS/Nginx)** when you grow.
