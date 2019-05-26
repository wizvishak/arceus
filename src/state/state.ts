import {Snowflake, TextChannel, Guild, Message} from "discord.js";

export type IState = {
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

export default class State {
    /**
     * Change the application's state, triggering
     * a state change event.
     */
    public updateState(changes: Partial<IState>): this {
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

    public sync(): void {
        // TODO
    }

    public save(): void {
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
    }
}
