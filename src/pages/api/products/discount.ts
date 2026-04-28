import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('auth_token')?.value;
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const user = await verifyToken(token);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  try {
    const body = await request.json();
    const { productId, discountPrice, isDiscounted } = body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: { 
        isDiscounted: !!isDiscounted,
        discountPrice: isDiscounted ? parseFloat(discountPrice) : null
      }
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
