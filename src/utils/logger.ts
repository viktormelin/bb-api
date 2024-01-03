import pino from 'pino';
import PinoPretty from 'pino-pretty';

export const loggerOptions = PinoPretty({
  colorize: true,
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  loggerOptions,
);
