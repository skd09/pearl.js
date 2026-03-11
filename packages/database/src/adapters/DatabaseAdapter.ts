/**
 * DatabaseAdapter — the contract every ORM adapter must fulfil.
 *
 * Pearl's DatabaseManager delegates all connection / disconnection work
 * to whichever adapter the user configured in pearl.config.ts.
 *
 * The `connection()` return type is intentionally `unknown` here — each
 * adapter re-exports a typed getter (e.g. DrizzleAdapter.db) so callers
 * that know their ORM can have full type-safety without a generic here.
 */
export interface DatabaseAdapter {
  /** Boot the connection. Idempotent — safe to call multiple times. */
  connect(): Promise<void>

  /** Tear down the connection cleanly. */
  disconnect(): Promise<void>

  /**
   * Return the raw ORM client / db instance.
   * Throws if called before connect().
   */
  connection(): unknown
}