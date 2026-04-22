/**
 * Vercel Serverless Function (Node.js + Express)
 * Handles secure submission of college applications.
 *
 * Features:
 * - Securely connects to Firebase Admin SDK.
 * - Validates and sanitizes input data on the server.
 * - Implements rate-limiting to prevent spam.
 * - Stores data in the 'admissions' Firestore Database.
 * - Handles high-concurrency loads automatically.
 */

require('dotenv').config(); // Vercel loads environment variables automatically
const express = require('express');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { serialize } = require('cookie');

const stripQuotes = value => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};


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
      throw new Error("Firebase credentials missing or malformed in .env file. Check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.");
    }
  }
  if (admin.apps.length) {
    db = admin.firestore(); // Use Firestore for consistency with frontend
    console.log(`Firebase Admin SDK initialized for: ${serviceAccount.projectId}`);
    console.log(`Using Service Account: ${serviceAccount.clientEmail}`);
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.error("CRITICAL: FIREBASE_PRIVATE_KEY is missing from your .env file!");
    }
  }
} catch (error) {
  console.error("Error initializing Firebase:", error.message);
}

// --- Twilio Client Initialization ---
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
  } else {
    console.log('Twilio credentials not provided or invalid - WhatsApp features disabled');
  }
} catch (error) {
  console.error('Error initializing Twilio:', error.message);
  console.log('WhatsApp features will be disabled');
}

const app = express();

// List of emails with super-admin privileges (Hardcoded fallback + included jay83856@gmail.com)
const superAdmins = [
  'admin@mathantics.com',
  'teacher@mathantics.com',
  'jay83856@gmail.com',
  'crackamubyabhay@gmail.com'
];

async function isAuthorizedStaff(email) {
  if (!email) return false;
  if (superAdmins.includes(email.toLowerCase())) return true;
  
  try {
    const snap = await db.collection('staff').where('email', '==', email.toLowerCase()).get();
    return !snap.empty;
  } catch (e) {
    return false;
  }
}

// --- Nodemailer Transporter ---

const GMAIL_USER = stripQuotes(process.env.GMAIL_USER || '');
const GMAIL_PASS = stripQuotes(process.env.GMAIL_PASS || '');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS, 
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
// Global limit for all endpoints and a stricter limit for OTP requests.
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
  headers: true,
});

const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many OTP requests. Please wait a minute and try again.' },
  headers: true,
});

app.use(globalLimiter);
app.use('/api/send-otp', otpLimiter);

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Stateless OTP Logic ---
const OTP_SECRET = stripQuotes(process.env.OTP_SECRET || 'k9j8h7g6f5e4dll3b1a0z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8');
const JWT_SECRET = stripQuotes(process.env.JWT_SECRET || 'a99f2e1a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c');
const COOKIE_NAME = 'session';

function createVerificationToken(email, otp, expiry) {
  const data = `${email}|${otp}|${expiry}`;
  return crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
}

// --- API Route Handler ---

// 1. Send OTP Endpoint
app.post('/api/send-otp', async (req, res) => {
  if (!db) {
    console.error("DB not initialized");
    return res.status(500).json({ error: 'Firebase Admin not initialized. Check your FIREBASE_ env variables.' });
  }
  let { email } = req.body;
  email = email ? email.trim().toLowerCase() : '';

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.error("SMTP config missing");
    return res.status(500).json({ error: 'Email service not configured (GMAIL_USER/PASS missing in .env).' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    const token = createVerificationToken(email, otp, expiry);

    // Try to check if user already exists (optional - if it fails, still send OTP)
    let isExistingUser = false;
    try {
      const existingUser = await db.collection('admissions').where('email', '==', email).get();
      isExistingUser = !existingUser.empty;

      // Treat staff as existing users so they can log into the student portal without re-registering
      if (!isExistingUser) {
        isExistingUser = await isAuthorizedStaff(email);
      }
    } catch (dbError) {
      console.warn('Could not check user existence:', dbError.message);
      // Continue anyway - user will verify via OTP
      isExistingUser = false;
    }

    // Send Email
    await transporter.sendMail({
      from: `"Era of MathAntics" <${GMAIL_USER}>`,
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

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent to email.',
      isExistingUser: isExistingUser,
      verificationToken: `${token}.${expiry}` // Send token and expiry to client
    });
  } catch (error) {
    console.error('Email sending failed:', error); // Log the actual error for debugging
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2)); // Log full error object
    res.status(500).json({ error: `Failed to send OTP: ${error.message}` });
  }
});

