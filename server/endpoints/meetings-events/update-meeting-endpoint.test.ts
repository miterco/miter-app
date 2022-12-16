import {SocketServer} from '../../server-core/socket-server';
import {insertTestMeetingAndCalendarEvent, testName} from '../../testing/generate-test-data';
import {updateMeetingEndpoint} from './update-meeting-endpoint';
import {UpdateMeetingRequest, Meeting} from 'miter-common/SharedTypes';
import {v4 as uuid} from 'uuid';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

let server: SocketServer;

const testFactory = (req: UpdateMeetingRequest, shouldThrow: boolean = false) => {
  return async () => {
    // Need a meeting to update, and a calendar event on which to base it

    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);

    // Manually altering the meeting to compare with what we get back
    const expectedUpdatedMeeting: Meeting = {...meeting};
    if (req?.goal !== undefined) expectedUpdatedMeeting.goal = req.goal;
    if (req?.title !== undefined) expectedUpdatedMeeting.title = req.title;

    const promise = updateMeetingEndpoint(server, mockWebSocket(), req);

    if (shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    } else {
      await promise;
      expect(server.broadcast).toHaveBeenCalledTimes(1);
      expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'Meeting', {meeting: expectedUpdatedMeeting});
    }
  };
};

beforeEach(() => {
  server = mockSocketServer();
});

test('Edit meeting endpoint: edit title only', testFactory({title: 'edit title only'}));
test(
  'Edit meeting endpoint: edit title and goal',
  testFactory({title: 'edit title with goal', goal: 'edit goal with title'})
);

test(
  'Edit meeting endpoint: extraneous id',
  testFactory({id: uuid(), title: 'edit title with extra id', goal: 'edit goal with extra id'} as UpdateMeetingRequest)
);

test('Edit meeting endpoint: empty', testFactory({}, true));
test('Edit meeting endpoint: null', testFactory(null as unknown as UpdateMeetingRequest, true));
