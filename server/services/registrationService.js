const crypto = require('crypto');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Transactions keep the registration record and event seat count in sync; the conditional seat update
// serializes competing requests, while a unique user/event index prevents duplicate registrations.
class RegistrationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function newQrToken() {
  return crypto.randomBytes(24).toString('hex');
}

function duplicateRegistrationError(error) {
  if (error.code === 11000) {
    throw new RegistrationError('You already have a registration for this event.', 409);
  }
  throw error;
}

function isValidId(value) {
  return mongoose.isValidObjectId(value);
}

function listTabMatch(tab, now) {
  if (tab === 'attended') return { attendanceStatus: 'attended' };
  if (tab === 'cancelled') {
    return {
      $or: [
        { status: 'cancelled' },
        { 'event.status': 'cancelled' }
      ]
    };
  }
  return {
    status: 'registered',
    'event.status': { $ne: 'cancelled' },
    'event.schedule.startAt': { $gt: now }
  };
}

function eventLookupStages() {
  return [
    { $lookup: { from: Event.collection.name, localField: 'event', foreignField: '_id', as: 'event' } },
    { $unwind: '$event' }
  ];
}

async function populateEventRecords(records) {
  const events = records.map((record) => record.event);
  await Event.populate(events, [{ path: 'venue' }, { path: 'category' }]);
  records.forEach((record, index) => { record.event = events[index]; });
  return records;
}

async function registerForEvent(userId, eventId) {
  if (!isValidId(eventId)) throw new RegistrationError('Event not found.', 404);

  const session = await mongoose.startSession();
  let registration;
  try {
    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) throw new RegistrationError('Event not found.', 404);
      if (event.status !== 'published') {
        throw new RegistrationError('This event is not open for registration.', 400);
      }
      const now = new Date();
      if (event.registrationDeadline <= now) {
        throw new RegistrationError('The registration deadline has passed.', 400);
      }
      if (event.schedule.startAt <= now) {
        throw new RegistrationError('This event has already started.', 400);
      }

      const existing = await Registration.findOne({ user: userId, event: eventId }).session(session);
      if (existing?.status === 'registered') {
        throw new RegistrationError('You are already registered for this event.', 409);
      }

      const reservedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          status: 'published',
          $expr: { $lt: ['$registeredCount', '$capacity'] }
        },
        { $inc: { registeredCount: 1 } },
        { session, new: true }
      );
      if (!reservedEvent) {
        throw new RegistrationError('This event is full or no longer open for registration.', 409);
      }

      const qrToken = newQrToken();
      if (existing) {
        existing.status = 'registered';
        existing.registrationDate = now;
        existing.cancelledAt = null;
        existing.qrToken = qrToken;
        await existing.save({ session });
        registration = await Registration.findById(existing._id)
          .select('+qrToken')
          .session(session);
      } else {
        const [created] = await Registration.create(
          [{ user: userId, event: eventId, registrationDate: now, qrToken }],
          { session }
        );
        registration = await Registration.findById(created._id)
          .select('+qrToken')
          .session(session);
      }
    });
  } catch (error) {
    duplicateRegistrationError(error);
  } finally {
    await session.endSession();
  }

  await Registration.populate(registration, {
    path: 'event',
    populate: [{ path: 'venue' }, { path: 'category' }]
  });
  return registration;
}

