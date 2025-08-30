import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down test server...');
  process.exit(0);
});
