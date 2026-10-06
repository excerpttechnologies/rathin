const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const history = require( 'connect-history-api-fallback');

const app = express();

const customerRoutes = require('./routes/customers');
const authRoutes = require('./routes/auth');
const serviceRequestRoutes = require('./routes/serviceRequests');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const signatureRoutes = require('./routes/signature-routes');

// Middleware
app.use(cors());

// gzip costs a few ms of CPU and saves most of the bytes on every JSON list
// and every script. Optional so the server still starts without the package —
// run `npm install compression` to switch it on.
try {
  const compression = require('compression');
  app.use(compression());
  console.log('Response compression enabled');
} catch (err) {
  console.log('compression not installed — run "npm install compression" for smaller responses');
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Absolute, so uploads are found whatever directory the process was started
// from, and cached: an upload's filename is unique, so its bytes never change.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true,
}));



// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-reports', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
const serviceRoutes = require('./routes/serviceRoutes');
app.use('/', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes); 

app.use('/api', signatureRoutes);

// An /api path that matches no route above must say so. Without this it fell
// through to the single-page fallback below and answered 200 with HTML, so a
// missing or misspelled endpoint looked like success to the browser and blew
// up later as "undefined is not a function" somewhere unrelated.
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `No such API route: ${req.method} ${req.originalUrl}`,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.use(history());

// Built asset names carry a content hash, so they can be cached hard: a repeat
// visit downloads no JavaScript at all.
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  maxAge: '1y',
  immutable: true,
}));
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    // index.html must never be cached, or a browser keeps loading the previous
    // build and never sees a deploy.
    if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));
app.get("*", (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




