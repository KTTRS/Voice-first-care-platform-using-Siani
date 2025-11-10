import express from 'express';
import { logEvent } from '../utils/logger';

const router = express.Router();

router.post('/:source', express.json(), async (req, res) => {
  const { source } = req.params;
  const body = req.body;

  logEvent('webhook.received', { source, body });

  res.status(200).json({ status: 'ok' });
});

export default router;
