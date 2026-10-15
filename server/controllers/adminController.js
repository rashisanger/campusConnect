const eventService = require('../services/eventService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const createUser = asyncHandler(async (req, res) => {
  const user = await eventService.createAdminUser(req.body);
  res.status(201).json({ user });
});

const listUsers = asyncHandler(async (req, res) => {
  res.json(await eventService.listAdminUsers(req.query));
});

const listEvents = asyncHandler(async (req, res) => {
  res.json(await eventService.getAdminEvents(req.query));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await eventService.updateAdminUser(req.params.userId, req.body);
  res.json({ user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await eventService.deleteAdminUser(req.params.userId, req.user.id);
  res.status(204).end();
});

module.exports = { createUser, listUsers, listEvents, updateUser, deleteUser };
