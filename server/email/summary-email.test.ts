import {ItemType} from '@prisma/client';
import {formatDate} from 'miter-common/CommonUtil';
import {EmailRecipient, Goal, GoalTypeMap, Meeting, Topic} from 'miter-common/SharedTypes';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {createSystemMessage} from '../data/notes-items/create-note';
import {setOrganizationInternalMeetingsOnly} from '../data/people/set-organization-internal-meetings-only';
import {
  insertTestDataForLocking,
  insertTestDomain,
  insertTestMeeting,
  insertTestNote,
  insertTestNoteAndSummaryItem,
  insertTestPerson,
  insertTestSummaryItem,
  insertTestTopic,
  testEmailRecipientList,
} from '../testing/generate-test-data';
import {sendEmail, EmailMessage} from './email';
import {
  DefaultSender,
  EmailSummaryContentGroup,
  EmailSummaryItem,
  EmailSummaryProtocolDesc,
  EmailSummaryValues,
  generateSummaryEmail,
  ItemTypeMap,
  renderSummaryEmailTemplate,
} from './summary-email';

const countOccurrences = (str: string, search: string) => str.split(search).length - 1;

// -------------------------------------------------------------------------------------------------
//                                        RENDERING ONLY
// Note that a lot of the rendering is tested end-to-end under Parsing & UI below. This is a subset.
// It may make sense to change what gets tested here vs. below...not sure.
// -------------------------------------------------------------------------------------------------

