import { SignJWT, jwtVerify } from 'jose';
import type { TokenService } from '../../core/ports/TokenService.js';

export class JwtService implements TokenService {
  private secret: Uint8Array;

  constructor(secretKey: string) {
    const encoder = new TextEncoder();
    this.secret = encoder.encode(secretKey);
  }

  async sign(payload: { sub: string }): Promise<string> {
    return new SignJWT({ sub: payload.sub })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);
  }

  async verify(token: string): Promise<{ sub: string }> {
    const { payload } = await jwtVerify(token, this.secret);
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Invalid token payload');
    }
    return { sub: payload.sub };
  }
}
