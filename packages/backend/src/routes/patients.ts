import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

const createPatientSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().transform(str => new Date(str)),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  emergencyContact: z.string().optional(),
  assignedDoctorId: z.string().uuid().optional(),
  assignedNurseId: z.string().uuid().optional(),
});

// Get all patients (admin/doctor/nurse only)
router.get('/', authenticate, authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req: AuthRequest, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedNurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedNurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        signals: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check authorization
    if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create patient profile
router.post('/', authenticate, authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createPatientSchema.parse(req.body);

    const patient = await prisma.patient.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', authenticate, authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

export { router as patientRouter };
