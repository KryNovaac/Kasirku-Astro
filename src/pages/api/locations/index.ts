import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const locations = await prisma.storageLocation.findMany({
      where: { storeId: user.storeId },
      include: {
        _count: {
          select: { products: true }
        },
        products: {
            select: {
                categoryId: true,
                onShelfStock: true
            }
        }
      },
      orderBy: { name: 'asc' }
    });

    return new Response(JSON.stringify(locations), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal mengambil data tempat' }), { status: 500 });
  }
};
