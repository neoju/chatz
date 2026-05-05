export interface ResetTokenData {
  /** Raw 32-byte CSPRNG token — never logged or stored */
  rawToken: Buffer;
  /** SHA-256 hex hash — stored in Redis as `pw_reset:<hash>` */
  tokenHash: string;
  /** URL-safe base64 encoding for embedding in reset links */
  tokenized: string;
  /** User nickname for the email template greeting */
  username: string;
  /** User ID for Redis key and password update */
  userId: string;
}
