"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Bazaga dastlabki ma\'lumotlar kiritilmoqda...');
    let center = await prisma.center.findFirst();
    if (!center) {
        center = await prisma.center.create({
            data: {
                name: 'EdYuz Bosh O\'quv Markazi',
                phone: '+998712001122',
            },
        });
        console.log('✅ O\'quv markazi yaratildi:', center.name);
    }
    const adminPhone = '+998901234567';
    let admin = await prisma.user.findUnique({ where: { phone: adminPhone } });
    if (!admin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        admin = await prisma.user.create({
            data: {
                centerId: center.id,
                fullName: 'Asosiy Administrator',
                phone: adminPhone,
                passwordHash,
                role: client_1.RoleType.superadmin,
                isActive: true,
            },
        });
        console.log('✅ Superadmin yaratildi: login: +998901234567, parol: admin123');
    }
    const teacherPhone = '+998909876543';
    let teacher = await prisma.user.findUnique({ where: { phone: teacherPhone } });
    if (!teacher) {
        const passwordHash = await bcrypt.hash('teacher123', 10);
        teacher = await prisma.user.create({
            data: {
                centerId: center.id,
                fullName: 'Aziz Rahimov (O\'qituvchi)',
                phone: teacherPhone,
                passwordHash,
                role: client_1.RoleType.teacher,
                isActive: true,
            },
        });
        console.log('✅ O\'qituvchi yaratildi: login: +998909876543, parol: teacher123');
    }
    let course1 = await prisma.course.findFirst({ where: { title: 'Frontend Dasturlash (React/Next.js)' } });
    if (!course1) {
        course1 = await prisma.course.create({
            data: {
                centerId: center.id,
                title: 'Frontend Dasturlash (React/Next.js)',
                price: 600000,
            },
        });
    }
    let course2 = await prisma.course.findFirst({ where: { title: 'Backend Dasturlash (NestJS/Node.js)' } });
    if (!course2) {
        course2 = await prisma.course.create({
            data: {
                centerId: center.id,
                title: 'Backend Dasturlash (NestJS/Node.js)',
                price: 700000,
            },
        });
    }
    const studentCount = await prisma.student.count();
    if (studentCount === 0) {
        await prisma.student.createMany({
            data: [
                {
                    centerId: center.id,
                    fullName: 'Sardorbek Olimov',
                    phone: '+998911112233',
                    parentPhone: '+998901112233',
                    balance: 600000,
                },
                {
                    centerId: center.id,
                    fullName: 'Madina Karimova',
                    phone: '+998934445566',
                    parentPhone: '+998904445566',
                    balance: -200000,
                },
                {
                    centerId: center.id,
                    fullName: 'Jasur Bekmurodov',
                    phone: '+998977778899',
                    parentPhone: '+998907778899',
                    balance: 0,
                },
            ],
        });
        console.log('✅ Namunaviy o\'quvchilar qo\'shildi');
    }
    console.log('🎉 Bazani to\'ldirish muvaffaqiyatli yakunlandi!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map