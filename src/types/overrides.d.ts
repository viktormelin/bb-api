import { LevelWithSilentOrString } from 'pino';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: LevelWithSilentOrString;
      DATABASE_URL: string;
    }
  }
}
