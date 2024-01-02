import { LevelWithSilentOrString } from 'pino';

declare global {
  namespace Express {
    interface Request {}
    interface Application {
      start: (port: number) => any;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: LevelWithSilentOrString;
      DATABASE_URL: string;
    }
  }
}
