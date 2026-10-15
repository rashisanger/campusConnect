const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const registrationController = require('../controllers/registrationController');
const organizerService = require('../services/organizerService');
const analyticsService = require('../services/analyticsService');

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
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const [
        summary,
        categories,
        events,
        attendance,
        departments,
        years,
        monthlyTrend,
        averageRating
      ] = await Promise.all([
        analyticsService.platformSummary(),
        analyticsService.popularCategories(),
        analyticsService.registrationsPerEvent(),
        analyticsService.attendanceRate(),
        analyticsService.departmentParticipation(),
        analyticsService.yearParticipation(),
        analyticsService.monthlyEventTrend(),
        analyticsService.averageRating()
      ]);
      res.json({
        summary,
        popularCategories: categories,
        registrationsPerEvent: events,
        attendanceRate: attendance,
        departmentParticipation: departments,
        yearParticipation: years,
        monthlyEventTrend: monthlyTrend,
        averageRating
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
