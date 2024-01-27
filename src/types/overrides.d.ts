import { LevelWithSilentOrString } from 'pino';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: LevelWithSilentOrString;
      LOGGER_TOKEN: string;
      AUTH_URL: string;
      AUTH_REDIRECT_URL: string;
      AUTH_CLIENTID: string;
      AUTH_CLIENTSECRET: string;
      DATABASE_URL: string;
    }
  }
}
