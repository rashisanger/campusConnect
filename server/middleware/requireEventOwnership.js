const Event = require('../models/Event');

async function requireEventOwnership(req, res, next) {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own events.' });
    }

    req.event = event;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireEventOwnership;
