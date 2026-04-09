import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

const stripQuotes = value => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

// Firebase Admin SDK Initialization
let db;
try {
  const projectId = stripQuotes(process.env.FIREBASE_PROJECT_ID || '');
  const clientEmail = stripQuotes(process.env.FIREBASE_CLIENT_EMAIL || '');
  const privateKey = stripQuotes((process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'));

  const serviceAccount = {
    projectId,
    privateKey,
    clientEmail,
  };

  if (!admin.apps.length) {
    if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
        databaseURL: stripQuotes(process.env.FIREBASE_DATABASE_URL),
      });
    } else {
      console.warn("Firebase credentials missing or malformed in .env for check-auth. Staff role check via Firestore will be limited.");
    }
  }
  if (admin.apps.length) {
    db = admin.firestore();
  }
} catch (error) {
  console.error("Error initializing Firebase in check-auth:", error.message);
}

// This secret must be the same as used in your middleware to verify JWTs.
const JWT_SECRET = stripQuotes(process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c');

// List of emails with super-admin privileges (Hardcoded fallback)
const superAdmins = ['admin@mathantics.com', 'teacher@mathantics.com', 'jay83856@gmail.com', 'crackamubyabhay@gmail.com'];

async function isAuthorizedStaff(email) {
  if (!email) return false;
  if (superAdmins.includes(email.toLowerCase())) return true;
  if (!db) return false; // Cannot check Firestore if DB not initialized
  try {
    const snap = await db.collection('staff').where('email', '==', email.toLowerCase()).get();
    return !snap.empty;
  } catch (e) {
    console.error('Error checking staff in Firestore (check-auth):', e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET);

    const role = await isAuthorizedStaff(decoded.email) ? 'staff' : 'student';

    return res.status(200).json({ authenticated: true, role: role, email: decoded.email });
  } catch (error) {
    console.error('JWT verification failed in /api/check-auth:', error);
    res.setHeader('Set-Cookie', `session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`); // Clear invalid cookie
    return res.status(200).json({ authenticated: false });
  }
}