import Joi, {AnySchema} from 'joi';
import {ExtendedRequest} from '../http-server';
import {Response} from 'express';
import HttpError from '../../../errors/HttpError';

const bodySchema = (schemaDef: Record<string, AnySchema>) => {
  const schema = Joi.object(schemaDef);

  return (request: ExtendedRequest, _response: Response) => {
    const validation = schema.validate(request.body);
    if (validation.error) throw new HttpError(400, validation.error.message);
    else request.body = validation.value;
  };
};

export default bodySchema;
