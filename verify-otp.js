import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import crypto from 'crypto';
// Assuming you have Firebase Admin SDK initialized for Firestore access
// import admin from 'firebase-admin';
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
//   });
// }
// const db = admin.firestore();

const stripQuotes = value => {
  if (!value) return '';
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

const JWT_SECRET = stripQuotes(process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c');
const OTP_SECRET = stripQuotes(process.env.OTP_SECRET || 'k9j8h7g6f5e4dll3b1a0z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8');

function verifyTokenSignature(email, otp, expiry, hash) {
  const data = `${email}|${otp}|${expiry}`;
  const expectedHash = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return hash === expectedHash;
}

// This list should ideally be managed in a database or a more secure configuration.
const STAFF_EMAILS = ['admin@mathantics.com', 'teacher@mathantics.com', 'jay83856@gmail.com', 'crackamubyabhay@gmail.com'];

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

  try {
    // Determine role
    const role = STAFF_EMAILS.includes(email) ? 'staff' : 'student';

    // If it's a new student registration, save their details
    if (!isExistingUser && role === 'student') {
      // Example: Save to Firestore
      // await db.collection('students').doc(email).set({
      //   name: applicationForm.name,
      //   phone: applicationForm.phone,
      //   fatherName: applicationForm.fatherName,
      //   studentClass: applicationForm.studentClass,
      //   dob: applicationForm.dob,
      //   schoolName: applicationForm.schoolName,
      //   email: email,
      //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
      //   isBlocked: false,
      // });
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