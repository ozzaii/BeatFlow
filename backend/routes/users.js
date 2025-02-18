const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Beat = require('../models/Beat')
const auth = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const multer = require('multer')
const path = require('path')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/profiles/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'))
  }
})

// Register new user
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = new User({
      username,
      email,
      password
    })

    await user.save()

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('following', 'username profilePicture')
      .populate('followers', 'username profilePicture')
      .populate('favoriteBeats')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get user's beats
    const beats = await Beat.find({ creator: user._id })
      .sort('-createdAt')
      .populate('likes', 'username')
      .populate('comments.user', 'username profilePicture')

    res.json({ user, beats })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user profile
router.patch('/profile', auth, upload.single('profilePicture'), [
  body('username').optional().trim().isLength({ min: 3, max: 30 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('genres').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const updates = req.body
    if (req.file) {
      updates.profilePicture = req.file.filename
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Follow/unfollow user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' })
    }

    const userToFollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.user.id)

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isFollowing = currentUser.following.includes(req.params.id)

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id)
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user.id)
    } else {
      // Follow
      currentUser.following.push(req.params.id)
      userToFollow.followers.push(req.user.id)
    }

    await Promise.all([currentUser.save(), userToFollow.save()])

    res.json({
      following: currentUser.following,
      followers: userToFollow.followers
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Get user's favorite beats
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favoriteBeats',
        populate: [
          { path: 'creator', select: 'username profilePicture' },
          { path: 'likes', select: 'username' },
          { path: 'comments.user', select: 'username profilePicture' }
        ]
      })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user.favoriteBeats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add/remove beat from favorites
router.post('/favorites/:beatId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const beat = await Beat.findById(req.params.beatId)

    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' })
    }

    const isFavorite = user.favoriteBeats.includes(req.params.beatId)

    if (isFavorite) {
      user.favoriteBeats = user.favoriteBeats.filter(id => id.toString() !== req.params.beatId)
    } else {
      user.favoriteBeats.push(req.params.beatId)
    }

    await user.save()
    res.json(user.favoriteBeats)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

module.exports = router 