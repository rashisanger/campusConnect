const eventService = require('../services/eventService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const getEvents = asyncHandler(async (req, res) => {
  res.json(await eventService.getEvents(req.query));
});

const getEvent = asyncHandler(async (req, res) => {
  res.json({ event: await eventService.getPublicEvent(req.params.eventId) });
});

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user.id);
  res.status(201).json({ event });
});

const updateEvent = asyncHandler(async (req, res) => {
  res.json({ event: await eventService.updateEvent(req.event, req.body) });
});

const cancelEvent = asyncHandler(async (req, res) => {
  res.json({ event: await eventService.cancelEvent(req.event) });
});

const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.event);
  res.status(204).end();
});

const getOrganizerEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getOrganizerEvents(req.user.id, req.user.role);
  res.json({ events });
});

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getOrganizerEvents
};
