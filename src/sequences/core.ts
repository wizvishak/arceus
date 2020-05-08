import {pickRandomRange} from "./utils";

// Talk
export class TalkOptions {
    public prefix: string = '';
    public words: string[];
    public silence: number;
}

export  default class Talk {
    public prefix: string = '';
    public words: string[];
    public silence: number;

    constructor(options: TalkOptions) {
        this.prefix = options.prefix;
        this.words = options.words
            .map((cmd: string) => `${this.prefix}${cmd}`);
        this.silence = options.silence;
    }

    public talk(): string {
        const {words} = this;
        return words[pickRandomRange(0, words.length - 1)]
    }
}

// Timer
export namespace Timer {
    import Timeout = NodeJS.Timeout;
    export let active: Timeout;
}