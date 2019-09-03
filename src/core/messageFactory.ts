import chalk from "chalk";
import App, {SpecialSenders} from "../app";

export type MessageFactoryOptions = {

};

export default class MessageFactory {
    protected readonly app: App;

    public constructor(app: App) {
        this.app = app;
    }

    // TODO: Also include time.
    public create(sender: string, message: string, senderColor: string = "white", messageColor: string = this.app.state.get().themeData.messages.foregroundColor): this {
        let messageString: string = message;

        if (messageColor.startsWith("#")) {
            messageString = chalk.hex(messageColor)(messageString);
        }
        else if (chalk[messageColor] === undefined || typeof chalk[messageColor] !== "function") {
            this.system("Refusing to append message: An invalid color was provided");

            return this;
        }
        else {
            messageString = ((chalk as any)[messageColor] as any)(message);
        }

        let line: string = this.app.state.get().messageFormat
            // TODO: Catch error if sender color doesn't exist.
            .replace("{sender}", chalk[senderColor](sender))
            .replace("{message}", messageString);

        if (sender !== `{bold}${SpecialSenders.System}{/bold}`) {
            const splitLine: string[] = line.split(" ");

            for (let i: number = 0; i < this.app.state.get().wordPins.length; i++) {
                while (splitLine.includes(this.app.state.get().wordPins[i])) {
                    splitLine[splitLine.indexOf(this.app.state.get().wordPins[i])] = chalk.bgCyan.white(this.app.state.get().wordPins[i]);
                }
            }

            line = splitLine.join(" ");
        }

        this.app.options.nodes.messages.pushLine(line);
        this.app.options.nodes.messages.setScrollPerc(100);
        this.app.render();

        return this;
    }

    public user(sender: string, message: string, modifiers: string[] = []): this {
        let name: string = `@${sender}`;

        if (modifiers.length > 0) {
            for (let i: number = 0; i < modifiers.length; i++) {
                name = modifiers[i] + name;
            }
        }

        this.create(name, message, "cyan");

        return this;
    }

    public self(name: string, message: string): this {
        this.create(`@{bold}${name}{/bold}`, message, "cyan");

        return this;
    }

    public special(prefix: string, sender: string, message: string, color: string = "yellow"): this {
        this.create(`${prefix} ~> @{bold}${sender}{/bold}`, message, color);

        return this;
    }

    public system(message: string): this {
        this.create(`{bold}${SpecialSenders.System}{/bold}`, message, "green");

        return this;
    }
}
