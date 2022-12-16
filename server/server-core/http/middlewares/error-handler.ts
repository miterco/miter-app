import {Request, Response} from 'express';

/**
 * This middleware handles uncaught exceptions and sends an error response to the client.
 */
const errorHandlerMiddleware = (error: any, _: Request, res: Response, next: Function) => {
  console.error(error);
  res.status(error.statusCode || 500).json({success: false, error: `${error.message}`});
};

export default errorHandlerMiddleware;
