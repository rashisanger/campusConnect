const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    year: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    interests: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.passwordHash;
    delete returnedObject.__v;
    return returnedObject;
  }
});

module.exports = mongoose.model('User', userSchema);
