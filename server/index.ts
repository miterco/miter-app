import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';
import {setupSocketServer} from './server-core/socket-server-setup';
import {SocketServer} from './server-core/socket-server';
import app from './server-core/http/http-server';

const {SERVER_SENTRY_DSN, NODE_ENV, PORT} = process.env;

if (['production', 'staging'].includes(NODE_ENV || '')) {
  // Log errors to Sentry.
  Sentry.init({
    dsn: SERVER_SENTRY_DSN,
    integrations: [new Sentry.Integrations.Http({tracing: true})],
  });
}

const server = app.listen(PORT || 3000, () => {
  console.log('Listening on port', PORT || 3000);
});

const socketServer = new SocketServer(server);
setupSocketServer(socketServer);
