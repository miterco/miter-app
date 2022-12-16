import {promises as fs} from 'fs';
import * as gAuth from '../google-apis/google-auth';
import path from 'path';
import serverRootDirectory from '../server-root';
import httpEndpoint from '../server-core/http/http-endpoint';
import {checkEnvironmentVariables} from '../server-core/server-util';

checkEnvironmentVariables(['GOOGLE_CLIENT_ID', 'HS_SIGNUP_URL']);
const environmentVars: Record<string, string> = {
  Debug: process.env.DEBUG && process.env.DEBUG !== 'false' ? '1' : '',
  GoogleClientId: process.env.GOOGLE_CLIENT_ID || '',
  GoogleScope: gAuth.scope,
  GoogleInitialScope: gAuth.initialScope,
  HubspotSignupUrl: process.env.HS_SIGNUP_URL || '',
  HeapEnvId: process.env.HEAP_ENV_ID || '',
};

const getEnvironmentJs = (extraVars?: Record<string, string>) => {
  const finalVars = extraVars ? {...environmentVars, ...extraVars} : environmentVars;
  return Object.keys(finalVars)
    .map(k => `window.${k} = "${finalVars[k]}";`)
    .join(' ');
};

export const clientLibEndpoint = httpEndpoint(async (req, res) => {
  const js = await fs.readFile(path.join(serverRootDirectory, 'static/client-lib-base.js'), 'utf8');
  const envJs = getEnvironmentJs();
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`${envJs}\n${js}`);
});
