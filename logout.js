import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Clear the session cookie by setting its expiry to a past date
  res.setHeader('Set-Cookie', serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure in production
    sameSite: 'Lax', // Or 'Strict' for stronger protection
    path: '/',
    expires: new Date(0), // Expire immediately
  }));

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}