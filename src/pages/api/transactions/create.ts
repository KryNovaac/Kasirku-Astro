import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, total, isMember, memberPhone, cashPaid, change } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'Keranjang kosong' }), { status: 400 });
    }

    // Process transaction in a transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction
      const newTransaction = await tx.transaction.create({
        data: {
          total,
          cashPaid,
          change,
          isMember,
          memberPhone,
          storeId: user.storeId!,
          cashierId: user.id,
          items: items // Json field
        }
      });

      // 2. Update product stocks
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 3. Update member points if applicable
      if (isMember && memberPhone) {
        const pointsEarned = Math.floor(total * 0.1); // 10% points
        await tx.customer.update({
          where: { 
            phone_storeId: {
              phone: memberPhone,
              storeId: user.storeId!
            }
          },
          data: {
            points: {
              increment: pointsEarned
            }
          }
        });
      }

      return newTransaction;
    });

    return new Response(JSON.stringify(transaction), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal memproses transaksi' }), { status: 500 });
  }
};
