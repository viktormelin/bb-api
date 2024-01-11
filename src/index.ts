import express, { json, urlencoded } from 'express';
import cors from 'cors';
import routes from './routes';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { config } from './utils/config';

const port = Number(config.PORT);
const app = express();
const server = createServer(app);

app.use(json());
app.use(urlencoded({ extended: true }));
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

server.listen(
  port,
  () => console.log(`Server started on port ${port}`),
  // () => logger.info(`Server started on port ${port}`),
);