describe('renderSummaryEmailTemplate', () => {
  const makeTestEmailSummaryItem = (values?: Partial<Omit<EmailSummaryItem, 'itemIconUrl'>>): EmailSummaryItem => {
    const itemType = values?.protocol ? 'Protocol' : values?.summaryItemType || ItemType.Task;
    return {
      text: values?.text || 'Test email summary item text',
      dueDateText: values?.dueDateText,
      summaryItemType: itemType,
      itemIconUrl: ItemTypeMap[itemType][1],
      itemIconName: itemType,
      protocol: values?.protocol,
    };
  };

  const makeTestEmailSummaryProtocol = (values?: Partial<EmailSummaryProtocolDesc>) => ({
    type: values?.type || 'Test Protocol Type',
    title: values?.title || 'What do you want to test today?',
    caption: values?.caption,
    items: values?.items || [
      'First protocol item',
      'Protocol item the second',
      'Protocol item #3 that is really really really long and is long',
    ],
  });

  const makeTestEmailSummaryContentGroup = (
    values?: Partial<Omit<EmailSummaryItem, 'itemIconUrl'>>[],
    title?: string
  ): EmailSummaryContentGroup => ({
    title: title || 'Test Content Group Title',
    items: values?.map(val => makeTestEmailSummaryItem(val)) || [],
  });

  const makeTestEmailSummaryValues = (values?: Partial<EmailSummaryValues>): EmailSummaryValues => ({
    title: `${values?.title || 'Render-Only Test'} ${Date.now()}`,
    goal: values?.goal || 'Render-Only Test Goal',
    date: values?.date || 'Wed, May 4',
    url: values?.url || 'https://app.miter.co/m/123456789',
    summaryItemGroups: values?.summaryItemGroups || [makeTestEmailSummaryContentGroup([{}, {}, {}])],
    noteGroups: values?.noteGroups || [makeTestEmailSummaryContentGroup([{}, {}, {}])],
  });

  const testSendEmail = async (values: EmailSummaryValues) => {
    const html = await renderSummaryEmailTemplate(values);
    expect(html.length).toBeGreaterThan(500);
    expect(html).toContain('Goal');

    const msg: EmailMessage = {
      to: [{name: 'Miter Testing', email: 'email-testing@test.miter.co'}],
      from: DefaultSender,
      subject: values.title || 'Missing Subject',
      html,
    };

    await expect(sendEmail(msg)).resolves.toBeTruthy();

    return html;
  };

  it('should correctly render a simple EmailSummaryValues (inspect email visually)', async () => {
    const values = makeTestEmailSummaryValues();
    await testSendEmail(values);
  });

  it('should render a single protocol in both the Outcomes and Notes sections', async () => {
    const caption = 'Super Awesome Caption';
    const protocol = makeTestEmailSummaryProtocol({caption});
    const values = makeTestEmailSummaryValues({
      title: 'Render-Only Test: Single Protocol',
      summaryItemGroups: [
        makeTestEmailSummaryContentGroup([{}, {}, {}, {protocol}]),
        makeTestEmailSummaryContentGroup([{}, {}]),
      ],
      noteGroups: [
        makeTestEmailSummaryContentGroup([{}, {}, {}, {}, {protocol}, {}, {}]),
        makeTestEmailSummaryContentGroup([{}, {}, {}, {}]),
      ],
    });

    const rendered = await testSendEmail(values);
    const [outcomesPart, notesPart] = rendered.split('class="Notes');

    expect(outcomesPart).toContain(protocol.type);
    expect(notesPart).toContain(protocol.type);
    expect(outcomesPart).toContain(protocol.items[0]);
    expect(notesPart).toContain(protocol.items[0]);
    expect(outcomesPart).toContain(caption);
    expect(notesPart).toContain(caption);
  });

  it('should render two protocols, one without a caption', async () => {
    const caption = 'My Great Caption';
    const protocol1 = makeTestEmailSummaryProtocol();
    const protocol2 = makeTestEmailSummaryProtocol({
      caption,
      items: ['Single protocol item'],
      type: 'Some Type',
      title: 'Some prompt',
    });
    const values = makeTestEmailSummaryValues({
      title: 'Render-Only Test: 2 Protocols, 1 Caption',
      summaryItemGroups: [
        makeTestEmailSummaryContentGroup([{}, {}, {}, {protocol: protocol1}]),
        makeTestEmailSummaryContentGroup([{}, {protocol: protocol2}]),
      ],
      noteGroups: [
        makeTestEmailSummaryContentGroup([{}, {}, {}, {}, {protocol: protocol1}, {}, {}]),
        makeTestEmailSummaryContentGroup([{}, {}, {protocol: protocol2}, {}]),
      ],
    });

    const rendered = await testSendEmail(values);
    const [outcomesPart, notesPart] = rendered.split('class="Notes');

    expect(outcomesPart).toContain(protocol1.type);
    expect(notesPart).toContain(protocol1.type);
    expect(outcomesPart).toContain(protocol1.items[0]);
    expect(notesPart).toContain(protocol1.items[0]);
    expect(outcomesPart).toContain(protocol1.title);
    expect(notesPart).toContain(protocol1.title);

    // We should have one caption, so one <h4> tag.
    expect(outcomesPart.split('<h4')).toHaveLength(2);
    expect(notesPart.split('<h4')).toHaveLength(2);

    expect(outcomesPart).toContain(caption);
    expect(notesPart).toContain(caption);
    expect(outcomesPart).toContain(protocol2.type);
    expect(notesPart).toContain(protocol2.type);
    expect(outcomesPart).toContain(protocol2.items[0]);
    expect(notesPart).toContain(protocol2.items[0]);
    expect(outcomesPart).toContain(protocol2.title);
    expect(notesPart).toContain(protocol2.title);
  });
});

// -------------------------------------------------------------------------------------------------
//                                         PARSING & UI
// Note that these tests serve two purposes: automated checking that the summary-email content
// contains what we want it to contain for a given meeting configuration, and production of actual
// SendGrid requests for those configurations so it's easy to do visual checks.
// -------------------------------------------------------------------------------------------------

