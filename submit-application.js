/**
 * Vercel Serverless Function (Node.js + Express)
 * Handles secure submission of college applications.
 *
 * Features:
 * - Securely connects to Firebase Admin SDK.
 * - Validates and sanitizes input data on the server.
 * - Implements rate-limiting to prevent spam.
 * - Stores data in the 'admissions' Firestore collection.
 * - Handles high-concurrency loads automatically.
 */

const express = require('express');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// --- Firebase Admin SDK Initialization ---
// IMPORTANT: In production, use Vercel Environment Variables for this!
// DO NOT hardcode your credentials.
// Vercel -> Project Settings -> Environment Variables
// 1. FIREBASE_PROJECT_ID: your-project-id
-- 2. FIREBASE_CLIENT_EMAIL: your-service-account-email@...
-- 3. FIREBASE_PRIVATE_KEY: Copy-paste the entire private key from your JSON file.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();

// --- Security and Middleware ---

// Enable CORS. Vercel handles this well, but it's good practice.
app.use(cors({ origin: true }));

// Basic rate-limiting to prevent spam and abuse.
// Allows 10 requests per IP address per minute.
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
  headers: true,
});
app.use(limiter);

// Middleware to parse JSON request bodies
app.use(express.json());

// --- API Route Handler ---

app.post('/api/submit-application', async (req, res) => {
  // 1. --- Server-side Validation (critical for security) ---
  const { name, email, phone, course, message } = req.body;

  if (!name || !email || !phone || !course) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // 2. --- Prepare Data for Firestore ---
  const applicationData = {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    course: course.trim(),
    message: message ? message.trim() : '', // Message is optional
    status: 'Pending', // Default status for new applications
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };

  // 3. --- Save to Firestore ---
  await db.collection('admissions').add(applicationData);
  res.status(200).json({ success: true, message: 'Application submitted successfully!' });
});

// Export the Express app for Vercel to use as a serverless function
module.exports = app;