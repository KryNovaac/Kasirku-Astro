import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN' || !user.storeId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ message: 'Semua field wajib diisi' }), { status: 400 });
    }

    if (role === 'ADMIN') {
      return new Response(JSON.stringify({ message: 'Tidak dapat menambah Admin baru' }), { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ message: 'Email sudah digunakan' }), { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        storeId: user.storeId
      }
    });

    return new Response(JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal menambah pegawai' }), { status: 500 });
  }
};
