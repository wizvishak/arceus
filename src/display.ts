import {TextChannel, Guild, Client, Message} from "discord.js";
import Utils from "./utils";
import blessed, {Widgets} from "blessed";
import chalk from "chalk";

export type IAppState = {
    channel?: TextChannel;
    guild?: Guild;
    globalMessages: boolean;
    ignoreBots: boolean;
    ignoreEmptyMessages: boolean;
    muted: boolean;
}

export type IAppNodes = {
    readonly messages: Widgets.BoxElement;
    readonly channels: Widgets.BoxElement;
    readonly input: Widgets.TextboxElement;
}

export type IAppOptions = {
    readonly maxMessages: number;
    readonly screen: Widgets.Screen
    readonly nodes: IAppNodes;
    readonly commandPrefix: string;
    readonly messageFormat: string;
}

const defaultAppState: IAppState = {
    globalMessages: false,
    ignoreBots: false,
    ignoreEmptyMessages: true,
    muted: false
};

const defaultAppOptions: IAppOptions = {
    maxMessages: 50,
    commandPrefix: "/",
    messageFormat: "<{sender}>: {message}",

    screen: blessed.screen({
        // TODO:
    }),

    nodes: {
        messages: blessed.box({
            top: "0%",
            left: "25%",
            width: "75%+2",
            height: `96%`,

            style: {
                fg: "white",
                bg: "gray"
            },

            scrollable: true,
            alwaysScroll: true,
            tags: true,
            padding: 1
        }),

        channels: blessed.box({
            top: "0%",
            left: "0%",
            height: `96%`,
            width: "25%",
            scrollable: true,
            padding: 1,

            style: {
                item: {
                    bg: "gray",
                    fg: "white"
                },

                selected: {
                    bg: "gray",
                    fg: "white"
                },

                fg: "white",
                bg: "black"
            } as any
        }),

        input: blessed.textbox({
            style: {
                fg: "gray",
                bg: "lightgray"
            },
        
            bottom: "0",
            width: "100%",
            inputOnFocus: true,
            height: "shrink"
        })
    }
};

export type ICommandHandler = (args: string[], display: Display) => void;

export default class Display {
    public readonly options: IAppOptions;
    public readonly client: Client;
    public readonly commands: Map<string, ICommandHandler>;

    private state: IAppState;

    public constructor(options: Partial<IAppOptions> = defaultAppOptions, commands: Map<string, ICommandHandler> = new Map(), state: Partial<IAppState> = defaultAppState) {
        this.options = {
            ...defaultAppOptions,
            ...options
        };

        this.state = {
            ...defaultAppState,
            ...state    
        };

        this.client = new Client;
        this.commands = commands;
    }

    public async setup(init: boolean = true): Promise<this> {
        // Discord Events
        this.client.on("ready", () => {
            this.appendSystemMessage(`Successfully connected as {bold}${this.client.user.tag}{/bold}`);
            
            const firstGuild: Guild = this.client.guilds.first();

            if (firstGuild) {
                this.setActiveGuild(firstGuild);
            }
        });

        this.client.on("message", (msg: Message) => {
            if (this.state.ignoreBots && msg.author.bot) {
                return;
            }
            else if (this.state.ignoreEmptyMessages && !msg.content) {
                return;
            }
            else if (msg.author.id === this.client.user.id) {
                this.appendSelfMessage(this.client.user.tag, msg.content);
            }
            else if (this.state.guild && this.state.channel && msg.channel.id === this.state.channel.id) {
                const modifiers: string[] = [];

                if (msg.guild && msg.member) {
                    if (msg.member.hasPermission("MANAGE_MESSAGES")) {
                        modifiers.push(chalk.red("+"));
                    }

                    if (msg.member.hasPermission("MANAGE_GUILD")) {
                        modifiers.push(chalk.red("$"));
                    }
                }

                this.appendUserMessage(msg.author.tag, msg.content, modifiers);
            }
            else if (this.state.globalMessages) {
                this.appendSpecialMessage("Global", msg.author.tag, msg.content);
            }
        });

        // Append Nodes
        this.options.screen.append(this.options.nodes.input);
        this.options.screen.append(this.options.nodes.messages);
        this.options.screen.append(this.options.nodes.channels);

        if (init) {
            this.init();
        }

        return this;
    }

    private setupEvents(): this {
        // Screen
        this.options.screen.key("C-c", () => {
            process.exit(0);
        });

        this.options.screen.key("space", () => {
            this.options.nodes.input.focus();
        });

        // Input
        this.options.nodes.input.key("enter", () => {
            const input: string = this.getInput(true);

            if (input.startsWith(this.options.commandPrefix)) {
                const args: string[] = input.substr(this.options.commandPrefix.length).split(" ");
                const base: string = args[0];

                if (this.commands.has(base)) {
                    args.splice(0, 1);
                    (this.commands.get(base) as ICommandHandler)(args, this);
                }
                else {
                    this.appendSystemMessage(`Unknown command: ${base}`);
                }
            }
            else {
                if (this.state.muted) {
                    this.appendSystemMessage(`Message not sent; Muted mode is active. Please use ${this.options.commandPrefix}mute to toggle`);
                }
                else if (this.state.guild && this.state.channel) {
                    this.state.channel.send(input);
                }
                else {
                    this.appendSystemMessage("No active text channel");
                }
            }

            this.clearInput();
        });

        this.options.nodes.input.key("escape", () => {
            if (this.getInput().startsWith(this.options.commandPrefix)) {
                this.clearInput(this.options.commandPrefix);
            }
            else {
                this.clearInput();
            }
        });

        this.options.nodes.input.key("C-c", () => {
            process.exit(0);
        });

        return this;
    }

