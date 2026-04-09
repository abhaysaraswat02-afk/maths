import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import crypto from 'crypto';
// Assuming you have Firebase Admin SDK initialized for Firestore access
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
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      console.warn("Firebase credentials missing or malformed in .env for verify-otp. Staff role check via Firestore will be limited.");
    }
  }
  if (admin.apps.length) {
    db = admin.firestore();
  }
} catch (error) {
  console.error("Error initializing Firebase in verify-otp:", error.message);
}

const JWT_SECRET = stripQuotes(process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c'); // Ensure consistent stripping
const OTP_SECRET = stripQuotes(process.env.OTP_SECRET || 'k9j8h7g6f5e4dll3b1a0z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8'); // Ensure consistent stripping

function verifyTokenSignature(email, otp, expiry, hash) {
  const data = `${email}|${otp}|${expiry}`;
  const expectedHash = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return hash === expectedHash;
}

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
    console.error('Error checking staff in Firestore (verify-otp):', e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, code, verificationToken, isExistingUser, applicationForm } = req.body;

  if (!email || !code || !verificationToken) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  const [hash, expiry] = verificationToken.split('.');
  
  // Check Expiry and Signature
  const isExpired = Date.now() > parseInt(expiry);
  const isSignatureValid = verifyTokenSignature(email, code, expiry, hash);
  const otpVerified = !isExpired && isSignatureValid;

  if (!otpVerified) {
    return res.status(401).json({ success: false, error: isExpired ? 'OTP has expired.' : 'Invalid OTP code.' });
  }

  if (!db) {
    console.error("Firestore DB not initialized in verify-otp. Cannot save new student or check staff roles from DB.");
    return res.status(500).json({ success: false, error: 'Server database error during OTP verification.' });
  }

  try {
    // Determine role
    const role = await isAuthorizedStaff(email) ? 'staff' : 'student';

    // If it's a new student registration, save their details
    if (!isExistingUser && role === 'student') {
      await db.collection('admissions').add({ // Assuming 'admissions' is where new students are saved
        name: applicationForm.name,
        phone: applicationForm.phone,
        fatherName: applicationForm.fatherName,
        studentClass: applicationForm.studentClass,
        dob: applicationForm.dob,
        schoolName: applicationForm.schoolName,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isBlocked: false,
      });
    }

    // Create JWT payload
    const tokenPayload = {
      email: email,
      role: role,
    };

    // Sign the JWT
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

    // Set the HTTP-only session cookie
    res.setHeader('Set-Cookie', serialize('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour in seconds
    }));

    return res.status(200).json({ success: true, message: 'OTP verified and logged in.', isStaff: role === 'staff' });
  } catch (error) {
    console.error('Error during OTP verification or session creation:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}