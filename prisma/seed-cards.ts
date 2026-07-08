import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cards = [
    {
      name: 'Carte Orange 500F',
      description: 'Carte de recharge physique Orange 500 FCFA. Grattez pour obtenir votre code de recharge.',
      price: 500,
      imageUrl: '/cards/orange-500.png',
      operator: 'ORANGE',
      active: true,
      stock: -1,
    },
    {
      name: 'Carte MTN 1000F',
      description: 'Carte de recharge physique MTN 1000 FCFA. Grattez pour obtenir votre code de recharge.',
      price: 1000,
      imageUrl: '/cards/mtn-1000.png',
      operator: 'MTN',
      active: true,
      stock: -1,
    },
    {
      name: 'Carte Moov 500F',
      description: 'Carte de recharge physique Moov 500 FCFA. Grattez pour obtenir votre code de recharge.',
      price: 500,
      imageUrl: '/cards/moov-500.png',
      operator: 'MOOV',
      active: true,
      stock: -1,
    },
  ];

  for (const card of cards) {
    await prisma.physicalCard.upsert({
      where: { id: `seed-${card.operator}-${card.price}` },
      update: card,
      create: { id: `seed-${card.operator}-${card.price}`, ...card },
    });
  }

  console.log('✅ Physical cards seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
