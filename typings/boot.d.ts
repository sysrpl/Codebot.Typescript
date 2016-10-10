interface String {
    includes(search: string, start?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    endsWith(searchString: string, position?: number): boolean;
}
declare type BootModule = "greensock" | "jquery" | "rivets" | "three";
declare class Boot {
    private included;
    private loaded;
    private requestCount;
    private sources;
    private moduleCount;
    private modules;
    private start();
    private processIncludes();
    open(url: string, onload: (result: string, state?: any) => void, state?: any): void;
    private processUses();
    use(module: BootModule | Array<BootModule>): void;
    constructor();
}
declare var boot: Boot;
