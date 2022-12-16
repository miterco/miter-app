import {createCalendarEvent} from './create-calendar-event';
import {v4 as uuid} from 'uuid';

test('createCalendarEvent', async () => {
  const serviceId = uuid().toString();
  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

  const title = 'createCalendarEvent Test Title';

  const getTime = new Date();
  const startTime = getTime;

  getTime.setMinutes(getTime.getMinutes() + 30);
  const endTime = getTime;

  const newCalendarEvent = await createCalendarEvent({
    title,
    startDate: null,
    endDate: null,
    startTime,
    endTime,
    serviceId,
  });

  expect(newCalendarEvent?.title).toBe(title);
  expect(newCalendarEvent?.startTime?.toString()).toBe(startTime.toString());
  expect(newCalendarEvent?.endTime?.toString()).toBe(endTime.toString());
});
