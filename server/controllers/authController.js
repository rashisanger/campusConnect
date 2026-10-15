const User = require('../models/User');
const createToken = require('../utils/token');

function authResponse(user) {
  return {
    user: user.toJSON(),
    token: createToken(user.id)
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password, department, year, interests = [] } = req.body;
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      department,
      year,
      interests: interests.map((interest) => interest.trim()).filter(Boolean),
      role: 'student'
    });

    return res.status(201).json({ data: authResponse(user) });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      error.statusCode = 409;
      error.message = 'An account with this email already exists.';
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account is inactive.' });
    }

    return res.json({ data: authResponse(user) });
  } catch (error) {
    return next(error);
  }
}

function getMe(req, res) {
  return res.json({ data: { user: req.user.toJSON() } });
}

module.exports = { register, login, getMe };
