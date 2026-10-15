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

module.exports = { createUser, listUsers };
