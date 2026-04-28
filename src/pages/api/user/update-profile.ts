import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ message: 'Nama terlalu pendek' }), { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
};
