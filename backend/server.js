import mongoose from 'mongoose';
import config from './config.js';
import { createApp } from './app.js';

mongoose.set('strictQuery', true);
await mongoose.connect(config.mongodbUrl, { serverSelectionTimeoutMS: 10_000 });

const server = createApp().listen(config.port, () => {
  console.log(`NovaStore API listening on http://localhost:${config.port} (${config.env})`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close();
  await mongoose.disconnect();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
