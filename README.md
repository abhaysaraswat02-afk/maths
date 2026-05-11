# Era of MathAntics — Full LMS

A complete Learning Management System built with Next.js 14, Firebase Firestore, Cloudinary, Socket.io, and WebRTC live classes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (Pages Router) |
| Database | Firebase Firestore (Admin SDK) |
| Auth | OTP via Gmail + JWT cookies |
| File Storage | Cloudinary |
| Real-time | Socket.io |
| Live Video | WebRTC (peer-to-peer, no Zoom/Meet) |
| Styling | Custom CSS + Google Fonts (Syne + DM Sans) |

---

## Features

### Students
- OTP email login (passwordless)
- Dashboard with enrolled batches, live alerts, pending enrollments
- Explore & enroll in batches (free = instant, paid = UPI + approval flow)
- Study materials viewer (PDF, video, image, links)
- Real-time batch chat (Socket.io)
- Join live WebRTC video classes

### Staff / Admin
- Dashboard with stats (batches, students, pending approvals, live count)
- Create batches with thumbnail upload, price, schedule
- Manage study materials per batch (upload or paste links)
- Review & approve/reject enrollment requests
- View all students and their enrollments
- Start/stop live classes (WebRTC broadcaster)
- Live class chat with students

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/abhaysaraswat02-afk/maths
cd maths
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
```
Fill in all values (see below).

### 3. Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Enable **Firestore Database** (production mode)
3. Project Settings → Service Accounts → **Generate new private key**
4. Copy `project_id`, `client_email`, `private_key` into `.env.local`
5. Apply Firestore rules from `firestore.rules`

### 4. Gmail App Password
1. Enable 2FA on your Google account
2. Google Account → Security → **App Passwords**
3. Create one for "Mail" → copy into `GMAIL_APP_PASSWORD`

### 5. Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is enough)
2. Copy Cloud Name, API Key, API Secret from Dashboard

### 6. Set Super Admin
Edit `src/lib/auth.js` → `SUPER_ADMINS` array:
```js
export const SUPER_ADMINS = ['youremail@gmail.com'];
```
Anyone in this list gets the `admin` role on login.

### 7. Run
```bash
npm run dev    # Development → http://localhost:3000
npm run build  # Production build
npm start      # Production server
```

---

## File Structure

```
src/
├── pages/
│   ├── index.js                  # Redirects to /login
│   ├── login.js                  # OTP login page
│   ├── _app.js
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp.js       # Send OTP email
│   │   │   ├── verify-otp.js     # Verify OTP → set JWT cookie
│   │   │   ├── logout.js
│   │   │   └── me.js             # Get current session
│   │   ├── batches/
│   │   │   ├── index.js          # GET all / POST create
│   │   │   └── [id].js           # GET / PUT / DELETE single batch
│   │   ├── enrollments/
│   │   │   └── index.js          # GET / POST enroll / PUT approve
│   │   ├── materials/
│   │   │   └── index.js          # GET / POST upload / DELETE
│   │   ├── chat/
│   │   │   └── index.js          # GET messages / POST message
│   │   ├── live/
│   │   │   └── toggle.js         # Start / stop live class
│   │   └── socket.js             # Socket.io server (WebRTC signaling + chat)
│   ├── student/
│   │   ├── dashboard.js
│   │   ├── batches.js
│   │   ├── explore.js
│   │   └── batch/[id].js         # Materials + chat per batch
│   ├── staff/
│   │   ├── dashboard.js
│   │   ├── batches.js
│   │   ├── enrollments.js
│   │   ├── students.js
│   │   └── batch/[id].js         # Manage materials + chat
│   └── live/
│       ├── teacher.js            # WebRTC broadcaster
│       └── student.js            # WebRTC viewer
├── components/
│   └── ui/
│       └── Sidebar.js
├── lib/
│   ├── firebase.js               # Firebase Admin SDK
│   ├── auth.js                   # JWT + session helpers
│   ├── otp.js                    # In-memory OTP store
│   ├── mailer.js                 # Nodemailer (Gmail)
│   ├── cloudinary.js             # Cloudinary upload helper
│   └── hooks.js                  # useAuth, useToast
└── styles/
    └── globals.css
```

---

## Firestore Collections

| Collection | Fields |
|-----------|--------|
| `students` | email, role, createdAt |
| `staff` | email, role, createdAt |
| `batches` | name, description, price, schedule, subject, thumbnail, createdBy, createdAt, isLive |
| `enrollments` | studentEmail, batchId, upiRef, status (pending/approved/rejected), enrolledAt |
| `materials` | batchId, title, description, url, type, createdBy, createdAt |
| `messages` | batchId, text, sender, role, createdAt |

---

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Add all `.env.local` variables in Vercel → Settings → Environment Variables.

> ⚠️ **Socket.io / WebRTC Note:** Vercel serverless functions have a 30s timeout. For production live classes with many concurrent students, deploy to **Railway** or **Render** which support persistent Node.js servers and WebSockets properly.

### Railway (for full WebSocket support)
1. Push to GitHub
2. Create project at [railway.app](https://railway.app) → Deploy from GitHub
3. Add environment variables
4. Set start command: `npm start`

---

## Live Class Flow

```
Teacher clicks "Go Live"
  → API sets batch.isLive = true
  → Redirected to /live/teacher
  → Grabs camera/mic via getUserMedia
  → Connects to Socket.io room

Student joins /live/student?batchId=xxx
  → Sends WebRTC offer via Socket.io
  → Teacher receives offer → sends answer
  → ICE candidates exchanged
  → Peer-to-peer video established
```

---

## Auth Flow

```
User enters email → /api/auth/send-otp
  → Generates 6-digit OTP
  → Saves to memory store (10 min TTL)
  → Sends email via Gmail

User enters OTP → /api/auth/verify-otp
  → Validates OTP
  → Signs JWT (7d expiry)
  → Sets httpOnly cookie

All API routes → read cookie → verify JWT → get session
```
