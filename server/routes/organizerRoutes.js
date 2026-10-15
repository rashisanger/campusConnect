const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { getOrganizerEvents } = require('../controllers/eventController');
const organizerController = require('../controllers/organizerController');
const requireEventOwnership = require('../middleware/requireEventOwnership');
const { body, param, query } = require('express-validator');

const router = express.Router();

router.get('/events', authenticate, authorize('organizer', 'admin'), validateRequest, getOrganizerEvents);
router.get(
  '/events/:eventId/registrations',
  authenticate,
  authorize('organizer', 'admin'),
  param('eventId').isMongoId(),
  query('status').optional().isIn(['registered', 'cancelled']),
  query('attendance').optional().isIn(['attended', 'not_attended']),
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest,
  requireEventOwnership,
  organizerController.listEventRegistrations
);
router.get(
  '/events/:eventId/attendance',
  authenticate,
  authorize('organizer', 'admin'),
  param('eventId').isMongoId(),
  query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest,
  requireEventOwnership,
  organizerController.listEventAttendance
);
router.post(
  '/events/:eventId/check-ins',
  authenticate,
  authorize('organizer', 'admin'),
  param('eventId').isMongoId(),
  body('token').isString().trim().matches(/^[a-f0-9]{48}$/i).withMessage('A valid QR token is required.'),
  validateRequest,
  requireEventOwnership,
  organizerController.checkInByToken
);
router.post(
  '/events/:eventId/registrations/:registrationId/check-in',
  authenticate,
  authorize('organizer', 'admin'),
  param('eventId').isMongoId(),
  param('registrationId').isMongoId(),
  validateRequest,
  requireEventOwnership,
  organizerController.checkInByRegistration
);

module.exports = router;
