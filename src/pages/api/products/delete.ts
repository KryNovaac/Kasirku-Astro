import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const DELETE: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  const id = url.searchParams.get('id');

  if (!user || !user.storeId || !id) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Ensure product belongs to the store
    const product = await prisma.product.findFirst({
      where: { id, storeId: user.storeId }
    });

    if (!product) {
      return new Response(JSON.stringify({ message: 'Produk tidak ditemukan' }), { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'Produk dihapus' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal menghapus produk' }), { status: 500 });
  }
};
