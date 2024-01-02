import express, { json } from 'express';
import cors from 'cors';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import routes from './routes';
import { createServer } from 'http';
import dotenv from 'dotenv';
import pinoPretty from 'pino-pretty';

dotenv.config();

const app = express();
const loggerOptions = pinoPretty({
  colorize: true,
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  loggerOptions,
);

const server = createServer(app);

app.use(pinoHttp({ logger }));
app.use(json());
app.use(
  cors({
    origin: '*',
  }),
);

const routeVersions = Object.keys(routes);
for (const version of routeVersions) {
  const routeSections = Object.keys(routes[version]);
  for (const section of routeSections) {
    if (version === 'v1') {
      app.use(`/${section}`, routes[version][section]);
    }
    app.use(`/${version}/${section}`, routes[version][section]);
  }
}

server.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`),
);
