import {addRecurrenceToCalendarEventByGoogleId} from './add-recurrence-to-calendar-event';
import {createCalendarEvent} from './create-calendar-event';
import {v4 as uuid} from 'uuid';
import {fetchRecurringCalendarEventByGoogleId} from './fetch-recurring-calendar-event';

test('Add Recurrence to Calendar Event', async () => {
  const serviceId = uuid().toString();
  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

  const title = 'Add Recurrence Test Title';
  const goal = 'Add Recurrence Test Goal';
  const phase = 'NotStarted';

  const getTime = new Date();
  const startDate = getTime;

  getTime.setMinutes(getTime.getMinutes() + 30);
  const endDate = getTime;

  const newCalendarEvent = await createCalendarEvent({
    title,
    startDate,
    endDate,
    startTime: startDate,
    endTime: endDate,
    serviceId,
  });
  expect(newCalendarEvent.serviceId).toBe(serviceId);

  const updatedCalendarEvent = await addRecurrenceToCalendarEventByGoogleId(serviceId);
  expect(updatedCalendarEvent.serviceId).toBe(serviceId);

  const recurringCalendarEvent = await fetchRecurringCalendarEventByGoogleId(serviceId);

  expect(recurringCalendarEvent?.id).toBe(newCalendarEvent?.id);
});
