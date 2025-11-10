import { Router } from 'express';
import { ZodError } from 'zod';
import {
  createSignalEvent,
  deleteSignalEvent,
  getSignalEventById,
  listSignalEvents,
  updateSignalEvent,
} from '../services/signalEvent.service';
import { handlePrismaError } from '../utils/prismaError';
import { authenticate } from '../utils/auth';
import { getPaginationParams } from '../utils/pagination';
import {
  createSignalEventSchema,
  updateSignalEventSchema,
} from '../validators/signalEvent.validator';
import { logEvent } from '../utils/logger';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(req.query.limit, req.query.offset);
    const events = await listSignalEvents({ take, skip });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'SignalEvent id is required' });
    }

    const event = await getSignalEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'SignalEvent not found' });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = createSignalEventSchema.parse(req.body);

    const event = await createSignalEvent(payload);
    const actorId = (req as any).user?.id;
    logEvent('signalEvent.created', { userId: actorId, data: event });

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'SignalEvent id is required' });
    }

    const payload = updateSignalEventSchema.parse(req.body);

    const event = await updateSignalEvent(id, payload);
    const actorId = (req as any).user?.id;
    logEvent('signalEvent.updated', { userId: actorId, data: event });
    res.json(event);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, 'SignalEvent not found');
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'SignalEvent id is required' });
    }

    const event = await deleteSignalEvent(id);
    const actorId = (req as any).user?.id;
    logEvent('signalEvent.deleted', { userId: actorId, data: event });
    res.json(event);
  } catch (error) {
    return handlePrismaError(error, res, next, 'SignalEvent not found');
  }
});

export default router;
