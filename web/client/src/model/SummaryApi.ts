import {
  CreateSummaryItemRequest,
  UpdateSummaryItemRequest,
  EmailRecipient,
  FetchTaskListRequest,
  DeleteSummaryItemRequest,
  SendSummaryEmailRequest,
  SummaryItem,
  SummaryItemWithContext,
  TaskListFilter,
  UnsavedSummaryItem,
} from 'miter-common/SharedTypes';
import conn from '../SocketConnection';
import {validateSummaryItemsWithContextResponse} from './Validators';

export const requestAllSummaryItems = () => {
  conn.request('FetchAllSummaryItems', null);
};

export const createSummaryItem = (summaryItem: UnsavedSummaryItem, withoutMeeting?: boolean) => {
  const body: CreateSummaryItemRequest = {summaryItem, outsideOfMeeting: withoutMeeting};
  conn.request('CreateSummaryItem', body);
};

export const deleteSummaryItem = (summaryItem: SummaryItem) => {
  const body: DeleteSummaryItemRequest = {id: summaryItem.id};
  conn.request('DeleteSummaryItem', body);
};

export const editSummaryItem = (updates: UpdateSummaryItemRequest) => {
  conn.request('UpdateSummaryItem', updates);
};

export const requestRelevantPeople = () => {
  conn.request('FetchAllRelevantPeople');
};

// Throws
export const sendSummaryEmail = async (recipients: EmailRecipient[]): Promise<void> => {
  // map() is to remove fields beyond those in EmailRecipient
  const req: SendSummaryEmailRequest = {recipients: recipients.map(({name, email}) => ({name, email}))};
  await conn.requestResponse('SendSummaryEmail', req);
};

export const fetchTaskList = async (
  filter: TaskListFilter,
  showCompleted: boolean
): Promise<SummaryItemWithContext[]> => {
  const rawRes = await conn.requestResponse<FetchTaskListRequest>('FetchTaskList', {filter, showCompleted});
  const res = validateSummaryItemsWithContextResponse(rawRes);
  return res.summaryItems;
};
