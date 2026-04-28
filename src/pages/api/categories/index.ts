import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('auth_token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const user = await verifyToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const categories = await prisma.category.findMany({
      where: { storeId: user.storeId! },
      orderBy: { name: 'asc' }
    });
    return new Response(JSON.stringify(categories));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const user = await verifyToken(token);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    const { name } = await request.json();
    if (!name) return new Response(JSON.stringify({ error: 'Nama kategori wajib diisi' }), { status: 400 });

    const category = await prisma.category.create({
      data: {
        name,
        storeId: user.storeId!
      }
    });

    return new Response(JSON.stringify(category), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const user = await verifyToken(token);
  if (!user || user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'ID wajib diisi' }), { status: 400 });

    await prisma.category.delete({
      where: { id, storeId: user.storeId! }
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