// 2. Verify OTP Endpoint
app.post('/api/verify-otp', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Server database error.' });
  }
  let { email, code, verificationToken, isExistingUser, applicationForm } = req.body;
  email = email ? email.trim().toLowerCase() : '';
  
  if (!verificationToken) return res.status(400).json({ error: 'Missing verification session.' });

  const [hash, expiry] = verificationToken.split('.');

  // Check Expiry
  if (Date.now() > parseInt(expiry)) {
    return res.status(400).json({ success: false, error: 'OTP has expired.' });
  }

  // Verify Signature
  const expectedHash = createVerificationToken(email, code, expiry);
  if (hash !== expectedHash) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  const isStaff = await isAuthorizedStaff(email);

  if (applicationForm) {
    try {
      const existingUserSnap = await db.collection('admissions').where('email', '==', email).get();
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      if (!existingUserSnap.empty) {
        // User exists in admissions, update last login
        await existingUserSnap.docs[0].ref.update({
          lastLogin: timestamp
        });
      } else if (isStaff || !isExistingUser) {
        // Create a student profile for staff members or new students
        await db.collection('admissions').add({
          name: applicationForm.name || (isStaff ? 'Staff Account' : 'New Student'),
          email: email,
          phone: applicationForm.phone || 'Not Provided',
          fatherName: applicationForm.fatherName || '',
          studentClass: applicationForm.studentClass || (isStaff ? 'Staff' : ''),
          dob: applicationForm.dob || '',
          schoolName: applicationForm.schoolName || (isStaff ? 'Era of MathAntics' : ''),
          status: isStaff ? 'Approved' : 'Pending', // Staff student access is pre-approved
          createdAt: timestamp,
          timestamp: timestamp,
          lastLogin: timestamp
        });
      } else {
        return res.status(400).json({ success: false, error: 'Student record not found.' });
      }
    } catch (dbError) {
      console.error('OTP completion database error:', dbError);
      let errorMessage = dbError.message;
      if (dbError.code === 7 || errorMessage.includes('PERMISSION_DENIED')) {
        errorMessage = `PERMISSION_DENIED: The Service Account (${process.env.FIREBASE_CLIENT_EMAIL}) does not have the 'Firebase Admin' or 'Cloud Datastore User' role in the Google Cloud IAM Console. Check your IAM settings.`;
      } else if (errorMessage.includes('NOT_FOUND')) {
        errorMessage = "Cloud Firestore API has not been enabled for this project, or the database hasn't been created.";
      }
      return res.status(500).json({ success: false, error: 'Failed to save registration data: ' + errorMessage });
    }
  }

  // Create JWT session
  const role = isStaff ? 'staff' : 'student';
  const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });

  // Set HTTP-Only Cookie
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 3600 // 1 hour
  }));

  res.status(200).json({ success: true, message: 'OTP Verified', isStaff });
});

// --- Auth Check & Logout Endpoints ---

app.get('/api/check-auth', async (req, res) => {
  const cookies = req.headers.cookie ? require('cookie').parse(req.headers.cookie) : {};
  const sessionCookie = cookies[COOKIE_NAME];
  
  if (!sessionCookie) return res.status(200).json({ authenticated: false });

  try {
    // Explicitly check for HS256 to align with jose/middleware
    const decoded = jwt.verify(sessionCookie, JWT_SECRET, { algorithms: ['HS256'] });
    const isStaff = await isAuthorizedStaff(decoded.email);
    res.status(200).json({ authenticated: true, role: isStaff ? 'staff' : 'student', email: decoded.email });
  } catch (error) {
    console.error('Check-auth JWT error:', error.message);
    res.status(200).json({ authenticated: false });
  }
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    expires: new Date(0)
  }));
  res.status(200).json({ success: true });
});

app.post('/api/save-student-profile', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Server database error.' });
  }

  let { studentEmail, name, fatherName, studentClass, dob, schoolName, photoURL } = req.body;
  console.log('Received data:', { studentEmail, name, fatherName, studentClass, dob, schoolName, photoURL: photoURL ? photoURL.substring(0, 50) + '...' : null });
  studentEmail = studentEmail ? studentEmail.trim().toLowerCase() : '';

  if (!studentEmail) {
    return res.status(400).json({ error: 'Missing student email.' });
  }

  try {
    const snap = await db.collection('admissions').where('email', '==', studentEmail).get();
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (studentClass !== undefined) updateData.studentClass = studentClass;
    if (dob !== undefined) updateData.dob = dob;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    updateData.lastUpdated = admin.firestore.FieldValue.serverTimestamp();

    if (snap.empty) {
      const docRef = await db.collection('admissions').add({
        name: name || '',
        email: studentEmail,
        fatherName: fatherName || '',
        studentClass: studentClass || '',
        dob: dob || '',
        schoolName: schoolName || '',
        photoURL: photoURL || '',
        status: 'Pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).json({ success: true, id: docRef.id });
    }

    const docRef = snap.docs[0].ref;
    await docRef.update(updateData);
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Save student profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to save student profile.' });
  }
});

