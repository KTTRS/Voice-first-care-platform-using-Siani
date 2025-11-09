import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.memory.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const nursePassword = await bcrypt.hash('nurse123', 10);
  const patientPassword = await bcrypt.hash('patient123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@sainte.ai',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '+1234567890',
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@sainte.ai',
      password: doctorPassword,
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      role: 'DOCTOR',
      phone: '+1234567891',
    },
  });

  const nurse = await prisma.user.create({
    data: {
      email: 'nurse@sainte.ai',
      password: nursePassword,
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'NURSE',
      phone: '+1234567892',
    },
  });

  const patientUser1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: patientPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT',
      phone: '+1234567893',
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: patientPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'PATIENT',
      phone: '+1234567894',
    },
  });

  // Create patient profiles
  const patient1 = await prisma.patient.create({
    data: {
      userId: patientUser1.id,
      dateOfBirth: new Date('1985-05-15'),
      medicalHistory: 'Hypertension, Type 2 Diabetes',
      allergies: 'Penicillin',
      currentMedications: 'Metformin 500mg, Lisinopril 10mg',
      emergencyContact: 'Mary Doe (Wife): +1234567895',
      assignedDoctorId: doctor.id,
      assignedNurseId: nurse.id,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: patientUser2.id,
      dateOfBirth: new Date('1992-08-22'),
      medicalHistory: 'Asthma',
      allergies: 'None',
      currentMedications: 'Albuterol inhaler as needed',
      emergencyContact: 'Bob Smith (Father): +1234567896',
      assignedDoctorId: doctor.id,
      assignedNurseId: nurse.id,
    },
  });

  // Create signals
  await prisma.signal.createMany({
    data: [
      {
        type: 'VITAL_SIGN',
        severity: 'MEDIUM',
        value: '145/95',
        score: 65,
        metadata: { vitalType: 'bloodPressure', unit: 'mmHg' },
        patientId: patient1.id,
        recordedById: nurse.id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        type: 'VITAL_SIGN',
        severity: 'HIGH',
        value: '38.5',
        score: 75,
        metadata: { vitalType: 'temperature', unit: 'celsius' },
        patientId: patient1.id,
        recordedById: nurse.id,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        type: 'SYMPTOM',
        severity: 'MEDIUM',
        value: 'Moderate headache and dizziness',
        score: 55,
        metadata: { painScale: 5 },
        patientId: patient1.id,
        recordedById: patientUser1.id,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        type: 'MOOD',
        severity: 'LOW',
        value: 'Feeling well today',
        score: 20,
        metadata: {},
        patientId: patient2.id,
        recordedById: patientUser2.id,
        timestamp: new Date(),
      },
    ],
  });

  // Create referrals
  await prisma.referral.createMany({
    data: [
      {
        status: 'PENDING',
        reason: 'Elevated blood pressure readings',
        notes: 'Patient needs cardiology consultation',
        priority: 3,
        patientId: patient1.id,
        fromUserId: nurse.id,
        toUserId: doctor.id,
      },
      {
        status: 'ACCEPTED',
        reason: 'Follow-up on asthma management',
        notes: 'Regular checkup scheduled',
        priority: 2,
        patientId: patient2.id,
        fromUserId: doctor.id,
        toUserId: nurse.id,
      },
    ],
  });

  // Create sample memories
  await prisma.memory.createMany({
    data: [
      {
        content: 'Patient prefers morning appointments',
        importance: 0.7,
        userId: patientUser1.id,
        conversationId: 'conv-001',
      },
      {
        content: 'Mentioned difficulty sleeping due to stress at work',
        importance: 0.8,
        userId: patientUser1.id,
        conversationId: 'conv-001',
      },
      {
        content: 'Patient is allergic to latex gloves',
        importance: 0.9,
        userId: patientUser2.id,
        conversationId: 'conv-002',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Admin: admin@sainte.ai / admin123');
  console.log('Doctor: doctor@sainte.ai / doctor123');
  console.log('Nurse: nurse@sainte.ai / nurse123');
  console.log('Patient 1: john.doe@example.com / patient123');
  console.log('Patient 2: jane.smith@example.com / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
