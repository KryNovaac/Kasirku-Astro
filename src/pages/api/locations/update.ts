import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, capacity } = body;

    const location = await prisma.storageLocation.update({
      where: { 
        id,
        storeId: user.storeId
      },
      data: {
        name,
        capacity: parseInt(capacity) || 0
      }
    });

    return new Response(JSON.stringify(location), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal memperbarui tempat penyimpanan' }), { status: 500 });
  }
};
