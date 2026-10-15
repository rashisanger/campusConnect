const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// A transaction updates the registration and creates attendance together; the conditional
// registration update and unique attendance index ensure only one simultaneous check-in wins.
class CheckInError extends Error {
  constructor(message, statusCode = 400, checkInTime = null) {
    super(message);
    this.statusCode = statusCode;
    this.checkInTime = checkInTime;
  }
}

function isValidId(value) {
  return mongoose.isValidObjectId(value);
}

function cleanToken(value) {
  if (typeof value !== 'string') throw new CheckInError('A valid QR token is required.');
  const token = value.trim();
  if (!/^[a-f0-9]{48}$/i.test(token)) throw new CheckInError('A valid QR token is required.');
  return token;
}

async function checkIn({ eventId, checkedInBy, token, registrationId }) {
  if (!isValidId(eventId)) throw new CheckInError('Event not found.', 404);
  if (registrationId && !isValidId(registrationId)) {
    throw new CheckInError('Registration not found.', 404);
  }
  const qrToken = token === undefined ? undefined : cleanToken(token);
  const session = await mongoose.startSession();
  let result;
  let duplicateRegistrationId;
  let failure;

  try {
    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) throw new CheckInError('Event not found.', 404);
      if (event.status === 'cancelled') throw new CheckInError('This event was cancelled.', 400);

      const registrationQuery = registrationId
        ? Registration.findById(registrationId)
        : Registration.findOne({ qrToken });
      const registration = await registrationQuery.select('+qrToken').session(session);
      if (!registration) {
        if (registrationId) throw new CheckInError('Registration not found.', 404);
        throw new CheckInError('Invalid QR code.', 404);
      }
      if (registration.event.toString() !== eventId.toString()) {
        throw new CheckInError('This QR code is for a different event.', 400);
      }
      if (registration.status === 'cancelled') {
        throw new CheckInError('Registration was cancelled.', 400);
      }

      const updatedRegistration = await Registration.findOneAndUpdate(
        {
          _id: registration._id,
          event: eventId,
          status: 'registered',
          attendanceStatus: 'not_attended'
        },
        { $set: { attendanceStatus: 'attended' } },
        { session, new: true }
      );

      if (!updatedRegistration) {
        duplicateRegistrationId = registration._id;
        const earlierAttendance = await Attendance.findOne({ registration: registration._id })
          .select('checkInTime')
          .session(session);
        throw new CheckInError(
          'Already checked in.',
          409,
          earlierAttendance?.checkInTime || null
        );
      }

      const [attendance] = await Attendance.create(
        [{
          registration: updatedRegistration._id,
          user: updatedRegistration.user,
          event: eventId,
          checkedInBy,
          checkInTime: new Date(),
          status: 'checked_in'
        }],
        { session }
      );
      duplicateRegistrationId = updatedRegistration._id;
      const student = await User.findById(updatedRegistration.user)
        .select('name department year')
        .session(session);
      if (!student) throw new CheckInError('The student account could not be found.', 404);

      result = {
        attendance,
        student: {
          name: student.name,
          department: student.department,
          year: student.year
        },
        checkInTime: attendance.checkInTime
      };
    });
  } catch (error) {
    if (error.code === 11000) {
      failure = new CheckInError('Already checked in.', 409);
    } else {
      failure = error;
    }
  } finally {
    await session.endSession();
  }

  if (failure) {
    if (failure.statusCode === 409 && duplicateRegistrationId && !failure.checkInTime) {
      const earlierAttendance = await Attendance.findOne({ registration: duplicateRegistrationId })
        .select('checkInTime');
      failure.checkInTime = earlierAttendance?.checkInTime || null;
    }
    throw failure;
  }

  return result;
}

async function checkInByToken(eventId, token, checkedInBy) {
  return checkIn({ eventId, token, checkedInBy });
}

async function checkInByRegistration(eventId, registrationId, checkedInBy) {
  return checkIn({ eventId, registrationId, checkedInBy });
}

module.exports = { CheckInError, checkInByToken, checkInByRegistration };
