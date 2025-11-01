import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import tiktokRouter from './routes/tiktok.js';

const {
  PORT = 3000,
  NODE_ENV = 'production',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  REDIRECT_URI,
} = process.env;

const app = express();

app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth/tiktok', tiktokRouter);

app.get('/', (_req, res) => {
  res.type('text').send(
    \API OK
FRONTEND_ORIGIN=\
REDIRECT_URI=\
NODE_ENV=\
\
  );
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(\✅ API on :\\);
  console.log(\FRONTEND_ORIGIN: \\);
  console.log(\REDIRECT_URI   : \\);
});
