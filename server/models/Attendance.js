const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    checkInTime: { type: Date, default: Date.now, required: true },
    status: { type: String, enum: ['checked_in'], default: 'checked_in', required: true },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// One attendance row per registration prevents duplicate check-ins.
attendanceSchema.index({ registration: 1 }, { unique: true });
// Organizers commonly review a particular event's check-ins in time order.
attendanceSchema.index({ event: 1, checkInTime: -1 });
// Student attendance history can be queried without scanning all event records.
attendanceSchema.index({ user: 1 });

attendanceSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.__v;
    return returnedObject;
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
