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
    const { id, name, email, password, role } = body;

    if (!id || !name || !email || !role) {
      return new Response(JSON.stringify({ message: 'Semua field wajib diisi' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return new Response(JSON.stringify({ message: 'User tidak ditemukan' }), { status: 404 });
    }

    // Prevent changing role to ADMIN if not already ADMIN
    if (role === 'ADMIN' && existingUser.role !== 'ADMIN') {
      return new Response(JSON.stringify({ message: 'Tidak dapat mengubah role menjadi Admin' }), { status: 400 });
    }

    // Check if email is already taken by another user
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: id },
        email
      }
    });

    if (conflict) {
      return new Response(JSON.stringify({ message: 'Email sudah digunakan' }), { status: 400 });
    }

    const updateData: any = {
      name,
      email,
      role: role as any,
    };

    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return new Response(JSON.stringify({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Gagal memperbarui pegawai' }), { status: 500 });
  }
};
