import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const org = 'MakeMyLabs';
  const baseDate = new Date('2020-01-15');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hireflow.com' },
    update: {
      employeeId: 'EMP001',
      designation: 'HR Admin',
      location: 'Mumbai',
      joiningDate: baseDate,
      birthday: new Date('1985-05-10'),
      organization: org,
    },
    create: {
      name: 'Admin User',
      email: 'admin@hireflow.com',
      password: hashedPassword,
      role: Role.admin,
      department: 'HR',
      employeeId: 'EMP001',
      designation: 'HR Admin',
      location: 'Mumbai',
      joiningDate: baseDate,
      birthday: new Date('1985-05-10'),
      organization: org,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@hireflow.com' },
    update: {
      employeeId: 'EMP002',
      managerId: admin.id,
      designation: 'Engineering Manager',
      location: 'Mumbai',
      joiningDate: new Date('2019-06-01'),
      birthday: new Date('1988-11-22'),
      organization: org,
    },
    create: {
      name: 'Hiring Manager',
      email: 'manager@hireflow.com',
      password: hashedPassword,
      role: Role.manager,
      department: 'Engineering',
      employeeId: 'EMP002',
      managerId: admin.id,
      designation: 'Engineering Manager',
      location: 'Mumbai',
      joiningDate: new Date('2019-06-01'),
      birthday: new Date('1988-11-22'),
      organization: org,
    },
  });

  const interviewer1 = await prisma.user.upsert({
    where: { email: 'interviewer1@hireflow.com' },
    update: {
      employeeId: 'EMP003',
      managerId: manager.id,
      designation: 'Senior Engineer',
      location: 'Mumbai',
      joiningDate: new Date('2021-03-10'),
      birthday: new Date('1992-07-15'),
      organization: org,
    },
    create: {
      name: 'Tech Interviewer',
      email: 'interviewer1@hireflow.com',
      password: hashedPassword,
      role: Role.interviewer,
      department: 'Engineering',
      employeeId: 'EMP003',
      managerId: manager.id,
      designation: 'Senior Engineer',
      location: 'Mumbai',
      joiningDate: new Date('2021-03-10'),
      birthday: new Date('1992-07-15'),
      organization: org,
    },
  });

  const interviewer2 = await prisma.user.upsert({
    where: { email: 'interviewer2@hireflow.com' },
    update: {
      employeeId: 'EMP004',
      managerId: manager.id,
      designation: 'Engineer',
      location: 'Bangalore',
      joiningDate: new Date('2022-01-15'),
      birthday: new Date('1995-01-08'),
      organization: org,
    },
    create: {
      name: 'Panel Interviewer',
      email: 'interviewer2@hireflow.com',
      password: hashedPassword,
      role: Role.interviewer,
      department: 'Engineering',
      employeeId: 'EMP004',
      managerId: manager.id,
      designation: 'Engineer',
      location: 'Bangalore',
      joiningDate: new Date('2022-01-15'),
      birthday: new Date('1995-01-08'),
      organization: org,
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@hireflow.com' },
    update: {
      employeeId: 'EMP005',
      managerId: admin.id,
      designation: 'Recruiter',
      location: 'Mumbai',
      joiningDate: new Date('2020-08-01'),
      birthday: new Date('1990-12-01'),
      organization: org,
    },
    create: {
      name: 'Recruiter',
      email: 'recruiter@hireflow.com',
      password: hashedPassword,
      role: Role.recruiter,
      department: 'HR',
      employeeId: 'EMP005',
      managerId: admin.id,
      designation: 'Recruiter',
      location: 'Mumbai',
      joiningDate: new Date('2020-08-01'),
      birthday: new Date('1990-12-01'),
      organization: org,
    },
  });

  const adminHr = await prisma.user.upsert({
    where: { email: 'admin_hr@hireflow.com' },
    update: {
      employeeId: 'EMP006',
      managerId: admin.id,
      designation: 'HR Operations',
      location: 'Mumbai',
      joiningDate: new Date('2020-03-01'),
      birthday: new Date('1987-09-14'),
      organization: org,
    },
    create: {
      name: 'Admin HR',
      email: 'admin_hr@hireflow.com',
      password: hashedPassword,
      role: Role.admin_hr,
      department: 'HR',
      employeeId: 'EMP006',
      managerId: admin.id,
      designation: 'HR Operations',
      location: 'Mumbai',
      joiningDate: new Date('2020-03-01'),
      birthday: new Date('1987-09-14'),
      organization: org,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@hireflow.com' },
    update: {
      employeeId: 'EMP007',
      managerId: manager.id,
      designation: 'Software Engineer',
      location: 'Bangalore',
      joiningDate: new Date('2023-02-01'),
      birthday: new Date('1996-04-20'),
      organization: org,
    },
    create: {
      name: 'ESS Employee',
      email: 'employee@hireflow.com',
      password: hashedPassword,
      role: Role.employee,
      department: 'Engineering',
      employeeId: 'EMP007',
      managerId: manager.id,
      designation: 'Software Engineer',
      location: 'Bangalore',
      joiningDate: new Date('2023-02-01'),
      birthday: new Date('1996-04-20'),
      organization: org,
    },
  });

  // HRMS: Shifts, Leave types, Holidays
  let shift = await prisma.shift.findFirst();
  if (!shift) {
    shift = await prisma.shift.create({
      data: { name: 'General', inTime: '09:00', outTime: '18:00', breakMinutes: 60 },
    });
  }
  await prisma.user.updateMany({
    data: { assignedShiftId: shift.id },
    where: { assignedShiftId: null },
  });

  const leaveTypeNames = ['Casual Leave', 'Sick Leave', 'Privilege Leave', 'Bereavement Leave'];
  for (const name of leaveTypeNames) {
    const existing = await prisma.leaveType.findFirst({ where: { name } });
    if (!existing) {
      await prisma.leaveType.create({ data: { name, unit: 'days', renewsYearly: true } });
    }
  }
  const leaveTypes = await prisma.leaveType.findMany();

  const year = new Date().getFullYear();
  const holidaysToCreate = [
    { name: 'Republic Day', date: new Date(year, 0, 26), isOptional: false },
    { name: 'Holi', date: new Date(year, 2, 25), isOptional: false },
    { name: 'Independence Day', date: new Date(year, 7, 15), isOptional: false },
    { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), isOptional: false },
    { name: 'Diwali', date: new Date(year, 10, 12), isOptional: false },
  ];
  for (const h of holidaysToCreate) {
    const exists = await prisma.holiday.findFirst({ where: { name: h.name, date: h.date } });
    if (!exists) {
      await prisma.holiday.create({ data: { name: h.name, date: h.date, isOptional: h.isOptional } });
    }
  }

  // Sample leave balances for current year
  for (const u of [admin, manager, interviewer1, interviewer2, recruiter, adminHr, employeeUser]) {
    for (const lt of leaveTypes) {
      const accrued = lt.name === 'Casual Leave' ? 6 : lt.name === 'Sick Leave' ? 6 : lt.name === 'Privilege Leave' ? 32 : lt.name === 'Bereavement Leave' ? 3 : 0;
      await prisma.leaveBalance.upsert({
        where: { userId_leaveTypeId_year: { userId: u.id, leaveTypeId: lt.id, year } },
        create: { userId: u.id, leaveTypeId: lt.id, year, accrued, balance: accrued, used: 0, requested: 0 },
        update: {},
      });
    }
  }

  // Sample attendance records (last 7 days) for manager
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const clockIn = new Date(date);
    clockIn.setHours(9, 15, 0, 0);
    const clockOut = new Date(date);
    clockOut.setHours(18, 30, 0, 0);
    await prisma.attendanceRecord.upsert({
      where: { userId_date: { userId: manager.id, date } },
      create: {
        userId: manager.id,
        date,
        clockIn,
        clockOut,
        breakMinutes: 60,
        totalMinutes: 9 * 60 + 15 - 60,
        remark: 'Present',
        updatedAt: new Date(),
      },
      update: {},
    });
  }

  const candidate1 = await prisma.candidate.create({
    data: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1234567890',
      roleApplied: 'Senior Software Engineer',
      stage: 'Interview',
      status: 'active',
      createdById: recruiter.id,
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+0987654321',
      roleApplied: 'Software Engineer',
      stage: 'Interview',
      status: 'active',
      createdById: recruiter.id,
    },
  });

  await prisma.interview.createMany({
    data: [
      {
        candidateId: candidate1.id,
        interviewerId: interviewer1.id,
        roundName: 'Technical Round 1',
        scheduledAt: new Date(),
        status: 'completed',
        feedbackStatus: 'pending',
      },
      {
        candidateId: candidate1.id,
        interviewerId: interviewer2.id,
        roundName: 'Technical Round 2',
        scheduledAt: new Date(),
        status: 'completed',
        feedbackStatus: 'pending',
      },
      {
        candidateId: candidate2.id,
        interviewerId: interviewer1.id,
        roundName: 'Technical Round 1',
        scheduledAt: new Date(),
        status: 'scheduled',
        feedbackStatus: 'pending',
      },
    ],
  });

  const interviews1 = await prisma.interview.findMany({
    where: { candidateId: candidate1.id },
  });

  for (const interview of interviews1) {
    const avg = (4 + 4 + 4 + 4) / 4;
    await prisma.feedback.create({
      data: {
        interviewId: interview.id,
        scoreTechnical: 4,
        scoreCommunication: 4,
        scoreProblemSolving: 4,
        scoreCultureFit: 4,
        averageScore: avg,
        strengths: 'Strong technical skills and communication.',
        concerns: 'None significant.',
        riskLevel: 'low',
        recommendation: 'hire',
        signedOff: true,
        submittedAt: new Date(),
      },
    });
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { interview: { candidateId: candidate1.id } },
    include: { interview: true },
  });

  for (const feedback of feedbacks) {
    await prisma.interview.update({
      where: { id: feedback.interviewId },
      data: { feedbackStatus: 'submitted' },
    });
  }

  await prisma.approval.create({
    data: {
      candidateId: candidate1.id,
      managerId: manager.id,
      status: 'approved',
      approvedAt: new Date(),
    },
  });

  await prisma.offer.create({
    data: {
      candidateId: candidate1.id,
      status: 'ready',
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'Candidate',
      entityId: candidate1.id,
      action: 'CREATE',
      performedById: recruiter.id,
      metadata: { firstName: 'Jane', lastName: 'Doe' },
    },
  });

  // Phase 2/3 sample data (run after Phase 2 migration)
  try {
    const notifCount = await prisma.notification.count({ where: { userId: manager.id } });
    if (notifCount === 0) {
      await prisma.notification.create({
        data: { userId: manager.id, title: 'Welcome to HRMS', body: 'Your attendance and leave modules are now active.' },
      });
    }
    const taskCount = await prisma.task.count({ where: { userId: manager.id } });
    if (taskCount === 0) {
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() + 7);
      await prisma.task.create({
        data: { userId: manager.id, title: 'Complete Q1 goals', dueDate: taskDate, status: 'on_going', assignedById: manager.id },
      });
    }
  } catch {
    // Phase 2 tables may not exist yet
  }

  console.log('Seed completed successfully.');
  console.log('Demo users (password: Admin123!):');
  console.log('- admin@hireflow.com (Super Admin)');
  console.log('- admin_hr@hireflow.com (Admin HR)');
  console.log('- manager@hireflow.com (manager)');
  console.log('- interviewer1@hireflow.com (interviewer)');
  console.log('- interviewer2@hireflow.com (interviewer)');
  console.log('- recruiter@hireflow.com (recruiter)');
  console.log('- employee@hireflow.com (employee)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
