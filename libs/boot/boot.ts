interface String {
    includes(search: string, start?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    endsWith(searchString: string, position?: number): boolean;
}

if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

type BootModule = "greensock" | "jquery" | "three";

class Boot {
    private included = false;
    private loaded = false;
    private requestCount = 0;
    private sources = [];
    private moduleCount = 0;
    private modules = [];

    private start(): void {
        if (this.included && this.loaded) {
            if (typeof window["main"] === "function")
                window["main"]();
        }
    }

    private processIncludes(): void {
        let me = this;

        function slice(items): Array<HTMLElement> {
            return Array.prototype.slice.call(items);
        }

        function load() {
            me.requestCount--;
            if (me.requestCount == 0)
                me.processIncludes();
        }

        var includes = slice(document.getElementsByTagName("include"));
        me.requestCount += includes.length;
        if (me.requestCount == 0) {
            me.included = true;
            me.start();
            return;
        }
        for (let item of includes) {
            var src = item.getAttribute("src");
            if (src.endsWith(".css")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1) {
                    load();
                    continue;
                }
                me.sources.push(src);
                let link = document.createElement("link");
                link.rel = "stylesheet";
                link.type = "text/css";
                link.onload = () => { load(); };
                document.getElementsByTagName("head")[0].appendChild(link);
                link.href = src;
            }
            else if (src.endsWith(".js")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1) {
                    load();
                    continue;
                }
                me.sources.push(src);
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.onload = () => { load(); };
                document.body.appendChild(script);
                script.src = src;
            }
            else {
                let parent = item.parentNode;
                let next = item.nextSibling;
                parent.removeChild(item);
                me.open(src, (result: string, includeNode: HTMLElement) => {
                    includeNode.innerHTML = result;
                    let nodes = slice(includeNode.children);
                    while (nodes.length) {
                        let node = nodes.shift();
                        parent.insertBefore(node, next);
                    }
                    load();
                }, item);
            }
        }
    }

    open(url: string, onload: (result: string, state?: any) => void, state?: any): void {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            onload(request.response, state);
        }
        request.send();
    }

    private processUses(): void {
        let me = this;

        function load() {
            me.moduleCount--;
            if (me.moduleCount == 0) {
                me.loaded = true;
                me.start();
            }
        }

        var entries = {
            "greensock": {
                "url": "http://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenMax.min.js",
                "identifier": "TweenMax"
            },
            "jquery": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js",
                "identifier": "jQuery"
            },
            "three": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r80/three.min.js",
                "identifier": "THREE"
            }
        };

        me.moduleCount = me.modules.length;
        if (me.moduleCount == 0) {
            me.moduleCount = 1;
            load();
            return;
        }
        for (let key of me.modules) {
            let module = entries[key];
            if (!module || window[module.url] || me.sources.indexOf(module.url) > -1) {
                load();
                continue;
            }
            me.sources.push(module.url);
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => { load(); }
            document.body.appendChild(script);
            script.src = module.url;
        }
    }

    use(module: BootModule | Array<BootModule>): void {
        let items = Array.isArray(module) ? module : [module];
        for (let item of items)
            if (this.modules.indexOf(item) < 0)
                this.modules.push(item);
    }

    constructor() {
        if (window["boot"])
            return;
        let me = this;
        window["boot"] = me;
        me.processIncludes();
        window.addEventListener("DOMContentLoaded", () => {
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => me.processUses();
            document.body.appendChild(script);
            script.src = "build/app.js";
        });
    }
}

declare var boot: Boot;

new Boot();