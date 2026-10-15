const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    building: { type: String, trim: true, maxlength: 120, default: '' },
    room: { type: String, trim: true, maxlength: 80, default: '' },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  { timestamps: true }
);

venueSchema.index({ name: 1, building: 1, room: 1 }, { unique: true });

module.exports = mongoose.model('Venue', venueSchema);
