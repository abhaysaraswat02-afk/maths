/**
 * Vercel Serverless Function (Node.js + Express)
 * Handles secure submission of college applications.
 *
 * Features:
 * - Securely connects to Firebase Admin SDK.
 * - Validates and sanitizes input data on the server.
 * - Implements rate-limiting to prevent spam.
 * - Stores data in the 'admissions' Realtime Database.
 * - Handles high-concurrency loads automatically.
 */

require('dotenv').config(); // Load environment variables first
const express = require('express');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

// --- Firebase Admin SDK Initialization ---
// IMPORTANT: In production, use Vercel Environment Variables for this!
// DO NOT hardcode your credentials.
let db;
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    if (serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    } else {
      console.error("Firebase credentials missing in .env file.");
    }
  }
  if (admin.apps.length) {
    db = admin.database();
    console.log("Firebase initialized successfully.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error.message);
}

const app = express();

// Serve static files (HTML, CSS, JS) from the current folder
app.use(express.static(__dirname));

// --- Nodemailer Transporter ---

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || 'crackamubyabhay@gmail.com', // Your Gmail address
    pass: process.env.GMAIL_PASS || 'dqof kmnk tojl gknn', // App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.log("Error with email config:", error);
  } else {
    console.log("Server is ready to send OTPs!");
  }
});

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

// 1. Send OTP Endpoint
app.post('/api/send-otp', async (req, res) => {
  if (!db) {
    console.error("DB not initialized");
    return res.status(500).json({ error: 'Server database error. Check server logs.' });
  }
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Realtime DB keys cannot contain '.', replace with ','
  const emailKey = email.replace(/\./g, ',');

  try {
    // Store OTP in Realtime Database (expires in 5 minutes)
    try {
      await db.ref('otp_codes/' + emailKey).set({
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
    } catch (dbError) {
      console.error("Firestore Error Detail:", dbError);
      throw dbError;
    }

    // Send Email
    await transporter.sendMail({
      from: `"Era of MathAntics" <${process.env.GMAIL_USER || 'crackamubyabhay@gmail.com'}>`,
      to: email,
      subject: 'Your Login Verification Code',
      text: `Your verification code is: ${otp}. It is valid for 5 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Verification Code</h2>
              <p>Your code for Era of MathAntics is:</p>
              <h1 style="color: #1e40af; letter-spacing: 5px;">${otp}</h1>
              <p>This code expires in 5 minutes.</p>
             </div>`
    });

    res.status(200).json({ success: true, message: 'OTP sent to email.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: `Failed to send OTP: ${error.message}` });
  }
});

// 2. Verify OTP Endpoint
app.post('/api/verify-otp', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Server database error.' });
  }
  const { email, code } = req.body;
  const emailKey = email.replace(/\./g, ',');
  const snapshot = await db.ref('otp_codes/' + emailKey).once('value');
  const data = snapshot.val();

  if (!data || data.code !== code || data.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  // Optional: Delete OTP after use to prevent replay
  await db.ref('otp_codes/' + emailKey).remove();
  res.status(200).json({ success: true, message: 'OTP Verified' });
});

app.post('/api/submit-application', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Server database error.' });
  }
  try {
    // 1. --- Server-side Validation (critical for security) ---
    const { name, email, phone, course, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // 2. --- Prepare Data for Firestore ---
    const applicationData = {
      name: name.trim(),
      email: email.trim(),
      // Use provided phone or default to "Not Provided" to avoid undefined errors
      phone: phone ? phone.trim() : 'Not Provided',
      course: course ? course.trim() : 'General',
      message: message ? message.trim() : '', // Message is optional
      status: 'Pending', // Default status for new applications
      timestamp: admin.database.ServerValue.TIMESTAMP,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };

    // 3. --- Save to Realtime Database ---
    await db.ref('admissions').push(applicationData);
    res.status(200).json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Export the Express app for Vercel to use as a serverless function
module.exports = app;

// Allow running locally with `node submit-application.js`
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running locally on http://localhost:${PORT}`);
  });
}