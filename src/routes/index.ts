import { Router } from 'express';
import v1 from './v1';

interface IRoutes {
  [key: string]: {
    [key: string]: Router;
  };
}

const routes: IRoutes = {
  v1,
};

export default routes;
