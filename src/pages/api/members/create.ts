import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { phone, name } = await request.json();

    if (!phone) {
      return new Response(JSON.stringify({ message: 'Nomor HP wajib diisi' }), { status: 400 });
    }

    // Check if phone already exists in this store
    const existing = await prisma.customer.findFirst({
      where: {
        phone,
        storeId: user.storeId
      }
    });

    if (existing) {
      return new Response(JSON.stringify({ message: 'Nomor HP sudah terdaftar sebagai member' }), { status: 400 });
    }

    const member = await prisma.customer.create({
      data: {
        phone,
        name: name || null,
        storeId: user.storeId,
        points: 0
      }
    });

    return new Response(JSON.stringify(member), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal membuat member' }), { status: 500 });
  }
};
