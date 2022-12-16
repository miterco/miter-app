import Joi, {AnySchema} from 'joi';
import {SocketEndpoint} from '../socket-endpoint';

export const messageBodySchema = (schemaDef: Record<string, AnySchema>): SocketEndpoint => {
  const schema = Joi.object(schemaDef);

  return async (request, _response) => {
    const validation = schema.validate(request.body);
    if (validation.error) throw new Error(validation.error.message);
    else request.body = validation.value;
  };
};
