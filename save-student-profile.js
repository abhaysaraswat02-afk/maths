import jwt from 'jsonwebtoken';
// Assuming you have Firebase Admin SDK initialized for Firestore access
// import admin from 'firebase-admin';
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
//   });
// }
// const db = admin.firestore();

const JWT_SECRET = process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const sessionCookie = req.cookies.session;
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session found' });
  }

  let studentEmail;
  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET);
    studentEmail = decoded.email;
    if (decoded.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Not a student' });
    }
  } catch (error) {
    console.error('JWT verification failed in /api/save-student-profile:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid session' });
  }

  const { name, fatherName, studentClass, dob, schoolName, photoURL } = req.body;

  // --- Placeholder for actual Firestore logic ---
  // Replace with your actual Firestore update logic for the student profile
  // Example: await db.collection('students').doc(studentEmail).set({ name, fatherName, studentClass, dob, schoolName, photoURL, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  // return res.status(200).json({ success: true, id: studentEmail, message: 'Profile updated successfully' });
  return res.status(200).json({ success: true, id: studentEmail, message: 'Profile updated successfully' });
}