async function cancelRegistration(userId, registrationId) {
  if (!isValidId(registrationId)) throw new RegistrationError('Registration not found.', 404);
  const session = await mongoose.startSession();
  let registration;

  try {
    await session.withTransaction(async () => {
      const current = await Registration.findOne({ _id: registrationId, user: userId }).session(session);
      if (!current) throw new RegistrationError('Registration not found.', 404);
      if (current.status !== 'registered') {
        throw new RegistrationError('This registration is already cancelled.', 409);
      }
      if (current.attendanceStatus === 'attended') {
        throw new RegistrationError('An attended registration cannot be cancelled.', 409);
      }

      const event = await Event.findById(current.event).session(session);
      if (!event) throw new RegistrationError('Event not found.', 404);
      if (event.schedule.startAt <= new Date()) {
        throw new RegistrationError('A registration cannot be cancelled after the event has started.', 400);
      }

      const cancelled = await Registration.findOneAndUpdate(
        {
          _id: registrationId,
          user: userId,
          status: 'registered',
          attendanceStatus: { $ne: 'attended' }
        },
        { $set: { status: 'cancelled', cancelledAt: new Date() } },
        { session, new: true }
      );
      if (!cancelled) {
        throw new RegistrationError('This registration can no longer be cancelled.', 409);
      }

      const updatedEvent = await Event.findOneAndUpdate(
        { _id: current.event, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } },
        { session, new: true }
      );
      if (!updatedEvent) {
        throw new RegistrationError('The event seat count could not be safely updated.', 409);
      }

      registration = cancelled;
    });
  } finally {
    await session.endSession();
  }

  await Registration.populate(registration, {
    path: 'event',
    populate: [{ path: 'venue' }, { path: 'category' }]
  });
  return registration;
}

async function getMyRegistrations(userId, query) {
  const tab = ['upcoming', 'attended', 'cancelled'].includes(query.tab) ? query.tab : 'upcoming';
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const now = new Date();
  const pipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    ...eventLookupStages(),
    { $match: listTabMatch(tab, now) },
    {
      $facet: {
        registrations: [
          { $sort: { registrationDate: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { qrToken: 0, __v: 0 } }
        ],
        count: [{ $count: 'total' }]
      }
    }
  ];
  const [result] = await Registration.aggregate(pipeline);
  const registrations = await populateEventRecords(result.registrations);
  const total = result.count[0]?.total || 0;

  return {
    registrations,
    page,
    totalPages: Math.ceil(total / limit),
    totalRegistrations: total,
    tab
  };
}

async function getRegistrationById(userId, registrationId) {
  if (!isValidId(registrationId)) throw new RegistrationError('Registration not found.', 404);
  const registration = await Registration.findOne({ _id: registrationId, user: userId })
    .select('+qrToken')
    .populate({
      path: 'event',
      populate: [{ path: 'venue' }, { path: 'category' }, { path: 'organizer', select: 'name' }]
    });
  if (!registration) throw new RegistrationError('Registration not found.', 404);
  return registration;
}

async function getRegistrationForEvent(userId, eventId) {
  if (!isValidId(eventId)) throw new RegistrationError('Event not found.', 404);
  const registration = await Registration.findOne({ user: userId, event: eventId })
    .populate({ path: 'event', select: 'status schedule capacity registeredCount registrationDeadline' });
  return registration;
}

async function getStudentDashboard(userId) {
  const now = new Date();
  const [result] = await Registration.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    ...eventLookupStages(),
    {
      $facet: {
        upcoming: [
          { $match: listTabMatch('upcoming', now) },
          { $count: 'count' }
        ],
        attended: [
          { $match: { attendanceStatus: 'attended' } },
          { $count: 'count' }
        ],
        cancelled: [
          { $match: listTabMatch('cancelled', now) },
          { $count: 'count' }
        ],
        total: [{ $count: 'count' }],
        nextEvents: [
          { $match: listTabMatch('upcoming', now) },
          { $sort: { 'event.schedule.startAt': 1 } },
          { $limit: 5 },
          { $project: { qrToken: 0, __v: 0 } }
        ]
      }
    }
  ]);

  const nextEvents = await populateEventRecords(result.nextEvents);
  return {
    counts: {
      upcoming: result.upcoming[0]?.count || 0,
      attended: result.attended[0]?.count || 0,
      cancelled: result.cancelled[0]?.count || 0,
      total: result.total[0]?.count || 0
    },
    nextEvents
  };
}

module.exports = {
  RegistrationError,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationById,
  getRegistrationForEvent,
  getStudentDashboard
};