describe('generateSummaryEmail - Parsing & UI', () => {
  const NoOutcomesText = 'No outcomes';
  const NoTopic = 'No Topic';

  // For testing that we correctly strip notes and summary items of any HTML tags.
  const testNoteTextWithHtml = 'Note with <strong class="Entity">HTML tag</strong>.';
  const testNoteTextWithHtml_after = 'Note with HTML tag.';

  // Specifies relevant details of a test note/summary item to be generated.
  type TestItemSpec = {
    itemType: ItemType;
    topic?: Topic;
    summaryOnly?: boolean; // Don't create a note—just a summary item.
    text?: string; // If not specified, will be generated.
    outputText?: string; // If not specified, we assume it matches the manual/auto-generated input.
    hasDate?: boolean;
  };

  // Info output by insertTestData() per item. To keep the tests distinct from the things they're
  // testing, this is produced by insertTestData() and not fetched from the created objects.
  type TestItemInfo = {
    note: boolean;
    summaryItem: boolean;
    text: string;
    topicText: string | undefined;
    dueText?: string;
    hasDueText?: boolean;
  };

  // Mimics how we expect dates to be formatted in summary emails.
  const testFormatDate = (date: Date): string => formatDate(date);

  // We auto-generate due dates but step them forward 36h so we can check for unique strings in
  // the tests.
  const DueDateStep = 129600000;

  //
  // Given a TestItemSpec array and a meeting, insert all the specified SummaryItems and Notes. For each, calculate
  // in parallel a TestItemInfo that dictates what we'll expect to see in the summary email for that item.
  //
  const insertTestData = async (meetingId: string, data: TestItemSpec[]) => {
    const result: TestItemInfo[] = [];
    const baseDueDateTimestamp = Date.now();

    for (let i = 0; i < data.length; i++) {
      const {itemType, topic, summaryOnly, text, outputText, hasDate} = data[i];
      if (itemType === 'None' && summaryOnly) throw new Error('Cannot have standalone summary item of type None.');

      // Only calculate due dates when hasDate is true (but note that hasDate doesn't mean there'll *actually* be a
      // date in the summary email--merely that the Note / SummaryItem have a date set.)
      const dueDate = hasDate ? new Date(baseDueDateTimestamp + i * DueDateStep) : undefined;

      // If text is supplied, use it; otherwise, generate something useful for debugging.
      const resolvedText =
        text ||
        `${
          summaryOnly ? 'Standalone summary item' : 'Note'
        } #${i} for testing summary emails, of type ${itemType} and topic ${topic?.id}`;

      // Insert the appropriate type of item into the DB. insertTestNote() will insert summary items as well when needed.
      if (summaryOnly) {
        await insertTestSummaryItem(meetingId, resolvedText, {topicId: topic?.id, itemType, targetDate: dueDate});
      } else {
        await insertTestNote(meetingId, resolvedText, {topicId: topic?.id, itemType, targetDate: dueDate});
      }

      // Add specification of expected output to result array. Again, note we're not pulling from the database objects
      // but rather calculating independently.
      result.push({
        note: Boolean(!summaryOnly),
        summaryItem: itemType !== 'None',
        text: outputText || resolvedText,
        topicText: topic?.text,
        dueText: dueDate ? testFormatDate(dueDate) : undefined,
        hasDueText: dueDate && itemType === 'Task',
      });
    }

    return result;
  };

  //
  // Setup logic shared by all the tests here. Adds a meeting and zero or more topics.
  //
  const setupTest = async (meetingTitle: string, topicCount: number, goal?: Goal) => {
    const resolvedGoal: Goal = goal || {type: 'CreateCollab'};
    const meeting = await insertTestMeeting(`${meetingTitle} ${Date.now()}`, {goal: JSON.stringify(resolvedGoal)});
    const topics: Topic[] = [];
    for (let i = 0; i < topicCount; i++) {
      topics.push(await insertTestTopic(meeting.id, `Summary-Email Topic ${i}`));
    }
    return {meeting, topics};
  };

  //
  // Given a meeting, prepopulated test content, and an itemInfo array to guide what we should be looking for, runs
  // generateSummaryEmail() and tests its output.
  //
  const testCore = async (meeting: Meeting, itemInfo: TestItemInfo[], expectedGoalString?: string) => {
    const msg: EmailMessage = await generateSummaryEmail(meeting.id, testEmailRecipientList);

    // Check sender and recipients.
    expect(msg.to).toHaveLength(testEmailRecipientList.length);
    expect(msg.from.email).toBe('meetings@miter.app');

    // Split HTML into parts. Are they all there?
    const {html} = msg;
    if (typeof html !== 'string') throw new Error('Expected generateSummaryEmail() to return html string.');
    const [headerPart, bodyPart] = html.split('class="Outcomes');
    expect(headerPart).toBeTruthy();
    const [outcomesPart, notesPart] = bodyPart.split('class="Notes');
    expect(outcomesPart).toBeTruthy();
    expect(notesPart).toBeTruthy();

    // Is the meeting data reflected in the header area?
    expect(headerPart).toContain(meeting.title || 'Untitled Meeting');
    expect(headerPart).toContain(expectedGoalString || GoalTypeMap.CreateCollab.string);
    expect(headerPart).toContain(formatDate(meeting.startDatetime));

    // Run through the item info array. Is it reflected the way we expect?
    expect(itemInfo.length).toBeTruthy(); // There should be *some* items.

    // We're going to count the summary items topics we find in the item-info array because we want to look for them
    // and/or the different document structures that result from how many there are.
    const noteTopics = new Set<string>();
    const outcomeTopics = new Set<string>();
    let outcomeCount = 0;

    itemInfo.forEach(item => {
      if (item.note) {
        // We expect the item to be reflected in the notes section.
        expect(notesPart).toContain(item.text);
        noteTopics.add(item.topicText || NoTopic);

        // Don't show due dates in notes
        if (item.dueText) expect(notesPart).not.toContain(item.dueText);
      }
      if (item.summaryItem) {
        // We expect the item to be reflected in the summary section.
        expect(outcomesPart).toContain(item.text);
        outcomeTopics.add(item.topicText || NoTopic);
        outcomeCount++;

        // If item has a due date, show if and only if it's a Task.
        if (item.hasDueText) {
          expect(outcomesPart).toContain(item.dueText);
        } else if (item.dueText) {
          expect(outcomesPart).not.toContain(item.dueText);
        }
      }
    });

    // If there were no summary items, then we should see a placeholder instead.
    if (outcomeCount === 0) {
      expect(outcomesPart).toContain(NoOutcomesText);
      expect(outcomesPart).toContain('Outcomes');
    } else {
      expect(outcomesPart).not.toContain(NoOutcomesText);

      // Are headers configured correctly in the outcomes section?
      if (outcomeTopics.size > 1) {
        // We should have outcomes for multiple topics (where "No Topic") counts as a topic.
        expect(outcomesPart).not.toContain('Outcomes');
        outcomeTopics.forEach(topicText => {
          expect(outcomesPart).toContain(`${topicText}</h2>`);
        });
      } else {
        // We zero or one topics to work with, so we just have a generic header.
        expect(outcomesPart).toContain('Outcomes');
      }
    }

    // Are headers configured correctly in the notes section?
    expect(noteTopics.size).toBeTruthy(); // This is mostly checking the test logic itself.
    if (noteTopics.size > 1) {
      // Notes for multiple topics; should see individual headers
      noteTopics.forEach(topicText => {
        expect(notesPart).toContain(`${topicText}</h3>`);
      });
    } else {
      // Notes for zero or one topics; should not see headers.
      expect(notesPart).not.toContain(Array.from(noteTopics)[0]);
    }

    // Send for visual check and ensure SendGrid is working while we're at it.
    await expect(sendEmail(msg)).resolves.toBeTruthy();

    return {generatedMessage: msg, headerPart, outcomesPart, notesPart};
  };

  it('should generate an email for a meeting with topics', async () => {
    const goal: Goal = {type: 'BuildRelationships'};
    const expectedGoal = GoalTypeMap.BuildRelationships.string;
    const {meeting, topics} = await setupTest('Meeting with Topics', 2, goal);
    const [topic1, topic2] = topics;

    // Two notes on topic 1 with one pinned, two pinned on topic 2 including HTML-stripping test, one without a topic,
    // and one standalone summary item without a topic. One unpinned note, one task, and one decision with dates.
    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None', topic: topic1},
      {itemType: 'None', topic: topic1, hasDate: true},
      {itemType: 'Decision', topic: topic2, text: testNoteTextWithHtml, outputText: testNoteTextWithHtml_after},
      {itemType: 'Task', topic: topic2, hasDate: true},
      {itemType: 'Decision'},
      {itemType: 'Decision', summaryOnly: true, hasDate: true},
    ]);

    await testCore(meeting, testItemInfo, expectedGoal);
  });

  it('should generate an email for a meeting without topics', async () => {
    const goal: Goal = {type: 'Other', customText: 'I am a custom goal.'};
    const expectedGoal = 'I am a custom goal.';
    const {meeting} = await setupTest('Meeting Without Topics', 0, goal);

    // Three plain notes, two pinned notes (one HTML), one standalone decision. Dates on a plain note, decision, and task.
    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None'},
      {itemType: 'None', hasDate: true},
      {itemType: 'Decision', text: testNoteTextWithHtml, outputText: testNoteTextWithHtml_after, hasDate: true},
      {itemType: 'Task', hasDate: true},
      {itemType: 'None'},
      {itemType: 'Decision', summaryOnly: true},
    ]);

    await testCore(meeting, testItemInfo, expectedGoal);
  });

  it('should generate an email for a meeting with one topic', async () => {
    const {meeting, topics} = await setupTest('Meeting With One Fully-Assigned Topic', 1);
    const [topic] = topics;

    // 7 notes, 5 pinned
    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None', topic},
      {itemType: 'None', topic},
      {itemType: 'Decision', topic},
      {itemType: 'Pin', topic},
      {itemType: 'Decision', topic},
      {itemType: 'Task', topic},
      {itemType: 'Task', topic},
    ]);

    await testCore(meeting, testItemInfo);
  });

  it('should generate an email for a meeting with one topic and some topic-less items', async () => {
    const {meeting, topics} = await setupTest('Meeting With One Partially-Assigned Topic', 1);
    const [topic] = topics;

    // 7 notes, 5 pinned, one unassigned unpinned and one unassigned pinned
    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None', topic},
      {itemType: 'None', hasDate: true},
      {itemType: 'Decision', topic},
      {itemType: 'Pin', topic},
      {itemType: 'Decision', hasDate: true},
      {itemType: 'Task', topic, hasDate: true},
      {itemType: 'Task', topic},
    ]);

    await testCore(meeting, testItemInfo);
  });

  it('should generate an email with placeholder for a meeting with no outcomes', async () => {
    const {meeting, topics} = await setupTest('Meeting With No Outcomes', 4);
    const [topic1, topic2, topic3, topic4] = topics;

    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None', topic: topic1},
      {itemType: 'None', topic: topic1},
      {itemType: 'None', topic: topic2},
      {itemType: 'None', topic: topic3},
      {itemType: 'None', topic: topic3},
      {itemType: 'None', topic: topic2},
      {itemType: 'None', topic: topic4},
      {itemType: 'None', topic: topic4},
      {itemType: 'None', topic: topic3},
      {itemType: 'None', topic: topic1},
    ]);

    await testCore(meeting, testItemInfo);
  });

  it('should not render system messages in the notes', async () => {
    const {meeting, topics} = await setupTest('Meeting with System Messages', 4);
    const [topic1, topic2, topic3, topic4] = topics;

    // Six notes, one pinned
    const testItemInfo = await insertTestData(meeting.id, [
      {itemType: 'None', topic: topic1},
      {itemType: 'None', topic: topic2},
      {itemType: 'None', topic: topic3},
      {itemType: 'None', topic: topic2},
      {itemType: 'None', topic: topic4},
      {itemType: 'Task', topic: topic3},
    ]);

    await createSystemMessage({
      meetingId: meeting.id,
      topicId: topic1.id,
      systemMessageType: 'CurrentTopicSet',
    });
    await createSystemMessage({
      meetingId: meeting.id,
      topicId: topic3.id,
      systemMessageType: 'CurrentTopicSet',
    });

    const {outcomesPart, notesPart} = await testCore(meeting, testItemInfo);
    expect(countOccurrences(outcomesPart, '<img')).toBe(1);
    expect(countOccurrences(notesPart, '<img')).toBe(6);
  });
});

