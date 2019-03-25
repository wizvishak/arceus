import Display from "./display";

export type IPlugin = {
    readonly name: string;
    readonly description?: string;
    readonly version: string;
    readonly author?: string;

    enabled(display: Display): void;
    disabled(display: Display): void;
}
