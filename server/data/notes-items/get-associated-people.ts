import {NoteRecord, FullPersonWithEmail} from '../../server-core/server-types';
import {fetchPeopleByEmailAddresses} from '../people/fetch-people';
import {EMAILS_PATTERN} from 'miter-common/patterns';

/**
 * Given a note or a summary item, it returns the list of people associated to it.
 *
 * @param note - a note item.
 * @returns the list of people associated to it.
 */
export const getAssociatedPeople = async (note: Pick<NoteRecord, 'itemText'>): Promise<FullPersonWithEmail[]> => {
  // Extract the email mentions from the item text.
  const {itemText} = note;
  const emails = itemText.match(new RegExp(EMAILS_PATTERN, 'gi')) || [];
  const associatedPeople = await fetchPeopleByEmailAddresses(emails);

  return associatedPeople;
};
