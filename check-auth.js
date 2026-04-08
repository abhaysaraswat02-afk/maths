import jwt from 'jsonwebtoken';

const stripQuotes = value => {
  if (!value) return '';
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

// This secret must be the same as used in your middleware to verify JWTs.
const JWT_SECRET = stripQuotes(process.env.JWT_SECRET || 'your-super-secret-jwt-key');
// This list should ideally be managed in a database or a more secure configuration.
const STAFF_EMAILS = ['admin@mathantics.com', 'teacher@mathantics.com', 'jay83856@gmail.com', 'crackamubyabhay@gmail.com'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(sessionCookie, JWT_SECRET);

    // Determine role based on email or a 'role' field in the JWT payload
    const role = STAFF_EMAILS.includes(decoded.email) ? 'staff' : 'student';

    return res.status(200).json({ authenticated: true, role: role, email: decoded.email });
  } catch (error) {
    console.error('JWT verification failed in /api/check-auth:', error);
    res.setHeader('Set-Cookie', `session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`); // Clear invalid cookie
    return res.status(200).json({ authenticated: false });
  }
}