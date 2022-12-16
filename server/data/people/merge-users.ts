import {getPrismaClient} from '../prisma-client';
import {UserGoogleIdentifiers, UserRecord, UserZoomIdentifiers} from '../../server-core/server-types';
import {fetchZoomIdentifiers} from '../fetch-zoom-identifiers';
import {setUserZoomCredentials} from '../people/set-user-zoom-credentials';
import {fetchGoogleIdentifiers} from '../fetch-google-identifiers';
import {editGoogleIdentifiers} from '../edit-google-identifiers';
import {deletePersonById} from './delete-person';
import {deleteUserById} from './delete-user';
import {fetchMeetingIdsAttendedByPerson} from './fetch-meetings-attended';
import {fetchItemIdsByPerson} from '../notes-items/fetch-all-notes';

const prisma = getPrismaClient();

export const mergeUsers = async (primaryUser: UserRecord, secondaryUser: UserRecord) => {
  if (!primaryUser.personId || !secondaryUser.personId) throw new Error('Users should have a valid personId');

  const meetingsAtttendedByPrimaryUser = await fetchMeetingIdsAttendedByPerson(primaryUser.personId);
  const itemsAssociatedToPrimaryUser = await fetchItemIdsByPerson(primaryUser.personId);

  // ===================================================================================================================
  //                                                FETCHING CREDENTIALS
  // ===================================================================================================================
  // Credentials from the secondary user are fetched only if the primary user doesn't already have credentials for the
  // corresponding service.

  let newZoomCredentials: UserZoomIdentifiers | null = null;
  let newGoogleCredentials: UserGoogleIdentifiers | null = null;

  // Fetch the zoom credentials.
  if (!primaryUser.zoomUserId && secondaryUser.zoomUserId) {
    newZoomCredentials = await fetchZoomIdentifiers(secondaryUser.id);
  }

  // Fetch the google credentials.
  if (!primaryUser.serviceId && secondaryUser.serviceId) {
    newGoogleCredentials = await fetchGoogleIdentifiers(secondaryUser.id);
  }

  if (!primaryUser.personId || !secondaryUser.personId) throw new Error('Users should have a valid personId');

  await prisma.$transaction([
    // =================================================================================================================
    //                                             USER DATA MIGRATION
    // =================================================================================================================
    // Delete all auth tokens from the account that will be deleted.
    prisma.authToken.updateMany({
      where: {userId: secondaryUser.id},
      data: {userId: primaryUser.id},
    }),

    // Delete magic links that won't be used anymore.
    prisma.magicLink.updateMany({
      where: {userId: secondaryUser.id},
      data: {userId: primaryUser.id},
    }),

    // Update notes.
    prisma.note.updateMany({
      where: {createdBy: secondaryUser.id},
      data: {createdBy: primaryUser.id},
    }),

    // Update topics.
    prisma.topic.updateMany({
      where: {createdBy: secondaryUser.id},
      data: {createdBy: primaryUser.id},
    }),

    // Update summary items.
    prisma.summaryItem.updateMany({
      where: {createdBy: secondaryUser.id},
      data: {createdBy: primaryUser.id},
    }),

    // =================================================================================================================
    //                                             PEOPLE DATA MIGRATION
    // =================================================================================================================
    // Update owned notes.
    prisma.note.updateMany({
      where: {ownerId: secondaryUser.personId},
      data: {ownerId: primaryUser.personId},
    }),

    // Update owned summary items.
    prisma.summaryItem.updateMany({
      where: {itemOwnerId: secondaryUser.personId},
      data: {itemOwnerId: primaryUser.personId},
    }),

    // Update email addresses.
    prisma.emailAddress.updateMany({
      where: {personId: secondaryUser.personId},
      data: {personId: primaryUser.personId},
    }),

    // Update the person reference for calendar events.
    prisma.calendarEventPerson.updateMany({
      where: {personId: secondaryUser.personId},
      data: {personId: primaryUser.personId},
    }),

    // Remove the meetingPerson instances that would result in a violation of the unique constraint.
    prisma.meetingPerson.deleteMany({
      where: {
        personId: secondaryUser.personId,
        meetingId: {in: meetingsAtttendedByPrimaryUser},
      },
    }),

    // Update the meeting person.
    prisma.meetingPerson.updateMany({
      where: {personId: secondaryUser.personId},
      data: {personId: primaryUser.personId},
    }),

    // Remove the itemAssociatedPerson instances that would result in a violation of the unique constraint.
    prisma.itemAssociatedPerson.deleteMany({
      where: {
        personId: secondaryUser.personId,
        OR: [
          {noteId: {in: itemsAssociatedToPrimaryUser.noteIds}},
          {summaryItemId: {in: itemsAssociatedToPrimaryUser.summaryItemIds}},
        ],
      },
    }),

    // Update the item associated person.
    prisma.itemAssociatedPerson.updateMany({
      where: {personId: secondaryUser.personId},
      data: {personId: primaryUser.personId},
    }),
  ]);

  // =================================================================================================================
  //                                                   CLEAN UP
  // =================================================================================================================
  await deleteUserById(secondaryUser.id);
  await deletePersonById(secondaryUser.personId);

  // =================================================================================================================
  //                                              UPDATING CREDENTIALS
  // =================================================================================================================
  // The credentials are updated after the secondary user is deleted in order to avoid violating the unique constraint.

  // Update the zoom credentials.
  if (newZoomCredentials) {
    await setUserZoomCredentials(primaryUser.id, newZoomCredentials.zoomUserId, newZoomCredentials.zoomTokens || null);
  }

  // Update the google credentials.
  if (newGoogleCredentials) {
    const {serviceId, gcalPushChannel, gcalResourceId, gcalSyncToken, gcalPushChannelExpiration, tokens} =
      newGoogleCredentials;

    await editGoogleIdentifiers(primaryUser.id, {
      serviceId: serviceId || undefined,
      gcalPushChannel: gcalPushChannel || undefined,
      gcalResourceId: gcalResourceId || undefined,
      gcalSyncToken: gcalSyncToken || undefined,
      gcalPushChannelExpiration: gcalPushChannelExpiration || undefined,
      tokens: tokens || undefined,
    });
  }
};
