import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ensureGameDataForUser } from '../services/bootstrapService.js'

const buildToken = (userId) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' })

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' })
    }

    const existing = await User.findOne({
      $or: [{ email: String(email).trim().toLowerCase() }, { username: String(username).trim() }],
    })
    if (existing) {
      return res.status(409).json({ message: 'User already exists with that email or username' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
    })

    await ensureGameDataForUser(user._id)

    res.status(201).json({
      message: 'User registered successfully',
      token: buildToken(user._id),
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    await ensureGameDataForUser(user._id)

    res.json({
      message: 'Login successful',
      token: buildToken(user._id),
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (error) {
    next(error)
  }
}

export const me = async (req, res) => {
  res.json({ user: { id: req.user._id, username: req.user.username, email: req.user.email } })
}
