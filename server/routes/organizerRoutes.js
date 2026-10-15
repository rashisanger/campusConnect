const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { getOrganizerEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/events', authenticate, authorize('organizer', 'admin'), validateRequest, getOrganizerEvents);

module.exports = router;
