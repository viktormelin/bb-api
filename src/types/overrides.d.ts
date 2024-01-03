import { LevelWithSilentOrString } from 'pino';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOG_LEVEL: LevelWithSilentOrString;
      AXIOM_DATASET: string;
      AXIOM_TOKEN: string;
      AUTH_CLIENTID: string;
      AUTH_CLIENTSECRET: string;
      DATABASE_URL: string;
    }
  }
}
