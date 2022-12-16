import {fetchBulkCalendarEventsByServiceId} from './fetch-bulk-calendar-events';

const serviceIds = [
  'fake98s7ewfn98s478e48797e84897ve9s8975nes45789es589nes9ns98',
  '98ef77e9g5e95978esr5789esr987s9r785798rs5978r57e59sr78h5ve7rs8',
];

test('fetchBulkCalendarEvents', async () => {
  const calendarEvents = await fetchBulkCalendarEventsByServiceId(serviceIds);

  expect(calendarEvents).toHaveLength(2);
});
