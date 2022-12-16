import {AddressBookPerson, FetchUserAddressBookRequest} from '../../../common/SharedTypes';
import {fetchNonUsersFromAddressBook} from '../../data/people/fetch-people';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

// Use the following variables to define the time window that will be taken into consideration.
const DaysInThePast = 7;
const DaysInTheFuture = 7;

const fetchUserAddressBook = socketEndpoint(async (request, _response) => {
  const body = request.body as FetchUserAddressBookRequest;
  let peopleInAddressBook: AddressBookPerson[] = [];

  if (request.userId) {
    // Set the start of the time window.
    const timeWindowStart = new Date();
    timeWindowStart.setHours(0);
    timeWindowStart.setMinutes(0);
    timeWindowStart.setSeconds(0);
    timeWindowStart.setDate(timeWindowStart.getDate() - DaysInThePast);

    // Set the end of the time window.
    const timeWindowEnd = new Date();
    timeWindowEnd.setHours(23);
    timeWindowEnd.setMinutes(59);
    timeWindowEnd.setSeconds(59);
    timeWindowEnd.setDate(timeWindowEnd.getDate() + DaysInTheFuture);

    peopleInAddressBook = await fetchNonUsersFromAddressBook(request.userId, timeWindowStart, timeWindowEnd);

    // Sort by the calendar events count.
    peopleInAddressBook.sort((p1, p2) => p2.eventCount - p1.eventCount);
  }

  return {
    people: peopleInAddressBook.slice(0, body?.limit),
  };
});

export default fetchUserAddressBook;
