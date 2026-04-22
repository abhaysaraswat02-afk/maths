/**
 * /api/live-token — Generates JWT for WebSocket connection
 * Add this to your existing Express/Next.js API
 * This endpoint is called by student.html and staff.html before connecting to live server
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arrow-math-secret-2025';
const LIVE_TOKEN_EXPIRY = '8h'; // Token valid for 8 hours (one full school day)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify session cookie (your existing auth)
  const sessionToken = req.cookies?.session_token;
  if (!sessionToken) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Verify existing session
    const session = jwt.verify(sessionToken, JWT_SECRET);
    
    // Issue a live-class specific token
    const liveToken = jwt.sign(
      {
        uid:   session.uid,
        name:  session.name,
        email: session.email,
        role:  session.role,  // 'student' | 'staff'
      },
      JWT_SECRET,
      { expiresIn: LIVE_TOKEN_EXPIRY }
    );

    return res.status(200).json({ token: liveToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session' });
  }
}
