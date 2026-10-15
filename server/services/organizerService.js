const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
}

async function buildRegistrationFilter(eventId, query) {
  const filter = { event: eventId };
  if (query.status) filter.status = query.status;
  if (query.attendance === 'attended') filter.attendanceStatus = 'attended';
  if (query.attendance === 'not_attended') filter.attendanceStatus = 'not_attended';

  const search = typeof query.search === 'string' ? escapeRegex(query.search.trim()) : '';
  if (search) {
    const expression = new RegExp(search, 'i');
    const users = await User.find({ $or: [{ name: expression }, { email: expression }] }).select('_id');
    filter.user = { $in: users.map((user) => user._id) };
  }
  return filter;
}

async function getEventRegistrations(eventId, query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const countsPipeline = [
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        registered: { $sum: { $cond: [{ $eq: ['$status', 'registered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        attended: { $sum: { $cond: [{ $eq: ['$attendanceStatus', 'attended'] }, 1, 0] } }
      }
    }
  ];
  const filter = await buildRegistrationFilter(eventId, query);
  const [registrations, total, [counts = {}]] = await Promise.all([
    Registration.find(filter)
      .sort({ registrationDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-qrToken')
      .populate('user', 'name email department year'),
    Registration.countDocuments(filter),
    Registration.aggregate(countsPipeline)
  ]);

  return {
    registrations,
    page,
    totalPages: Math.ceil(total / limit),
    totalRegistrations: counts.registered || 0,
    totalCancelled: counts.cancelled || 0,
    totalAttended: counts.attended || 0
  };
}

async function getEventAttendance(eventId, query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const [records, totalAttendance, registered] = await Promise.all([
    Attendance.find({ event: eventId })
      .sort({ checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email department year')
      .populate('checkedInBy', 'name'),
    Attendance.countDocuments({ event: eventId }),
    Registration.countDocuments({ event: eventId, status: 'registered' })
  ]);

  return {
    attendance: records,
    page,
    totalPages: Math.ceil(totalAttendance / limit),
    totalAttendance,
    registered,
    attendanceRate: registered === 0 ? 0 : Number(((totalAttendance / registered) * 100).toFixed(1))
  };
}

async function getOrganizerDashboard(userId, role) {
  const match = role === 'admin' ? {} : { organizer: new mongoose.Types.ObjectId(userId) };
  const now = new Date();
  const [result] = await Event.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Registration.collection.name,
        let: { currentEventId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$event', '$$currentEventId'] }, { $eq: ['$status', 'registered'] }] } } },
          { $count: 'count' }
        ],
        as: 'activeRegistrationStats'
      }
    },
    {
      $lookup: {
        from: Attendance.collection.name,
        let: { currentEventId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$event', '$$currentEventId'] } } },
          { $count: 'count' }
        ],
        as: 'checkInStats'
      }
    },
    {
      $addFields: {
        registrationTotal: { $ifNull: [{ $arrayElemAt: ['$activeRegistrationStats.count', 0] }, 0] },
        attendanceTotal: { $ifNull: [{ $arrayElemAt: ['$checkInStats.count', 0] }, 0] }
      }
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              upcomingEvents: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$status', 'published'] }, { $gt: ['$schedule.startAt', now] }] },
                    1,
                    0
                  ]
                }
              },
              totalRegistrations: { $sum: '$registrationTotal' },
              totalAttendance: { $sum: '$attendanceTotal' }
            }
          }
        ],
        events: [
          { $sort: { 'schedule.startAt': 1 } },
          {
            $project: {
              title: 1,
              startAt: '$schedule.startAt',
              status: 1,
              capacity: 1,
              registeredCount: '$registrationTotal',
              attended: '$attendanceTotal',
              attendanceRate: {
                $cond: [
                  { $gt: ['$registrationTotal', 0] },
                  { $round: [{ $multiply: [{ $divide: ['$attendanceTotal', '$registrationTotal'] }, 100] }, 1] },
                  0
                ]
              }
            }
          }
        ]
      }
    }
  ]);

  const summary = result.summary[0] || {
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    totalAttendance: 0
  };
  return {
    totalEvents: summary.totalEvents,
    upcomingEvents: summary.upcomingEvents,
    totalRegistrations: summary.totalRegistrations,
    totalAttendance: summary.totalAttendance,
    attendanceRate: summary.totalRegistrations === 0
      ? 0
      : Number(((summary.totalAttendance / summary.totalRegistrations) * 100).toFixed(1)),
    averageRating: null,
    events: result.events
  };
}

module.exports = { getEventRegistrations, getEventAttendance, getOrganizerDashboard };
