import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID diperlukan' }), { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { 
        id,
        storeId: user.storeId
      },
      include: {
        category: true,
        location: true,
        allocations: {
            include: {
                location: true
            }
        }
      }
    });

    if (!product) {
      return new Response(JSON.stringify({ message: 'Produk tidak ditemukan' }), { status: 404 });
    }

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan' }), { status: 500 });
  }
};
