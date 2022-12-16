import {
  EmailRecipient,
  Meeting,
  Note,
  SummaryItem,
  Topic,
  ItemType,
  Protocol,
  ProtocolItemType,
} from 'miter-common/SharedTypes';
import {formatDate, getEmailDomain, getGoalString} from 'miter-common/CommonUtil';
import {EmailMessage} from './email';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {fetchAllSummaryItems} from '../data/notes-items/fetch-all-summary-items';
import {fetchAllTopicsForMeeting} from '../data/topics/fetch-all-topics';
import {getLocalDateFromMidnightUTC, stripHtmlTags} from '../server-core/server-util';
import {fetchOrganizationById} from '../data/people/fetch-organization';
import {fetchAllNotes} from '../data/notes-items/fetch-all-notes';
import {fetchOrCreateMeetingTokenByMeetingId} from '../data/fetch-token';
import {ItemTypeLabels} from 'miter-common/Strings';
import {renderContentTemplate} from './content-templates';
import {fetchProtocolsByMeetingId} from '../data/protocol/fetch-protocol';
import {ProtocolSummaryStrategies} from 'miter-common/logic/protocol-summary-strategies';

export const DefaultSender: EmailRecipient = {name: 'Miter', email: 'meetings@miter.app'};
const BulletIconUrlBase = 'https://cdn.mcauto-images-production.sendgrid.net/75638682e510bcb9';
const BulletIconProtocol = `${BulletIconUrlBase}/a34c67b7-8319-4a18-9d98-a52c2ae7bb0c/40x40.png`;
const BulletIconTask = `${BulletIconUrlBase}/ea6d8c5f-5b01-4f6d-9fb9-a3624159bbbc/40x40.png`;
const BulletIconDecision = `${BulletIconUrlBase}/36a470ad-84b9-4a04-aee0-754ab821b8de/40x40.png`;
const BulletIconPin = `${BulletIconUrlBase}/bc9faa8a-1aa8-415b-a6e4-1feaf4e2f14f/40x40.png`;

const NoTopic = 'No Topic';
const SingleOutcomesHeader = 'Outcomes';
export const ItemTypeMap: Record<ItemType | 'Protocol', [number, string]> = {
  // [sort order, icon URL]
  Task: [0, BulletIconTask],
  Decision: [1, BulletIconDecision],
  Pin: [3, BulletIconPin],
  Protocol: [2, BulletIconProtocol],
  None: [4, ''],
};

export interface EmailSummaryProtocolDesc {
  type: string;
  title: string;
  caption?: string;
  items: string[];
}

export type EmailSummaryItem = {
  text: string | null | undefined;
  dueDateText: string | null | undefined;
  summaryItemType: ItemType | 'Protocol';
  itemIconUrl?: string;
  itemIconName?: string;
  protocol?: EmailSummaryProtocolDesc;
};
export type EmailSummaryContentGroup = {title: string; items: EmailSummaryItem[]};
export interface EmailSummaryValues {
  title: string | null;
  goal?: string;
  date: string;
  url: string;
  summaryItemGroups: EmailSummaryContentGroup[];
  noteGroups: EmailSummaryContentGroup[];
}

/*
 * Given a list of summary items or notes and a list of topics (with an understanding that these all correspond to a
 * single meeting), (a) group by topic, and (b) convert to the text we'll need for the email.
 */
const groupByTopicAndGetEmailContent = (
  things: (SummaryItem | Note)[],
  topics: Topic[]
): EmailSummaryContentGroup[] => {
  const content: Record<string, EmailSummaryContentGroup> = {};
  const topicMap: Record<string, string> = {};
  topics.forEach(topic => (topicMap[topic.id] = topic.text));
  things.forEach(thing => {
    const key = thing.topicId || NoTopic;
    if (!content[key]) content[key] = {title: topicMap[key] || NoTopic, items: []};
    const itemType = thing.protocolId ? 'Protocol' : thing.itemType;
    const itemIconName = thing.protocolId
      ? 'Protocol'
      : thing.itemType
      ? ItemTypeLabels[thing.itemType].Singular
      : undefined;

    const {protocol} = thing as SummaryItem;

    const protocolTypeName = protocol?.type?.name || '';
    const summarizeProtocolItems = ProtocolSummaryStrategies[protocolTypeName] || ProtocolSummaryStrategies.Default;

    const groups = [];
    const ungroupedItems = [];

    if (protocol) {
      const filteredProtocolItems = summarizeProtocolItems(protocol.items);

      for (const item of filteredProtocolItems) {
        if (item.type === ProtocolItemType.Group) {
          const groupItemCount = filteredProtocolItems.filter(({parentId}) => parentId === item.id).length;
          const ideasLabel = groupItemCount > 1 ? 'ideas' : 'idea';
          groups.push(`${item.text} (${groupItemCount} ${ideasLabel})`);
        } else if (item.parentId === null) {
          ungroupedItems.push(item.text);
        }
      }
    }

    const protocolDesc: EmailSummaryProtocolDesc | undefined = protocol
      ? {
          type: protocol.type.name,
          title: protocol.title,
          items: [...groups, ...ungroupedItems],
        }
      : undefined;

    content[key].items.push({
      text: stripHtmlTags(thing.itemText),
      dueDateText: generateDueDateText(thing),
      summaryItemType: itemType || 'None',
      itemIconUrl: itemType ? ItemTypeMap[itemType][1] : undefined,
      itemIconName,
      protocol: protocolDesc,
    });
  });
  return Object.values(content);
};

