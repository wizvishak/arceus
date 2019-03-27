import {TextChannel, Guild, Client, Message, Channel, Snowflake, DMChannel} from "discord.js";
import Utils from "./utils";
import blessed, {Widgets} from "blessed";
import chalk from "chalk";
import fs from "fs";
import clipboardy from "clipboardy";
import path from "path";
import Encryption from "./encryption";
import {defaultAppOptions, defaultAppState} from "./constant";
import Pattern from "./pattern";
import setupEvents from "./events";
import setupInternalCommands from "./commands/internal";
import {EventEmitter} from "events";

export type IAppNodes = {
    readonly messages: Widgets.BoxElement;
    readonly channels: Widgets.BoxElement;
    readonly input: Widgets.TextboxElement;
    readonly header: Widgets.BoxElement;
}

export type IAppState = {
    readonly channel?: TextChannel;
    readonly guild?: Guild;
    readonly globalMessages: boolean;
    readonly ignoreBots: boolean;
    readonly ignoreEmptyMessages: boolean;
    readonly muted: boolean;
    readonly messageFormat: string;
    readonly lastMessage?: Message;
    readonly typingTimeout?: NodeJS.Timeout;
    readonly trackList: Snowflake[];
    readonly wordPins: string[];
    readonly ignoredUsers: Snowflake[];
    readonly autoHideHeaderTimeout?: NodeJS.Timer;
    readonly tags: any;
    readonly theme: string;
    readonly themeData: any;
    readonly decriptionKey: string;
    readonly encrypt: boolean;
    readonly token?: string;
}

export type IAppOptions = {
    readonly maxMessages: number;
    readonly screen: Widgets.Screen
    readonly nodes: IAppNodes;
    readonly commandPrefix: string;
    readonly stateFilePath: string;
    readonly headerAutoHideTimeoutPerChar: number;
}

export enum SpecialSenders {
    System = "System"
}

export type ICommandHandler = (args: string[], display: Display) => void;

export default class Display extends EventEmitter {
    /**
     * Instance options for the application.
     */
    public readonly options: IAppOptions;

    /**
     * The Discord client class instance.
     */
    public readonly client: Client;

    /**
     * Registered commands usable by the client.
     */
    public readonly commands: Map<string, ICommandHandler>;

    /**
     * The current application state.
     */
    private state: IAppState;

