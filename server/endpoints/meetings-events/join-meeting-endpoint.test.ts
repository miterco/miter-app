import {JoinMeetingRequest, Meeting, MeetingToken} from 'miter-common/SharedTypes';
import {v4 as uuid} from 'uuid';
import {createBulkCalendarEvents} from '../../data/meetings-events/create-bulk-calendar-events';
import {joinMeetingEndpoint} from './join-meeting-endpoint';
import {fetchMeetingByToken} from '../../data/fetch-token';
import {calendar_v3, google} from 'googleapis';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {
  getGCalEventPermutations,
  insertTestDataForLocking,
  insertTestMeeting,
  insertTestMeetingAndToken,
  insertTestUser,
  testName,
  TestUserId,
} from '../../testing/generate-test-data';
import {getPrismaClient} from '../../data/prisma-client';
import {createToken} from '../../data/create-token';

jest.mock('googleapis');
jest.mock('../../google-apis/google-auth');

const googleErrorMessage = {
  response: {
    data: {
      error: 'not_found',
    },
  },
};

/*
 * Core logic for all the tests. Joins a meeting, checks the result. Optionally mocks a Google calendar API call. Does
 * not create data intself--that's left to individual tests and factories.
 */
const testCore = async (opts: {
  meetingExternalIdentifier: string;
  expectedResult: Partial<Meeting> | boolean; // False if we expect to get an error back from the endpoint
  testGoogleEvent?: calendar_v3.Schema$Event | null; // Undefined if irrelevant, null if we want mock-Google to error
  userId: string | null;
}) => {
  const {meetingExternalIdentifier, expectedResult, testGoogleEvent, userId} = opts;
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getUserForClient as jest.Mock).mockReturnValue({userId});
  if (testGoogleEvent !== undefined) {
    (google.calendar as jest.Mock).mockReturnValue({
      events: {
        get: () => {
          if (!testGoogleEvent) return Promise.reject(googleErrorMessage);

          return {data: testGoogleEvent};
        },
      },
    });
  }

  const body: JoinMeetingRequest = {meetingExternalIdentifier};
  await joinMeetingEndpoint(server, client, body);

  if (expectedResult) {
    // For successful join we call send() twice: first with the meeting, then the token.
    expect(server.send).toHaveBeenCalledTimes(userId ? 2 : 3);

    // Grab and validate the token we sent.
    expect(server.send).toHaveBeenNthCalledWith(2, client, 'MeetingToken', {tokenValue: expect.any(String)});
    const {tokenValue} = (server.send as jest.Mock).mock.calls[1][2];

    // Use the token to get the meeting from the DB.
    const meeting = await fetchMeetingByToken(tokenValue);

    // Ensure we called setClientChannel() with the meeting ID
    expect(server.setClientChannel).toHaveBeenCalledTimes(1);
    expect(server.setClientChannel as jest.Mock).toHaveBeenCalledWith(client, meeting.id);

    // Ensure we shipped the correct meeting down to the client
    expect(server.send).toHaveBeenNthCalledWith(1, client, 'Meeting', {meeting});
    if (expectedResult !== true) {
      // We've got an object with expected data to check
      expect(server.send).toHaveBeenNthCalledWith(1, client, 'Meeting', {
        meeting: expect.objectContaining(expectedResult),
      });
    }

    // Depending on whether we have a User ID, we either broadcast (signed in) or just send (signed out) attendance info
    if (userId) {
      expect(server.broadcast).toHaveBeenCalledTimes(1);
      expect(server.broadcast).toHaveBeenCalledWith(
        expect.any(String),
        'AllAttendees',
        expect.objectContaining({
          people: expect.arrayContaining([expect.objectContaining({userId})]),
        })
      );
    } else {
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    }

    return {server, client, meeting};
  } else {
    // On a normal failed join, we expect the server to send a single message down to the client with an error.
    expect(server.send).toHaveBeenCalledTimes(1);
    expect(server.send).toHaveBeenCalledWith(
      client,
      'Meeting',
      expect.objectContaining({meeting: null, error: expect.any(String)})
    );
    expect(server.broadcast).toHaveBeenCalledTimes(0);

    return {server, client, meeting: null};
  }
};

