import App from "./app";

export type IPlugin = {
    readonly name: string;

    readonly description?: string;

    readonly version: string;

    readonly author?: string;

    enabled(app: App): void;

    disabled(app: App): void;
}
