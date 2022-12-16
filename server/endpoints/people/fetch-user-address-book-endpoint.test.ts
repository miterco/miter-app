import {getDaysAgo, getDaysFromNow, uuid} from '../../../common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import fetchUserAddressBookEndpoint from './fetch-user-address-book-endpoint';
import {fetchNonUsersFromAddressBook} from '../../data/people/fetch-people';

jest.mock('../../data/people/fetch-people');

const dataFn = fetchNonUsersFromAddressBook as any;
const ExpectedTimeWindowStart = getDaysAgo(7);
const ExpectedTimeWindowEnd = getDaysFromNow(7);
const AddressBookMockValues = [
  {
    id: uuid(),
    displayName: 'Nick',
    email: 'sampleemailn@test.miter.co',
    eventCount: 1,
  },
  {
    id: uuid(),
    displayName: 'Franklin',
    email: 'sampleemaildf@test.miter.co',
    eventCount: 4,
  },
  {
    id: uuid(),
    displayName: 'Wilson',
    email: 'sampleemaildw@test.miter.co',
    eventCount: 7,
  },
  {
    id: uuid(),
    displayName: 'Alan',
    email: 'sampleemaila@test.miter.co',
    eventCount: 2,
  },
];

describe('fetchUserAddressBookEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const {send, broadcast, getUserForClient} = server as any;

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  it('should send a DirectResponse', async () => {
    const payload = {};
    await fetchUserAddressBookEndpoint(server, client, payload);

    const [_, responseType] = send.mock.calls[0];
    expect(send).toHaveBeenCalledTimes(1);
    expect(responseType).toBe('DirectResponse');
  });

  it('should return an empty list of people when the user is not authenticated', async () => {
    const payload = {};
    await fetchUserAddressBookEndpoint(server, client, payload);

    const [_, _responseType, body] = send.mock.calls[0];
    expect(Array.isArray(body.people)).toBe(true);
    expect(body.people).toHaveLength(0);
  });

  it('should fetch the list of people the user is meeting with in the past/next week', async () => {
    dataFn.mockClear();

    // Authenticate the user and perform the request.
    const expectedUserId = uuid();
    getUserForClient.mockReturnValue({userId: expectedUserId});

    // Mock the return value of fetchNonUsersFromAddressBook.
    dataFn.mockReturnValue([...AddressBookMockValues]);

    await fetchUserAddressBookEndpoint(server, client, {}); // Execute the endpoint.

    const [userId, timeWindowStart, timeWindowEnd] = dataFn.mock.calls[0];
    expect(dataFn).toHaveBeenCalledTimes(1);
    expect(userId).toBe(expectedUserId);
    expect(timeWindowStart.getDate()).toBe(ExpectedTimeWindowStart.getDate());
    expect(timeWindowEnd.getDate()).toBe(ExpectedTimeWindowEnd.getDate());
  });

  it('should limit the results to the specified limit', async () => {
    // Authenticate the user and perform the request.
    getUserForClient.mockReturnValue({userId: uuid()});

    // Mock the return value of fetchNonUsersFromAddressBook.
    dataFn.mockReturnValue([...AddressBookMockValues]);

    await fetchUserAddressBookEndpoint(server, client, {limit: 1}); // Execute the endpoint.

    const [_, _responseType, body] = send.mock.calls[0];
    expect(body.people).toHaveLength(1);
  });
});
