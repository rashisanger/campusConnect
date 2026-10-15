const mongoose = require('mongoose');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const User = require('../models/User');

const EVENT_FIELDS = [
  'title',
  'description',
  'poster',
  'category',
  'tags',
  'venue',
  'schedule',
  'capacity',
  'speakers',
  'agenda',
  'registrationDeadline'
];
const UPDATE_FIELDS = [...EVENT_FIELDS, 'status'];

class ServiceError extends Error {
  constructor(message, statusCode = 400, field) {
    super(message);
    this.statusCode = statusCode;
    this.errors = field ? [{ field, message }] : undefined;
  }
}

function pickFields(source, allowedFields) {
  return Object.fromEntries(
    allowedFields.filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]])
  );
}

function safeTextSearch(value) {
  return value
    .replace(/["\\$-]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function assertSchedule(schedule, deadline, { requireFutureStart = false } = {}) {
  const startAt = new Date(schedule.startAt);
  const endAt = new Date(schedule.endAt);
  const registrationDeadline = new Date(deadline);
  if (Number.isNaN(startAt.valueOf()) || Number.isNaN(endAt.valueOf()) || endAt <= startAt) {
    throw new ServiceError('Event end time must be after its start time.', 400, 'schedule.endAt');
  }
  if (Number.isNaN(registrationDeadline.valueOf()) || registrationDeadline >= startAt) {
    throw new ServiceError('Registration deadline must be before the event start time.', 400, 'registrationDeadline');
  }
  if (requireFutureStart && startAt <= new Date()) {
    throw new ServiceError('Event start time must be in the future.', 400, 'schedule.startAt');
  }
}

function toPublicQuery(query) {
  const filter = { status: { $in: ['published', 'cancelled'] } };
  if (query.category) {
    if (!validId(query.category)) throw new ServiceError('Invalid category filter.');
    filter.category = query.category;
  }
  if (query.venue) {
    if (!validId(query.venue)) throw new ServiceError('Invalid venue filter.');
    filter.venue = query.venue;
  }

  const startAt = {};
  const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null;
  if (dateFrom) startAt.$gte = dateFrom;
  let dateTo;
  if (query.dateTo) {
    dateTo = new Date(query.dateTo);
    if (/^\d{4}-\d{2}-\d{2}$/.test(query.dateTo)) dateTo.setUTCHours(23, 59, 59, 999);
    startAt.$lte = dateTo;
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new ServiceError('The end date cannot be before the start date.');
  }
  if (query.upcoming === 'true') startAt.$gt = new Date();
  if (Object.keys(startAt).length) filter['schedule.startAt'] = startAt;

  const search = typeof query.search === 'string' ? safeTextSearch(query.search) : '';
  if (search) filter.$text = { $search: search };
  return filter;
}

function eventQuery() {
  return Event.find().populate('category').populate('venue').populate('organizer', 'name');
}

async function getEvents(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 9));
  const filter = toPublicQuery(query);
  const sortFields = {
    date_asc: { 'schedule.startAt': 1 },
    date_desc: { 'schedule.startAt': -1 },
    newest: { createdAt: -1 }
  };
  const sort = sortFields[query.sort] || sortFields.date_asc;
  const [events, totalEvents] = await Promise.all([
    eventQuery().find(filter).sort(sort).skip((page - 1) * limit).limit(limit).exec(),
    Event.countDocuments(filter)
  ]);

  return {
    events,
    page,
    totalPages: Math.ceil(totalEvents / limit),
    totalEvents
  };
}

async function getPublicEvent(id) {
  if (!validId(id)) throw new ServiceError('Event not found.', 404);
  const event = await eventQuery().findOne({
    _id: id,
    status: { $in: ['published', 'cancelled'] }
  });
  if (!event) throw new ServiceError('Event not found.', 404);
  return event;
}

async function createEvent(body, organizerId) {
  const fields = pickFields(body, EVENT_FIELDS);
  fields.status = body.status === 'draft' ? 'draft' : 'published';
  fields.organizer = organizerId;
  assertSchedule(fields.schedule, fields.registrationDeadline, { requireFutureStart: true });

  const category = await Category.exists({ _id: fields.category });
  const venue = await Venue.exists({ _id: fields.venue });
  if (!category) throw new ServiceError('Select a valid category.', 400, 'category');
  if (!venue) throw new ServiceError('Select a valid venue.', 400, 'venue');

  const event = await Event.create(fields);
  return eventQuery().findById(event._id);
}

