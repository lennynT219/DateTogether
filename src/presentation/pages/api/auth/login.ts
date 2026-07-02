import type { APIRoute } from 'astro';
import { JwtService } from '../../../../infrastructure/services/JwtService.js';
import { EnvCredentialsVerifier } from '../../../../infrastructure/services/EnvCredentialsVerifier.js';
import { AuthenticateUser } from '../../../../core/use-cases/AuthenticateUser.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Usuario y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const jwtSecret = import.meta.env.JWT_SECRET;
    if (!jwtSecret) {
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const jwtService = new JwtService(jwtSecret);
    const credentialsVerifier = new EnvCredentialsVerifier({
      HER_USERNAME: import.meta.env.HER_USERNAME,
      HER_PASSWORD: import.meta.env.HER_PASSWORD,
      HIS_USERNAME: import.meta.env.HIS_USERNAME,
      HIS_PASSWORD: import.meta.env.HIS_PASSWORD,
    });
    const authenticateUser = new AuthenticateUser(credentialsVerifier, jwtService);

    const token = await authenticateUser.execute(username, password);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Credenciales inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    cookies.set('auth_token', token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
