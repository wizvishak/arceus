export default abstract class Pattern {
    /**
     * Matches a Discord bot token.
     */
    public static token: RegExp = /ND[a-z0-9]{22}\.D[a-z]{2}[a-z0-9-]{3}\.[-a-z0-9_]{27}/gmi;
}
