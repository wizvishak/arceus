import MessageFactory from "./messageFactory";
import State from "../state/state";

export default class Context {
    private static globalContext: Context = new Context();

    public static getGlobal(): Context {
        return Context.globalContext;
    }

    public readonly state: State;

    public readonly message: MessageFactory;

    public constructor() {
        this.state = new State();
        this.message = new MessageFactory();
    }
}