    public constructor(options?: Partial<IAppOptions>, commands: Map<string, ICommandHandler> = new Map(), state?: Partial<IAppState>) {
        super();

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
        // Discord events.
        this.client.on("ready", () => {
            this.hideHeader();

            this.updateState({
                token: this.client.token
            });
            
            this.appendSystemMessage(`Successfully connected as {bold}${this.client.user.tag}{/bold}`);

            const firstGuild: Guild = this.client.guilds.first();

            if (firstGuild) {
                this.setActiveGuild(firstGuild);
            }

            this.showChannels();
            this.saveStateSync();
        });

        this.client.on("message", this.handleMessage.bind(this));
        this.client.on("messageUpdate", this.handleMessage.bind(this));

        this.client.on("error", (error: Error) => {
            this.appendSystemMessage(`An error occurred within the client: ${error.message}`);
        });

        this.client.on("guildCreate", (guild: Guild) => {
            this.appendSystemMessage(`Joined guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
        });

        this.client.on("guildDelete", (guild: Guild) => {
            this.appendSystemMessage(`Left guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
        });

        // Append nodes.
        this.options.screen.append(this.options.nodes.input);
        this.options.screen.append(this.options.nodes.messages);
        this.options.screen.append(this.options.nodes.channels);
        this.options.screen.append(this.options.nodes.header);

        // Sync state.
        await this.syncState();

        // Load & apply saved theme
        this.loadTheme(this.state.theme);

        if (init) {
            this.init();
        }

        return this;
    }

    /**
     * Change the application's state, triggering
     * a state change event.
     */
    public updateState(changes: Partial<IAppState>): this {
        this.emit("stateWillChange");

        // Store current state as previous state.
        const previousState: IAppState = this.state;

        // Update the state.
        this.state = {
            ...this.state,
            ...changes
        };

        // Fire the state change event. Provide the old and new state.
        this.emit("stateChanged", this.state, previousState);

        return this;
    }

    /**
     * Retrieve the current application state.
     */
    public getState(): Readonly<IAppState> {
        return this.state;
    }

    private handleMessage(msg: Message): void {
        if (msg.author.id === this.client.user.id) {
            this.updateState({
                lastMessage: msg
            });
        }

        if (this.state.ignoredUsers.includes(msg.author.id)) {
            return;
        }
        else if (this.state.trackList.includes(msg.author.id)) {
            this.appendSpecialMessage("Track", msg.author.tag, msg.content);

            return;
        }
        else if (this.state.ignoreBots && msg.author.bot && msg.author.id !== this.client.user.id) {
            return;
        }
        else if (this.state.ignoreEmptyMessages && !msg.content) {
            return;
        }

        let content: string = msg.cleanContent;

        if (content.startsWith("$dt_")) {
            try {
                content = Encryption.decrypt(content.substr(4), this.state.decriptionKey);
            }
            catch (error) {
                // Don't show the error.
                //this.appendSystemMessage(`Could not decrypt message: ${error.message}`);
            }
        }

        if (msg.author.id === this.client.user.id) {
            if (msg.channel.type === "text") {
                this.appendSelfMessage(this.client.user.tag, content);
            }
            else if (msg.channel.type === "dm") {
                this.appendSpecialMessage(`${chalk.green("=>")} DM`, (msg.channel as DMChannel).recipient.tag, content, "blue");
            }
        }
        else if (this.state.guild && this.state.channel && msg.channel.id === this.state.channel.id) {
            // TODO: Turn this into a function
            const modifiers: string[] = [];

            if (msg.guild && msg.member) {
                if (msg.member.hasPermission("MANAGE_MESSAGES")) {
                    modifiers.push(chalk.red("+"));
                }

                if (msg.author.bot) {
                    modifiers.push(chalk.blue("&"));
                }
                if (msg.member.hasPermission("MANAGE_GUILD")) {
                    modifiers.push(chalk.green("$"));
                }
            }

            this.appendUserMessage(msg.author.tag, content, modifiers);
        }
        else if (msg.channel.type === "dm") {
            this.appendSpecialMessage(`${chalk.green("<=")} DM`, msg.author.tag, content, "blue");
        }
        else if (this.state.globalMessages) {
            this.appendSpecialMessage("Global", msg.author.tag, content);
        }
    }

    /**
     * Load and apply previously saved state from the
     * file system.
     */
    public async syncState(): Promise<boolean> {
        if (fs.existsSync(this.options.stateFilePath)) {
            return new Promise<boolean>((resolve) => {
                fs.readFile(this.options.stateFilePath, (error: Error, data: Buffer) => {
                    if (error) {
                        this.appendSystemMessage(`There was an error while reading the state file: ${error.message}`);

                        resolve(false);

                        return;
                    }

                    this.state = {
                        ...JSON.parse(data.toString()),
                        guild: this.state.guild,
                        channel: this.state.channel,
                        themeData: this.state.themeData
                    };

                    this.appendSystemMessage(`Synced state @ ${this.options.stateFilePath} (${data.length} bytes)`);

                    resolve(true);
                });
            });
        }

        return false;
    }

    public showChannels(): this {
        if (this.options.nodes.channels.hidden) {
            // Messages.
            this.options.nodes.messages.width = "75%+2";
            this.options.nodes.messages.left = "25%";

            // Input.
            this.options.nodes.input.width = "75%+2";
            this.options.nodes.input.left = "25%";

            // Header.
            this.options.nodes.header.width = "75%+2";
            this.options.nodes.header.left = "25%";

            this.options.nodes.channels.show();
            this.render();
        }

        return this;
    }

    public hideChannels(): this {
        if (!this.options.nodes.channels.hidden) {
            // Messages.
            this.options.nodes.messages.width = "100%";
            this.options.nodes.messages.left = "0%";

            // Input.
            this.options.nodes.input.width = "100%";
            this.options.nodes.input.left = "0%";

            // Header.
            this.options.nodes.header.width = "100%";
            this.options.nodes.header.left = "0%";

            this.options.nodes.channels.hide();
            this.render();
        }

        return this;
    }

    public toggleChannels(): this {
        this.options.nodes.channels.visible ? this.hideChannels() : this.showChannels();

        return this;
    }

    private setupEvents(): this {
        setupEvents(this);

        return this;
    }

    /**
     * Show the client as typing in the currently
     * active channel.
     */
    public startTyping(): this {
        if (!this.state.muted && this.state.guild && this.state.channel && this.state.typingTimeout === undefined) {
            this.state.channel.startTyping();

            this.updateState({
                typingTimeout: setTimeout(() => {
                    this.stopTyping();
                }, 10000)
            });
        }

        return this;
    }

    /**
     * Stop the client from typing in the currently
     * active channel if applicable.
     */
    public stopTyping(): this {
        if (this.state.guild && this.state.channel && this.state.typingTimeout !== undefined) {
            clearTimeout(this.state.typingTimeout);

            this.updateState({
                typingTimeout: undefined
            });

            this.state.channel.stopTyping();
        }

        return this;
    }

    public getInput(clear: boolean = false): string {
        const value: string = this.options.nodes.input.getValue();

        if (clear) {
            this.clearInput();
        }

        return value.trim();
    }

    public clearInput(newValue: string = ""): this {
        this.options.nodes.input.setValue(newValue);

        if (this.options.screen.focused !== this.options.nodes.input) {
            this.options.nodes.input.focus();
        }

        this.render();

        return this;
    }

    public appendInput(value: string): this {
        this.clearInput(this.getInput() + value);

        return this;
    }

    /**
     * Destroy the client, save the state and exit
     * the application.
     */
    public async shutdown(code: number = 0): Promise<void> {
        this.stopTyping();
        await this.client.destroy();
        this.saveStateSync();
        process.exit(code);
    }

    public updateChannels(render: boolean = false): this {
        if (!this.state.guild) {
            return this;
        }

        // Fixes "ghost" children bug.
        for (let i: number = 0; i < this.options.nodes.channels.children.length; i++) {
            this.options.nodes.channels.remove(this.options.nodes.channels.children[i]);
        }

        const channels: TextChannel[] = this.state.guild.channels.array().filter((channel: Channel) => channel.type === "text") as TextChannel[];

        for (let i: number = 0; i < channels.length; i++) {
            let channelName: string = channels[i].name;

            // TODO: Use a constant for the pattern.
            // This fixes UI being messed up due to channel names containing unicode emojis.
            while (/[^a-z0-9-_?]+/gm.test(channelName)) {
                channelName = channelName.replace(/[^a-z0-9-_]+/gm, "?");
            }

            if (channelName.length > 25) {
                channelName = channelName.substring(0, 21) + " ...";
            }

            const channelNode: Widgets.BoxElement = blessed.box({
                style: {
                    bg: this.state.themeData.channels.backgroundColor,
                    fg: this.state.themeData.channels.foregroundColor,

                    // TODO: Not working
                    bold: this.state.channel !== undefined && this.state.channel.id === channels[i].id,

                    hover: {
                        bg: this.state.themeData.channels.backgroundColorHover,
                        fg: this.state.themeData.channels.foregroundColorHover
                    }
                },

                content: `#${channelName}`,
                width: "100%-2",
                height: "shrink",
                top: i,
                left: "0%",
                clickable: true
            });

            channelNode.on("click", () => {
                if (this.state.guild && this.state.channel && channels[i].id !== this.state.channel.id && this.state.guild.channels.has(channels[i].id)) {
                    this.setActiveChannel(channels[i]);
                }
            });

            this.options.nodes.channels.append(channelNode);
        }

        if (render) {
            this.render(false, false);
        }

        return this;
    }

    private setupInternalCommands(): this {
        setupInternalCommands(this);

        return this;
    }

    public loadTheme(name: string): this {
        if (!name) {
            return;
        }
        // TODO: Trivial expression.
        /*else if (this.state.theme === name) {
            return this;
        }*/

        // TODO: Allow to change themes folder path (by option).
        const themePath: string = path.join(__dirname, "../", "themes", `${name}.json`);

        if (name === defaultAppState.theme) {
            this.setTheme(defaultAppState.theme, defaultAppState.themeData, 0);
        }
        else if (fs.existsSync(themePath)) {
            this.appendSystemMessage(`Loading theme '{bold}${name}{/bold}' ...`);

            // TODO: Verify schema.
            const theme: any = fs.readFileSync(themePath).toString();

            // TODO: Catch possible parsing errors.
            this.setTheme(name, JSON.parse(theme), theme.length);
        }
        else {
            this.appendSystemMessage("Such theme file could not be found (Are you sure thats under the {bold}themes{/bold} folder?)");
        }

        return this;
    }

    public setTheme(name: string, data: any, length: number): this {
        if (!data) {
            this.appendSystemMessage("Error while setting theme: No data was provided for the theme");

            return this;
        }

        this.updateState({
            theme: name,
            themeData: data
        });

        // Messages.
        this.options.nodes.messages.style.fg = this.state.themeData.messages.foregroundColor;
        this.options.nodes.messages.style.bg = this.state.themeData.messages.backgroundColor;

        // Input.
        this.options.nodes.input.style.fg = this.state.themeData.input.foregroundColor;
        this.options.nodes.input.style.bg = this.state.themeData.input.backgroundColor;

        // Channels.
        this.options.nodes.channels.style.fg = this.state.themeData.channels.foregroundColor;
        this.options.nodes.channels.style.bg = this.state.themeData.channels.backgroundColor;

        // Header.
        this.options.nodes.header.style.fg = this.state.themeData.header.foregroundColor;
        this.options.nodes.header.style.bg = this.state.themeData.header.backgroundColor;

        this.updateChannels();
        this.appendSystemMessage(`Applied theme '${name}' (${length} bytes)`);

        return this;
    }

    private updateTitle(): this {
        if (this.state.guild && this.state.channel) {
            this.options.screen.title = `Discord Terminal @ ${this.state.guild.name} # ${this.state.channel.name}`;
        }
        else if (this.state.guild) {
            this.options.screen.title = `Discord Terminal @ ${this.state.guild.name}`;
        }
        else {
            this.options.screen.title = "Discord Terminal";
        }

        return this;
    }

    public getTags(): string[] {
        return Object.keys(this.state.tags);
    }

    public hasTag(name: string): boolean {
        return this.getTags().includes(name);
    }

    public getTag(name: string): string | null {
        const keys: string[] = this.getTags();

        if (!keys.includes(name)) {
            return name;
        }

        return this.state.tags[name];
    }

    public setTag(name: string, value: string): this {
        this.state.tags[name] = value;

        return this;
    }

    public deleteTag(name: string): boolean {
        if (this.hasTag(name)) {
            delete this.state.tags[name];

            return true;
        }

        return false;
    }

    public saveStateSync(): this {
        this.appendSystemMessage("Saving application state ...");

        const data: string = JSON.stringify({
            ...this.state,
            guild: undefined,
            channel: undefined,
            lastMessage: undefined,
            typingTimeout: undefined,
            autoHideHeaderTimeout: undefined,
            themeData: undefined
        });

        fs.writeFileSync(this.options.stateFilePath, data);
        this.appendSystemMessage(`Application state saved @ '${this.options.stateFilePath}' (${data.length} bytes)`);

        return this;
    }

    public login(token: string): this {
        this.client.login(token).catch((error: Error) => {
            this.appendSystemMessage(`Login failed: ${error.message}`);
        });

        return this;
    }

    public init(): this {
        const clipboard: string = clipboardy.readSync();

        if (this.state.token) {
            this.appendSystemMessage(`Attempting to login using saved token; Use {bold}${this.options.commandPrefix}forget{/bold} to forget the token`);
            this.login(this.state.token);
        }
        else if (Pattern.token.test(clipboard)) {
            this.appendSystemMessage("Attempting to login using token in clipboard");
            this.login(clipboard);
        }
        else if (process.env.TOKEN !== undefined) {
            this.appendSystemMessage("Attempting to login using environment token");
            this.login(process.env.TOKEN);
        }
        else {
            this.options.nodes.input.setValue(`${this.options.commandPrefix}login `);
            this.showHeader("{bold}Pro Tip.{/bold} Set the environment variable {bold}TOKEN{/bold} to automagically login!");
            this.appendSystemMessage("Welcome! Please login using {bold}/login <token>{/bold} or {bold}/help{/bold} to view available commands");
        }

        this.setupEvents()
            .setupInternalCommands();

        return this;
    }

    public setActiveGuild(guild: Guild): this {
        this.updateState({
            guild
        });

        this.appendSystemMessage(`Switched to guild '{bold}${this.state.guild.name}{/bold}'`);

        const defaultChannel: TextChannel | null = Utils.findDefaultChannel(this.state.guild);

        if (defaultChannel !== null) {
            this.setActiveChannel(defaultChannel);
        }
        else {
            this.appendSystemMessage(`Warning: Guild '${this.state.guild.name}' doesn't have any text channels`);
        }

        this.updateTitle();
        this.updateChannels(true);

        return this;
    }

    public showHeader(text: string, autoHide: boolean = false): boolean {
        if (!text) {
            throw new Error("[Display.showHeader] Expecting header text");
        }

        this.options.nodes.header.content = `[!] ${text}`;

        if (!this.options.nodes.header.visible) {
            // Messages.
            this.options.nodes.messages.top = "0%+3";
            this.options.nodes.messages.height = "100%-6";

            // Header.
            this.options.nodes.header.hidden = false;
        }

        if (autoHide) {
            if (this.state.autoHideHeaderTimeout) {
                clearTimeout(this.state.autoHideHeaderTimeout);
            }

            this.updateState({
                autoHideHeaderTimeout: setTimeout(this.hideHeader.bind(this), text.length * this.options.headerAutoHideTimeoutPerChar)
            });
        }

        this.render();

        return true;
    }

    public hideHeader(): boolean {
        if (!this.options.nodes.header.visible) {
            return false;
        }

        // Messages.
        this.options.nodes.messages.top = "0%";
        this.options.nodes.messages.height = "100%-3";

        // Header.
        this.options.nodes.header.hidden = true;

        this.render();

        return true;
    }

    public setActiveChannel(channel: TextChannel): this {
        this.stopTyping();

        this.updateState({
            channel
        });

        
        this.updateTitle();
        this.appendSystemMessage(`Switched to channel '{bold}${this.state.channel.name}{/bold}'`);

        return this;
    }

    // TODO: Also include time.
    public appendMessage(sender: string, message: string, senderColor: string = "white", messageColor: string = this.state.themeData.messages.foregroundColor): this {
        let messageString: string = message;

        if (messageColor.startsWith("#")) {
            messageString = chalk.hex(messageColor)(messageString);
        }
        else if (chalk[messageColor] === undefined || typeof chalk[messageColor] !== "function") {
            this.appendSystemMessage("Refusing to append message: An invalid color was provided");

            return this;
        }
        else {
            messageString = ((chalk as any)[messageColor] as any)(message);
        }

        let line: string = this.state.messageFormat
            // TODO: Catch error if sender color doesn't exist.
            .replace("{sender}", chalk[senderColor](sender))
            .replace("{message}", messageString);

        if (sender !== `{bold}${SpecialSenders.System}{/bold}`) {
            const splitLine: string[] = line.split(" ");

            for (let i: number = 0; i < this.state.wordPins.length; i++) {
                while (splitLine.includes(this.state.wordPins[i])) {
                    splitLine[splitLine.indexOf(this.state.wordPins[i])] = chalk.bgCyan.white(this.state.wordPins[i]);
                }
            }

            line = splitLine.join(" ");
        }

        this.options.nodes.messages.pushLine(line);
        this.options.nodes.messages.setScrollPerc(100);
        this.render();

        return this;
    }

    public render(hard: boolean = false, updateChannels: boolean = false): this {
        if (updateChannels) {
            this.updateChannels(false);
        }

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

    public appendSpecialMessage(prefix: string, sender: string, message: string, color: string = "yellow"): this {
        this.appendMessage(`${prefix} ~> @{bold}${sender}{/bold}`, message, color);

        return this;
    }

    public appendSystemMessage(message: string): this {
        this.appendMessage(`{bold}${SpecialSenders.System}{/bold}`, message, "green");

        return this;
    }
}
