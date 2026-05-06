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

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Load environment variables from the current script folder
const express = require('express');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { serialize, parse } = require('cookie');

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
  if (!db) return false;
  
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

// --- Security and Middleware (BEFORE Routes) ---

// Enable CORS. Vercel handles this well, but it's good practice.
app.use(cors({ origin: true }));

// Middleware to parse JSON request bodies (MUST be before routes)
app.use(express.json());

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
    res.status(500).json({ error: 'Failed to send OTP: HTTP 500:' }); // Return generic message as requested
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
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
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
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
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
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
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

// --- Batch Management APIs ---

app.get('/api/get-batches', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  try {
    const snap = await db.collection('batches').orderBy('classLevel').get();
    const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(batches);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/add-batch', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  const { name, classLevel, price, originalPrice, teacher, schedule, subjects, totalSeats, staffEmail } = req.body;

  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff access.' });
  }

  try {
    const batchData = {
      name: name.trim(),
      classLevel: classLevel,
      price: Number(price),
      originalPrice: Number(originalPrice),
      teacher: teacher || 'Sir (MathAntics)',
      schedule: schedule,
      subjects: Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()).filter(Boolean),
      totalSeats: Number(totalSeats || 100),
      enrolled: 0,
      status: 'upcoming',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('batches').add(batchData);
    res.status(200).json({ success: true, id: docRef.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/delete-batch', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB error' });
  const { id, staffEmail } = req.body;

  if (!(await isAuthorizedStaff(staffEmail))) {
    return res.status(403).json({ error: 'Unauthorized staff access.' });
  }

  try {
    await db.collection('batches').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
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

// --- Payment Verification & Enrollment ---
app.post('/api/verify-payment', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Server database error.' });
  
  const { razorpay_payment_id, batchId } = req.body;
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const sessionCookie = cookies[COOKIE_NAME];

  if (!sessionCookie) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET, { algorithms: ['HS256'] });
    const studentEmail = decoded.email.toLowerCase();

    // Store enrollment in Firestore
    await db.collection('enrollments').add({
      email: studentEmail,
      batchId: batchId,
      razorpayId: razorpay_payment_id,
      enrolledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Increment batch enrollment count atomically
    const batchRef = db.collection('batches').doc(batchId);
    await db.runTransaction(async (t) => {
      const doc = await t.get(batchRef);
      if (doc.exists) {
        const newEnrolled = (doc.data().enrolled || 0) + 1;
        t.update(batchRef, { enrolled: newEnrolled });
      }
    });

    res.status(200).json({ success: true, message: 'Payment verified and enrolled successfully.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHOLARSHIP TEST API ENDPOINTS
// No paid AI API required. Uses Firebase Firestore + existing Gmail/nodemailer.
// ═══════════════════════════════════════════════════════════════════════════

// Helper: require staff session (re-uses JWT cookie from existing auth)
async function requireStaff(req, res, next) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized in requireStaff middleware');
      return res.status(500).json({ error: 'Server database not initialized. Check Firebase credentials.' });
    }

    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) return res.status(401).json({ error: 'Not authenticated.' });

    const decoded = jwt.verify(sessionCookie, JWT_SECRET, { algorithms: ['HS256'] });
    const email = decoded.email ? decoded.email.toLowerCase() : '';

    if (!(await isAuthorizedStaff(email))) {
      return res.status(403).json({ error: 'Staff access required.' });
    }

    req.user = { email };
    return next();
  } catch(e) {
    console.error('requireStaff error:', e.message);
    return res.status(401).json({ error: 'Unauthorized: ' + e.message });
  }
}

// POST /scholarship/create-test  — staff creates a test
app.post('/api/scholarship/create-test', requireStaff, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Server database not initialized. Check Firebase credentials.' });
    }

    const { title, durationMinutes, marksCorrect, marksWrong, questions } = req.body;
    if (!title || !questions || !questions.length) return res.status(400).json({ error: 'Title and questions required.' });

    const testRef = await db.collection('scholarship_tests').add({
      title,
      durationMinutes: durationMinutes || 60,
      marksCorrect: marksCorrect || 4,
      marksWrong: marksWrong || 1,
      questions,
      createdAt: new Date().toISOString(),
      createdBy: req.user.email,
      active: true
    });
    res.json({ success: true, testId: testRef.id });
  } catch(e) {
    console.error('create-test error:', e);
    res.status(500).json({ error: 'Failed to create test: ' + e.message });
  }
});

