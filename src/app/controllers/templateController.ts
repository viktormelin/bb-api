import expressAsyncHandler from 'express-async-handler';

const template = expressAsyncHandler(async (req, res) => {
  res.send('Hello World!').status(200);
});

export default {
  template,
};
