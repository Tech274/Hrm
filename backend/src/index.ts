import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`HireFlow API listening on port ${config.port}`);
});
