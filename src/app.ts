import blessed from "blessed";
import {Client, Message, Snowflake, Channel, TextChannel} from "discord.js";
import chalk from "chalk";

const client: Client = new Client();

export type IAppState = {
    channel?: Snowflake;
}

export type ILine = {
    sender: string;
    message: string;
}

let state: IAppState = {

};

let messageMap: Map<Snowflake, number> = new Map();
let trackList: Snowflake[] = [];
let lines: ILine[] = [];
let lastPinger: Snowflake | null = null;
let gm: boolean = false;
let bots: boolean = true;
let ignoreNonAlpha: boolean = false;

const maxLines: number = 50;

// Client events
client.on("ready", () => {
    addSysMsg(`Successfully conntected as ${client.user.tag}`);
});

client.on("message", (msg: Message) => {
    if ((!bots && msg.author.bot)) {
        return;
    }
    else if (ignoreNonAlpha && !/[a-z]/i.test(msg.content[0])) {
        return;
    }

    const authorTag: string = `@${chalk.blue(msg.author.tag)}`;

    if (msg.channel.id === state.channel || gm) {
        addMsg(authorTag, msg.content);
        messageMap.set(msg.id, messages.getLines().length);
    }
    else if (trackList.includes(msg.author.id)) {
        addMsg(`Track ~> ${authorTag}`, msg.content);
    }

    if (msg.content.includes(`<@${client.user.id}>`)) {
        lastPinger = msg.author.id;
    }
});

client.on("messageDelete", (msg: Message) => {
    if (messageMap.has(msg.id)) {
        const lineNum: number = messageMap.get(msg.id) as number - 1;

        if (lines[lineNum] === undefined) {
            return;
        }

        messages.setLine(lineNum, `<${lines[lineNum].sender} (${chalk.red("deleted")})> ${lines[lineNum].message}`);
        screen.render();
    }

    if (messageMap.size > maxLines || lines.length > maxLines) {
        messageMap.clear();
        lines = [];
    }
});

function addMsg(sender: string, msg: string): void {
    messages.pushLine(`<${sender}> ${msg}`);
    messages.setScrollPerc(100);

    lines.push({
        message: msg,
        sender
    });

    screen.render();
}

function addSysMsg(msg: string): void {
    addMsg(chalk.green("System"), msg);
}

// Create a screen object.
var screen = blessed.screen({
    smartCSR: true
});

screen.title = "Discord Terminal";

// Create a box perfectly centered horizontally and vertically.
var messages = blessed.box({
    top: "0%",
    width: "100%",
    height: `95%`,

    style: {
        fg: "white",
        bg: "gray"
    },

    scrollable: true
});

var textbox = blessed.textbox({
    style: {
        fg: "gray",
        bg: "lightgray"
    },

    bottom: "0",
    width: "100%",
    inputOnFocus: true,
    height: "shrink"
});

// Append our box to the screen.
screen.append(messages);
screen.append(textbox);

// If box is focused, handle `enter`/`return` and give us some more content.
/* 
    box.key("enter", function (ch, key) {
        box.setContent("{right}Even different {black-fg}content{/black-fg}.{/right}\n");
        box.setLine(1, "bar");
        box.insertLine(1, "foo");
        screen.render();
    });
*/

textbox.key("enter", () => {
    const message: string = textbox.getValue();

    if (message.trim() === "") {
        clearMessageInput();

        return;
    }
    else if (message.startsWith("/")) {
        const args: string[] = message.substr(1).split(" ");
        const command: string = args[0];

        args.splice(0, 1);

        switch (command) {
            case "login": {
                client.login(args[0]).catch((error: Error) => {
                    addSysMsg(`Login failed: ${error.message}`);
                });

                break;
            }

            case "channel": {
                if (client.channels.has(args[0])) {
                    state.channel = args[0];
                    addSysMsg(`Set channel to ${state.channel}`);
                }
                else {
                    addSysMsg("That channel does not exist");
                }

                break;
            }

            case "clear": {
                messages.content = "";

                break;
            }

            case "bots": {
                bots = !bots;

                if (bots) {
                    addSysMsg("Displaying bot messages");
                }
                else {
                    addSysMsg("No longer displaying bot messages");
                }

                break;
            }

            case "alpha": {
                ignoreNonAlpha = !ignoreNonAlpha;

                if (ignoreNonAlpha) {
                    addSysMsg("Ignoring messages starting with non-alphanumeric characters");
                }
                else {
                    addSysMsg("No longer ignoring messages starting with non-alphanumeric characters");
                }

                break;
            }

            case "r": {
                if (lastPinger !== null) {
                    const msg: string = args.slice(0).join(" ");

                    sendToChannel(`<@${lastPinger}> ${msg}`);
                }
                else {
                    addSysMsg("No one has pinged you yet");
                }

                break;
            }

            case "track": {
                if (trackList.includes(args[0])) {
                    trackList.splice(trackList.indexOf(args[0]), 1);
                    addSysMsg(`No longer tracking @${args[0]}`);
                }
                else if (client.users.has(args[0])) {
                    trackList.push(args[0]);
                    addSysMsg(`Now tracking @${args[0]}`);
                }
                else {
                    addSysMsg("That user doesn't exist");
                }

                break;
            }

            case "global": {
                gm = !gm;

                if (gm) {
                    addSysMsg("Displaying global messages");
                }
                else {
                    addSysMsg("No longer displaying global messages");
                }

                break;
            }

            case "random": {
                sendToChannel(Math.random().toString().replace(".", ""));

                break;
            }

            default: {
                addSysMsg(`Unknown command: ${command}`);
            }
        }
    }
    // TODO: Check if connected
    else if (state.channel !== undefined) {
        sendToChannel(message);
    }
    else {
        addSysMsg("Not currently in any channel");
        textbox.focus();

        return;
    }

    clearMessageInput();
});

textbox.key("up", () => {
    if (client.user.lastMessage.deletable) {
        client.user.lastMessage.delete();
    }
});

function sendToChannel(message: string): void {
    if (state.channel === undefined || !client.channels.has(state.channel)) {
        return;
    }

    const channel: Channel = client.channels.get(state.channel) as Channel;

    if (channel.type !== "text") {
        addMsg("System", "Can only send messages to a text channel");

        return;
    }

    (channel as TextChannel).send(message);
}

textbox.key("escape", () => {
    let stayInCommand: boolean = textbox.getValue().startsWith("/");

    clearMessageInput();

    if (stayInCommand) {
        textbox.setValue("/");
        screen.render();
    }
});

textbox.key("C-c", () => {
    process.exit(0);
});

function clearMessageInput(): void {
    textbox.clearValue();
    textbox.focus();
    screen.render();
}

textbox.focus();

if (process.env.TOKEN) {
    addSysMsg("Using environment token");

    client.login(process.env.TOKEN).catch((error: Error) => {
        addSysMsg(`Login failed: ${error.message}`);
    });

    textbox.setValue("/channel ");
}
else {
    addSysMsg("Welcome! Use /login <token> to login.");
    textbox.setValue("/login ");
}

// Render the screen.
screen.render();