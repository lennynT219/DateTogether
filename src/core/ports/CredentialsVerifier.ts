export interface CredentialsVerifier {
  verify(username: string, password: string): string | null;
  // Returns canonical username if valid, null if invalid
}
