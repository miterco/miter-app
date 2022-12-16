import express, {Request, NextFunction, Response} from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import * as helmet from 'helmet';

// Endpoints.
import {createMeetingEndpoint} from '../../endpoints/meetings-events/create-meeting-endpoint';
import {gcalHookEndpoint} from '../../endpoints/gcal-hook-endpoint';
import {getMeetingTimeInfoEndpoint} from '../../endpoints/meetings-events/get-meeting-time-info-endpoint';
import serverRootDirectory from '../../server-root';
import {clientLibEndpoint} from '../../endpoints/client-lib-endpoint';
import {getMeetingsFromTodayEndpoint} from '../../endpoints/meetings-events/get-meetings-from-today-endpoint';
import {fetchMeetingTokenEndpoint} from '../../endpoints/zoom/fetch-meeting-token-endpoint';
import {zoomOauthSuccessEndpoint} from '../../endpoints/zoom/oauth-success-endpoint';
import {zoomInstallEndpoint} from '../../endpoints/zoom/install-endpoint';
import {zoomUninstallEndpoint} from '../../endpoints/zoom/uninstall-endpoint';
import {zoomDeepLinkEndpoint} from '../../endpoints/zoom/deep-link-endpoint';
import {proxyPictureEndpoint} from '../../endpoints/people/proxy-picture-endpoint';
import {googleSignInEndpoint} from '../../endpoints/google/sign-in-endpoint';
import {signInWithMagicLink} from '../../endpoints/magic-links/sign-in-with-magic-link';
import {createMagicLinkEndpoint} from '../../endpoints/magic-links/create-magic-link';
import {getLinkedServicesEndpoint} from '../../endpoints/auth/get-linked-services';
import {correlateMeetingsEndpoint} from '../../endpoints/zoom/correlate-meetings-endpoint';
import {createMeetingWithZoomIdentifiersEndpoint} from '../../endpoints/zoom/create-meeting-endpoint';

// Middlewares.
import OWASPHeaders from './middlewares/owasp-headers';
import errorHandler from './middlewares/error-handler';
import {UserGoogleIdentifiers, UserRecord} from '../server-types';
import forceHttps from './middlewares/force-https';
import corsControlAllowOrigin from './middlewares/cors-control-allow-origin';
import authenticateZoomUser from './middlewares/authenticate-zoom-user';
import {passwordlessSignUpEndpoint} from '../../endpoints/magic-links/passwordless-sign-up';
import {checkAuthenticationEndpoint} from '../../endpoints/auth/check';
import {copyFromTemplateToMeetingEndpoint} from '../../endpoints/meetings-events/copy-from-template-to-meeting';
import {postChromeExtensionLoadEndpoint} from '../../endpoints/google/post-chrome-extension-load';
import {acceptInviteEndpoint} from '../../email/accept-invite-endpoint';

export interface ExtendedRequest extends Request {
  user?: UserRecord;
  googleIdentifiers?: UserGoogleIdentifiers | null;
}

export type ExpressEndpoint = (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;

export type ExtendedEndpoint<T> = (
  req: ExtendedRequest,
  res: Response,
  next?: NextFunction
) => Promise<void> | Promise<T> | T | void;

const {NODE_ENV} = process.env;
const isProduction = NODE_ENV === 'production';
const isStaging = NODE_ENV === 'staging';
const noOp = (_req: Request, _res: Response, next: NextFunction) => next();
const maxRequestsPerMinute = (max: number) =>
  isStaging || isProduction ? rateLimit({windowMs: 60 * 1000, max}) : noOp;
const app = express();

if (isProduction || isStaging) {
  // Enable middlewares to prevent security issues.
  // app.use(helmet.crossOriginEmbedderPolicy());  // Heap doesn't support this yet.
  app.use(helmet.crossOriginOpenerPolicy({policy: 'same-origin-allow-popups'}));
  app.use(helmet.crossOriginResourcePolicy({policy: 'cross-origin'}));
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.originAgentCluster());
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.xssFilter());

  app.use(forceHttps);
}

