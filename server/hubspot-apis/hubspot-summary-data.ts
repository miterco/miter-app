import {BatchInputSimplePublicObjectBatchInput} from '@hubspot/api-client/lib/codegen/crm/contacts/api';
import {getPrismaClient} from '../data/prisma-client';
import {getHubspotClient} from './hubspot-client';

const hubspotChunkSize = 10;

type HubspotSummaryData = {
  id: string;
  properties: {
    miter_user_id: string;
    number_of_notes_authored: string;
    number_of_topics_authored: string;
    number_of_summary_items_pinned: string;
    number_of_tasks_owned: string;
    number_of_meetings_attended: string;
    number_of_meetings_with_goals: string;
    number_of_meetings_with_summaries: string;
    google_is_active: string;
    zoom_is_active: string;
  };
};

export const populateHubspotSummaryData = async () => {
  const prisma = getPrismaClient();
  const hubspot = await getHubspotClient();

  const result = await prisma.hubspotSummary.findMany({
    where: {},
  });

  const summaryCore: HubspotSummaryData[] = result.map(resultRow => {
    return {
      id: resultRow.hubspot_id || '',
      properties: {
        miter_user_id: resultRow.miter_user_id || '',
        zoom_is_active: resultRow.zoom_is_active ? 'true' : 'false',
        google_is_active: resultRow.google_is_active ? 'true' : 'false',
        number_of_notes_authored: resultRow.number_of_notes_authored.toString(),
        number_of_topics_authored: resultRow.number_of_topics_authored.toString(),
        number_of_summary_items_pinned: resultRow.number_of_summary_items_pinned.toString(),
        number_of_tasks_owned: resultRow.number_of_tasks_owned.toString(),
        number_of_meetings_attended: resultRow.number_of_meetings_attended.toString(),
        number_of_meetings_with_goals: resultRow.number_of_meetings_with_goals.toString(),
        number_of_meetings_with_summaries: resultRow.number_of_meetings_with_summaries.toString(),
      },
    };
  });

  try {
    for (let i = 0; i < summaryCore.length; i += hubspotChunkSize) {
      const apiInput: BatchInputSimplePublicObjectBatchInput = {
        inputs: summaryCore.slice(i, i + hubspotChunkSize),
      };
      const _hsResponse = await hubspot.crm.contacts.batchApi.update(apiInput);
    }
  } catch (err) {
    console.log(err);
    throw err;
  }

  return summaryCore;
};
