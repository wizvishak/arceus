import App from "./app";
import Encryption from "./encryption";

export default function setupEvents(app: App): void {
    // Screen.
    app.options.screen.key("C-c", async () => {
        await app.shutdown();
    });

    app.options.screen.key("C-x", () => {
        process.exit(0);
    });

    app.options.screen.key("space", () => {
        app.options.nodes.input.focus();
    });

    // Input.
    app.options.nodes.input.on("keypress", () => {
        // TODO: If logged in.
        //app.startTyping();
    });

    app.options.nodes.input.key("tab", () => {
        const rawInput: string = app.getInput();
        const input: string = rawInput.substr(app.options.commandPrefix.length);

        if (rawInput.startsWith(app.options.commandPrefix) && input.length >= 2 && input.indexOf(" ") === -1) {
            for (let [name, handler] of app.commands) {
                if (name.startsWith(input)) {
                    app.clearInput(`${app.options.commandPrefix}${name} `);

                    break;
                }
            }
        }
    });

    app.options.nodes.input.key("enter", () => {
        let input: string = app.getInput(true);

        const splitInput: string[] = input.split(" ");
        const tags: string[] = app.tags.getTags();

        for (let i: number = 0; i < tags.length; i++) {
            while (splitInput.includes(`$${tags[i]}`)) {
                splitInput[splitInput.indexOf(`$${tags[i]}`)] = app.tags.getTag(tags[i]);
            }
        }

        input = splitInput.join(" ").trim();

        if (input === "") {
            return;
        }
        else if (input.startsWith(app.options.commandPrefix)) {
            const args: string[] = input.substr(app.options.commandPrefix.length).split(" ");
            const base: string = args[0];

            if (app.commands.has(base)) {
                args.splice(0, 1);
                app.commands.get(base)!(args, this);
            }
            else {
                app.message.system(`Unknown command: ${base}`);
            }
        }
        else {
            if (app.state.get().muted) {
                app.message.system(`Message not sent; Muted mode is active. Please use {bold}${app.options.commandPrefix}mute{/bold} to toggle`);
            }
            else if (app.state.get().guild && app.state.get().channel) {
                let msg: string = input;

                if (app.state.get().encrypt) {
                    msg = "$dt_" + Encryption.encrypt(msg, app.state.get().decriptionKey);
                }

                app.state.get().channel.send(msg).catch((error: Error) => {
                    app.message.system(`Unable to send message: ${error.message}`);
                });
            }
            else {
                app.message.system("No active text channel");
            }
        }

        app.clearInput();
    });

    app.options.nodes.input.key("escape", () => {
        if (app.getInput().startsWith(app.options.commandPrefix)) {
            app.clearInput(app.options.commandPrefix);
        }
        else {
            app.clearInput();
        }
    });

    app.options.nodes.input.key("up", () => {
        if (app.state.get().lastMessage) {
            app.clearInput(`${app.options.commandPrefix}edit ${app.state.get().lastMessage.id} ${app.state.get().lastMessage.content}`);
        }
    });

    app.options.nodes.input.key("down", () => {
        if (app.client.user && app.client.user.lastMessage && app.client.user.lastMessage.deletable) {
            app.client.user.lastMessage.delete();
        }
    });

    app.options.nodes.input.key("C-c", async () => {
        await app.shutdown();
    });

    app.options.nodes.input.key("C-x", () => {
        process.exit(0);
    });
}
