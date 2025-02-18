const express = require('express')
const router = express.Router()
const Beat = require('../models/Beat')
const auth = require('../middleware/auth')
const { body, validationResult } = require('express-validator')

// Get all public beats with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const genre = req.query.genre
    const sort = req.query.sort || '-createdAt'
    
    const query = { isPublic: true }
    if (genre) query.genre = genre

    const beats = await Beat.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'username profilePicture')
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')

    const total = await Beat.countDocuments(query)

    res.json({
      beats,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a new beat
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('patterns').notEmpty().withMessage('Patterns are required'),
  body('bpm').isInt({ min: 60, max: 180 }).withMessage('BPM must be between 60 and 180'),
  body('genre').isIn(['House', 'Techno', 'Trance', 'Dubstep', 'Other']).withMessage('Invalid genre')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const beat = new Beat({
      ...req.body,
      creator: req.user.id
    })

    const savedBeat = await beat.save()
    await savedBeat.populate('creator', 'username profilePicture')
    
    res.status(201).json(savedBeat)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Get a specific beat
router.get('/:id', async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
      .populate('creator', 'username profilePicture')
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')

    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    res.json(beat)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update a beat
router.patch('/:id', auth, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    if (beat.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    Object.keys(req.body).forEach(key => {
      beat[key] = req.body[key]
    })

    const updatedBeat = await beat.save()
    await updatedBeat.populate('creator', 'username profilePicture')
    
    res.json(updatedBeat)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete a beat
router.delete('/:id', auth, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    if (beat.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await beat.remove()
    res.json({ message: 'Beat deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Like/unlike a beat
router.post('/:id/like', auth, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    const likeIndex = beat.likes.indexOf(req.user.id)
    
    if (likeIndex === -1) {
      beat.likes.push(req.user.id)
    } else {
      beat.likes.splice(likeIndex, 1)
    }

    await beat.save()
    res.json({ likes: beat.likes })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Add a comment
router.post('/:id/comments', auth, [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const beat = await Beat.findById(req.params.id)
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    beat.comments.push({
      user: req.user.id,
      text: req.body.text
    })

    await beat.save()
    await beat.populate('comments.user', 'username profilePicture')
    
    res.status(201).json(beat.comments)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

module.exports = router 