app.use(OWASPHeaders);

app.use(cookieParser());

// When testing locally (and for now, only then), we want to allow cross-origin requests
// So React running at :8000 can talk to the server running at :3000
app.use(corsControlAllowOrigin);

app.use(authenticateZoomUser);

// Write out the path for all requests in debug.
app.use((req, res, next) => {
  if (NODE_ENV !== 'production') console.log(req.method, req.originalUrl);
  next();
});

app.use('/app', express.static(path.join(serverRootDirectory, '../web/client/build')));
app.use(express.static(path.join(serverRootDirectory, 'static')));
app.use(express.json());

// Google endpoints.
app.post('/api/sign-in', googleSignInEndpoint);
app.post('/hook/gcal-push', gcalHookEndpoint);
app.get('/api/post-chrome-load', postChromeExtensionLoadEndpoint);

app.get('/api/meeting-times/:externalMeetingIdentifier', getMeetingTimeInfoEndpoint);
app.get('/api/vc/:meetingToken', copyFromTemplateToMeetingEndpoint);
app.get('/api/meetings-from-today', getMeetingsFromTodayEndpoint);
app.put('/api/meeting', createMeetingEndpoint);
app.get('/api/users/:idType/:id/proxy-picture', proxyPictureEndpoint);
app.get('/bridge', maxRequestsPerMinute(15), (_req, res) => {
  res.sendFile(path.join(serverRootDirectory, 'templates/bridge.html'));
});
app.get('/client-lib', maxRequestsPerMinute(15), clientLibEndpoint);

// Zoom Apps endpoints.
app.get('/api/zoom/meeting/:zoomMeetingNID?/token', fetchMeetingTokenEndpoint);
app.post('/api/zoom/meeting/', createMeetingWithZoomIdentifiersEndpoint);
app.post('/api/zoom/meeting/:zoomMeetingNID?/correlate', correlateMeetingsEndpoint);
app.get('/zoom/oauth/success', zoomOauthSuccessEndpoint);
app.get('/zoom/install', zoomInstallEndpoint);
app.post('/zoom/uninstall', zoomUninstallEndpoint);
app.get('/api/zoom/deep-link', zoomDeepLinkEndpoint);

// Authentication.
app.post('/api/magic-link', createMagicLinkEndpoint);
app.post('/api/magic-link/sign-up', passwordlessSignUpEndpoint);
app.get('/api/magic-link/:token', signInWithMagicLink);
app.get('/api/auth/linked-services', getLinkedServicesEndpoint);
app.get('/api/auth/check', checkAuthenticationEndpoint);

// Invites
app.get('/invite/:inviteId/accept', acceptInviteEndpoint);

// Google domain verification
app.get('/googlebf0549c7bab85a7b.html', (_req, res) => {
  res.send('google-site-verification: googlebf0549c7bab85a7b.html');
});

// Zoom domain verification
app.get('/zoomverify/verifyzoom.html', (_req, res) => {
  res.send('dd0f9feb190f49bcab8bc12fb033b881');
});

app.get('/app/*', maxRequestsPerMinute(15), (_req, res) => {
  res.sendFile(path.join(serverRootDirectory, '../web/client/build/index.html'));
});

app.get('/sign-in', maxRequestsPerMinute(15), (req, res) => {
  res.redirect('/app' + req.originalUrl);
});

app.get('/sign-in/*', maxRequestsPerMinute(15), (req, res) => {
  res.redirect('/app' + req.originalUrl);
});

app.get('/', (_req, res) => {
  res.redirect('/app');
});

// Sentry logging middleware.
app.use(
  Sentry.Handlers.requestHandler({
    user: ['loginEmail'], // Keys to be extracted from request.user.
  })
);

// Error handlers.
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

export default app;
