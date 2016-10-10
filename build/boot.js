if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        }
        else {
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
var Boot = (function () {
    function Boot() {
        this.included = false;
        this.loaded = false;
        this.requestCount = 0;
        this.sources = [];
        this.moduleCount = 0;
        this.modules = [];
        if (window["boot"])
            return;
        var me = this;
        window["boot"] = me;
        me.processIncludes();
        window.addEventListener("DOMContentLoaded", function () {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = function () { return me.processUses(); };
            document.body.appendChild(script);
            script.src = "build/app.js";
        });
    }
    Boot.prototype.start = function () {
        if (this.included && this.loaded) {
            if (typeof window["main"] === "function")
                window["main"]();
        }
    };
    Boot.prototype.processIncludes = function () {
        var me = this;
        function slice(items) {
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
        var _loop_1 = function(item) {
            src = item.getAttribute("src");
            if (src.endsWith(".css")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1) {
                    load();
                    return "continue";
                }
                me.sources.push(src);
                var link = document.createElement("link");
                link.rel = "stylesheet";
                link.type = "text/css";
                link.onload = function () { load(); };
                document.getElementsByTagName("head")[0].appendChild(link);
                link.href = src;
            }
            else if (src.endsWith(".js")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1) {
                    load();
                    return "continue";
                }
                me.sources.push(src);
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.onload = function () { load(); };
                document.body.appendChild(script);
                script.src = src;
            }
            else {
                var parent_1 = item.parentNode;
                var next_1 = item.nextSibling;
                parent_1.removeChild(item);
                me.open(src, function (result, includeNode) {
                    includeNode.innerHTML = result;
                    var nodes = slice(includeNode.children);
                    while (nodes.length) {
                        var node = nodes.shift();
                        parent_1.insertBefore(node, next_1);
                    }
                    load();
                }, item);
            }
        };
        var src;
        for (var _i = 0, includes_1 = includes; _i < includes_1.length; _i++) {
            var item = includes_1[_i];
            _loop_1(item);
        }
    };
    Boot.prototype.open = function (url, onload, state) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = function () {
            onload(request.response, state);
        };
        request.send();
    };
    Boot.prototype.processUses = function () {
        var me = this;
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
            "rivets": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/rivets/0.9.4/rivets.bundled.min.js",
                "identifier": "rivets"
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
        for (var _i = 0, _a = me.modules; _i < _a.length; _i++) {
            var key = _a[_i];
            var module = entries[key];
            if (!module || window[module.url] || me.sources.indexOf(module.url) > -1) {
                load();
                continue;
            }
            me.sources.push(module.url);
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = function () { load(); };
            document.body.appendChild(script);
            script.src = module.url;
        }
    };
    Boot.prototype.use = function (module) {
        var items = Array.isArray(module) ? module : [module];
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            if (this.modules.indexOf(item) < 0)
                this.modules.push(item);
        }
    };
    return Boot;
}());
new Boot();
//# sourceMappingURL=boot.js.map