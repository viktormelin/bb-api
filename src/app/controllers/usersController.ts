import { Request } from 'express';
import expressAsyncHandler from 'express-async-handler';

const getSelf = expressAsyncHandler(async (req: Request) => {
  console.log(req.user);

  // res.send('Hello World!').status(200);
});

export default {
  getSelf,
};