async function updateEvent(event, body) {
  const updates = pickFields(body, UPDATE_FIELDS);
  if (updates.category && !(await Category.exists({ _id: updates.category }))) {
    throw new ServiceError('Select a valid category.', 400, 'category');
  }
  if (updates.venue && !(await Venue.exists({ _id: updates.venue }))) {
    throw new ServiceError('Select a valid venue.', 400, 'venue');
  }
  if (updates.capacity !== undefined && updates.capacity < event.registeredCount) {
    throw new ServiceError('Capacity cannot be lower than the current registration count.', 400, 'capacity');
  }

  const nextSchedule = updates.schedule
    ? { ...event.schedule.toObject(), ...updates.schedule }
    : event.schedule;
  const nextDeadline = updates.registrationDeadline || event.registrationDeadline;
  assertSchedule(nextSchedule, nextDeadline);
  if (updates.schedule) updates.schedule = nextSchedule;
  event.set(updates);
  await event.save();
  return eventQuery().findById(event._id);
}

async function cancelEvent(event) {
  event.status = 'cancelled';
  await event.save();
  return eventQuery().findById(event._id);
}

async function deleteEvent(event) {
  if (event.registeredCount > 0) {
    throw new ServiceError('This event has registrations. Cancel it instead of deleting it.', 409);
  }
  await event.deleteOne();
}

async function getOrganizerEvents(organizerId, role) {
  const filter = role === 'admin' ? {} : { organizer: organizerId };
  return eventQuery().find(filter).sort({ 'schedule.startAt': 1 });
}

async function listCategories() {
  return Category.find().sort({ name: 1 });
}

async function listVenues() {
  return Venue.find().sort({ name: 1 });
}

async function createCategory(body) {
  return Category.create({ name: body.name, description: body.description || '' });
}

async function updateCategory(id, body) {
  const category = await Category.findByIdAndUpdate(
    id,
    { $set: pickFields(body, ['name', 'description']) },
    { new: true, runValidators: true }
  );
  if (!category) throw new ServiceError('Category not found.', 404);
  return category;
}

async function deleteCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw new ServiceError('Category not found.', 404);
  if (await Event.exists({ category: id })) {
    throw new ServiceError('This category is used by an event and cannot be deleted.', 409);
  }
  await Category.deleteOne({ _id: id });
}

async function createVenue(body) {
  return Venue.create(pickFields(body, ['name', 'building', 'room', 'address', 'coordinates']));
}

async function updateVenue(id, body) {
  const venue = await Venue.findByIdAndUpdate(
    id,
    { $set: pickFields(body, ['name', 'building', 'room', 'address', 'coordinates']) },
    { new: true, runValidators: true }
  );
  if (!venue) throw new ServiceError('Venue not found.', 404);
  return venue;
}

async function deleteVenue(id) {
  if (!(await Venue.exists({ _id: id }))) throw new ServiceError('Venue not found.', 404);
  if (await Event.exists({ venue: id })) {
    throw new ServiceError('This venue is used by an event and cannot be deleted.', 409);
  }
  await Venue.deleteOne({ _id: id });
}

async function createAdminUser(body) {
  const email = body.email.trim().toLowerCase();
  if (!['organizer', 'admin'].includes(body.role)) {
    throw new ServiceError('Role must be organizer or admin.');
  }
  try {
    return await User.create({
      name: body.name,
      email,
      passwordHash: body.password,
      role: body.role
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      throw new ServiceError('An account with this email already exists.', 409);
    }
    throw error;
  }
}

async function listAdminUsers(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const [users, totalUsers] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments()
  ]);
  return { users, page, totalPages: Math.ceil(totalUsers / limit), totalUsers };
}

module.exports = {
  ServiceError,
  getEvents,
  getPublicEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getOrganizerEvents,
  listCategories,
  listVenues,
  createCategory,
  updateCategory,
  deleteCategory,
  createVenue,
  updateVenue,
  deleteVenue,
  createAdminUser,
  listAdminUsers
};
