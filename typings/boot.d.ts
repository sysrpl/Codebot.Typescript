interface String {
    includes(search: string, start?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    endsWith(searchString: string, position?: number): boolean;
}

type BootModule = "greensock" | "jquery" | "three";

interface Boot {
    open(url: string, onload: (result: string, state?: any) => void, state?: any): void;
    use(module: BootModule | Array<BootModule>): void;
}

declare var boot: Boot;
