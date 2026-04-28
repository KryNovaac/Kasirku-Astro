import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { name, password, email, storeName } = body;

    if (!name || !password || !email || !storeName) {
      return new Response(JSON.stringify({ message: 'Semua field wajib diisi' }), { status: 400 });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'Email sudah digunakan' }), { status: 400 });
    }

    // Create store and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: { name: storeName }
      });

      const hashedPassword = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          storeId: store.id
        }
      });

      return { user, store };
    });

    const token = signToken({
      id: result.user.id,
      email: result.user.email,
      storeId: result.store.id,
      role: result.user.role,
      name: result.user.name
    });

    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ message: 'Pendaftaran berhasil' }), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan server' }), { status: 500 });
  }
};
