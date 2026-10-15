const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    registrationDate: { type: Date, default: Date.now, required: true },
    status: { type: String, enum: ['registered', 'cancelled'], default: 'registered', required: true },
    cancelledAt: { type: Date, default: null },
    // The unique index supports token lookup; select:false keeps it out of routine reads and lists.
    qrToken: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    attendanceStatus: {
      type: String,
      enum: ['not_attended', 'attended'],
      default: 'not_attended',
      required: true
    }
  },
  { timestamps: true }
);

// A student can have at most one registration record per event, including re-registrations.
registrationSchema.index({ user: 1, event: 1 }, { unique: true });
// Organizer event rosters can be filtered by registration status.
registrationSchema.index({ event: 1, status: 1 });
// Student registration history can be sorted by registration time.
registrationSchema.index({ user: 1, registrationDate: -1 });

registrationSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.__v;
    return returnedObject;
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
