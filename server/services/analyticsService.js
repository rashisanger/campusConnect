const Attendance = require('../models/Attendance');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Dashboard counts and breakdowns are calculated by MongoDB aggregation pipelines rather
// than by loading records into JavaScript.

// Groups users and events by role/status, while MongoDB counts registered rows and attendance rows.
async function platformSummary() {
  const [totalUsers, usersByRole, totalEvents, eventsByStatus, totalRegistrations, totalAttendance] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Event.countDocuments(),
    Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Registration.countDocuments({ status: 'registered' }),
    Attendance.countDocuments()
  ]);
  const roles = Object.fromEntries(usersByRole.map(({ _id, count }) => [_id, count]));
  const statuses = Object.fromEntries(eventsByStatus.map(({ _id, count }) => [_id, count]));

  return {
    totalUsers,
    usersByRole: roles,
    totalEvents,
    eventsByStatus: statuses,
    totalRegistrations,
    totalAttendance
  };
}

// Matches active registrations, joins their events, groups by category, joins category names,
// then sorts the most popular categories and returns only the requested number.
async function popularCategories(limit = 6) {
  return Registration.aggregate([
    { $lookup: { from: Event.collection.name, localField: 'event', foreignField: '_id', as: 'event' } },
    { $unwind: '$event' },
    { $match: { status: 'registered' } },
    { $group: { _id: '$event.category', registrations: { $sum: 1 } } },
    { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, categoryId: '$_id', name: '$category.name', registrations: 1 } },
    { $sort: { registrations: -1, name: 1 } },
    { $limit: Math.max(1, Math.min(50, limit)) }
  ]);
}

// Joins each event to its registrations, counts registered and attended records, sorts by
// registeredCount, and calculates the percentage of capacity filled.
async function registrationsPerEvent(limit = 10) {
  return Event.aggregate([
    {
      $lookup: {
        from: Registration.collection.name,
        let: { currentEvent: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$event', '$$currentEvent'] } } },
          {
            $group: {
              _id: null,
              registered: { $sum: { $cond: [{ $eq: ['$status', 'registered'] }, 1, 0] } },
              attended: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$status', 'registered'] }, { $eq: ['$attendanceStatus', 'attended'] }] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        as: 'registrationStats'
      }
    },
    {
      $addFields: {
        registered: { $ifNull: [{ $arrayElemAt: ['$registrationStats.registered', 0] }, 0] },
        attended: { $ifNull: [{ $arrayElemAt: ['$registrationStats.attended', 0] }, 0] }
      }
    },
    { $sort: { registeredCount: -1, 'schedule.startAt': 1 } },
    { $limit: Math.max(1, Math.min(50, limit)) },
    {
      $project: {
        title: 1,
        status: 1,
        startAt: '$schedule.startAt',
        capacity: 1,
        registeredCount: 1,
        registered: 1,
        attended: 1,
        fillPercentage: {
          $cond: [
            { $gt: ['$capacity', 0] },
            { $round: [{ $multiply: [{ $divide: ['$registered', '$capacity'] }, 100] }, 1] },
            0
          ]
        }
      }
    }
  ]);
}

// Groups registered records into total and attended counts, then uses a guarded MongoDB
// division so an empty platform reports zero instead of a divide-by-zero error.
async function attendanceRate() {
  const [counts] = await Registration.aggregate([
    { $match: { status: 'registered' } },
    {
      $group: {
        _id: null,
        registered: { $sum: 1 },
        attended: { $sum: { $cond: [{ $eq: ['$attendanceStatus', 'attended'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        registered: 1,
        attended: 1,
        rate: {
          $cond: [
            { $gt: ['$registered', 0] },
            { $round: [{ $multiply: [{ $divide: ['$attended', '$registered'] }, 100] }, 1] },
            0
          ]
        }
      }
    }
  ]);
  return counts || { registered: 0, attended: 0, rate: 0 };
}

// Keeps registered records, joins student profiles, replaces missing department values with
// "Unspecified", and groups and sorts the participation totals.
async function departmentParticipation() {
  return Registration.aggregate([
    { $match: { status: 'registered' } },
    { $lookup: { from: User.collection.name, localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $addFields: {
        groupName: {
          $let: {
            vars: { departmentName: { $trim: { input: { $ifNull: ['$user.department', ''] } } } },
            in: { $cond: [{ $eq: ['$$departmentName', ''] }, 'Unspecified', '$$departmentName'] }
          }
        }
      }
    },
    { $group: { _id: '$groupName', registrations: { $sum: 1 } } },
    { $project: { _id: 0, department: '$_id', registrations: 1 } },
    { $sort: { registrations: -1, department: 1 } }
  ]);
}

// Joins registered rows to students, normalizes empty year values, then groups and sorts totals.
async function yearParticipation() {
  return Registration.aggregate([
    { $match: { status: 'registered' } },
    { $lookup: { from: User.collection.name, localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $addFields: {
        groupName: {
          $let: {
            vars: { yearName: { $trim: { input: { $ifNull: ['$user.year', ''] } } } },
            in: { $cond: [{ $eq: ['$$yearName', ''] }, 'Unspecified', '$$yearName'] }
          }
        }
      }
    },
    { $group: { _id: '$groupName', registrations: { $sum: 1 } } },
    { $project: { _id: 0, year: '$_id', registrations: 1 } },
    { $sort: { registrations: -1, year: 1 } }
  ]);
}

// Filters events to the last twelve UTC calendar months, groups by $dateToString month, and
// joins registrations per event; JavaScript only inserts missing zero-count month labels.
async function monthlyEventTrend(now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const rows = await Event.aggregate([
    { $match: { 'schedule.startAt': { $gte: monthStart, $lt: nextMonth } } },
    {
      $lookup: {
        from: Registration.collection.name,
        let: { currentEvent: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$event', '$$currentEvent'] }, { $eq: ['$status', 'registered'] }] } } },
          { $count: 'count' }
        ],
        as: 'registrationStats'
      }
    },
    {
      $addFields: {
        month: { $dateToString: { format: '%Y-%m', date: '$schedule.startAt', timezone: 'UTC' } },
        registered: { $ifNull: [{ $arrayElemAt: ['$registrationStats.count', 0] }, 0] }
      }
    },
    { $group: { _id: '$month', events: { $sum: 1 }, registrations: { $sum: '$registered' } } },
    { $project: { _id: 0, month: '$_id', events: 1, registrations: 1 } },
    { $sort: { month: 1 } }
  ]);
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  return Array.from({ length: 12 }, (_unused, offset) => {
    const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + offset, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return byMonth.get(month) || { month, events: 0, registrations: 0 };
  });
}

// Feedback does not exist in this slice, so rating analytics intentionally remain unavailable.
async function averageRating() {
  return null;
}

module.exports = {
  platformSummary,
  popularCategories,
  registrationsPerEvent,
  attendanceRate,
  departmentParticipation,
  yearParticipation,
  monthlyEventTrend,
  averageRating
};
