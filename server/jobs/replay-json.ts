import {rerunJson} from './rerun-json';

if (!process.argv[2]) throw 'eventId not provided';

const eventIds = process.argv.slice(2);

const runEventLoop = async (eventIds: string[]) => {
  const promises = eventIds.map(eventId => rerunJson(eventId));

  await Promise.all(promises);

  process.exit();
};

// eventIds.forEach(async (eventId) => {
//  rerunJson(eventId);
// });

runEventLoop(eventIds);
