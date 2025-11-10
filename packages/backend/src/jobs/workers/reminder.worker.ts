import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

new Worker(
  'reminders',
  async (job) => {
    console.log('[Worker] Processing reminder job:', job.name, job.data);
  },
  { connection },
).on('failed', (job, err) => {
  console.error('[Worker] Reminder job failed', job?.id, err);
});