const googleEventTestFactory = (baseServiceId: string, expectedResult: Partial<Meeting> | boolean) => {
  return async () => {
    const {rawEvents, transformedEvents, idPrefix} = await getGCalEventPermutations();
    const user = await insertTestUser(testName());
    await createBulkCalendarEvents(transformedEvents, user);
    const uniqueServiceId = idPrefix + baseServiceId;
    const meetingExternalIdentifier = `g_${uniqueServiceId}`;
    const testGoogleEvent = rawEvents.find(event => event.id === uniqueServiceId);

    await testCore({
      meetingExternalIdentifier,
      testGoogleEvent: testGoogleEvent || null,
      userId: user.id,
      expectedResult,
    });
  };
};

const existingMiterIdTestFactory = (tokenValue: string, expectedResult: Partial<Meeting> | boolean) => {
  return async () => {
    await testCore({
      meetingExternalIdentifier: tokenValue,
      userId: TestUserId,
      expectedResult,
    });
  };
};

describe('joinMeetingEndpoint', () => {
  it('Should error on nonexistent Google event ID', googleEventTestFactory(`trythismeeting_${uuid()}`, false));

  it('Should error on nonexistent Miter meeting token', existingMiterIdTestFactory(uuid(), false));

  it('Should join newly-created Miter meeting with signed-in user', async () => {
    const [_, token] = await insertTestMeetingAndToken(testName());
    await testCore({
      meetingExternalIdentifier: token.value,
      userId: TestUserId,
      expectedResult: true,
    });
  });

  it('Should join newly-created Miter meeting with no user', async () => {
    const [_, token] = await insertTestMeetingAndToken(testName());
    await testCore({
      meetingExternalIdentifier: token.value,
      userId: null,
      expectedResult: true,
    });
  });

  it(
    'Should return a meeting already in the DB for a single-instance Google ID',
    googleEventTestFactory('singleInstanceNoMiterId', {title: 'Single Instance - No Miter ID'})
  );

  it(
    'Should find the first instance of a recurring event with no additional instances in DB',
    googleEventTestFactory('firstInstanceOfRecurringYesMiterIdNoAdditional', {
      title: 'First Instance of Recurring - Yes Miter ID',
    })
  );

  it.todo('Look up Nth Instance of Recurring not in DB, first in DB, no others in DB');
  // This was a test before and just (incorrectly) generated an ad-hoc meeting with a TODO to mock Google. I'm adding
  // a todo here without fully understanding what this was. Leaving the original commented out.
  /*
  _test(
    'Look up Nth Instance of Recurring not in DB, first in DB, no others in DB',
    testFactory(
      `g_firstInstanceOfRecurringYesMiterIdNoAdditional_${uuid()}`,
      // {title: "First Instance of Recurring - No Additional Instances"},
      {title: adHocMeetingTitle}
    )
  );
  */

  it.todo('Look up Nth Instance of Recurring not in DB, first in DB, yes others in DB');
  // Same deal as above
  /*
  // Should generate an instance via our DB (TODO Google mocks)
  _test(
    'Look up Nth Instance of Recurring not in DB, first in DB, yes others in DB',
    testFactory(
      `g_firstInstanceOfRecurringYesMiterIdYesAdditional_${uuid()}`,
      // {title: "First Instance of Recurring - Yes Miter Id / Yes Additional Instances"},
      {title: adHocMeetingTitle}
    )
  );
  */

  it(
    'Should locate Nth Instance of Recurring - yes Miter ID, no Additional By Miter ID & GoogleID',
    googleEventTestFactory('firstInstanceOfRecurringYesMiterIdYesAdditional_20210625T180000Z', {
      title: 'Adding a new title for the Nth Instance',
    })
  );

  it(
    'Should look up First Instance of Recurring with Compound ID',
    googleEventTestFactory('firstInstanceCompoundTestYesMiterId_CompoundId', {
      title: 'Compound First ID - Yes Miter ID',
    })
  );

  it.todo('Look up Nth instance (not in DB) with Compound First Instance');
  it.todo('Look up Nth instance (not in DB) with Compound First Instance -- variant where it IS in the db');
  // Same deal as todos above
  // TODO Revisit when we have a Google API mock - for now, ad hoc
  /*
  _test(
    'Look up Nth instance (not in DB) with Compound First Instance',
    testFactory(
      `g_firstInstanceCompoundTestYesMiterId_${uuid()}`,
      // {title: "Compound First ID - Yes Miter ID"}
      {title: adHocMeetingTitle}
    )
  );
  */

  // TODO: ADD expect toHaveBeenCalledWith for the Token message
  // TODO check title rather than ID and maybe make sample title more unique
  it(
    'Should fetch a preexisting meeting by Miter token',
    existingMiterIdTestFactory('VALIDTESTTOKEN', {id: '1e77370b-535b-4955-96b1-64fe3ebe1581'})
  );
});

