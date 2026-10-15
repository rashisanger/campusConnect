const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  let decoded;
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    return res.status(401).json({ message: 'Your session is invalid or has expired.' });
  }

  try {
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Your account is unavailable.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
