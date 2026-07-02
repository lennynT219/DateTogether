import type { CredentialsVerifier } from '../ports/CredentialsVerifier.js';
import type { TokenService } from '../ports/TokenService.js';

export class AuthenticateUser {
  constructor(
    private credentialsVerifier: CredentialsVerifier,
    private tokenService: TokenService
  ) {}

  async execute(username: string, password: string): Promise<string | null> {
    const canonicalUsername = this.credentialsVerifier.verify(username, password);
    if (!canonicalUsername) return null;
    return this.tokenService.sign({ sub: canonicalUsername });
  }
}