// -------------------------------------------------------------------------------------------------
//                                               LOGIC
// -------------------------------------------------------------------------------------------------

describe('generateSummaryEmail - Logic', () => {
  it('should filter out recipients outside a locked org', async () => {
    const {unlockedPerson, secondUnlockedPerson, lockedPerson, lockedMeeting, unlockedMeeting, unlockedOrganization} =
      await insertTestDataForLocking();

    const lockedRecipientList: EmailRecipient[] = [
      {email: unlockedPerson.email, name: unlockedPerson.displayName || ''},
      {email: lockedPerson.email, name: lockedPerson.displayName || ''},
    ];

    const unlockedRecipientList: EmailRecipient[] = [
      {email: unlockedPerson.email, name: unlockedPerson.displayName || ''},
      {email: secondUnlockedPerson.email, name: secondUnlockedPerson.displayName || ''},
    ];

    const task = 'Note.';
    // just have a little data
    await insertTestNoteAndSummaryItem(lockedMeeting.id, task, {itemType: 'Task'});
    await insertTestNoteAndSummaryItem(unlockedMeeting.id, task, {itemType: 'Task'});

    const msgLocked = await generateSummaryEmail(lockedMeeting.id, lockedRecipientList);

    expect(msgLocked.to).toHaveLength(1);
    expect(msgLocked.to).toContainEqual({name: lockedPerson.displayName, email: lockedPerson.email});

    const msgUnlocked = await generateSummaryEmail(unlockedMeeting.id, unlockedRecipientList);

    expect(msgUnlocked.to).toHaveLength(2);
    expect(msgUnlocked.to).toContainEqual({name: unlockedPerson.displayName, email: unlockedPerson.email});
    expect(msgUnlocked.to).toContainEqual({name: secondUnlockedPerson.displayName, email: secondUnlockedPerson.email});

    await setOrganizationInternalMeetingsOnly(unlockedOrganization.id);

    // Not strictly necessary but helps to have the right variable names
    const newlyLockedMeeting = await fetchMeeting(unlockedMeeting.id);
    const newlyLockedRecipientList = unlockedRecipientList;
    const newlyLockedPerson = unlockedPerson;

    const msgAfter = await generateSummaryEmail(newlyLockedMeeting.id, newlyLockedRecipientList);
    expect(msgAfter.to).toHaveLength(1);
    expect(msgAfter.to[0].name).toBe(newlyLockedPerson.displayName);

    const personalUnlockedPerson = await insertTestPerson('Personal Person', 'gmail.com');
    const corporateDomain = await insertTestDomain();
    const corporateUnlockedPerson = await insertTestPerson('Corporate Person', corporateDomain.name);

    const additionalRecipientList: EmailRecipient[] = [
      {name: personalUnlockedPerson.displayName || ' ', email: personalUnlockedPerson.email},
      {name: corporateUnlockedPerson.displayName || ' ', email: corporateUnlockedPerson.email},
    ];

    const additionalMsg = await generateSummaryEmail(lockedMeeting.id, additionalRecipientList);
    expect(additionalMsg.to).toHaveLength(0);
  });
});
