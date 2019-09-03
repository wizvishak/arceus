export default abstract class Pattern {
    /**
     * Matches a Discord bot token.
     */
    public static token: RegExp =  /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g;
}
