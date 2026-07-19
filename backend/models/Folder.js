import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  path: { type: String, required: true } // e.g. "/root/folderA/folderB"
}, { timestamps: true });

export default mongoose.model('Folder', folderSchema);