app.get('/api/get-student-profile', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const cookies = req.headers.cookie ? require('cookie').parse(req.headers.cookie) : {};
  const sessionCookie = cookies[COOKIE_NAME];
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session found.' });
  }

  let studentEmail = '';
  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded?.email || (decoded.role !== 'student' && decoded.role !== 'staff')) {
      return res.status(403).json({ error: 'Forbidden: Invalid session role.' });
    }
    studentEmail = decoded.email.trim().toLowerCase();
  } catch (error) {
    console.error('Get student profile JWT error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid session.' });
  }

  try {
    const snap = await db.collection('admissions').where('email', '==', studentEmail).get();
    if (snap.empty) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    res.status(200).json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Failed to get student profile.' });
  }
});

app.get('/api/admissions', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  try {
    const snapshot = await db.collection('admissions').orderBy('createdAt', 'desc').get();
    const admissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || doc.data().timestamp
    }));
    res.status(200).json(admissions);
  } catch (error) {
    console.error('Admissions fetch failed:', error);
    res.status(500).json({ error: 'Failed to load admissions.' });
  }
});

app.post('/api/toggle-block-student', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { studentId, studentEmail, staffEmail, block } = req.body;
  
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!studentId || !studentEmail) {
    return res.status(400).json({ error: 'Missing student ID or email.' });
  }
  
  try {
    const docRef = db.collection('admissions').doc(studentId);
    await docRef.update({
      isBlocked: block,
      blockedAt: block ? admin.firestore.FieldValue.serverTimestamp() : null,
      blockedBy: block ? staffEmail : null
    });
    res.status(200).json({ success: true, message: block ? 'Student blocked successfully.' : 'Student unblocked successfully.' });
  } catch (error) {
    console.error('Toggle block student error:', error);
    res.status(500).json({ error: 'Failed to toggle student block status.' });
  }
});

app.get('/api/resources', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  try {
    const snapshot = await db.collection('resources').orderBy('timestamp', 'desc').get();
    const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(resources);
  } catch (error) {
    console.error('Resources fetch failed:', error);
    res.status(500).json({ error: 'Failed to load resources.' });
  }
});

app.post('/api/submit-test-score', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { studentEmail, testName, classGrade, score, total, percentage, date, staffEmail } = req.body;
  
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  
  if (!studentEmail || !testName || !classGrade || score === undefined || !total || percentage === undefined || !date) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    await db.collection('test_scores').add({
      studentEmail: studentEmail.toLowerCase(),
      testName: testName.trim(),
      classGrade: classGrade,
      score: parseFloat(score),
      total: parseFloat(total),
      percentage: parseInt(percentage),
      date: date,
      submittedBy: staffEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ success: true, message: 'Test score submitted successfully.' });
  } catch (error) {
    console.error('Submit test score error:', error);
    res.status(500).json({ error: 'Failed to submit test score.' });
  }
});

app.get('/api/get-test-scores', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  try {
    const snapshot = await db.collection('test_scores').orderBy('timestamp', 'desc').limit(50).get();
    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(scores);
  } catch (error) {
    console.error('Get test scores error:', error);
    res.status(500).json({ error: 'Failed to get test scores.' });
  }
});

app.post('/api/delete-test-score', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { id, staffEmail } = req.body;
  
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  
  if (!id) {
    return res.status(400).json({ error: 'Missing score ID.' });
  }

  try {
    await db.collection('test_scores').doc(id).delete();
    res.status(200).json({ success: true, message: 'Test score deleted successfully.' });
  } catch (error) {
    console.error('Delete test score error:', error);
    res.status(500).json({ error: 'Failed to delete test score.' });
  }
});

app.get('/api/get-student-test-scores', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const cookies = req.headers.cookie ? require('cookie').parse(req.headers.cookie) : {};
  const sessionCookie = cookies[COOKIE_NAME];
  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session found.' });
  }

  let studentEmail = '';
  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded?.email || (decoded.role !== 'student' && decoded.role !== 'staff')) {
      return res.status(403).json({ error: 'Forbidden: Invalid session role.' });
    }
    studentEmail = decoded.email.trim().toLowerCase();
  } catch (error) {
    console.error('Get student test scores JWT error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid session.' });
  }

  try {
    const snapshot = await db.collection('test_scores')
      .where('studentEmail', '==', studentEmail)
      .get();
    
    const scores = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });

    res.status(200).json(scores);
  } catch (error) {
    console.error('Get student test scores error:', error);
    res.status(500).json({ error: 'Failed to get test scores.' });
  }
});

app.post('/api/post-news', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { title, content, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!title || !content) {
    return res.status(400).json({ error: 'Missing title or content.' });
  }
  try {
    await db.collection('notifications').add({
      title: title.trim(),
      content: content.trim(),
      author: staffEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Post news error:', error);
    res.status(500).json({ error: 'Failed to post news.' });
  }
});

app.get('/api/get-news', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  try {
    const snapshot = await db.collection('notifications').orderBy('timestamp', 'desc').get();
    const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to fetch news.' });
  }
});

