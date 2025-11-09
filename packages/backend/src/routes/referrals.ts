import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

const createReferralSchema = z.object({
  patientId: z.string().uuid(),
  toUserId: z.string().uuid(),
  reason: z.string(),
  notes: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
});

const updateReferralSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

// Get referrals for the authenticated user
router.get('/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, type = 'received' } = req.query;

    const where: any = type === 'sent' 
      ? { fromUserId: req.user!.id }
      : { toUserId: req.user!.id };

    if (status) {
      where.status = status;
    }

    const referrals = await prisma.referral.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Get referrals for a specific patient
router.get('/patient/:patientId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Create a new referral
router.post('/', authenticate, authorize('DOCTOR', 'NURSE', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createReferralSchema.parse(req.body);

    const referral = await prisma.referral.create({
      data: {
        ...data,
        fromUserId: req.user!.id,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        fromUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(referral);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Update referral status
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateReferralSchema.parse(req.body);
    
    // Check if user is authorized to update this referral
    const existingReferral = await prisma.referral.findUnique({
      where: { id: req.params.id },
    });

    if (!existingReferral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    if (existingReferral.toUserId !== req.user!.id && 
        existingReferral.fromUserId !== req.user!.id &&
        req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = { ...data };
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        fromUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        toUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json(referral);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// Get referral analytics
router.get('/analytics/overview', authenticate, authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req: AuthRequest, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany();

    const analytics = {
      total: referrals.length,
      byStatus: {
        PENDING: referrals.filter(r => r.status === 'PENDING').length,
        ACCEPTED: referrals.filter(r => r.status === 'ACCEPTED').length,
        COMPLETED: referrals.filter(r => r.status === 'COMPLETED').length,
        CANCELLED: referrals.filter(r => r.status === 'CANCELLED').length,
      },
      byPriority: {
        critical: referrals.filter(r => r.priority >= 4).length,
        high: referrals.filter(r => r.priority === 3).length,
        medium: referrals.filter(r => r.priority === 2).length,
        low: referrals.filter(r => r.priority === 1).length,
      },
      averageCompletionTime: calculateAverageCompletionTime(referrals),
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

function calculateAverageCompletionTime(referrals: any[]): number | null {
  const completed = referrals.filter(r => r.status === 'COMPLETED' && r.completedAt);
  
  if (completed.length === 0) return null;

  const totalTime = completed.reduce((sum, r) => {
    const diff = new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime();
    return sum + diff;
  }, 0);

  return Math.round(totalTime / completed.length / (1000 * 60 * 60)); // in hours
}

export { router as referralRouter };
