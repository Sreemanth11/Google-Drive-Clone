import express from 'express';
import Folder from '../models/Folder.js';
import auth from '../middleware/auth.js';
import File from '../models/File.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const owner = req.user.id;

    // compute path
    let path = `/${name}`;
    if (parentFolder) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) return res.status(400).json({ message: 'Parent folder not found' });
      path = `${parent.path}/${name}`;
    }

    const folder = new Folder({ name, owner, parentFolder: parentFolder || null, path });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List folders (for owner, optionally by parent)
router.get('/', auth, async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const folders = await Folder.find({ owner: req.user.id, parentFolder: parent }).sort({ createdAt: -1 });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rename folder
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // update path for folder and its children (simple approach)
    const oldPath = folder.path;
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${name}`;

    folder.name = name;
    folder.path = newPath;
    await folder.save();

    // update children paths (direct children and subfolders)
    await Folder.updateMany({ path: { $regex: `^${oldPath}/` }, owner: req.user.id },
      [{ $set: { path: { $concat: [ newPath, { $substr: [ "$path", { $strLenCP: oldPath }, -1 ] } ] } } }]
    );

    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete folder (and optionally cascade delete files metadata; does not delete GridFS data here)
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user.id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // delete files metadata that reference this folder (you may choose to also delete GridFS chunks — see comment)
    await File.deleteMany({ parentFolder: folder._id });

    // delete subfolders recursively
    await Folder.deleteMany({ path: { $regex: `^${folder.path}` }, owner: req.user.id });

    res.json({ message: 'Folder and its metadata deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
