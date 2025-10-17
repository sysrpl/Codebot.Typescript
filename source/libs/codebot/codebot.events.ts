type Handler = (...args: any[]) => void;
type EventMap = { [eventName: string]: Handler[] };

interface NotifyArgs {
    sender: object
};

class EventManager {
    private events: EventMap = {};

    public addEventListener(name: string, handler: Handler): () => void {
        if (!this.events[name])
            this.events[name] = [];
        this.events[name].push(handler);
        return () =>
            this.events[name] = this.events[name].filter(h => h !== handler);
    }

    protected notify(eventName: string, ...args: any[]): void {
        const handlers = this.events[eventName] || [];
        for (const handler of handlers)
            handler(...args);
    }
}