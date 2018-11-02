import crypto, {Decipher, Cipher} from "crypto";

export default abstract class Encryption {
    public static encrypt(message: string, password: string): string {
        const cipher: Cipher = crypto.createCipher("aes-256-cbc", password);

        let result = cipher.update(message, "utf8", "hex");

        result += cipher.final("hex");

        return result;
    }

    public static decrypt(encryptedMessage: string, password: string): string {
        const decipher: Decipher = crypto.createDecipher("aes-256-cbc", password);

        let result = decipher.update(encryptedMessage, "hex", "utf8")

        result += decipher.final("utf8");

        return result;
    }
}