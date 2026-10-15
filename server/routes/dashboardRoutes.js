const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const registrationController = require('../controllers/registrationController');
const organizerService = require('../services/organizerService');

const router = express.Router();

router.get('/student', authenticate, authorize('student'), registrationController.getStudentDashboard);
router.get(
  '/organizer',
  authenticate,
  authorize('organizer', 'admin'),
  async (req, res, next) => {
    try {
      res.json(await organizerService.getOrganizerDashboard(req.user.id, req.user.role));
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
