const express = require('express');
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));
router.get(
  '/events',
  [
    query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
    query('search').optional().isString().trim().isLength({ max: 200 }),
    query('organizer').optional().isMongoId(),
    query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validateRequest,
  adminController.listEvents
);
router.get(
  '/users',
  [
    query('role').optional().isIn(['student', 'organizer', 'admin']),
    query('isActive').optional().isIn(['true', 'false']),
    query('search').optional().isString().trim().isLength({ max: 100 }),
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
router.patch(
  '/users/:userId',
  param('userId').isMongoId(),
  body('role').optional().isIn(['student', 'organizer', 'admin']),
  body('isActive').optional().isBoolean({ strict: true }),
  body('name').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('department').optional().isString().trim().isLength({ max: 100 }),
  body('year').optional().isString().trim().isLength({ max: 20 }),
  body('password').not().exists().withMessage('Password cannot be changed through this endpoint.'),
  validateRequest,
  adminController.updateUser
);
router.delete(
  '/users/:userId',
  param('userId').isMongoId(),
  validateRequest,
  adminController.deleteUser
);

module.exports = router;
