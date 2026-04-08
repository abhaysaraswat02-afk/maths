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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const sessionCookie = req.cookies.session;
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session found' });
  }

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET);
    if (decoded.role !== 'staff') {
      return res.status(403).json({ error: 'Forbidden: Not staff' });
    }
  } catch (error) {
    console.error('JWT verification failed in /api/get-staff:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid session' });
  }

  // --- Placeholder for actual Firestore logic ---
  // Replace with your actual Firestore query to get staff members
  // Example: const staffSnap = await db.collection('staff').get();
  // const staffList = staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // return res.status(200).json(staffList);
  return res.status(200).json([
    { id: 'staff1', name: 'Dr. Abhay Sharma', role: 'Math Head', email: 'admin@mathantics.com' },
    { id: 'staff2', name: 'Ms. Priya Singh', role: 'Senior Teacher', email: 'teacher@mathantics.com' },
  ]);
}