app.post('/api/delete-news', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { id, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!id) {
    return res.status(400).json({ error: 'Missing news ID.' });
  }
  try {
    await db.collection('notifications').doc(id).delete();
    res.status(200).json({ success: true, message: 'News deleted successfully.' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Failed to delete news.' });
  }
});

app.post('/api/add-resource', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { title, link, classGrade, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!title || !link) {
    return res.status(400).json({ error: 'Missing title or link.' });
  }
  try {
    await db.collection('resources').add({
      title: title.trim(),
      link: link.trim(),
      type: 'pdf',
      classGrade: classGrade || 'All',
      author: staffEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({ error: 'Failed to add resource.' });
  }
});

app.post('/api/delete-resource', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { id, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!id) {
    return res.status(400).json({ error: 'Missing resource id.' });
  }
  try {
    await db.collection('resources').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource.' });
  }
});

app.post('/api/approve-admission', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { id, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!id) {
    return res.status(400).json({ error: 'Missing admission id.' });
  }
  try {
    await db.collection('admissions').doc(id).update({ status: 'Approved' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Approve admission error:', error);
    res.status(500).json({ error: 'Failed to approve admission.' });
  }
});

app.post('/api/delete-student', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  const { id, staffEmail } = req.body;
  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff user.' });
  }
  if (!id) {
    return res.status(400).json({ error: 'Missing student id.' });
  }
  try {
    await db.collection('admissions').doc(id).delete();
    res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student record.' });
  }
});

// --- Staff Management APIs ---

app.get('/api/get-staff', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  try {
    const snap = await db.collection('staff').orderBy('timestamp', 'desc').get();
    const staff = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(staff);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/add-staff', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  const { name, email, role, staffEmail } = req.body;

  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    // Check if already exists
    const existing = await db.collection('staff').where('email', '==', normalizedEmail).get();
    if (!existing.empty) return res.status(400).json({ error: 'Staff member with this email already exists.' });

    await db.collection('staff').add({
      name: name.trim(),
      email: normalizedEmail,
      role: role.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/delete-staff', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  const { id, staffEmail } = req.body;

  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Protect super admins from being deleted if they were added to DB
  try {
    const doc = await db.collection('staff').doc(id).get();
    if (doc.exists && superAdmins.includes(doc.data().email)) {
      return res.status(400).json({ error: 'Cannot delete super-admin records.' });
    }

    await db.collection('staff').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };

    // 3. --- Save to Firestore ---
    await db.collection('admissions').add(applicationData);
    res.status(200).json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- WhatsApp Message Sending Endpoint ---
app.post('/api/send-whatsapp', async (req, res) => {
  if (!twilioClient) {
    return res.status(503).json({ error: 'WhatsApp service is not configured.' });
  }
  
  try {
    const { phone, message } = req.body;

    // Validate required fields
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone number and message are required.' });
    }

    // Validate phone number format (should start with + and country code)
    if (!phone.startsWith('+')) {
      return res.status(400).json({ error: 'Phone number must include country code (e.g., +91XXXXXXXXXX).' });
    }

    // Send WhatsApp message using Twilio
    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
      body: message
    });

    console.log('WhatsApp message sent:', response.sid);

    res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully!',
      messageId: response.sid
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      error: 'Failed to send WhatsApp message.',
      details: error.message
    });
  }
});

// --- Bulk WhatsApp Broadcast Endpoint ---
app.post('/api/broadcast-whatsapp', async (req, res) => {
  if (!twilioClient) {
    return res.status(503).json({ error: 'WhatsApp service is not configured.' });
  }
  
  try {
    const { phones, message } = req.body;

    if (!phones || !Array.isArray(phones) || phones.length === 0 || !message) {
      return res.status(400).json({ error: 'Valid phone array and message are required.' });
    }

    const results = [];
    const errors = [];

    // Send messages with rate limiting (Twilio has limits)
    for (let i = 0; i < phones.length; i++) {
      try {
        const phone = phones[i];
        if (!phone.startsWith('+')) {
          errors.push({ phone, error: 'Invalid phone format' });
          continue;
        }

        const response = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${phone}`,
          body: message
        });

        results.push({ phone, messageId: response.sid, status: 'sent' });

        // Small delay to avoid rate limits
        if (i < phones.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error sending to ${phones[i]}:`, error.message);
        errors.push({ phone: phones[i], error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Broadcast completed. ${results.length} sent, ${errors.length} failed.`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in broadcast:', error);
    res.status(500).json({ error: 'Broadcast failed.', details: error.message });
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
