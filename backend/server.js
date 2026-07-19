import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import folderRoutes from './routes/folders.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);

// test
app.get('/api/test', (req, res) => res.json({ message: 'API running' }));

const PORT = process.env.PORT || 5000;

let dbUrl = process.env.MONGODB_URI;

const startServer = async () => {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('🔄 Attempting to spin up in-memory MongoDB database...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      dbUrl = mongoServer.getUri();
      await mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ In-memory MongoDB Connected at:', dbUrl);
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (memErr) {
      console.error('❌ In-memory MongoDB Error:', memErr.message);
      process.exit(1);
    }
  }
};

startServer();
