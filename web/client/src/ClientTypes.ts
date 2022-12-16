import {Person} from 'miter-common/SharedTypes';

export interface TextEntity {
  text: string;
  type: 'Text' | 'Mention';
  mutable?: boolean;
  person?: Person;
}

export type AuthenticatedRequestStatus = 'Pending' | 'Success' | 'SignedOut' | 'Error';