/*
 * Given a meeting, generate the subject line for the summary email.
 */
const generateSummaryEmailSubject = (meeting: Meeting): string => {
  const startDate = meeting.startDatetime;
  const formatter = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium'});
  const dateStr = startDate ? `- ${formatter.format(startDate)}` : '';
  return `Summary: ${meeting.title || 'Untitled Meeting'} ${dateStr}`;
};

/*
 * Given a summary item or note, generate text for the due date, if and only if it's a Task.
 */
const generateDueDateText = (item: SummaryItem | Note) =>
  item.itemType === 'Task' && item.targetDate ? formatDate(getLocalDateFromMidnightUTC(item.targetDate)) : undefined;

/*
 * Run the template values for a summary email through the template.
 */
export const renderSummaryEmailTemplate = async (values: EmailSummaryValues) =>
  await renderContentTemplate('summary-email', values, ['summary-email-protocol']);

/*
 * Generate all content for a summary email, given a Meeting.
 */
const generateSummaryEmailContent = async (meeting: Meeting): Promise<string> => {
  const protocols: Protocol[] = await fetchProtocolsByMeetingId(meeting.id);
  const protocolsMap = protocols.reduce((acc, protocol) => {
    acc[protocol.id!] = protocol;
    return acc;
  }, {} as Record<string, Protocol>);
  const bareSummaryItems: SummaryItem[] = await fetchAllSummaryItems(meeting.id);
  const summaryItems = bareSummaryItems.map(item => {
    if (item.protocolId) {
      return {
        ...item,
        protocol: protocolsMap[item.protocolId],
      };
    }
    return item;
  });
  const notes: Note[] = await fetchAllNotes(meeting.id, true);
  const topics = await fetchAllTopicsForMeeting(meeting.id);
  const token = await fetchOrCreateMeetingTokenByMeetingId(meeting.id);
  const url = `${process.env.HOST || 'https://app.miter.co'}/app/m/${token.value}`;
  const dateStr = formatDate(meeting.startDatetime);

  const summaryItemGroups = groupByTopicAndGetEmailContent(summaryItems, topics);
  if (summaryItemGroups.length === 1) summaryItemGroups[0].title = SingleOutcomesHeader;

  // Sort summary items by type
  summaryItemGroups.forEach(group =>
    group.items.sort((a, b) => {
      if (a.summaryItemType === b.summaryItemType) return 0;
      return ItemTypeMap[a.summaryItemType][0] > ItemTypeMap[b.summaryItemType][0] ? 1 : -1;
    })
  );

  const noteGroups = groupByTopicAndGetEmailContent(notes, topics);
  if (noteGroups.length === 1) noteGroups[0].title = '';

  const values: EmailSummaryValues = {
    summaryItemGroups,
    noteGroups,
    title: meeting.title,
    goal: getGoalString(meeting.goal),
    date: dateStr,
    url,
  };

  return await renderSummaryEmailTemplate(values);
};

const removeUnauthorizedRecipients = async (
  meeting: Meeting,
  candidateRecipients: EmailRecipient[]
): Promise<EmailRecipient[]> => {
  if (meeting.organizationId) {
    const organization = await fetchOrganizationById(meeting.organizationId);
    const validDomains = new Set(organization.domain.map(domainRow => domainRow.name));
    return candidateRecipients.filter(candidate => validDomains.has(getEmailDomain(candidate.email)));
  } else return candidateRecipients;
};

export const generateSummaryEmail = async (meetingId: string, recipients: EmailRecipient[]): Promise<EmailMessage> => {
  const meeting = await fetchMeeting(meetingId);

  const to = await removeUnauthorizedRecipients(meeting, recipients);

  return {
    to,
    from: DefaultSender,
    subject: generateSummaryEmailSubject(meeting),
    html: await generateSummaryEmailContent(meeting),
    width: 720,
  };
};
