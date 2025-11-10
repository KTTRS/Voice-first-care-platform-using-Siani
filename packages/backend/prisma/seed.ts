import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (in correct order due to foreign keys)
  await prisma.dailyAction.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.memoryMoment.deleteMany();
  await prisma.referralLoop.deleteMany();
  await prisma.signalEvent.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const doctorPassword = await bcrypt.hash("doctor123", 10);
  const nursePassword = await bcrypt.hash("nurse123", 10);
  const patientPassword = await bcrypt.hash("patient123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@sainte.ai",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      phone: "+1234567890",
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: "doctor@sainte.ai",
      password: doctorPassword,
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      role: "DOCTOR",
      phone: "+1234567891",
    },
  });

  const nurse = await prisma.user.create({
    data: {
      email: "nurse@sainte.ai",
      password: nursePassword,
      firstName: "Emily",
      lastName: "Davis",
      role: "NURSE",
      phone: "+1234567892",
    },
  });

  const patientUser1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      password: patientPassword,
      firstName: "John",
      lastName: "Doe",
      role: "PATIENT",
      phone: "+1234567893",
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      password: patientPassword,
      firstName: "Jane",
      lastName: "Smith",
      role: "PATIENT",
      phone: "+1234567894",
    },
  });

  // Create patient profiles
  const patient1 = await prisma.patient.create({
    data: {
      userId: patientUser1.id,
      dateOfBirth: new Date("1985-05-15"),
      medicalHistory: "Hypertension, Type 2 Diabetes",
      allergies: "Penicillin",
      currentMedications: "Metformin 500mg, Lisinopril 10mg",
      emergencyContact: "Mary Doe (Wife): +1234567895",
      assignedDoctorId: doctor.id,
      assignedNurseId: nurse.id,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: patientUser2.id,
      dateOfBirth: new Date("1992-08-22"),
      medicalHistory: "Asthma",
      allergies: "None",
      currentMedications: "Albuterol inhaler as needed",
      emergencyContact: "Bob Smith (Father): +1234567896",
      assignedDoctorId: doctor.id,
      assignedNurseId: nurse.id,
    },
  });

  // Create signals
  await prisma.signal.createMany({
    data: [
      {
        type: "VITAL_SIGN",
        severity: "MEDIUM",
        value: "145/95",
        score: 65,
        metadata: { vitalType: "bloodPressure", unit: "mmHg" },
        patientId: patient1.id,
        recordedById: nurse.id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        type: "VITAL_SIGN",
        severity: "HIGH",
        value: "38.5",
        score: 75,
        metadata: { vitalType: "temperature", unit: "celsius" },
        patientId: patient1.id,
        recordedById: nurse.id,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        type: "SYMPTOM",
        severity: "MEDIUM",
        value: "Moderate headache and dizziness",
        score: 55,
        metadata: { painScale: 5 },
        patientId: patient1.id,
        recordedById: patientUser1.id,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
      {
        type: "MOOD",
        severity: "LOW",
        value: "Feeling well today",
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
        status: "PENDING",
        reason: "Elevated blood pressure readings",
        notes: "Patient needs cardiology consultation",
        priority: 3,
        patientId: patient1.id,
        fromUserId: nurse.id,
        toUserId: doctor.id,
      },
      {
        status: "ACCEPTED",
        reason: "Follow-up on asthma management",
        notes: "Regular checkup scheduled",
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
        content: "Patient prefers morning appointments",
        importance: 0.7,
        userId: patientUser1.id,
        conversationId: "conv-001",
      },
      {
        content: "Mentioned difficulty sleeping due to stress at work",
        importance: 0.8,
        userId: patientUser1.id,
        conversationId: "conv-001",
      },
      {
        content: "Patient is allergic to latex gloves",
        importance: 0.9,
        userId: patientUser2.id,
        conversationId: "conv-002",
      },
    ],
  });

  // Create goals
  const goal1 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Walk 10,000 steps daily",
      points: 100,
      isActive: true,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Monitor blood pressure twice daily",
      points: 150,
      isActive: true,
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Practice breathing exercises",
      points: 75,
      isActive: true,
    },
  });

  const goal4 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Complete asthma action plan",
      points: 200,
      isActive: false,
    },
  });

  const goal5 = await prisma.goal.create({
    data: {
      userId: admin.id,
      title: "Review monthly health reports",
      points: 50,
      isActive: true,
    },
  });

  // Additional diverse goals
  const goal6 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Drink 8 glasses of water daily",
      points: 80,
      isActive: true,
    },
  });

  const goal7 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Get 7-8 hours of sleep",
      points: 120,
      isActive: true,
    },
  });

  const goal8 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Meditate for 15 minutes daily",
      points: 90,
      isActive: true,
    },
  });

  const goal9 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Take medications on time",
      points: 150,
      isActive: true,
    },
  });

  const goal10 = await prisma.goal.create({
    data: {
      userId: doctor.id,
      title: "Complete patient charts",
      points: 100,
      isActive: true,
    },
  });

  const goal11 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Avoid sugary drinks",
      points: 60,
      isActive: true,
    },
  });

  const goal12 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Practice yoga 3x per week",
      points: 100,
      isActive: false,
    },
  });

  const goal13 = await prisma.goal.create({
    data: {
      userId: nurse.id,
      title: "Complete continuing education course",
      points: 200,
      isActive: true,
    },
  });

  const goal14 = await prisma.goal.create({
    data: {
      userId: patientUser1.id,
      title: "Track daily calorie intake",
      points: 70,
      isActive: true,
    },
  });

  const goal15 = await prisma.goal.create({
    data: {
      userId: patientUser2.id,
      title: "Reduce screen time before bed",
      points: 50,
      isActive: true,
    },
  });

  // Create daily actions linked to goals
  await prisma.dailyAction.createMany({
    data: [
      {
        userId: patientUser1.id,
        goalId: goal1.id,
        content: "Morning walk - 5,000 steps",
        points: 50,
        completed: true,
      },
      {
        userId: patientUser1.id,
        goalId: goal1.id,
        content: "Evening walk - 5,000 steps",
        points: 50,
        completed: false,
      },
      {
        userId: patientUser1.id,
        goalId: goal2.id,
        content: "Morning BP check",
        points: 75,
        completed: true,
      },
      {
        userId: patientUser1.id,
        goalId: goal2.id,
        content: "Evening BP check",
        points: 75,
        completed: false,
      },
      {
        userId: patientUser2.id,
        goalId: goal3.id,
        content: "10-minute breathing session",
        points: 75,
        completed: false,
      },
      // Additional daily actions for new goals
      {
        userId: patientUser1.id,
        goalId: goal6.id,
        content: "Drink 2 glasses with breakfast",
        points: 20,
        completed: true,
      },
      {
        userId: patientUser1.id,
        goalId: goal6.id,
        content: "Drink 2 glasses with lunch",
        points: 20,
        completed: true,
      },
      {
        userId: patientUser1.id,
        goalId: goal6.id,
        content: "Drink 2 glasses with dinner",
        points: 20,
        completed: false,
      },
      {
        userId: patientUser1.id,
        goalId: goal7.id,
        content: "Set bedtime alarm for 10:30 PM",
        points: 60,
        completed: true,
      },
      {
        userId: patientUser2.id,
        goalId: goal8.id,
        content: "Morning meditation session",
        points: 90,
        completed: true,
      },
      {
        userId: patientUser2.id,
        goalId: goal9.id,
        content: "Take morning medication",
        points: 75,
        completed: true,
      },
      {
        userId: patientUser2.id,
        goalId: goal9.id,
        content: "Take evening medication",
        points: 75,
        completed: false,
      },
      {
        userId: patientUser1.id,
        goalId: goal14.id,
        content: "Log breakfast calories",
        points: 25,
        completed: true,
      },
    ],
  });

  // Create memory moments
  await prisma.memoryMoment.createMany({
    data: [
      {
        userId: patientUser1.id,
        content:
          "Felt great after morning walk today! Energy levels were high.",
        emotion: "happy",
        tone: "positive",
        vectorId: "vec-001",
      },
      {
        userId: patientUser1.id,
        content: "Had some stress at work but managed to stay calm.",
        emotion: "neutral",
        tone: "reflective",
        vectorId: "vec-002",
      },
      {
        userId: patientUser2.id,
        content: "Breathing exercises really helped during my anxiety moment.",
        emotion: "relieved",
        tone: "grateful",
        vectorId: "vec-003",
      },
      {
        userId: patientUser2.id,
        content: "Weather triggered my asthma today, used inhaler twice.",
        emotion: "concerned",
        tone: "informative",
        vectorId: "vec-004",
      },
      {
        userId: admin.id,
        content:
          "Platform is helping patients track their health better than expected.",
        emotion: "satisfied",
        tone: "professional",
        vectorId: "vec-005",
      },
      // Additional memory moments
      {
        userId: patientUser1.id,
        content:
          "Reached my water intake goal today! Feeling more hydrated and energetic.",
        emotion: "proud",
        tone: "positive",
        vectorId: "vec-006",
      },
      {
        userId: patientUser1.id,
        content:
          "Struggled to fall asleep last night. Maybe too much screen time before bed.",
        emotion: "frustrated",
        tone: "reflective",
        vectorId: "vec-007",
      },
      {
        userId: patientUser2.id,
        content:
          "Meditation this morning was peaceful. Noticed my anxiety levels dropping.",
        emotion: "calm",
        tone: "grateful",
        vectorId: "vec-008",
      },
      {
        userId: patientUser2.id,
        content:
          "Remembered to take both medications on time today. Getting better at the routine.",
        emotion: "accomplished",
        tone: "positive",
        vectorId: "vec-009",
      },
      {
        userId: doctor.id,
        content:
          "Had a productive meeting with patient about their blood pressure management plan.",
        emotion: "satisfied",
        tone: "professional",
        vectorId: "vec-010",
      },
      {
        userId: patientUser1.id,
        content:
          "Avoided soda at lunch today even though I was tempted. Small victories!",
        emotion: "proud",
        tone: "encouraging",
        vectorId: "vec-011",
      },
      {
        userId: nurse.id,
        content:
          "Completed module 2 of the continuing education course. Learning a lot about patient engagement.",
        emotion: "motivated",
        tone: "professional",
        vectorId: "vec-012",
      },
      {
        userId: patientUser1.id,
        content:
          "Tracked my calories for the entire day. It's eye-opening to see the numbers!",
        emotion: "surprised",
        tone: "informative",
        vectorId: "vec-013",
      },
      {
        userId: patientUser2.id,
        content:
          "Reduced screen time before bed by reading a book instead. Slept much better.",
        emotion: "happy",
        tone: "positive",
        vectorId: "vec-014",
      },
      {
        userId: patientUser1.id,
        content:
          "Had a minor setback with my step goal but planning to catch up tomorrow.",
        emotion: "determined",
        tone: "motivational",
        vectorId: "vec-015",
      },
    ],
  });

  // Create referral loops
  await prisma.referralLoop.createMany({
    data: [
      {
        userId: patientUser1.id,
        resource: "Cardiology Specialist",
        status: "pending",
      },
      {
        userId: patientUser2.id,
        resource: "Pulmonologist",
        status: "completed",
      },
    ],
  });

  // Create signal events
  await prisma.signalEvent.createMany({
    data: [
      {
        userId: patientUser1.id,
        type: "blood_pressure_spike",
        delta: 15.5,
      },
      {
        userId: patientUser1.id,
        type: "temperature_elevated",
        delta: 1.2,
      },
      {
        userId: patientUser2.id,
        type: "asthma_trigger",
        delta: -5.0,
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📝 Test credentials:");
  console.log("Admin: admin@sainte.ai / admin123");
  console.log("Doctor: doctor@sainte.ai / doctor123");
  console.log("Nurse: nurse@sainte.ai / nurse123");
  console.log("Patient 1: john.doe@example.com / patient123");
  console.log("Patient 2: jane.smith@example.com / patient123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
