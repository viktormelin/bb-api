import { Request, Response } from 'express';

const getServerVersion = async (req: Request, res: Response) => {
  return res.status(200).send(process.env.npm_package_version);
};

export default { getServerVersion };
