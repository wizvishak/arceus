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

    private sequenceCounter: number = 0;

    constructor(options: TalkOptions) {
        this.prefix = options.prefix;
        this.words = options.words
            .map((cmd: string) => `${this.prefix}${cmd}`);
        this.silence = options.silence;

        this.teachWords();
    }

    public talk(): string {
        const {words} = this;

        return words[pickRandomRange(0, words.length - 1)];
    }

    public talkInOrder(): string {
        let {
            words,
            sequenceCounter
        } = this;

        if (sequenceCounter >= this.words.length)
            sequenceCounter = this.sequenceCounter = 0;
        else
            this.sequenceCounter++;

        return words[sequenceCounter];
    }

    public talking(): boolean {
        return (this.sequenceCounter != this.words.length);
    }

    public teachWords(): void {}
}

// Timer
export namespace Timer {
    import Timeout = NodeJS.Timeout;
    export let active: Timeout;
}