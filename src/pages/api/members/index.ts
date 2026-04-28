import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { storeId: user.storeId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { transactions: true }
        }
      }
    });

    const membersWithStats = customers.map(c => ({
      id: c.id,
      phone: c.phone,
      name: c.name,
      points: c.points,
      createdAt: c.createdAt,
      totalTransactions: c._count.transactions,
      transactions: c.transactions, // Include multiple transactions
      lastTransaction: c.transactions[0] || null,
      isSubscribed: c.points > 1000
    }));

    return new Response(JSON.stringify(membersWithStats), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
};
