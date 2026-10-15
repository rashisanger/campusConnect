const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    designation: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' }
  },
  { _id: false }
);

const agendaItemSchema = new mongoose.Schema(
  {
    time: { type: String, required: true, trim: true, maxlength: 50 },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    poster: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    schedule: {
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true }
    },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    speakers: { type: [speakerSchema], default: [] },
    agenda: { type: [agendaItemSchema], default: [] },
    registrationDeadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published'
    }
  },
  { timestamps: true }
);

// Search across the public-facing event text and tags with MongoDB text search.
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Filter and sort public events by visibility and start time efficiently.
eventSchema.index({ status: 1, 'schedule.startAt': 1 });
// Load and order an organizer's events without scanning other organizers.
eventSchema.index({ organizer: 1, 'schedule.startAt': 1 });
// Admin event filters can select one organizer and then sort the matching results by creation time.
eventSchema.index({ organizer: 1, createdAt: -1 });
// Filter event discovery by category and date.
eventSchema.index({ category: 1, 'schedule.startAt': 1 });
// Venue-filtered discovery sorts matching events by their start time.
eventSchema.index({ venue: 1, 'schedule.startAt': 1 });
// Admin event listing and public newest sorting use creation time after optional status filtering.
eventSchema.index({ status: 1, createdAt: -1 });
// The unfiltered admin event table sorts all event records by creation time.
eventSchema.index({ createdAt: -1 });
// Admin analytics ranks events by the denormalized registered-seat counter.
eventSchema.index({ registeredCount: -1 });

eventSchema.set('toJSON', {
  transform(_document, returnedObject) {
    if (returnedObject.capacity !== undefined && returnedObject.registeredCount !== undefined) {
      returnedObject.availableSeats = returnedObject.capacity - returnedObject.registeredCount;
    }
    delete returnedObject.__v;
    return returnedObject;
  }
});

module.exports = mongoose.model('Event', eventSchema);
