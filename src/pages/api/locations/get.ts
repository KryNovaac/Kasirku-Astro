import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID diperlukan' }), { status: 400 });
  }

  try {
    const location = await prisma.storageLocation.findUnique({
      where: { 
        id,
        storeId: user.storeId
      },
      include: {
        _count: {
            select: { products: true }
        }
      }
    });

    if (!location) {
      return new Response(JSON.stringify({ message: 'Lokasi tidak ditemukan' }), { status: 404 });
    }

    return new Response(JSON.stringify(location), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan' }), { status: 500 });
  }
};
