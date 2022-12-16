import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import fetchNonUsersFromInviteeListEndpoint from './fetch-non-users-from-invitee-list-endpoint';
import {fetchNonUsersFromMeeting} from '../../data/people/fetch-people';

jest.mock('../../data/people/fetch-people');

describe('fetchNonUsersFromInviteeListEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const send = server.send as jest.Mock;
  const getUserForClient = server.getUserForClient as jest.Mock;
  const getExistingChannel = server.getExistingChannel as jest.Mock;
  const dataFn = fetchNonUsersFromMeeting as jest.Mock;

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  it('should return an empty list when there is no authenticated user', async () => {
    getUserForClient.mockReturnValue({userId: null});
    getExistingChannel.mockReturnValue(uuid());

    const requestId = uuid();
    await fetchNonUsersFromInviteeListEndpoint(server, client, {}, requestId);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(client, 'DirectResponse', {people: []}, requestId);
  });

  it('should return an empty list when the user is not in a meeting', async () => {
    getUserForClient.mockReturnValue({userId: uuid()});
    getExistingChannel.mockReturnValue(null);

    const requestId = uuid();
    await fetchNonUsersFromInviteeListEndpoint(server, client, {}, requestId);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(client, 'DirectResponse', {people: []}, requestId);
  });

  it('should call the "fetchNonUsersFromInviteeList" data function with the meetingId of the current meeting', async () => {
    const meetingId = uuid();
    getUserForClient.mockReturnValue({userId: uuid()});
    getExistingChannel.mockReturnValue(meetingId);

    await fetchNonUsersFromInviteeListEndpoint(server, client, {}, uuid());
    expect(dataFn).toHaveBeenCalledTimes(1);
    expect(dataFn).toHaveBeenCalledWith(meetingId);
  });

  it('should send a DirectResponse with the array of non-registered users', async () => {
    const requestId = uuid();
    getUserForClient.mockReturnValue({userId: uuid()});
    getExistingChannel.mockReturnValue(uuid());
    dataFn.mockReturnValue([]);
    await fetchNonUsersFromInviteeListEndpoint(server, client, {}, requestId);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(client, 'DirectResponse', {people: []}, requestId);
  });
});
