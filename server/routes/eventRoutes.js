const express = require('express');
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const requireEventOwnership = require('../middleware/requireEventOwnership');
const validateRequest = require('../middleware/validateRequest');
const eventController = require('../controllers/eventController');

const router = express.Router();
const eventIdParam = param('eventId').isMongoId().withMessage('Event ID is invalid.');
const hasTimezone = (value) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

const eventFieldsValidation = [
  body('title').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional().isString().trim().notEmpty().isLength({ max: 5000 }),
  body('poster').optional({ checkFalsy: true }).isURL({ require_protocol: true })
    .withMessage('Poster must be a valid URL.'),
  body('category').optional().isMongoId().withMessage('Choose a valid category.'),
  body('venue').optional().isMongoId().withMessage('Choose a valid venue.'),
  body('tags').optional().isArray({ max: 30 }).withMessage('Tags must be a list of up to 30 items.'),
  body('tags.*').optional().isString().trim().isLength({ max: 50 }),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1.').toInt(),
  body('schedule').optional().isObject().withMessage('Schedule must include a start and end time.'),
  body('schedule.startAt').optional().isISO8601({ strict: true }).withMessage('Enter a valid event start date.')
    .custom((value) => {
      if (!hasTimezone(value)) throw new Error('Event start time must include a timezone.');
      return true;
    }),
  body('schedule.endAt').optional().isISO8601({ strict: true }).withMessage('Enter a valid event end date.')
    .custom((endAt, { req }) => {
      if (!hasTimezone(endAt)) throw new Error('Event end time must include a timezone.');
      if (req.body.schedule?.startAt && new Date(endAt) <= new Date(req.body.schedule.startAt)) {
        throw new Error('Event end time must be after its start time.');
      }
      return true;
    }),
  body('registrationDeadline').optional().isISO8601({ strict: true }).withMessage('Enter a valid registration deadline.')
    .custom((deadline, { req }) => {
      if (!hasTimezone(deadline)) throw new Error('Registration deadline must include a timezone.');
      if (req.body.schedule?.startAt && new Date(deadline) >= new Date(req.body.schedule.startAt)) {
        throw new Error('Registration deadline must be before the event start time.');
      }
      return true;
    }),
  body('speakers').optional().isArray({ max: 30 }),
  body('speakers.*.name').optional().isString().trim().notEmpty().isLength({ max: 120 }),
  body('speakers.*.designation').optional().isString().trim().isLength({ max: 120 }),
  body('speakers.*.bio').optional().isString().trim().isLength({ max: 1000 }),
  body('agenda').optional().isArray({ max: 50 }),
  body('agenda.*.time').optional().isString().trim().notEmpty().isLength({ max: 50 }),
  body('agenda.*.title').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('agenda.*.description').optional().isString().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published.')
];

const requiredEventFields = [
  body('title').isString().trim().notEmpty().withMessage('Title is required.').isLength({ max: 150 }),
  body('description').isString().trim().notEmpty().withMessage('Description is required.').isLength({ max: 5000 }),
  body('category').isMongoId().withMessage('Choose a valid category.'),
  body('venue').isMongoId().withMessage('Choose a valid venue.'),
  body('schedule').isObject().withMessage('Schedule is required.'),
  body('schedule.startAt').isISO8601({ strict: true }).withMessage('Enter a valid event start date.')
    .custom((startAt) => {
      if (!hasTimezone(startAt)) throw new Error('Event start time must include a timezone.');
      if (new Date(startAt) <= new Date()) throw new Error('Event start time must be in the future.');
      return true;
    }),
  body('schedule.endAt').isISO8601({ strict: true }).withMessage('Enter a valid event end date.')
    .custom((endAt, { req }) => {
      if (!hasTimezone(endAt)) throw new Error('Event end time must include a timezone.');
      if (new Date(endAt) <= new Date(req.body.schedule.startAt)) throw new Error('Event end time must be after its start time.');
      return true;
    }),
  body('registrationDeadline').isISO8601({ strict: true }).withMessage('Enter a valid registration deadline.')
    .custom((deadline, { req }) => {
      if (!hasTimezone(deadline)) throw new Error('Registration deadline must include a timezone.');
      if (new Date(deadline) >= new Date(req.body.schedule.startAt)) throw new Error('Registration deadline must be before the event start time.');
      return true;
    }),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1.').toInt()
];

const publicQueryValidation = [
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('category').optional().isMongoId(),
  query('venue').optional().isMongoId(),
  query('dateFrom').optional().isISO8601({ strict: true }),
  query('dateTo').optional().isISO8601({ strict: true }),
  query('sort').optional().isIn(['date_asc', 'date_desc', 'newest']),
  query('page').optional().isInt({ min: 1, max: 1000000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.').toInt(),
  query('upcoming').optional().isIn(['true', 'false'])
];

router.get('/', publicQueryValidation, validateRequest, eventController.getEvents);
router.get('/:eventId', eventIdParam, validateRequest, eventController.getEvent);
router.post(
  '/',
  authenticate,
  authorize('organizer', 'admin'),
  [...requiredEventFields, ...eventFieldsValidation],
  validateRequest,
  eventController.createEvent
);
router.put(
  '/:eventId',
  authenticate,
  authorize('organizer', 'admin'),
  eventIdParam,
  eventFieldsValidation,
  validateRequest,
  requireEventOwnership,
  eventController.updateEvent
);
router.patch(
  '/:eventId/cancel',
  authenticate,
  authorize('organizer', 'admin'),
  eventIdParam,
  validateRequest,
  requireEventOwnership,
  eventController.cancelEvent
);
router.delete(
  '/:eventId',
  authenticate,
  authorize('organizer', 'admin'),
  eventIdParam,
  validateRequest,
  requireEventOwnership,
  eventController.deleteEvent
);

module.exports = router;
