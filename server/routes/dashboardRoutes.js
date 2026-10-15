const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const registrationController = require('../controllers/registrationController');

const router = express.Router();

router.get('/student', authenticate, authorize('student'), registrationController.getStudentDashboard);

module.exports = router;
