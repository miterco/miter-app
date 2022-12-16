import * as Util from '../Utils';
import {sendRequest} from '../HttpConnection';
import socket from '../SocketConnection';
import {
  LinkedServicesResponse,
  FetchUserAddressBookRequest,
  AddressBookPerson,
  EmailRecipient,
  InvitesSentResponse,
  AuthCheckResponse,
} from 'miter-common/SharedTypes';
import {validateInvitesSentResponse, validateAddressBookPeople} from './Validators';

export const getAuthenticationCheck = async (): Promise<AuthCheckResponse> => {
  const response = await sendRequest<AuthCheckResponse>('api/auth/check', {}, 'GET');
  return response.body || {isAuthenticated: false};
};

export const fetchLinkedServices = async (): Promise<LinkedServicesResponse | null> => {
  try {
    const response = await sendRequest<LinkedServicesResponse>('api/auth/linked-services', {}, 'GET');
    return response.body || null;
  } catch (err) {
    Util.error(`Could not retrieve linked services: ${err}`, true);
    return null;
  }
};

export const fetchUserAddressBook = async (limit?: number): Promise<AddressBookPerson[]> => {
  const body = await socket.requestResponse<FetchUserAddressBookRequest>('FetchUserAddressBook', {
    limit,
  });
  const addressBook = validateAddressBookPeople(body);

  // Return the list of people in the address book ordered by the shared events count.
  return addressBook.sort((a, b) => b.eventCount - a.eventCount);
};

export const sendInvites = async (recipients: EmailRecipient[]): Promise<InvitesSentResponse> => {
  const response = await socket.requestResponse('SendInvites', {recipients});
  return validateInvitesSentResponse(response);
};
