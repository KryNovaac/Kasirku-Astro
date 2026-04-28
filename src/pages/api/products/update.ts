import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, price, warehouseStock, onShelfStock, description, image, categoryId, locationId } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'ID diperlukan' }), { status: 400 });
    }

    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return new Response(JSON.stringify({ message: 'Produk tidak ditemukan' }), { status: 404 });

    const finalWh = typeof warehouseStock === 'number' ? warehouseStock : current.warehouseStock;
    const finalSh = typeof onShelfStock === 'number' ? onShelfStock : current.onShelfStock;
    const totalStock = finalWh + finalSh;

    const product = await prisma.product.update({
      where: { 
        id,
        storeId: user.storeId // Security check
      },
      data: {
        name: name ?? undefined,
        price: price ?? undefined,
        warehouseStock: finalWh,
        onShelfStock: finalSh,
        stock: totalStock,
        description: description === null ? null : (description || undefined),
        image: image === null ? null : (image || undefined),
        categoryId: categoryId === null ? null : (categoryId || undefined),
        locationId: locationId === null ? null : (locationId || undefined)
      },
      include: {
        category: true,
        location: true,
        allocations: {
            include: {
                location: true
            }
        }
      }
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal memperbarui produk' }), { status: 500 });
  }
};
