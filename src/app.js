import path from 'path';
import express from 'express';

import connectDB from './db.js';
import router from './router.js';

connectDB();
const app = express();

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// use public folder for static assets
app.use(express.static('public'));
// use /frontend/dist for public files
app.use(express.static('frontend/dist'));

app.get('/ping', (_req, res) => {
  res.end('OK');
});

app.use('/api/v1', router);

app.use((_req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend/dist', 'index.html'))
});

export default app;