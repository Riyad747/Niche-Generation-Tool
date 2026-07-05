import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the global Taxonomy tree — a reusable starter niche map that Mode 1
 * expansion builds on top of. Extend freely; paths are dot-delimited and unique.
 */
const TAXONOMY: Record<string, string[]> = {
  Healthcare: [
    'Telemedicine',
    'Mental Health',
    'Healthcare Icons',
    'Pediatric Care',
    'Elderly Care',
    'Medical Devices',
    'Healthcare Technology',
    'Medical Education',
  ],
  Business: ['Finance', 'Startups', 'Remote Work', 'Productivity', 'E-commerce', 'Marketing'],
  Lifestyle: ['Wellness', 'Fitness', 'Travel', 'Food', 'Home Decor', 'Sustainability'],
  Technology: ['AI', 'Cybersecurity', 'Cloud', 'IoT', 'Blockchain', 'Data Science'],
  Education: ['E-learning', 'STEM', 'Language Learning', 'Kids Education'],
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  console.log('🌱 Seeding taxonomy...');
  for (const [parent, children] of Object.entries(TAXONOMY)) {
    const parentPath = slug(parent);
    const root = await prisma.taxonomy.upsert({
      where: { path: parentPath },
      update: {},
      create: { name: parent, path: parentPath, depth: 0 },
    });
    for (const child of children) {
      const childPath = `${parentPath}.${slug(child)}`;
      await prisma.taxonomy.upsert({
        where: { path: childPath },
        update: {},
        create: { name: child, path: childPath, depth: 1, parentId: root.id },
      });
    }
  }
  const count = await prisma.taxonomy.count();
  console.log(`✅ Taxonomy seeded (${count} nodes).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
