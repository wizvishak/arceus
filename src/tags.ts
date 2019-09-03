import State from "./state/state";

export default class Tags {
    protected readonly state: State;

    public constructor(state: State) {
        this.state = state;
    }

    public getTags(): string[] {
        return Object.keys(this.state.get().tags);
    }

    public hasTag(name: string): boolean {
        return this.getTags().includes(name);
    }

    public getTag(name: string): string | null {
        const keys: string[] = this.getTags();

        if (!keys.includes(name)) {
            return name;
        }

        return this.state.get().tags[name];
    }

    public setTag(name: string, value: string): this {
        this.state.get().tags[name] = value;

        return this;
    }

    public deleteTag(name: string): boolean {
        if (this.hasTag(name)) {
            delete this.state.get().tags[name];

            return true;
        }

        return false;
    }
}
