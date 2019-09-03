import {Snowflake, TextChannel, Guild, Message} from "discord.js";
import {EventEmitter} from "events";
import fs from "fs";
import {defaultState} from "./stateConstants";
import App from "../app";

export interface IStateOptions {
    readonly stateFilePath: string;
}

export interface IState {
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

export default class State extends EventEmitter {
    public readonly options: IStateOptions;

    protected state: IState;

    protected readonly app: App;

    public constructor(app: App, options: IStateOptions, initialState?: Partial<IState>) {
        super();

        this.app = app;
        this.options = options;

        // Initialize the state.
        this.state = {
            ...defaultState,
            ...initialState
        };
    }

    public get(): IState {
        return Object.assign({}, this.state);
    }

    /**
     * Change the application's state, triggering
     * a state change event.
     */
    public update(changes: Partial<IState>): this {
        this.emit("stateWillChange");

        // Store current state as previous state.
        const previousState: IState = this.state;

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
     * Load and apply previously saved state from the
     * file system.
     */
    public async sync(): Promise<boolean> {
        if (fs.existsSync(this.options.stateFilePath)) {
            return new Promise<boolean>((resolve) => {
                fs.readFile(this.options.stateFilePath, (error: Error, data: Buffer) => {
                    if (error) {
                        this.app.message.system(`There was an error while reading the state file: ${error.message}`);

                        resolve(false);

                        return;
                    }

                    this.state = {
                        ...JSON.parse(data.toString()),
                        guild: this.state.guild,
                        channel: this.state.channel,
                        themeData: this.state.themeData
                    };

                    this.app.message.system(`Synced state @ ${this.options.stateFilePath} (${data.length} bytes)`);

                    resolve(true);
                });
            });
        }

        return false;
    }

    public save(): void {
        this.app.message.system("Saving application state ...");

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
        this.app.message.system(`Application state saved @ '${this.options.stateFilePath}' (${data.length} bytes)`);
    }

    public saveSync(): this {
        this.app.message.system("Saving application state ...");

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
        this.app.message.system(`Application state saved @ '${this.options.stateFilePath}' (${data.length} bytes)`);

        return this;
    }
}
