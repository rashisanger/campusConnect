const express = require('express');
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const registrationController = require('../controllers/registrationController');

const router = express.Router();
const registrationId = param('registrationId').isMongoId().withMessage('Registration ID is invalid.');
const eventId = param('eventId').isMongoId().withMessage('Event ID is invalid.');

router.use(authenticate, authorize('student'));

router.post(
  '/',
  body('eventId').isMongoId().withMessage('A valid event ID is required.'),
  validateRequest,
  registrationController.register
);
router.get(
  '/me',
  [
    query('tab').optional().isIn(['upcoming', 'attended', 'cancelled']),
    query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validateRequest,
  registrationController.listMine
);
router.get('/event/:eventId', eventId, validateRequest, registrationController.getForEvent);
router.patch('/:registrationId/cancel', registrationId, validateRequest, registrationController.cancel);
router.get('/:registrationId', registrationId, validateRequest, registrationController.getMine);

module.exports = router;
