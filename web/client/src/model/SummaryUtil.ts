import {formatDate, getGoalString} from 'miter-common/CommonUtil';
import {ProtocolSummaryStrategies} from 'miter-common/logic/protocol-summary-strategies';
import {ItemType, Meeting, Protocol, SummaryItem} from 'miter-common/SharedTypes';
import {DefaultGoalStringPastTense, ItemTypeLabels, StrProtocols, SummaryListEmpties} from 'miter-common/Strings';
import {getUrl} from '../Utils';
import {ProtocolMap} from './ProtocolContextProvider';

// Big ol' TODO: Refactor this using Mustache, and maybe turn into a hook or something so we can use context providers.

const MiterTagline = 'Run better meetings.';
const MissingDynamicError = 'This meeting used a dynamic but we encountered an error while looking it up.';

const renderProtocolHtml = (protocol: Protocol) => {
  const protocolTypeName = protocol.type?.name || StrProtocols.Protocol;
  const summarizeProtocolItems = ProtocolSummaryStrategies[protocolTypeName] || ProtocolSummaryStrategies.Default;
  const protocolItems = summarizeProtocolItems(protocol.items || []);

  return `<li><strong>${protocolTypeName}</strong> ${protocol.title}
      <ul>
        ${protocolItems.map(item => `<li>${item.text}</li>`).join('')}
      </ul>
    </li>`;
};

const renderProtocolMarkdown = (protocol: Protocol) => {
  const protocolTypeName = protocol.type?.name || StrProtocols.Protocol;
  const summarizeProtocolItems = ProtocolSummaryStrategies[protocolTypeName] || ProtocolSummaryStrategies.Default;
  const protocolItems = summarizeProtocolItems(protocol.items || []);
  return `- **${protocol.type?.name}** ${protocol.title}${protocolItems.map(item => `\n   - ${item.text}`).join('')}`;
};

const renderItem = (item: SummaryItem, isHtml: boolean, protocols: ProtocolMap) => {
  if (item.protocolId) {
    const protocol = protocols[item.protocolId];
    if (protocol) return isHtml ? renderProtocolHtml(protocol) : renderProtocolMarkdown(protocol);
    else {
      return isHtml
        ? `<li><em><strong>Error: </strong> ${MissingDynamicError}</em></li>`
        : `- *Error: ${MissingDynamicError}*`;
    }
  } else {
    return isHtml ? `<li>${item.itemText}</li>` : `- ${item.itemText}`;
  }
};

const makeBullets = (allItems: SummaryItem[], type: ItemType, format: string, protocols: ProtocolMap) => {
  const itemsOfType = allItems.filter(item => item.itemType === type) || [];
  const isHtml = format === 'html';
  if (!itemsOfType.length) return isHtml ? `<p><em>${SummaryListEmpties[type]}</em></p>` : SummaryListEmpties[type];
  let result = `${itemsOfType.map(item => renderItem(item, isHtml, protocols)).join('\n')}\n`;
  if (isHtml) result = `<ul>${result}</ul>`;
  return result;
};

export const getSummaryMarkdown = (meeting: Meeting | null, items: SummaryItem[] | null, protocols: ProtocolMap) => {
  if (!(meeting && items)) return null;
  return `${
    `#### ${formatDate(meeting.startDatetime).toUpperCase()}\n` +
    `# Summary: ${meeting.title}\n` +
    `## Goal: ${getGoalString(meeting.goal) || DefaultGoalStringPastTense}\n` +
    `\n### ${ItemTypeLabels.Decision.Plural}\n`
  }${makeBullets(items, 'Decision', 'markdown', protocols)}\n### ${ItemTypeLabels.Task.Plural}\n${makeBullets(
    items,
    'Task',
    'markdown',
    protocols
  )}\n### ${ItemTypeLabels.Pin.Plural}\n${makeBullets(
    items,
    'Pin',
    'markdown',
    protocols
  )}\n*[Open in Miter](${getUrl()}) - ${MiterTagline}*`;
};

export const getSummaryHtml = (meeting: Meeting | null, items: SummaryItem[] | null, protocols: ProtocolMap) => {
  if (!(meeting && items)) return null;
  return `
      <h3>${formatDate(meeting.startDatetime).toUpperCase()}</h3>
      <h1>${meeting.title}</h1>
      <h2>Goal: ${getGoalString(meeting.goal) || DefaultGoalStringPastTense}</h2>
      <h3>${ItemTypeLabels.Decision.Plural}</h3>
      ${makeBullets(items, 'Decision', 'html', protocols)}
      <h3>${ItemTypeLabels.Task.Plural}</h3>
      ${makeBullets(items, 'Task', 'html', protocols)}
      <h3>${ItemTypeLabels.Pin.Plural}</h3>
      ${makeBullets(items, 'Pin', 'html', protocols)}
      <p><em><a href="${getUrl()}">Open in Miter</a> - ${MiterTagline}</em></p>
    `;
};
