import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../utils/db";
import { authenticate } from "../utils/auth";

const router = Router();

const createPatientSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  emergencyContact: z.string().optional(),
  assignedDoctorId: z.string().uuid().optional(),
  assignedNurseId: z.string().uuid().optional(),
});

// Get all patients (admin/doctor/nurse only)
router.get("/", authenticate, async (req: any, res: Response) => {
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
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// Get patient by ID
router.get("/:id", authenticate, async (req: any, res: Response) => {
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
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// Create patient profile
router.post("/", authenticate, async (req: any, res: Response) => {
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
    console.error("Error creating patient:", error);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

// Update patient
router.put("/:id", authenticate, async (req: any, res: Response) => {
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
    console.error("Error updating patient:", error);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

export { router as patientRouter };