// -------------------------------------------------------------------------------------------------
//                                       GOAL EXEMPTION LOGIC
// -------------------------------------------------------------------------------------------------

const goalExemptionTestFactory = (title: string, expectedValue: boolean) => async () => {
  const meeting = await insertTestMeeting(title);
  const token = await createToken({meetingId: meeting.id});
  const prisma = getPrismaClient();
  const updated = await prisma.meeting.update({
    where: {
      id: meeting.id,
    },
    data: {
      isGoalExempt: null,
    },
  });

  expect(updated.isGoalExempt).toBeNull();

  await testCore({
    meetingExternalIdentifier: token.value,
    userId: TestUserId,
    expectedResult: {isGoalExempt: expectedValue},
  });
};

describe('joinMeetingEndpoint - goal-exemption', () => {
  it('Should return false for a normal meeting', goalExemptionTestFactory('Super Awesome Status Meeting', false));
  it(
    'Should return true for a starts-with match',
    goalExemptionTestFactory('HOLD: Super Awesome Status Meeting', true)
  );
  it(
    'Should return false when a starts-with-only string is not at the beginning',
    goalExemptionTestFactory('Meeting where we hold each other accountable', false)
  );
  it('Should return true for an ends-with match', goalExemptionTestFactory('My Focus Block', true));
  it(
    'Should return false when an ends-with-only string is not at the end',
    goalExemptionTestFactory('My Blockchain Meeting', false)
  );
  it('Should return true for an anywhere match', goalExemptionTestFactory('blah meditation blah', true));
  it('Should return true for an entire-string match', goalExemptionTestFactory('Doctor', true));
  it(
    'Should return false when an entire-string match is not the entire string',
    goalExemptionTestFactory('Doctor Whillans', false)
  );
});

// -------------------------------------------------------------------------------------------------
//                                      ORGANIZATION LOCKING
// -------------------------------------------------------------------------------------------------

describe('joinMeetingEndpoint - Meeting / Organization Locking Behavior', () => {
  it('should Allow: Unlocked User / Unlocked Meeting', async () => {
    const {unlockedUser, unlockedMeetingToken} = await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: unlockedMeetingToken.value,
      expectedResult: {id: unlockedMeetingToken.meetingId},
      userId: unlockedUser.id,
    });
  });

  it('should Allow:  Locked User / Locked Meeting (for a matching org)', async () => {
    const {lockedUser, lockedMeetingToken} = await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: lockedMeetingToken.value,
      expectedResult: {id: lockedMeetingToken.meetingId},
      userId: lockedUser.id,
    });
  });

  it('should Block: Locked User / Locked Meeting (not matching org)', async () => {
    const {secondLockedUser, lockedMeetingToken} = await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: lockedMeetingToken.value,
      expectedResult: false,
      userId: secondLockedUser.id,
    });
  });

  it('should Block: Unlocked User / Locked Meeting', async () => {
    const {unlockedUser, lockedMeetingToken} = await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: lockedMeetingToken.value,
      expectedResult: false,
      userId: unlockedUser.id,
    });
  });

  it('should Block: Locked User / Unlocked Meeting', async () => {
    const {lockedUser, unlockedMeetingToken} = await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: unlockedMeetingToken.value,
      expectedResult: false,
      userId: lockedUser.id,
    });
  });

  it('should Block ALL Users / Blocked meeting', async () => {
    const {lockedUser, unlockedUser, secondLockedUser, blockedMeetingToken, blockedMeeting} =
      await insertTestDataForLocking();

    await testCore({
      meetingExternalIdentifier: blockedMeetingToken.value,
      expectedResult: false,
      userId: lockedUser.id,
    });
    await testCore({
      meetingExternalIdentifier: blockedMeetingToken.value,
      expectedResult: false,
      userId: secondLockedUser.id,
    });
    await testCore({
      meetingExternalIdentifier: blockedMeetingToken.value,
      expectedResult: false,
      userId: unlockedUser.id,
    });
  });
});
