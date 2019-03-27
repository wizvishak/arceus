import Display from "./display";
import Encryption from "./encryption";

export default function setupEvents(display: Display): void {
    // Screen.
    display.options.screen.key("C-c", async () => {
        await display.shutdown();
    });

    display.options.screen.key("C-x", () => {
        process.exit(0);
    });

    display.options.screen.key("space", () => {
        display.options.nodes.input.focus();
    });

    // Input.
    display.options.nodes.input.on("keypress", display.startTyping.bind(this));

    display.options.nodes.input.key("tab", () => {
        const rawInput: string = display.getInput();
        const input: string = rawInput.substr(display.options.commandPrefix.length);

        if (rawInput.startsWith(display.options.commandPrefix) && input.length >= 2 && input.indexOf(" ") === -1) {
            for (let [name, handler] of display.commands) {
                if (name.startsWith(input)) {
                    display.clearInput(`${display.options.commandPrefix}${name} `);

                    break;
                }
            }
        }
    });

    display.options.nodes.input.key("enter", () => {
        let input: string = display.getInput(true);

        const splitInput: string[] = input.split(" ");
        const tags: string[] = display.getTags();

        for (let i: number = 0; i < tags.length; i++) {
            while (splitInput.includes(`$${tags[i]}`)) {
                splitInput[splitInput.indexOf(`$${tags[i]}`)] = display.getTag(tags[i]);
            }
        }

        input = splitInput.join(" ").trim();

        if (input === "") {
            return;
        }
        else if (input.startsWith(display.options.commandPrefix)) {
            const args: string[] = input.substr(display.options.commandPrefix.length).split(" ");
            const base: string = args[0];

            if (display.commands.has(base)) {
                args.splice(0, 1);
                display.commands.get(base)!(args, this);
            }
            else {
                display.appendSystemMessage(`Unknown command: ${base}`);
            }
        }
        else {
            if (display.getState().muted) {
                display.appendSystemMessage(`Message not sent; Muted mode is active. Please use {bold}${display.options.commandPrefix}mute{/bold} to toggle`);
            }
            else if (display.getState().guild && display.getState().channel) {
                let msg: string = input;

                if (display.getState().encrypt) {
                    msg = "$dt_" + Encryption.encrypt(msg, display.getState().decriptionKey);
                }

                display.getState().channel.send(msg).catch((error: Error) => {
                    display.appendSystemMessage(`Unable to send message: ${error.message}`);
                });
            }
            else {
                display.appendSystemMessage("No active text channel");
            }
        }

        display.clearInput();
    });

    display.options.nodes.input.key("escape", () => {
        if (display.getInput().startsWith(display.options.commandPrefix)) {
            display.clearInput(display.options.commandPrefix);
        }
        else {
            display.clearInput();
        }
    });

    display.options.nodes.input.key("up", () => {
        if (display.getState().lastMessage) {
            display.clearInput(`${display.options.commandPrefix}edit ${display.getState().lastMessage.id} ${display.getState().lastMessage.content}`);
        }
    });

    display.options.nodes.input.key("down", () => {
        if (display.client.user && display.client.user.lastMessage && display.client.user.lastMessage.deletable) {
            display.client.user.lastMessage.delete();
        }
    });

    display.options.nodes.input.key("C-c", async () => {
        await display.shutdown();
    });

    display.options.nodes.input.key("C-x", () => {
        process.exit(0);
    });
}
