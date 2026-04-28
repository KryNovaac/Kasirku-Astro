import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    // Detach products and return their shelf stock to warehouse for THIS location
    const allocations = await prisma.productAllocation.findMany({
      where: { locationId: id }
    });

    // Run in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. For each allocation, return quantity to product warehouseStock
      for (const alloc of allocations) {
        await tx.product.update({
          where: { id: alloc.productId },
          data: {
            warehouseStock: { increment: alloc.quantity },
            onShelfStock: { decrement: alloc.quantity }
          }
        });
      }

      // 2. Delete all allocations for this location
      await tx.productAllocation.deleteMany({
        where: { locationId: id }
      });

      // 3. Clear locationId from products that consider this their primary location
      await tx.product.updateMany({
        where: { locationId: id },
        data: { locationId: null }
      });

      // 4. Finally delete the location
      await tx.storageLocation.delete({
        where: { 
          id,
          storeId: user.storeId
        }
      });
    });

    return new Response(JSON.stringify({ message: 'Lokasi berhasil dihapus. Produk telah dikembalikan ke Gudang.' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal menghapus tempat' }), { status: 500 });
  }
};
