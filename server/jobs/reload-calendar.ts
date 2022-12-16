import {fetchUserByLoginEmail} from '../data/people/fetch-user';
import {renewSyncToken} from '../google-apis/google-calendar';
import {UserRecord} from '../server-core/server-types';

if (!process.argv[2]) throw 'userId not provided';

const loginEmails = process.argv.slice(2);

const runEventLoop = async (loginEmails: string[]) => {
  const users: UserRecord[] = [];

  for (let i = 0; i < loginEmails.length; i++) {
    const fetchedUser = await fetchUserByLoginEmail(loginEmails[i]);
    if (fetchedUser?.id) users.push(fetchedUser);
    else console.log(`Email Address: ${loginEmails[i]} not found.`);
  }

  const promises = users.map(user => renewSyncToken(user));

  await Promise.all(promises);

  process.exit();
};

runEventLoop(loginEmails);
