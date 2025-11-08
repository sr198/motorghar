import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // CATALOG SERVICE - Seed vehicle catalog
  // ============================================================================
  console.log('📚 Seeding vehicle catalog...');

  const bike1 = await prisma.vehicleCatalog.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      make: 'Honda',
      model: 'CBR250R',
      year: 2023,
      trim: 'Standard',
      fuelType: 'Petrol',
      specsJsonb: {
        engine: '249.6cc',
        power: '26.5 HP @ 8,500 rpm',
        torque: '22.9 Nm @ 7,000 rpm',
        weight: '161 kg',
        fuelCapacity: '13 L',
      },
    },
  });

  const bike2 = await prisma.vehicleCatalog.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      make: 'Royal Enfield',
      model: 'Classic 350',
      year: 2024,
      trim: 'Chrome',
      fuelType: 'Petrol',
      specsJsonb: {
        engine: '349cc',
        power: '20.2 HP @ 6,100 rpm',
        torque: '27 Nm @ 4,000 rpm',
        weight: '195 kg',
        fuelCapacity: '13 L',
      },
    },
  });

  const car1 = await prisma.vehicleCatalog.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      make: 'Hyundai',
      model: 'Creta',
      year: 2024,
      trim: 'SX',
      fuelType: 'Petrol',
      specsJsonb: {
        engine: '1497cc',
        power: '113.4 HP @ 6,300 rpm',
        torque: '144 Nm @ 4,500 rpm',
        weight: '1,245 kg',
        fuelCapacity: '50 L',
        seating: 5,
      },
    },
  });

  console.log(`✅ Created ${bike1.make} ${bike1.model}`);
  console.log(`✅ Created ${bike2.make} ${bike2.model}`);
  console.log(`✅ Created ${car1.make} ${car1.model}`);

  // ============================================================================
  // SERVICE CENTER SERVICE - Seed service centers
  // ============================================================================
  console.log('🔧 Seeding service centers...');

  const center1 = await prisma.serviceCenter.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'BikersNepal Service Center',
      address: 'Kathmandu, Nepal',
      phone: '+977-1-4444444',
      email: 'service@bikersnepal.com',
      latitude: 27.7172,
      longitude: 85.324,
    },
  });

  const center2 = await prisma.serviceCenter.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'Royal Motors Service',
      address: 'Lalitpur, Nepal',
      phone: '+977-1-5555555',
      email: 'info@royalmotors.com.np',
      latitude: 27.6794,
      longitude: 85.324,
    },
  });

  const center3 = await prisma.serviceCenter.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      name: 'Auto Care Experts',
      address: 'Bhaktapur, Nepal',
      phone: '+977-1-6666666',
      email: 'contact@autocareexperts.com',
      latitude: 27.6717,
      longitude: 85.4298,
    },
  });

  console.log(`✅ Created ${center1.name}`);
  console.log(`✅ Created ${center2.name}`);
  console.log(`✅ Created ${center3.name}`);

  // ============================================================================
  // CONTENT SERVICE - Seed content posts
  // ============================================================================
  console.log('📰 Seeding content posts...');

  const news1 = await prisma.contentPost.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      type: 'news',
      title: 'Honda CBR250R 2023 Launch Event',
      bodyMd: `# Honda CBR250R 2023 Launch Event

Honda has officially launched the new CBR250R for 2023 in Nepal. The bike features:

- Updated styling with LED headlights
- Improved fuel efficiency
- Enhanced ride comfort
- Competitive pricing

Perfect for both city commuting and weekend rides!`,
      status: 'published',
      vehicleIds: [bike1.id],
      publishAt: new Date(),
    },
  });

  const news2 = await prisma.contentPost.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      type: 'news',
      title: 'Hyundai Creta Gets New Features for 2024',
      bodyMd: `# Hyundai Creta Gets New Features for 2024

The popular Hyundai Creta receives several updates for the 2024 model year:

- Advanced safety features
- New infotainment system
- Panoramic sunroof
- Wireless charging

Book your test drive today!`,
      status: 'published',
      vehicleIds: [car1.id],
      publishAt: new Date(),
    },
  });

  const event1 = await prisma.contentPost.upsert({
    where: { id: '00000000-0000-0000-0000-000000000203' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000203',
      type: 'event',
      title: 'Nepal Bike Festival 2024',
      bodyMd: `# Nepal Bike Festival 2024

Join us for the biggest motorcycle gathering in Nepal!

**Date:** March 15-17, 2024
**Location:** Tundikhel, Kathmandu

Features:
- Bike shows and exhibitions
- Stunt performances
- Test rides
- Accessories bazaar

Entry is free for all bike enthusiasts!`,
      status: 'published',
      vehicleIds: [bike1.id, bike2.id],
      publishAt: new Date('2024-03-01'),
    },
  });

  console.log(`✅ Created news: ${news1.title}`);
  console.log(`✅ Created news: ${news2.title}`);
  console.log(`✅ Created event: ${event1.title}`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n✅ Database seed completed successfully!');
  console.log('\nSummary:');
  console.log(`  - 3 vehicle catalog entries`);
  console.log(`  - 3 service centers`);
  console.log(`  - 3 content posts (2 news, 1 event)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });