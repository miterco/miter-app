import {
  TaskListFilterValues,
  FetchTaskListRequest,
  SummaryItemsWithContextResponse,
  TaskProgressType,
} from 'miter-common/SharedTypes';
import {fetchTasksByPerson, fetchTasksByPersonMeetings} from '../../data/notes-items/fetch-tasks-by-person';
import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import withSocketUser from '../../server-core/socket/middlewares/with-socket-user';

export const fetchTasksForUserEndpoint = socketEndpoint(
  withSocketUser,
  messageBodySchema({
    filter: Joi.string()
      .required()
      .valid(...TaskListFilterValues)
      .messages({
        'string.requried': 'fetch-tasks request requires a filter',
        'string.valid': 'Invalid filter value: {filter}',
      }),
    showCompleted: Joi.boolean()
      .messages({'boolean.base': 'While fetching tasks, got an invalid showCompleted value: {showCompleted}'})
      .default(false),
  }),
  async (request, _response) => {
    const directResponse: SummaryItemsWithContextResponse = {summaryItems: []};
    const personId = request?.user?.personId;

    if (personId) {
      const {filter, showCompleted} = request.body as Required<FetchTaskListRequest>;
      const progressType: TaskProgressType | undefined = showCompleted ? undefined : 'None';
      directResponse.summaryItems =
        filter === 'MyTasks'
          ? await fetchTasksByPerson(personId, progressType)
          : await fetchTasksByPersonMeetings(personId, progressType);
      // TODO: Some sort of validation should be done for access to the task, once we figure out what the rule should be.
    }

    return directResponse;
  }
);