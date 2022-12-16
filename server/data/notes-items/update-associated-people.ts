import {getPrismaClient} from '../prisma-client';

import {FullPersonWithEmail, ItemAssociatedPersonRecord} from '../../server-core/server-types';
import {Note} from 'miter-common/SharedTypes';
import {getAssociatedPeople} from './get-associated-people';
import {fetchPersonByUserId} from '../people/fetch-person';
import {fetchSummaryItemByNote} from './fetch-summary-item-by-note';

const prisma = getPrismaClient();

type ItemAssociatedPersonUpdateData = Partial<Omit<ItemAssociatedPersonRecord, 'personId'>> &
  Pick<ItemAssociatedPersonRecord, 'personId'>;

/**
 * Associates a given list of people to a note item and/or a summary item.
 *
 * @param noteId - the id of the note.
 * @param summaryItemId - the id of the summary item to associate the given people with.
 * @param associatedPeople - the list of people to associate with the item/summary-item.
 * @returns a promise that resolves when it has finished updating the associated people for the items.
 */
export const updateAssociatedPeople = async (
  noteId: string | undefined,
  summaryItemId: string | undefined,
  associatedPeople: FullPersonWithEmail[]
) => {
  const data: ItemAssociatedPersonUpdateData[] = [];
  const alreadyAdded: Record<string, boolean> = {};

  for (let i = 0; i < associatedPeople.length; i++) {
    const personId = associatedPeople[i].id;
    const {emailAddressId} = associatedPeople[i];

    if (!personId || alreadyAdded[personId]) continue;
    else alreadyAdded[personId] = true;

    data.push({
      noteId: noteId || undefined,
      personId,
      personEmailId: emailAddressId,
      summaryItemId: summaryItemId || undefined,
    });
  }

  await prisma.$transaction([
    prisma.itemAssociatedPerson.deleteMany({where: {OR: [{noteId}, {summaryItemId}]}}),
    prisma.itemAssociatedPerson.createMany({data, skipDuplicates: true}),
  ]);
};

export const saveAssociatedPeopleForNote = async (note: Note) => {
  // Save the associated people.
  const summaryItemId = (await fetchSummaryItemByNote(note.id))?.id;
  const associatedPeople = await getAssociatedPeople(note);
  const author = note.createdBy ? await fetchPersonByUserId(note.createdBy) : null;

  if (author) associatedPeople.push(author);

  await updateAssociatedPeople(note.id, summaryItemId, associatedPeople);
};
