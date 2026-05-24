// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://civic-issue-reporting-system.vercel.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_FRONTEND_URL,
].filter(Boolean);

// ✅ CORS (allow frontend)
const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static uploads (VERY IMPORTANT for images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues')); // 🔥 your validation route is here
app.use('/api/confirmations', require('./routes/confirmations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/department', require('./routes/department'));

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Civic Issue System API is running',
  });
});

// ✅ MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log('MongoDB Error:', 'MONGO_URI is not set');
  process.exit(1);
}

const getSafeMongoInfo = (uri) => {
  try {
    const parsed = new URL(uri);
    return {
      host: parsed.host,
      database: parsed.pathname.replace('/', '') || '(default)',
    };
  } catch {
    return { host: 'unknown', database: 'unknown' };
  }
};

if (!process.env.MONGO_URI) {
  console.warn(
    '⚠️ Using local MongoDB (fallback)'
  );
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const mongoInfo = getSafeMongoInfo(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    console.log(`MongoDB Host: ${mongoInfo.host}`);
    console.log(`MongoDB Database: ${mongoose.connection.name || mongoInfo.database}`);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB Error:', err);
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
