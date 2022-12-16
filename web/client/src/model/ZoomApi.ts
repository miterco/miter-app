import * as Util from '../Utils';
import {sendRequest} from '../HttpConnection';
import {ExpressResponse} from 'miter-common/SharedTypes';

export const createMeeting = async (zoomMeetingNID: string | null): Promise<string | null> => {
  try {
    const response: ExpressResponse = await sendRequest('api/zoom/meeting', {zoomMeetingNID}, 'POST');
    return response.body?.meetingToken;
  } catch (err) {
    Util.error(`Failed to create a meeting for Zoom: ${err}`, true);
    return null;
  }
};

export const correlateMeetings = async (meetingToken: string, zoomMeetingNID: string | null): Promise<boolean> => {
  try {
    const url = zoomMeetingNID ? `api/zoom/meeting/${zoomMeetingNID}/correlate` : 'api/zoom/meeting/correlate';
    const response: ExpressResponse = await sendRequest(url, {meetingToken}, 'POST');
    return response.success;
  } catch (err) {
    Util.error(`Failed to correlate meetings: ${err}`, true);
    return false;
  }
};

export const fetchMeetingTokenForZoomMeeting = async (zoomMeetingNID: string | null): Promise<string | null> => {
  const url = zoomMeetingNID ? `api/zoom/meeting/${zoomMeetingNID}/token` : 'api/zoom/meeting/token';
  const response: ExpressResponse = await sendRequest(url, {}, 'GET');
  return response.body?.meetingToken;
};
