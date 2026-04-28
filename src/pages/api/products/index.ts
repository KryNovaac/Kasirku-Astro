import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const locationId = url.searchParams.get('locationId');
  const onlyWarehouse = url.searchParams.get('onlyWarehouse') === 'true';

  try {
    const products = await prisma.product.findMany({
      where: { 
        storeId: user.storeId,
        ...(locationId ? { locationId } : {}),
        ...(onlyWarehouse ? { warehouseStock: { gt: 0 } } : {})
      },
      include: { 
        category: true,
        location: true,
        allocations: {
            include: {
                location: true
            }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
};
