const express = require('express');
const { body, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validateRequest,
  adminController.listUsers
);
router.post(
  '/users',
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 128 })
      .withMessage('Password must contain 8 to 128 characters.'),
    body('role').isIn(['organizer', 'admin']).withMessage('Role must be organizer or admin.')
  ],
  validateRequest,
  adminController.createUser
);

module.exports = router;
