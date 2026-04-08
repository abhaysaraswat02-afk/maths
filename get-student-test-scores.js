import jwt from 'jsonwebtoken';
// Assuming you have Firebase Admin SDK initialized for Firestore access
// import admin from 'firebase-admin';
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
//   });
// }
// const db = admin.firestore();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    console.error('JWT verification failed in /api/get-student-test-scores:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid session' });
  }

  // --- Placeholder for actual Firestore logic ---
  // Replace with your actual Firestore query to get test scores for studentEmail
  // Example: const scoresSnap = await db.collection('testScores').where('studentEmail', '==', studentEmail).orderBy('timestamp', 'desc').get();
  // const scores = scoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // return res.status(200).json(scores);
  return res.status(200).json([
    { id: 'test1', testName: 'Algebra Midterm', score: 85, total: 100, percentage: 85, date: '2023-10-26T10:00:00Z' },
    { id: 'test2', testName: 'Geometry Quiz', score: 70, total: 80, percentage: 87.5, date: '2023-09-15T14:30:00Z' },
  ]);
}