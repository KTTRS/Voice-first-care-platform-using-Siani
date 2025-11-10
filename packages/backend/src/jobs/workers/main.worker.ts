import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

new Worker(
  'tasks',
  async (job) => {
    console.log(`[Worker] Running job ${job.name}:`, job.data);

    switch (job.name) {
      case 'sendReminder':
        console.log(`Reminder → user ${job.data.userId}`);
        break;
      default:
        console.warn('Unknown job type:', job.name);
    }
  },
  { connection },
);
