/*
 * Centralizes analytics tracking on the server.
 */

import {ProductSurface} from '@prisma/client';
import axios from 'axios';
import {uuid} from 'miter-common/CommonUtil';
import {checkEnvironmentVariables} from './server-util';

export const AnalyticsProperties = {
  SignUpSurface: 'Sign-Up Surface',
  SignUpDate: 'Sign-Up Date',
};

/* userIdentifier: At times we won't know who the user is, but we do need to supply an ID. Leaving userIdentifier as
 * null means we generate a UUID for the identity. Argument is string | null so you have to think about whether you
 * *really* want a one-off user.
 */
export const trackAnalyticsEvent = (
  eventName: string,
  userIdentifier: string | null,
  properties?: Record<string, string | number>
) => {
  if (checkEnvironmentVariables(['HEAP_ENV_ID'])) {
    axios
      .post('https://heapanalytics.com/api/track', {
        app_id: process.env.HEAP_ENV_ID,
        identity: userIdentifier || uuid(),
        event: eventName,
        properties,
      })
      .catch(error => {
        console.error('Error tracking analytics event', error);
      });
  }
};

export const addAnalyticsUserProperties = (userIdentifier: string, properties?: Record<string, string | number>) => {
  if (checkEnvironmentVariables(['HEAP_ENV_ID'])) {
    axios
      .post('https://heapanalytics.com/api/add_user_properties', {
        app_id: process.env.HEAP_ENV_ID,
        identity: userIdentifier,
        properties,
      })
      .catch(error => {
        console.error('Error adding analytics user properties', error);
      });
  }
};

export const configureNewAnalyticsUser = (userIdentifier: string, surface: ProductSurface) => {
  addAnalyticsUserProperties(userIdentifier, {
    'Sign-Up Surface': surface,
    'Sign-Up Date': new Date().toISOString().substring(0, 10),
  });
};
