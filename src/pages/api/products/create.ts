import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, price, stock, warehouseStock, onShelfStock, locationId, description, image, categoryId } = body;

    // Use explicit distribution if provided, otherwise fallback to total stock in warehouse
    const finalWarehouseStock = typeof warehouseStock === 'number' ? warehouseStock : (stock || 0);
    const finalOnShelfStock = onShelfStock || 0;
    const totalStock = finalWarehouseStock + finalOnShelfStock;

    const product = await prisma.product.create({
      data: {
        name,
        price,
        warehouseStock: finalWarehouseStock,
        onShelfStock: finalOnShelfStock,
        stock: totalStock,
        description,
        image,
        categoryId: categoryId || null,
        locationId: locationId || null,
        storeId: user.storeId
      }
    });

    return new Response(JSON.stringify(product), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal menambah produk' }), { status: 500 });
  }
};
