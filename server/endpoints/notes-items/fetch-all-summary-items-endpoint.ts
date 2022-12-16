import { SummaryItemsResponse } from "miter-common/SharedTypes";
import { fetchAllSummaryItems } from "../../data/notes-items/fetch-all-summary-items";
import { Endpoint } from "../../server-core/socket-server";

export const fetchAllSummaryItemsEndpoint: Endpoint = async (server, client) => {
  // TODO possible race condition here
  const meetingId = server.getExistingChannel(client);
  const items = await fetchAllSummaryItems(meetingId);
  if (!items) throw new Error(`Unable to retrieve summary items for meeting ${meetingId}`);
  const res: SummaryItemsResponse = { summaryItems: items };
  server.send(client, 'AllSummaryItems', res);
};

