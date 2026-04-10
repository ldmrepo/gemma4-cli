const express = require('express');
const cors = require('cors');
const path = require('path');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../todo-app/dist')));

// API routes
app.use('/api/notes', notesRouter);

// Serve React app for any other routes (fixed for Express 4.x)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../todo-app/dist/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
