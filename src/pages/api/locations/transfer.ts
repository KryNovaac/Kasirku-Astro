import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { productId, locationId, amount, direction } = await request.json();

    if (!productId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ message: 'Data tidak lengkap' }), { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { location: true }
    });

    if (!product || product.storeId !== user.storeId) {
      return new Response(JSON.stringify({ message: 'Produk tidak ditemukan' }), { status: 404 });
    }

    let warehouseStock = product.warehouseStock;
    let onShelfStock = product.onShelfStock;

    if (direction === 'TO_SHELF') {
      if (!locationId) return new Response(JSON.stringify({ message: 'Lokasi tujuan wajib diisi' }), { status: 400 });
      if (warehouseStock < amount) return new Response(JSON.stringify({ message: 'Stok gudang tidak mencukupi' }), { status: 400 });

      // Create or Update Allocation
      await prisma.productAllocation.upsert({
        where: {
            productId_locationId: {
                productId,
                locationId
            }
        },
        update: {
            quantity: { increment: amount }
        },
        create: {
            productId,
            locationId,
            quantity: amount
        }
      });

      // Update Product
      await prisma.product.update({
        where: { id: productId },
        data: {
          warehouseStock: { decrement: amount },
          onShelfStock: { increment: amount },
          stock: product.stock, // unchanged
          locationId: locationId // update primary location to the latest one
        }
      });
      
    } else if (direction === 'TO_WAREHOUSE') {
      // Find allocation for this location
      const allocation = await prisma.productAllocation.findUnique({
          where: { productId_locationId: { productId, locationId: locationId || product.locationId || '' } }
      });

      if (!allocation || allocation.quantity < amount) {
          return new Response(JSON.stringify({ message: 'Stok di rak spesifik ini tidak mencukupi' }), { status: 400 });
      }

      // Update Allocation
      if (allocation.quantity === amount) {
          await prisma.productAllocation.delete({ where: { id: allocation.id } });
      } else {
          await prisma.productAllocation.update({
              where: { id: allocation.id },
              data: { quantity: { decrement: amount } }
          });
      }

      // Update Product
      await prisma.product.update({
        where: { id: productId },
        data: {
          warehouseStock: { increment: amount },
          onShelfStock: { decrement: amount }
        }
      });
    } else {
      return new Response(JSON.stringify({ message: 'Arah transfer tidak valid' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan sistem' }), { status: 500 });
  }
};
