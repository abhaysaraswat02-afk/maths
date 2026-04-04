require('dotenv').config();
const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/^"(.*)"$/, '$1');
const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^"(.*)"$/, '$1');
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .replace(/^"(.*)"$/, '$1');
console.log('projectId=' + projectId);
console.log('clientEmail=' + clientEmail);
console.log('privateKey startsWith -----BEGIN PRIVATE KEY----- ? ' + privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
console.log('privateKey endsWith -----END PRIVATE KEY----- ? ' + privateKey.trim().endsWith('-----END PRIVATE KEY-----'));
console.log('databaseURL=' + process.env.FIREBASE_DATABASE_URL);
