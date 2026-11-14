import { ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service';

// Takroriy ism tekshiruvi: bir markazda bir xil ism-familiya ikkinchi marta qo'shilmasligi kerak
describe('StudentsService — takroriy ism', () => {
  const makePrisma = (existing: any) => ({
    center: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
    student: {
      findFirst: jest.fn().mockResolvedValue(existing),
      findUnique: jest.fn().mockResolvedValue({ id: 's1', centerId: 'c1', fullName: 'Ali Valiyev' }),
      create: jest.fn().mockResolvedValue({ id: 'new' }),
      update: jest.fn().mockResolvedValue({ id: 's1' }),
    },
    payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    studentBackup: { upsert: jest.fn() },
  });

  it("bir xil ismda 409 qaytaradi va yozmaydi", async () => {
    const prisma = makePrisma({ status: 'active' });
    const svc = new StudentsService(prisma as any);
    await expect(
      svc.create({ centerId: 'c1', fullName: '  ali   VALIYEV ', parentPhone: '+998901234567' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ centerId: 'c1', fullName: { equals: 'ali VALIYEV', mode: 'insensitive' } }),
      }),
    );
    expect(prisma.student.create).not.toHaveBeenCalled();
  });

  it("yangi ismni qo'shadi", async () => {
    const prisma = makePrisma(null);
    const svc = new StudentsService(prisma as any);
    jest.spyOn(svc, 'backup').mockResolvedValue(undefined);
    await expect(
      svc.create({ centerId: 'c1', fullName: 'Ali Valiyev', parentPhone: '+998901234567' } as any),
    ).resolves.toEqual({ id: 'new' });
  });

  it("tahrirda ism o'zgarmasa tekshirmaydi", async () => {
    const prisma = makePrisma({ status: 'active' });
    const svc = new StudentsService(prisma as any);
    jest.spyOn(svc, 'findOne').mockResolvedValue({ id: 's1', centerId: 'c1', fullName: 'Ali Valiyev' } as any);
    jest.spyOn(svc, 'backup').mockResolvedValue(undefined);
    await svc.update('s1', { fullName: 'ali valiyev', notes: 'x' } as any);
    expect(prisma.student.findFirst).not.toHaveBeenCalled();
  });
});
