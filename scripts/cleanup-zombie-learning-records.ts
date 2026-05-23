import { cleanupZombieLearningRecords } from '../backend/src/repositories/assignments.ts';

const dryRun = !process.argv.includes('--write');
const result = await cleanupZombieLearningRecords(dryRun);

console.log(JSON.stringify(result, null, 2));
if (dryRun && result.deleted > 0) {
  console.log('Dry run only. Re-run with --write to delete these zombie learning records.');
}
