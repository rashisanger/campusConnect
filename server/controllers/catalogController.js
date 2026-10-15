const eventService = require('../services/eventService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const listCategories = asyncHandler(async (_req, res) => {
  res.json({ categories: await eventService.listCategories() });
});

const listVenues = asyncHandler(async (_req, res) => {
  res.json({ venues: await eventService.listVenues() });
});

const createCategory = asyncHandler(async (req, res) => {
  res.status(201).json({ category: await eventService.createCategory(req.body) });
});

const updateCategory = asyncHandler(async (req, res) => {
  res.json({ category: await eventService.updateCategory(req.params.categoryId, req.body) });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await eventService.deleteCategory(req.params.categoryId);
  res.status(204).end();
});

const createVenue = asyncHandler(async (req, res) => {
  res.status(201).json({ venue: await eventService.createVenue(req.body) });
});

const updateVenue = asyncHandler(async (req, res) => {
  res.json({ venue: await eventService.updateVenue(req.params.venueId, req.body) });
});

const deleteVenue = asyncHandler(async (req, res) => {
  await eventService.deleteVenue(req.params.venueId);
  res.status(204).end();
});

module.exports = {
  listCategories,
  listVenues,
  createCategory,
  updateCategory,
  deleteCategory,
  createVenue,
  updateVenue,
  deleteVenue
};
