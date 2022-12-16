import {mergeOrganizations} from '../data/people/merge-organizations';

const runProcess = async () => {
  console.log('Beginning Merging Organizations');

  const primaryId = process.argv[2];
  if (!primaryId) throw new Error('Primary Organization Id not provided');
  console.log(`Merge Organizations: ${primaryId}`);

  const mergingId = process.argv[2];
  if (!mergingId) throw new Error('Merging Organization Id not provided');
  console.log(`Merge Organizations: ${mergingId}`);

  await mergeOrganizations(primaryId, mergingId);

  process.exit();
};

runProcess();
