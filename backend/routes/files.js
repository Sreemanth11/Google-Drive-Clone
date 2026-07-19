import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import dotenv from 'dotenv';
import File from '../models/File.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

dotenv.config();
const router = express.Router();

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) throw new Error('MONGODB_URI not set in .env');

// GridFS storage
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads'
    };
  }
});

const upload = multer({ storage });

// Initialize GridFSBucket once connection open
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  console.log('📁 GridFSBucket initialized');
});

// Upload multiple files
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files provided' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const parentFolder = req.body.parentFolder || null;
    const saved = [];

    for (const f of req.files) {
      const newStorageUsed = (user.storageUsed || 0) + f.size;
      if (newStorageUsed > (user.storageLimit || 512 * 1024 * 1024)) {
        // delete already uploaded files (cleanup) from GridFS
        for (const s of saved) {
          if (s.gridfsId && gfsBucket) {
            try { await gfsBucket.delete(new mongoose.Types.ObjectId(s.gridfsId)); } catch(e){ /* ignore */ }
          }
        }
        return res.status(400).json({ message: 'Storage limit exceeded' });
      }

      const fileDoc = new File({
        filename: f.filename,
        originalName: f.originalname,
        contentType: f.contentType || f.mimetype,
        size: f.size,
        owner: user._id,
        parentFolder: parentFolder || null,
        gridfsId: f.id
      });

      await fileDoc.save();
      saved.push(fileDoc);

      user.storageUsed = newStorageUsed;
    }

    await user.save();
    res.status(201).json({ message: 'Files uploaded', files: saved });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ message: err.message });
  }
});

// List files for user (optional parentFolder filter)
router.get('/', auth, async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const q = { owner: req.user.id };
    if (parent === 'null') q.parentFolder = null;
    else if (parent) q.parentFolder = parent;

    const files = await File.find(q).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download file by file document id (streams from GridFS)
router.get('/download/:id', auth, async (req, res) => {
  try {
    const fileDoc = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!fileDoc) return res.status(404).json({ message: 'File not found' });

    if (!gfsBucket) return res.status(500).json({ message: 'GridFS not initialized' });

    const downloadStream = gfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileDoc.gridfsId));
    res.set('Content-Type', fileDoc.contentType);
    res.set('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
    downloadStream.pipe(res);
  } catch (err) {
    console.error('Download error', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete file by file document id (removes GridFS data + metadata)
router.delete('/:id', auth, async (req, res) => {
  try {
    const fileDoc = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!fileDoc) return res.status(404).json({ message: 'File not found' });

    if (gfsBucket) {
      await gfsBucket.delete(new mongoose.Types.ObjectId(fileDoc.gridfsId));
    }
    await File.deleteOne({ _id: fileDoc._id });

    // update user storageUsed
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -fileDoc.size } });

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
