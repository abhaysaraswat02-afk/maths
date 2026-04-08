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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const OTP_SECRET = process.env.OTP_SECRET || 'era-of-mathantics-secret-key-2025';

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