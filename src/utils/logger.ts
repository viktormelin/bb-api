import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';
import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();

const axiomTransport = new AxiomTransport({
  token: process.env.AXIOM_TOKEN || '',
  dataset: process.env.AXIOM_DATASET,
});

const { combine, errors, json } = winston.format;

export const logger = winston.createLogger({
  level: 'info',
  format: combine(errors({ stack: true }), json()),
  defaultMeta: { service: 'user-service' },
  transports: [axiomTransport],
  exceptionHandlers: [axiomTransport],
  rejectionHandlers: [axiomTransport],
});
