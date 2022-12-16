import {NextFunction, Response} from 'express';
import {ExtendedRequest} from '../http-server';

const {HOST} = process.env;

const forceHttps = (request: ExtendedRequest, response: Response, next: NextFunction) => {
  if (request.headers['x-forwarded-proto'] !== 'https') response.redirect(`${HOST}${request.url}`);
  else next();
};

export default forceHttps;
