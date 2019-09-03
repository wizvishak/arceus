import State from "./state/state";

export default class Tags {
    protected readonly state: State;

    public constructor(state: State) {
        this.state = state;
    }

    public getAll(): string[] {
        return Object.keys(this.state.get().tags);
    }

    public has(name: string): boolean {
        return this.getAll().includes(name);
    }

    public get(name: string): string | null {
        const keys: string[] = this.getAll();

        if (!keys.includes(name)) {
            return name;
        }

        return this.state.get().tags[name];
    }

    public set(name: string, value: string): this {
        this.state.get().tags[name] = value;

        return this;
    }

    public delete(name: string): boolean {
        if (this.has(name)) {
            delete this.state.get().tags[name];

            return true;
        }

        return false;
    }
}
