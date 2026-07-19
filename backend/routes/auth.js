import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

dotenv.config();
const router = express.Router();

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token: genToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token: genToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my profile
router.get('/me', auth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('-password');
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
