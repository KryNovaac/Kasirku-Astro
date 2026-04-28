import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email dan password wajib diisi' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true }
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return new Response(JSON.stringify({ message: 'Email atau password salah' }), { status: 401 });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      storeId: user.storeId,
      role: user.role,
      name: user.name
    });

    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ message: 'Login berhasil' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan server' }), { status: 500 });
  }
};