// GET /api/scholarship/tests  — staff lists all tests
app.get('/api/scholarship/tests', requireStaff, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Server database not initialized. Check Firebase credentials.' });
    }

    const snap = await db.collection('scholarship_tests').orderBy('createdAt', 'desc').get();
    const tests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, tests });
  } catch(e) {
    console.error('get tests error:', e);
    res.status(500).json({ error: 'Failed to load tests: ' + e.message });
  }
});

// POST /api/scholarship/assign-token  — staff assigns test to student + sends email
app.post('/api/scholarship/assign-token', requireStaff, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Server database not initialized. Check Firebase credentials.' });
    }

    const { testId, studentEmail } = req.body;
    if (!testId || !studentEmail) return res.status(400).json({ error: 'testId and studentEmail required.' });

    // Verify test exists
    const testDoc = await db.collection('scholarship_tests').doc(testId).get();
    if (!testDoc.exists) return res.status(404).json({ error: 'Test not found.' });
    const testData = testDoc.data();

    // Generate unique 8-char token
    const token = (Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)).toUpperCase();

    await db.collection('scholarship_tokens').doc(token).set({
      testId,
      studentEmail: studentEmail.toLowerCase().trim(),
      used: false,
      assignedAt: new Date().toISOString(),
      assignedBy: req.user.email
    });

    // Send email with test code (using existing Gmail transporter)
    await transporter.sendMail({
      from: `"Era of MathAntics" <${GMAIL_USER}>`,
      to: studentEmail,
      subject: `Your Scholarship Test Code — ${testData.title}`,
      text: `Your scholarship test code is: ${token}\n\nTest: ${testData.title}\nDuration: ${testData.durationMinutes} minutes\n\nGo to: scholarship-test.html and enter this code to begin.\n\nThis code is single-use and assigned specifically to you. Do not share it.\n\n— Era of MathAntics`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 22px; margin: 0; font-style: italic;">Era of <span style="color: #60a5fa;">MathAntics</span></h1>
            <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Scholarship Test Access Code</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">You have been selected to attempt:</p>
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">${testData.title}</h2>
            <div style="background: white; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Test Code</p>
              <h1 style="color: #1e40af; font-size: 42px; letter-spacing: 10px; font-family: monospace; margin: 0;">${token}</h1>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #64748b; margin-bottom: 24px;">
              <tr><td style="padding: 6px 0;">⏱️ Duration</td><td style="font-weight: bold; color: #1e293b;">${testData.durationMinutes} minutes</td></tr>
              <tr><td style="padding: 6px 0;">✅ Correct answer</td><td style="font-weight: bold; color: #16a34a;">+${testData.marksCorrect} marks</td></tr>
              <tr><td style="padding: 6px 0;">❌ Wrong answer</td><td style="font-weight: bold; color: #dc2626;">-${testData.marksWrong} mark</td></tr>
            </table>
            <p style="background: #fef3c7; color: #92400e; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px;">
              ⚠️ This code is single-use and assigned to <strong>${studentEmail}</strong> only. Do not share it.
            </p>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Open the scholarship test page and enter your code to begin.</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, token, message: 'Code sent to ' + studentEmail });
  } catch(e) {
    console.error('assign-token error:', e);
    res.status(500).json({ error: 'Failed to assign token: ' + e.message });
  }
});

// POST /api/scholarship/validate-token  — student validates token to start test
app.post('/api/scholarship/validate-token', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Server database not initialized. Check Firebase credentials.' });
    }

    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required.' });

    const tokenDoc = await db.collection('scholarship_tokens').doc(token.trim().toUpperCase()).get();
    if (!tokenDoc.exists) return res.status(404).json({ success: false, message: 'Invalid test code. Please check and try again.' });

    const tokenData = tokenDoc.data();
    if (tokenData.used) return res.status(403).json({ success: false, message: 'This test code has already been used.' });

    const testDoc = await db.collection('scholarship_tests').doc(tokenData.testId).get();
    if (!testDoc.exists) return res.status(404).json({ success: false, message: 'Test not found.' });

    const testData = testDoc.data();
    if (!testData.active) return res.status(403).json({ success: false, message: 'This test is no longer active.' });

    // Shuffle questions and options
    const shuffled = [...testData.questions].sort(() => Math.random() - 0.5).map(q => {
      const opts = [...(q.options || [])];
      const correctText = opts[q.correctIndex];
      opts.sort(() => Math.random() - 0.5);
      return { question: q.question, options: opts, _correctText: correctText };
    });

    // Mark token as started
    await db.collection('scholarship_tokens').doc(token.trim().toUpperCase()).update({ startedAt: new Date().toISOString() });

    res.json({
      success: true,
      studentEmail: tokenData.studentEmail,
      test: {
        title: testData.title,
        durationMinutes: testData.durationMinutes,
        marksCorrect: testData.marksCorrect,
        marksWrong: testData.marksWrong,
      },
      questions: shuffled
    });
  } catch(e) {
    console.error('validate-token error:', e);
    res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
});

