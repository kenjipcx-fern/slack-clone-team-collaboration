import express from 'express';

const app = express();

// Simple route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Start server
const PORT = 8001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
