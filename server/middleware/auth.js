import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization token provided. Access denied.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token found in Authorization header. Access denied.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('JWT_SECRET environment variable is required in production mode!'); })()
      : 'stressradar_local_development_secure_jwt_fallback_key_2026');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ message: 'Token is invalid or expired. Authorization failed.' });
  }
}
