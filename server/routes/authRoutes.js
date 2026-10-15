const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

const registrationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 })
    .withMessage('Password must contain 8 to 128 characters.'),
  body('department').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('year').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('interests').optional().isArray().withMessage('Interests must be a list.'),
  body('interests.*').optional().isString().trim().isLength({ max: 50 })
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required.')
];

router.post('/register', registrationValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', authenticate, getMe);

module.exports = router;