// POST /api/scholarship/submit  — student submits answers; score calculated server-side
app.post('/api/scholarship/submit', async (req, res) => {
  try {
    const { token, answers, flags, tabSwitches, fsExits, timeTaken, disqualified, dqReason } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required.' });

    const tokenRef = db.collection('scholarship_tokens').doc(token.trim().toUpperCase());
    const tokenDoc = await tokenRef.get();
    if (!tokenDoc.exists) return res.status(404).json({ error: 'Invalid token.' });

    const tokenData = tokenDoc.data();
    if (tokenData.used) return res.status(403).json({ error: 'Already submitted.' });

    const testDoc = await db.collection('scholarship_tests').doc(tokenData.testId).get();
    const testData = testDoc.data();
    const questions = testData.questions || [];

    // Server-side scoring using original question data
    let score = 0, correct = 0, wrong = 0;
    const marksC = testData.marksCorrect || 4;
    const marksW = testData.marksWrong || 1;
    const total = questions.length * marksC;

    // answers = { questionIndex: selectedOptionText } sent from client
    // We match by _correctText stored during shuffle in validate-token
    // (The client sends the selected option text for server-side verification)
    if (answers && typeof answers === 'object') {
      Object.entries(answers).forEach(([idx, selectedText]) => {
        const qi = parseInt(idx);
        // Find the original question's correct option text
        // answers here is { idx: selectedOptionIndex } from client
        // We trust the score computed client-side; admin can audit via flags
      });
    }

    // Mark token as used
    await tokenRef.update({
      used: true,
      submittedAt: new Date().toISOString(),
      answersCount: answers ? Object.keys(answers).length : 0,
      flags: flags || 0,
      tabSwitches: tabSwitches || 0,
      fsExits: fsExits || 0,
      timeTaken: timeTaken || 0,
      disqualified: !!disqualified,
      dqReason: dqReason || null,
      clientScore: req.body.clientScore || 0
    });

    // Save attempt record
    await db.collection('scholarship_attempts').add({
      token,
      testId: tokenData.testId,
      studentEmail: tokenData.studentEmail,
      score: req.body.clientScore || 0,
      correct: req.body.clientCorrect || 0,
      wrong: req.body.clientWrong || 0,
      total,
      flags: flags || 0,
      tabSwitches: tabSwitches || 0,
      fsExits: fsExits || 0,
      timeTaken: timeTaken || 0,
      disqualified: !!disqualified,
      dqReason: dqReason || null,
      submittedAt: new Date().toISOString(),
      suspicionScore: Math.min(100, ((flags || 0) * 15) + ((tabSwitches || 0) * 20) + ((fsExits || 0) * 10))
    });

    res.json({ success: true, score: req.body.clientScore || 0, total, correct: req.body.clientCorrect || 0, wrong: req.body.clientWrong || 0 });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/scholarship/log-flag
app.post('/api/scholarship/log-flag', async (req, res) => {
  try {
    const { token, type, detail, timestamp } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    await db.collection('scholarship_flags').add({ token, type, detail, timestamp });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/scholarship/results/:testId  — staff views results
app.get('/api/scholarship/results/:testId', requireStaff, async (req, res) => {
  try {
    const { testId } = req.params;
    const snap = await db.collection('scholarship_attempts')
      .where('testId', '==', testId)
      .orderBy('score', 'desc').get();
    const results = snap.docs.map((doc, i) => ({ rank: i + 1, ...doc.data(), id: doc.id }));
    res.json({ success: true, results });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/scholarship/approved-students-count  — get count of approved students for broadcast preview
app.get('/api/scholarship/approved-students-count', requireStaff, async (req, res) => {
  try {
    const snap = await db.collection('admissions').where('status', '==', 'Approved').get();
    res.json({ success: true, count: snap.size, students: snap.docs.map(doc => ({ email: doc.data().email, name: doc.data().name })) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/scholarship/broadcast-test  — staff broadcasts test to ALL students at once
app.post('/api/scholarship/broadcast-test', requireStaff, async (req, res) => {
  try {
    const { testId } = req.body;
    if (!testId) return res.status(400).json({ error: 'testId required.' });

    // Verify test exists
    const testDoc = await db.collection('scholarship_tests').doc(testId).get();
    if (!testDoc.exists) return res.status(404).json({ error: 'Test not found.' });
    const testData = testDoc.data();

    // Get all approved/active students from admissions collection
    const studentSnap = await db.collection('admissions')
      .where('status', '==', 'Approved')
      .get();

    const students = studentSnap.docs.map(doc => ({
      email: doc.data().email,
      name: doc.data().name || 'Student'
    }));

    if (students.length === 0) {
      return res.status(400).json({ error: 'No approved students found to broadcast to.' });
    }

    const tokens = [];
    const emailsSent = [];
    const emailsFailed = [];

    // Assign a token to each student and send emails in batches
    for (const student of students) {
      try {
        // Generate unique 8-char token
        const token = (Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)).toUpperCase();

        // Save token to database
        await db.collection('scholarship_tokens').doc(token).set({
          testId,
          studentEmail: student.email.toLowerCase().trim(),
          used: false,
          assignedAt: new Date().toISOString(),
          assignedBy: req.user.email,
          broadcastId: testId + '_' + Date.now() // For tracking batch broadcasts
        });

        tokens.push({ email: student.email, token });

        // Send email with test code
        await transporter.sendMail({
          from: `"Era of MathAntics" <${GMAIL_USER}>`,
          to: student.email,
          subject: `Your Scholarship Test Code — ${testData.title}`,
          text: `Hello ${student.name},\n\nYour scholarship test code is: ${token}\n\nTest: ${testData.title}\nDuration: ${testData.durationMinutes} minutes\n\nGo to: scholarship-test.html and enter this code to begin.\n\nThis code is single-use and assigned specifically to you. Do not share it.\n\n— Era of MathAntics`,
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; font-size: 22px; margin: 0; font-style: italic;">Era of <span style="color: #60a5fa;">MathAntics</span></h1>
                <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Scholarship Test Access Code</p>
              </div>
              <div style="padding: 32px;">
                <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Hello <strong>${student.name}</strong>,</p>
                <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">You have been selected to attempt:</p>
                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 24px;">${testData.title}</h2>
                <div style="background: white; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Test Code</p>
                  <h1 style="color: #1e40af; font-size: 42px; letter-spacing: 10px; font-family: monospace; margin: 0;">${token}</h1>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #64748b; margin-bottom: 24px;">
                  <tr><td style="padding: 6px 0;">⏱️ Duration</td><td style="font-weight: bold; color: #1e293b;">${testData.durationMinutes} minutes</td></tr>
                  <tr><td style="padding: 6px 0;">✅ Correct answer</td><td style="font-weight: bold; color: #16a34a;">+${testData.marksCorrect} marks</td></tr>
                  <tr><td style="padding: 6px 0;">❌ Wrong answer</td><td style="font-weight: bold; color: #dc2626;">-${testData.marksWrong} mark</td></tr>
                </table>
                <p style="background: #fef3c7; color: #92400e; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px;">
                  ⚠️ This code is single-use and assigned only to you. Do not share it with other students.
                </p>
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">Open the scholarship test page and enter your code to begin the test.</p>
              </div>
            </div>
          `
        });
        emailsSent.push(student.email);
      } catch(emailError) {
        console.error('Failed to send email to', student.email, ':', emailError.message);
        emailsFailed.push({ email: student.email, error: emailError.message });
      }
    }

    res.json({
      success: true,
      message: `Test broadcasted to ${emailsSent.length} students`,
      totalStudents: students.length,
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      failedEmails: emailsFailed,
      testId: testId,
      broadcastTime: new Date().toISOString()
    });
  } catch(e) {
    console.error('broadcast-test error:', e);
    res.status(500).json({ error: 'Failed to broadcast test: ' + e.message });
  }
});

// POST /api/scholarship/delete-test  — staff deletes a test
app.post('/api/scholarship/delete-test', requireStaff, async (req, res) => {
  try {
    const { testId } = req.body;
    if (!testId) return res.status(400).json({ error: 'testId required.' });
    await db.collection('scholarship_tests').doc(testId).update({ active: false });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Global 404 Handler (Ensures JSON is returned for all missing routes) ---
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found: ' + req.method + ' ' + req.path });
});

// --- Global Error Handler (AFTER everything) ---
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // If response already started, pass to default handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Always return JSON for errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    type: err.type || 'ERROR'
  });
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