    public getInput(clear: boolean = false): string {
        const value: string = this.options.nodes.input.getValue();

        if (clear) {
            this.clearInput();
        }

        return value;
    }

    public clearInput(newValue: string = ""): this {
        this.options.nodes.input.setValue(newValue);

        if (this.options.screen.focused !== this.options.nodes.input) {
            this.options.nodes.input.focus();
        }

        this.render();

        return this;
    }

    private setupInternalCommands(): this {
        this.commands.set("login", (args: string[]) => {
            this.login(args[0]);
        });

        this.commands.set("now", () => {
            if (this.state.guild && this.state.channel) {
                this.appendSystemMessage(`Currently on guild '{bold}${this.state.guild.name}{/bold}' # '{bold}${this.state.channel.name}{/bold}'`)
            }
            else if (this.state.guild) {
                this.appendSystemMessage(`Currently on guild '{bold}${this.state.guild.name}{/bold}`);
            }
            else {
                this.appendSystemMessage("No active guild");
            }
        });

        this.commands.set("mute", () => {
            this.state.muted = !this.state.muted;

            if (this.state.muted) {
                this.appendSystemMessage("Muted mode activated");
            }
            else {
                this.appendSystemMessage("Muted mode is no longer activated");
            }
        });

        this.commands.set("global", () => {
            this.state.globalMessages = !this.state.globalMessages;

            if (this.state.globalMessages) {
                this.appendSystemMessage("Displaying global messages");
            }
            else {
                this.appendSystemMessage("No longer displaying global messages");
            }
        });

        this.commands.set("bots", () => {
            this.state.ignoreBots = !this.state.ignoreBots;

            if (this.state.ignoreBots) {
                this.appendSystemMessage("No longer displaying bot messages");
            }
            else {
                this.appendSystemMessage("Displaying bot messages");
            }
        });

        this.commands.set("clear", () => {
            this.options.nodes.messages.setContent("");
            this.render();
        });

        this.commands.set("c", (args: string[]) => {
            if (!this.state.guild) {
                this.appendSystemMessage("No active guild");
            }
            else if (this.state.guild.channels.has(args[0])) {
                // TODO: Verify that it's a text channel
                this.setActiveChannel(this.state.guild.channels.get(args[0]) as TextChannel);
            }
            else {
                this.appendSystemMessage(`Such channel does not exist in guild '${this.state.guild.name}'`);
            }
        });

        this.commands.set("reset", () => {
            this.render(true);
        });

        return this;
    }

    public login(token: string): this {
        this.client.login(token).catch((error: Error) => {
            this.appendSystemMessage(`Login failed: ${error.message}`);
        });
        
        return this;
    }

    public init(): this {
        if (process.env.TOKEN !== undefined) {
            this.appendSystemMessage("Attempting to login using environment token");
            this.login(process.env.TOKEN);
        }
        else {
            this.options.nodes.input.setValue(`${this.options.commandPrefix}login `);
            this.appendSystemMessage("Welcome! Please login using {bold}/login <token>{/bold}")
        }
        
        this.setupEvents()
            .setupInternalCommands();

        return this;
    }

    public setActiveGuild(guild: Guild): this {
        this.state.guild = guild;
        this.appendSystemMessage(`Switched to guild '${this.state.guild.name}'`);

        const defaultChannel: TextChannel | null = Utils.findDefaultChannel(this.state.guild);

        if (defaultChannel !== null) {
            this.setActiveChannel(defaultChannel);
        }
        else {
            this.appendSystemMessage(`Warning: Guild '${this.state.guild.name}' doesn't have any text channels`);
        }

        return this;
    }

    public setActiveChannel(channel: TextChannel): this {
        this.state.channel = channel;
        this.appendSystemMessage(`Switched to channel '${this.state.channel.name}'`);

        return this;
    }

    public appendMessage(sender: string, message: string, color = "white"): this {
        this.options.nodes.messages.pushLine(this.options.messageFormat
            .replace("{sender}", ((chalk as any)[color] as any)(sender))
            .replace("{message}", message));
        
        this.render();

        return this;
    }

    public render(hard: boolean = false): this {
        if (!hard) {
            this.options.screen.render();
        }
        else {
            this.options.screen.realloc();
        }

        return this;
    }

    public appendUserMessage(sender: string, message: string, modifiers: string[] = []): this {
        let name: string = `@${sender}`;

        if (modifiers.length > 0) {
            for (let i: number = 0; i < modifiers.length; i++) {
                name = modifiers[i] + name;
            }
        }

        this.appendMessage(name, message, "cyan");

        return this;
    }

    public appendSelfMessage(name: string, message: string): this {
        this.appendMessage(`@{bold}${name}{/bold}`, message, "cyan");

        return this;
    }

    public appendSpecialMessage(prefix: string, sender: string, message: string): this {
        this.appendMessage(`${prefix} ~> @{bold}${sender}{/bold}`, message, "yellow");

        return this;
    }

    public appendSystemMessage(message: string): this {
        this.appendMessage("{bold}System{/bold}", message, "green");

        return this;
    }
}