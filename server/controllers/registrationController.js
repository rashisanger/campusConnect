const registrationService = require('../services/registrationService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const register = asyncHandler(async (req, res) => {
  const registration = await registrationService.registerForEvent(req.user.id, req.body.eventId);
  res.status(201).json({ registration });
});

const cancel = asyncHandler(async (req, res) => {
  const registration = await registrationService.cancelRegistration(req.user.id, req.params.registrationId);
  res.json({ registration });
});

const listMine = asyncHandler(async (req, res) => {
  res.json(await registrationService.getMyRegistrations(req.user.id, req.query));
});

const getMine = asyncHandler(async (req, res) => {
  const registration = await registrationService.getRegistrationById(req.user.id, req.params.registrationId);
  res.json({ registration });
});

const getForEvent = asyncHandler(async (req, res) => {
  const registration = await registrationService.getRegistrationForEvent(req.user.id, req.params.eventId);
  res.json({ registration });
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  res.json(await registrationService.getStudentDashboard(req.user.id));
});

module.exports = { register, cancel, listMine, getMine, getForEvent, getStudentDashboard };
