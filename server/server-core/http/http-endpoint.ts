import {ExtendedEndpoint} from './http-server';

/**
 * This function wraps async HTTP endpoint handlers to enable proper error handling and the user of middlewares.
 *
 * @param handlers - an array of middlewares and an endpoint handler.
 * @returns the wrapped endpoint function.
 */
const httpEndpoint = <ResponseBody>(...handlers: ExtendedEndpoint<ResponseBody>[]): ExtendedEndpoint<ResponseBody> => {
  return async (req, res, next) => {
    try {
      for (const handler of handlers) {
        const body: ResponseBody | void = await handler(req, res); // eslint-disable-line no-await-in-loop
        if (typeof body === 'object') {
          res.json({success: true, body});
          break;
        }
      }
      if (next) next();
    } catch (error) {
      if (next) next(error);
    }
  };
};

export default httpEndpoint;
