import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const DELETE: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  const id = url.searchParams.get('id');

  if (!user || user.role !== 'ADMIN' || !user.storeId || !id) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Ensure user belongs to the same store and is not an ADMIN
    const targetUser = await prisma.user.findFirst({
      where: { id, storeId: user.storeId }
    });

    if (!targetUser) {
      return new Response(JSON.stringify({ message: 'Pegawai tidak ditemukan' }), { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return new Response(JSON.stringify({ message: 'Tidak bisa menghapus Admin' }), { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Pegawai dihapus' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal menghapus pegawai' }), { status: 500 });
  }
};
