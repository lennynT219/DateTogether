import type { CredentialsVerifier } from '../../core/ports/CredentialsVerifier.js';

export class EnvCredentialsVerifier implements CredentialsVerifier {
  private users: Map<string, string>; // lowercase-username -> password

  constructor(env: Record<string, string | undefined>) {
    this.users = new Map();
    const herUser = env.HER_USERNAME;
    const herPass = env.HER_PASSWORD;
    const hisUser = env.HIS_USERNAME;
    const hisPass = env.HIS_PASSWORD;

    if (herUser) this.users.set(herUser.toLowerCase(), herPass ?? '');
    if (hisUser) this.users.set(hisUser.toLowerCase(), hisPass ?? '');
  }

  verify(username: string, password: string): string | null {
    const normalized = username.toLowerCase();
    const storedPassword = this.users.get(normalized);
    if (!storedPassword) return null;
    if (storedPassword !== password) return null;
    return normalized;
  }
}
