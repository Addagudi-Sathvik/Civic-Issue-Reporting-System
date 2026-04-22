// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ override: true });

const app = express();

// Middlewares
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/confirmations', require('./routes/confirmations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/department', require('./routes/department'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Civic Issue System API is running' });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civic_issue_db';

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI is not set. Falling back to local MongoDB at mongodb://127.0.0.1:27017/civic_issue_db');
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
