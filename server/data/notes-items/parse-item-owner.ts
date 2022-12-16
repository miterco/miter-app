import {FullPersonRecord, NoteRecord} from '../../server-core/server-types';
import {fetchPersonByEmail, fetchPersonByUserId} from '../people/fetch-person';
import {EMAILS_PATTERN} from 'miter-common/patterns';

/**
 * Given a note or summary item it returns the right owner for the item.
 *
 * @param item - a note or summary item.
 * @returns the owner of the item.
 */
export const parseItemOwner = async (
  item: Pick<NoteRecord, 'itemText' | 'createdBy'>
): Promise<{owner: FullPersonRecord | null; explicit: boolean}> => {
  const {itemText, createdBy} = item;
  const emails = itemText.match(EMAILS_PATTERN) || [];
  const ownerEmail = emails.find((email: string) => itemText.startsWith(email));

  try {
    if (ownerEmail) return {owner: await fetchPersonByEmail(ownerEmail), explicit: true};
    else if (createdBy) return {owner: await fetchPersonByUserId(createdBy), explicit: false};
  } catch (error) {}

  return {owner: null, explicit: false};
};
