import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  const hashedTechPassword = await bcrypt.hash('Tech@123456', 10);
  const hashedCustomerPassword = await bcrypt.hash('Customer@123456', 10);

  // Create Admin User
  console.log('👤 Creating Admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maintenance.com' },
    update: {},
    create: {
      email: 'admin@maintenance.com',
      password: hashedPassword,
      fullName: 'مدير النظام',
      phone: '+966501234567',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✓ Admin created:', admin.email);

  // Create Technician User
  console.log('👨‍🔧 Creating Technician user...');
  const technician = await prisma.user.upsert({
    where: { email: 'tech@maintenance.com' },
    update: {},
    create: {
      email: 'tech@maintenance.com',
      password: hashedTechPassword,
      fullName: 'أحمد الفني',
      phone: '+966502345678',
      role: 'technician',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✓ Technician created:', technician.email);

  // Create Customer User
  console.log('👤 Creating Customer user...');
  const customer = await prisma.user.upsert({
    where: { email: 'customer@maintenance.com' },
    update: {},
    create: {
      email: 'customer@maintenance.com',
      password: hashedCustomerPassword,
      fullName: 'محمد العميل',
      phone: '+966503456789',
      role: 'customer',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('✓ Customer created:', customer.email);

  // Create Categories
  console.log('📁 Creating Categories...');
  const categories = [
    {
      nameEn: 'Plumbing',
      nameAr: 'السباكة',
      descriptionEn: 'All plumbing related services',
      descriptionAr: 'جميع خدمات السباكة',
      icon: 'plumbing',
    },
    {
      nameEn: 'Electrical',
      nameAr: 'الكهرباء',
      descriptionEn: 'Electrical installations and repairs',
      descriptionAr: 'التركيبات والإصلاحات الكهربائية',
      icon: 'electrical',
    },
    {
      nameEn: 'Air Conditioning',
      nameAr: 'التكييف',
      descriptionEn: 'AC installation, maintenance and repair',
      descriptionAr: 'تركيب وصيانة وإصلاح المكيفات',
      icon: 'ac',
    },
    {
      nameEn: 'Carpentry',
      nameAr: 'النجارة',
      descriptionEn: 'Furniture and woodwork services',
      descriptionAr: 'خدمات الأثاث والنجارة',
      icon: 'carpentry',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { nameEn: category.nameEn },
      update: {},
      create: category,
    });
    console.log(`✓ Category created: ${category.nameEn}`);
  }

  // Create Spare Part Categories
  console.log('🔧 Creating Spare Part Categories...');
  const sparePartCategories = [
    {
      code: 'ELEC',
      nameEn: 'Electrical Parts',
      nameAr: 'قطع كهربائية',
      description: 'Electrical components and parts',
      sortOrder: 1,
    },
    {
      code: 'PLUMB',
      nameEn: 'Plumbing Parts',
      nameAr: 'قطع سباكة',
      description: 'Plumbing components and parts',
      sortOrder: 2,
    },
    {
      code: 'AC',
      nameEn: 'AC Parts',
      nameAr: 'قطع تكييف',
      description: 'Air conditioning parts',
      sortOrder: 3,
    },
  ];

  for (const spCategory of sparePartCategories) {
    await prisma.sparePartCategory.upsert({
      where: { code: spCategory.code },
      update: {},
      create: spCategory,
    });
    console.log(`✓ Spare Part Category created: ${spCategory.nameEn}`);
  }

  // Create Suppliers
  console.log('🏢 Creating Suppliers...');
  const suppliers = [
    {
      code: 'SUP001',
      nameEn: 'Al Khaleej Trading',
      nameAr: 'تجارة الخليج',
      contactPerson: 'أحمد محمد',
      phone: '+966501111111',
      email: 'info@alkhaleej.com',
      taxNumber: 'TAX001',
    },
    {
      code: 'SUP002',
      nameEn: 'Modern Parts Co.',
      nameAr: 'شركة القطع الحديثة',
      contactPerson: 'محمد علي',
      phone: '+966502222222',
      email: 'sales@modernparts.com',
      taxNumber: 'TAX002',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: {},
      create: supplier,
    });
    console.log(`✓ Supplier created: ${supplier.nameEn}`);
  }

  // Create Sample Workshops
  console.log('🏭 Creating Workshops...');
  const workshops = [
    {
      code: 'WS001',
      nameEn: 'Expert AC Workshop',
      nameAr: 'ورشة الخبير للتكييف',
      specialization: ['ac', 'refrigeration'],
      phone: '+966503333333',
      email: 'expert@workshop.com',
      address: 'Riyadh, King Fahd Road',
      city: 'Riyadh',
      rating: 4.5,
      isActive: true,
    },
    {
      code: 'WS002',
      nameEn: 'Professional Plumbing',
      nameAr: 'السباكة المحترفة',
      specialization: ['plumbing', 'drainage'],
      phone: '+966504444444',
      email: 'pro@plumbing.com',
      address: 'Jeddah, Palestine Street',
      city: 'Jeddah',
      rating: 4.8,
      isActive: true,
    },
  ];

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { code: workshop.code },
      update: {},
      create: workshop,
    });
    console.log(`✓ Workshop created: ${workshop.nameEn}`);
  }

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin:');
  console.log('   Email: admin@maintenance.com');
  console.log('   Password: Admin@123456');
  console.log('');
  console.log('👨‍🔧 Technician:');
  console.log('   Email: tech@maintenance.com');
  console.log('   Password: Tech@123456');
  console.log('');
  console.log('👤 Customer:');
  console.log('   Email: customer@maintenance.com');
  console.log('   Password: Customer@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
