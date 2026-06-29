import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`DAIMUZ Delivery API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
