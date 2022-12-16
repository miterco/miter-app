import {Request, Response} from 'express';

const {NODE_ENV} = process.env;
// const ACCESS_CONTROL_ALLOW_ORIGIN = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*';

const scriptSources = [
  'https://accounts.google.com/gsi/client',
  'https://cdn.heapanalytics.com',
  'https://www.googletagmanager.com',
  'https://js.hs-scripts.com',
  'https://js.hscollectedforms.net',
  'https://js.hs-banner.com',
  'https://js.hs-analytics.net',
  'https://edge.fullstory.com',
];
const scriptSourcesString = scriptSources.join(' ');

/**
 * This middleware adds several security headers to every request in order to comply with the
 * Open Web Application Security Project.
 */
const OWASPHeadersMiddleware = (_: Request, res: Response, next: Function) => {
  // When a stylesheet is requested make sure that the MIME type is set to text/css and when a
  // script tag is loaded its MIME type is set to text/javascript.
  // TODO: Find a way to enable this for safari without excluding scrips from ngrok.
  res.append('X-Content-Type-Options', 'nosniff');

  // Indicate to the browser that this website should only be accessed using https.
  res.append('Strict-Transport-Security', 'max-age=31536000, includeSubDomains'); // One year.

  // Don't include the Referer header in requests.
  res.append('Referrer-Policy', 'no-referrer');

  // The Content-Security-Policy header allows you to define what kind and what source can a
  // script, style or any other content can be included from and executed by the browser.
  const frameAncestors = ['miter-test.herokuapp.com', 'calendar.google.com', 'app.miter.co'];

  if (NODE_ENV !== 'production') {
    frameAncestors.push('localhost:3000', 'localhost:8000', 'your-ngrok-domain.ngrok.io');
  }

  res.append(
    'Content-Security-Policy',
    [
      `default-src * data: blob: 'self' wss: ws: localhost:;`,
      `script-src 'self' https:* 'unsafe-inline' ${scriptSourcesString};`,
      `style-src data: blob: 'unsafe-inline' 'self' https://*.typekit.net https://fonts.googleapis.com;`,
      `frame-ancestors ${frameAncestors.join(' ')}`,
    ].join('')
  );

  next();
};

export default OWASPHeadersMiddleware;
