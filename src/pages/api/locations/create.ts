import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, capacity } = body;

    const location = await prisma.storageLocation.create({
      data: {
        name,
        capacity: parseInt(capacity) || 0,
        storeId: user.storeId
      }
    });

    return new Response(JSON.stringify(location), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal membuat tempat penyimpanan' }), { status: 500 });
  }
};
