import { Router } from 'express';
import { ZodError } from 'zod';
import { handlePrismaError } from '../utils/prismaError';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '../services/user.service';
import { authenticate } from '../utils/auth';
import { getPaginationParams } from '../utils/pagination';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { logEvent } from '../utils/logger';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { take, skip } = getPaginationParams(req.query.limit, req.query.offset);
    const users = await listUsers({ take, skip });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = createUserSchema.parse(req.body);

    const newUser = await createUser(payload);
    const actorId = (req as any).user?.id;
    logEvent('user.created', { userId: actorId, data: newUser });
    res.status(201).json(newUser);
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
      return res.status(400).json({ error: 'User id is required' });
    }

    const payload = updateUserSchema.parse(req.body);

    const updated = await updateUser(id, payload);
    const actorId = (req as any).user?.id;
    logEvent('user.updated', { userId: actorId, data: updated });
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return handlePrismaError(error, res, next, 'User not found');
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const removed = await deleteUser(id);
    const actorId = (req as any).user?.id;
    logEvent('user.deleted', { userId: actorId, data: removed });
    res.json(removed);
  } catch (error) {
    return handlePrismaError(error, res, next, 'User not found');
  }
});

export default router;
