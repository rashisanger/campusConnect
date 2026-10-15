const checkInService = require('../services/checkInService');
const organizerService = require('../services/organizerService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const checkInByToken = asyncHandler(async (req, res) => {
  const result = await checkInService.checkInByToken(req.params.eventId, req.body.token, req.user.id);
  res.status(201).json(result);
});

const checkInByRegistration = asyncHandler(async (req, res) => {
  const result = await checkInService.checkInByRegistration(
    req.params.eventId,
    req.params.registrationId,
    req.user.id
  );
  res.status(201).json(result);
});

const listEventRegistrations = asyncHandler(async (req, res) => {
  res.json(await organizerService.getEventRegistrations(req.params.eventId, req.query));
});

const listEventAttendance = asyncHandler(async (req, res) => {
  res.json(await organizerService.getEventAttendance(req.params.eventId, req.query));
});

module.exports = {
  checkInByToken,
  checkInByRegistration,
  listEventRegistrations,
  listEventAttendance
};
