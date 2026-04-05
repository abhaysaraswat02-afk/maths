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

require('dotenv').config(); // Load environment variables first
const express = require('express');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');
const twilio = require('twilio');

// --- Firebase Admin SDK Initialization ---
// IMPORTANT: In production, use Vercel Environment Variables for this!
// DO NOT hardcode your credentials.

// FIRESTORE SECURITY RULES NEEDED:
// Add the following to your Firestore Rules for backend operations to work:
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Required for both client-side and server-side verification
//     match /admissions/{document=**} {
//       allow read, write: if request.auth != null;
//     }
//     match /notifications/{document=**} {
//       allow read: if true;
//       allow write: if request.auth != null;
//     }
//     match /payments/{document=**} {
//       allow read, write: if request.auth != null;
//     }
//     match /resources/{document=**} {
//       allow read: if true;
//       allow write: if request.auth != null;
//     }
//   }
// }
let db;
try {
  const stripQuotes = value => {
    if (!value) return '';
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  };

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

// Serve static files (HTML, CSS, JS) from the current folder
app.use(express.static(__dirname));

// --- Nodemailer Transporter ---

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Remove hardcoded credentials
    pass: process.env.GMAIL_PASS, 
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

// --- Stateless OTP Logic ---
const OTP_SECRET = process.env.OTP_SECRET || 'era-of-mathantics-secret-key-2025';

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
  const { email } = req.body;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
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
    } catch (dbError) {
      console.warn('Could not check user existence:', dbError.message);
      // Continue anyway - user will verify via OTP
      isExistingUser = false;
    }

    // Send Email
    await transporter.sendMail({
      from: `"Era of MathAntics" <${process.env.GMAIL_USER}>`,
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
    console.error('Email error:', error);
    res.status(500).json({ error: `Failed to send OTP: ${error.message}` });
  }
});

// 2. Verify OTP Endpoint
app.post('/api/verify-otp', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Server database error.' });
  }
  const { email, code, verificationToken, isExistingUser, applicationForm } = req.body;
  
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

  if (applicationForm) {
    try {
      if (isExistingUser) {
        const existingUserSnap = await db.collection('admissions').where('email', '==', email).get();
        if (!existingUserSnap.empty) {
          await existingUserSnap.docs[0].ref.update({
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          return res.status(400).json({ success: false, error: 'Existing user record not found.' });
        }
      } else {
        await db.collection('admissions').add({
          name: applicationForm.name || '',
          email: email,
          phone: applicationForm.phone || 'Not Provided',
          fatherName: applicationForm.fatherName || '',
          studentClass: applicationForm.studentClass || '',
          dob: applicationForm.dob || '',
          schoolName: applicationForm.schoolName || '',
          status: 'Pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: admin.firestore.FieldValue.serverTimestamp()
        });
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