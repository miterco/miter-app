import {ExpressRequestBody, ExpressResponse} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import * as Util from './Utils';

const validateExpressResponseJson = <T>(decodedResponseJson: any): T => {
  if (!decodedResponseJson) {
    throw new ValidationError("Expected a non-empty Express response after JSON decode and didn't get one.");
  }
  if (typeof decodedResponseJson !== 'object' || Array.isArray(decodedResponseJson)) {
    throw new ValidationError(`Expected response to decode to an object, got ${decodedResponseJson}.`);
  }
  if (typeof decodedResponseJson.success !== 'boolean') {
    throw new ValidationError(
      `Expected a boolean success property on response object, got ${decodedResponseJson.success}.`
    );
  }
  if (!(typeof decodedResponseJson.error === 'undefined' || typeof decodedResponseJson.error === 'string')) {
    throw new ValidationError(
      `Expected response to have an undefined or string error property, got ${decodedResponseJson.error}.`
    );
  }

  if (decodedResponseJson.body === undefined || decodedResponseJson.body === null) {
    return decodedResponseJson;
  }

  if (typeof decodedResponseJson.body !== 'object' || Array.isArray(decodedResponseJson.body)) {
    throw new ValidationError(`Got a non-object or array Express response body: ${decodedResponseJson.body}.`);
  }

  return decodedResponseJson;
};

const validateExpressResponse = async <T>(res: Response) => {
  if (res.status === 200 || res.status === 500) {
    // No transport errors, so either we succeeded or the server generated an error.
    const validResponse = validateExpressResponseJson<T>(await res.json());
    return validResponse;
  } else {
    throw new Error(`Request to Miter's server failed with status ${res.status}`);
  }
};

export const sendRequest = async <T>(
  path: string,
  body: ExpressRequestBody,
  method: 'POST' | 'PUT' | 'GET',
  shouldThrow: boolean = true
): Promise<ExpressResponse<T>> => {
  try {
    // eslint-disable-next-line quote-props
    const headers = {'Content-Type': 'application/json'};
    const url = new URL(`${window.HttpHost}/${path}`);
    const opts: RequestInit = {method, headers};

    if (method === 'GET') {
      Object.keys(body).forEach(key => url.searchParams.append(key, body[key]));
    } else {
      opts.body = JSON.stringify(body);
    }

    const fetchResponse = await fetch(url.toString(), opts);
    return await validateExpressResponse<ExpressResponse<T>>(fetchResponse);
  } catch (err) {
    Util.error(`${method} request generated an error.`);
    Util.error(err);
    if (shouldThrow) throw err;
    else return {success: false};
  }
};
