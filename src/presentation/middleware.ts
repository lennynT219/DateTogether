import { defineMiddleware } from 'astro:middleware';
import { JwtService } from '../infrastructure/services/JwtService.js';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;

  // Normalize pathname (remove trailing slash)
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return next();
  }

  // Allow static assets
  if (pathname.startsWith('/_astro') || pathname.startsWith('/_image')) {
    return next();
  }

  // Check for auth token
  const token = cookies.get('auth_token')?.value;
  if (!token) {
    return context.redirect('/login');
  }

  // Verify token
  const jwtSecret = import.meta.env.JWT_SECRET;
  if (!jwtSecret) {
    return context.redirect('/login');
  }

  try {
    const jwtService = new JwtService(jwtSecret);
    const payload = await jwtService.verify(token);
    context.locals.user = payload;
    return next();
  } catch {
    // Token invalid or expired — clear it and redirect
    cookies.delete('auth_token', {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
    });
    return context.redirect('/login');
  }
});
