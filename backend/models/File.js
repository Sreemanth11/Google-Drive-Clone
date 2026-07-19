import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, default: "file" }, // 'file' or 'folder'
  size: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Fix OverwriteModelError: use mongoose.models (not mongoose.model)
const File = mongoose.models.File || mongoose.model("File", FileSchema);

export default File;
