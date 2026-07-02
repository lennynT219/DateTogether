import type { TokenService } from '../ports/TokenService.js';

export class VerifySession {
  constructor(private tokenService: TokenService) {}

  async execute(token: string): Promise<{ sub: string } | null> {
    try {
      return await this.tokenService.verify(token);
    } catch {
      return null;
    }
  }
}
