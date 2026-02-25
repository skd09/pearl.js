import bcrypt from 'bcryptjs'

export const Hash = {
    /**
     * Hash a plain text password.
     */
    async make(password: string, rounds = 10): Promise<string> {
        return bcrypt.hash(password, rounds)
    },

    /**
     * Verify a plain text password against a hash.
     */
    async check(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash)
    },

    /**
     * Check if a hash needs rehashing (e.g. rounds changed).
     */
    needsRehash(hash: string, rounds = 10): boolean {
        const hashRounds = bcrypt.getRounds(hash)
        return hashRounds !== rounds
    },
}