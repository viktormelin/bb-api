import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston from 'winston';

const { combine, errors, json } = winston.format;
const logtail = new Logtail(process.env.LOGGER_TOKEN || '');
export const logger = winston.createLogger({
  level: 'info',
  format: combine(errors({ stack: true }), json()),
  defaultMeta: {
    service: 'express.js',
  },
  transports: [new LogtailTransport(logtail)],
  exceptionHandlers: [new LogtailTransport(logtail)],
  rejectionHandlers: [new LogtailTransport(logtail)],
});
