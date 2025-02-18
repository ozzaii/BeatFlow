const mongoose = require('mongoose')

const beatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patterns: {
    type: Map,
    of: [Boolean],
    required: true
  },
  bpm: {
    type: Number,
    required: true,
    min: 60,
    max: 180
  },
  genre: {
    type: String,
    required: true,
    enum: ['House', 'Techno', 'Trance', 'Dubstep', 'Other']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Add indexes for better query performance
beatSchema.index({ creator: 1, createdAt: -1 })
beatSchema.index({ genre: 1 })
beatSchema.index({ tags: 1 })
beatSchema.index({ 'likes': 1 })

module.exports = mongoose.model('Beat', beatSchema) 