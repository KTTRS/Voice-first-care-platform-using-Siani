import cron from 'node-cron';
import { taskQueue } from '../queues/taskQueue';

export function scheduleDailyCheckins() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Enqueueing daily check-ins...');
    await taskQueue.add('sendReminder', { userId: 'user-daily-001' });
  });
}
