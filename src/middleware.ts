import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;

  context.locals.user = user;

  const { pathname } = context.url;

  // Public routes
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (user && pathname.startsWith('/auth')) {
      return context.redirect('/dashboard');
    }
    return next();
  }

  // Protected routes
  if (!user) {
    return context.redirect('/auth/login');
  }

  // Role-based access control
  if (pathname.startsWith('/dashboard/admin') && user.role !== 'ADMIN') {
    return context.redirect('/dashboard');
  }

  if (pathname.startsWith('/dashboard/manager') && !['ADMIN', 'MANAGER'].includes(user.role)) {
    return context.redirect('/dashboard');
  }

  return next();
});
