function main() {
    "Hello World".writeLine();
}
/** The static Test class can be used to aide in unit testing. */
var Test = (function () {
    function Test() {
    }
    /** Test a condition and write the result.
     * @param condition The test result being considered.
     * @param name The name associated with the condition.
    */
    Test.verify = function (condition, name) {
        Test.writeLine(name, ": ", condition ? "success" : "fail");
    };
    /** Write a break and an optional new heading section to a document.
     * @param message Optional heading text.
     */
    Test.writeBreak = function (message) {
        var h2 = document.createElement("h2");
        if (message)
            h2.innerText = message;
        document.body.appendChild(h2);
    };
    /** Write lines of text to a document. */
    Test.writeLine = function () {
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i - 0] = arguments[_i];
        }
        var div = document.createElement("div");
        div.innerText = content.join("");
        document.body.appendChild(div);
    };
    return Test;
}());
/** Add a cookie to the client if allowed.
 * @param name The name used to identify the cookie.
 * @param value The value stored associated with the name.
 * @param days The number of days the cookie persists.
 */
function addCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + (days * millisecondsPerDay));
        expires = "; expires=" + date.toUTCString();
    }
    else
        expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}
/** Remove a cookie from the client.
 * @param name The name of the cookie to be removed.
 */
function removeCookie(name) {
    addCookie(name, "", -1);
}
/** Read the value of a cookie from the client.
 * @param name The name of the cookie to be read.
 */
function readCookie(name) {
    name += "=";
    var cookies = document.cookie.split(';');
    for (var _i = 0, cookies_1 = cookies; _i < cookies_1.length; _i++) {
        var cookie = cookies_1[_i];
        cookie = cookie.trim();
        if (cookie.indexOf(name) == 0)
            return cookie.substring(name.length, cookie.length);
    }
    return undefined;
}
HTMLElement.prototype.nthElementChild = function (index) {
    var element = this.firstElementChild;
    while (index > 0) {
        index--;
        element = element.nextElementSibling;
    }
    return element;
};
HTMLElement.prototype.hasClass = function (value) {
    var values = isString(value) ? [value] : value;
    var i = values.length;
    var items = this.className.splitTrim();
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (values.contains(item))
            i--;
    }
    ;
    return i == 0;
};
HTMLElement.prototype.addClass = function (value) {
    var names = isString(value) ? [value] : value;
    var items = this.className.splitTrim();
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        if (names.contains(item))
            continue;
        names.push(item);
    }
    this.className = names.join(" ");
};
HTMLElement.prototype.removeClass = function (value) {
    var values = isString(value) ? [value] : value;
    var names = [];
    var items = this.className.split(" ");
    for (var _i = 0, items_3 = items; _i < items_3.length; _i++) {
        var item = items_3[_i];
        if (values.contains(item))
            continue;
        else
            names.push(item);
    }
    this.className = names.join(" ");
};
HTMLElement.prototype.mapPoint = function (event) {
    var rect = this.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};
HTMLElement.prototype.__defineGetter__("bounds", function () {
    var rect = this.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});
/** Find script node inside an HTMLElement object and executes them.
 * @param element The HTMLElement object to search.
*/
function executeScripts(element) {
    function nodeNameEquals(elem, name) {
        return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
    }
    function evalScript(elem) {
        var data = (elem.text || elem.textContent || elem.innerHTML || "");
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement("script");
        script.type = "text/javascript";
        try {
            script.appendChild(document.createTextNode(data));
        }
        catch (e) {
            script.text = data;
        }
        head.insertBefore(script, head.firstChild);
        head.removeChild(script);
    }
    var scripts = [], script;
    var children = element.childNodes, child;
    for (var i = 0; children[i]; i++) {
        child = children[i];
        if (nodeNameEquals(child, "script") && (!child.type || child.type.toLowerCase() == "text/javascript"))
            scripts.push(child);
    }
    for (var i = 0; scripts[i]; i++) {
        script = scripts[i];
        if (script.parentNode)
            script.parentNode.removeChild(script);
        evalScript(scripts[i]);
    }
}
/** Load a javascript file asynchronously.
 * @param url The content delivery resource for the script.
 * @param callback Notification of when a script has completely loaded.
 */
function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    var loaded = false;
    script.onload = script["onreadystatechange"] = function () {
        if (!loaded && (!this.readyState || this.readyState == "complete")) {
            loaded = true;
            callback();
        }
    };
    var node = document.getElementsByTagName("script")[0];
    node.parentNode.insertBefore(script, node);
}
/** Query the DOM using a selector and return a single HTMLElement.
 * @param query The selector text.
 */
function getElement(query) {
    if (isString(query))
        return document.querySelector(query);
    else if (query instanceof HTMLElement)
        return query;
    else
        return query[0];
}
/** Query the DOM using a selector and return all matching HTMLElements.
 * @param query The selector text.
 */
function getElements(query) {
    if (isString(query)) {
        var nodes = document.querySelectorAll(query);
        return Array.prototype.slice.call(nodes);
    }
    else if (query instanceof HTMLElement)
        return [query];
    else
        return query;
}
/** Sets the style on one or more HTMLElements.
 * @param query The selector or elements to modify.
 * @param styles A list of styles and values to be set.
 */
function setStyle(query, styles) {
    var elements = getElements(query);
    var keys = Object.keys(styles);
    for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
        var e = elements_1[_i];
        var style = e.style;
        for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
            var k = keys_1[_a];
            var value = styles[k];
            style[k] = isNumber(value) ? value + "px" : value;
        }
    }
}
/** Removes one or more inline styles from HTMLElements.
 * @param query The selector or elements to modify.
 * @param styles A list of styles names such as "margin-left" and "background-color".
 */
function removeStyle(query, styles) {
    var items = isString(styles) ? styles.splitTrim(" ") : styles;
    var elements = getElements(query);
    for (var _i = 0, items_4 = items; _i < items_4.length; _i++) {
        var item = items_4[_i];
        var n = 'A'.charCodeAt(0);
        var z = 'Z'.charCodeAt(0);
        while (n <= z) {
            var c = String.fromCharCode(n);
            if (item.includes(c)) {
                item = item.replace(c, "-" + c.toLowerCase());
            }
            n++;
        }
        for (var _a = 0, elements_2 = elements; _a < elements_2.length; _a++) {
            var element = elements_2[_a];
            element.style.removeProperty(item);
        }
    }
}
/** Type guard for objects supporting addEventListener.
 * @param obj The object to test.
 */
function isEventCapable(obj) {
    return isDefined(obj["addEventListener"]);
}
/** Attach an event listener to zero or more objects.
 * @param query The objects to attach the event.
 * @param name The name of the event to attach (for example "load", "resize", ect).
 * @param event The event handler to be invoked.
 */
function addEvent(query, name, event) {
    var items = isEventCapable(query) ? [query] : getElements(query);
    for (var _i = 0, items_5 = items; _i < items_5.length; _i++) {
        var item = items_5[_i];
        item.addEventListener(name, event);
    }
}
/** Add a value to the class attribute to zero or more HTMLElements.
 * @param query The objects to modify,
 * @param value One or more values to add.
 */
function addClass(query, value) {
    var items = getElements(query);
    for (var _i = 0, items_6 = items; _i < items_6.length; _i++) {
        var e = items_6[_i];
        e.addClass(value);
    }
}
/** Remove a value from the class attribute to zero or more HTMLElements.
 * @param query The objects to modify,
 * @param value One or more values to remove.
 *
 */
function removeClass(query, value) {
    var items = getElements(query);
    for (var _i = 0, items_7 = items; _i < items_7.length; _i++) {
        var e = items_7[_i];
        e.removeClass(value);
    }
}
/** LocalCache is used by the Request object to capture responses.*/
var LocalCache = (function () {
    function LocalCache() {
        this.data = {};
    }
    LocalCache.prototype.remove = function (url) {
        delete this.data[url];
    };
    LocalCache.prototype.exists = function (url) {
        return this.data.hasOwnProperty(url) && isDefined(this.data[url]);
    };
    LocalCache.prototype.recall = function (url) {
        return this.data[url];
    };
    LocalCache.prototype.store = function (url, value) {
        this.data[url] = value;
    };
    return LocalCache;
}());
/** Request handles asynchronous http 'get' and 'post' requests. */
var Request = (function () {
    function Request() {
        this.localCache = new LocalCache();
        this.httpRequest = new XMLHttpRequest();
        var request = this;
        this.httpRequest.onreadystatechange = function () {
            request.httpRequestChange();
        };
    }
    Request.prototype.sendComplete = function (response) {
        this.response = response;
        if (this.cache) {
            this.localCache.store(this.url, this.response);
        }
        this.callback(this);
    };
    Request.prototype.httpRequestChange = function () {
        if (this.posting)
            return;
        if (this.httpRequest.readyState == 4 && this.httpRequest.status == 200) {
            this.sendComplete(this.httpRequest.responseText);
        }
    };
    /** Perform an asynchronous http get request.
     * @param url The endpoint for the requested resource.
     * @param callback Your notification invoked after request completes successfully.
     * @param cache When cache is true responses are reused for each distinct url.
     */
    Request.prototype.send = function (url, callback, cache) {
        this.httpRequest.abort();
        this.posting = false;
        this.httpRequest.open("GET", url);
        this.url = url;
        this.callback = callback;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else
            this.httpRequest.send();
    };
    /** Perform an asynchronous http post request.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    Request.prototype.post = function (url, data) {
        this.httpRequest.abort();
        this.posting = true;
        this.url = url;
        this.callback = undefined;
        this.cache = false;
        this.httpRequest.open("POST", url);
        this.httpRequest.send(data);
    };
    /** Cancel any pending send or post operations.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    Request.prototype.cancel = function () {
        this.httpRequest.abort();
    };
    return Request;
}());
/** Perform a one off asynchronous http get request.
 * @param url The endpoint for the requested resource.
 * @param callback Your notification invoked after the request completes successfully.
 */
function sendRequest(url, callback) {
    var r = new Request();
    r.send(url, callback);
}
/** Perform a one off asynchronous http post request.
 * @param url The endpoint for the requested resource.
 * @param data Data posted to recipient enpoint.
 */
function postRequest(url, data) {
    var r = new Request();
    r.post(url, data);
}
Array.prototype.contains = function (value) {
    return this.indexOf(value) > -1;
};
Array.prototype.shuffle = function () {
    var index = this.length, rand = 0;
    var temp;
    while (index != 0) {
        rand = Math.floor(Math.random() * index);
        index -= 1;
        temp = this[index];
        this[index] = this[rand];
        this[rand] = temp;
    }
};
Array.prototype.__defineGetter__("first", function () {
    return this[0];
});
/** Returns true if a value is not undefined and not null.
 * @param obj The value to test.
 */
function isDefined(obj) {
    return obj !== undefined && obj !== null;
}
/** Returns true if a value is undefined or null.
 * @param obj The value to test.
 */
function isUndefined(obj) {
    return obj === undefined || obj === null;
}
/** Return true if the device is a tablet or phone. */
function isMobile() {
    return isDefined(window.orientation);
}
/** Return true if the device is a desktop browser. */
function isDesktop() {
    return isUndefined(window.orientation);
}
/** Returns a default value if a value is undefined or null.
 * @param obj The value to test.
 * @param defaultValue The value to return if obj is undefined or null.
 */
function getDefault(obj, defaultValue) {
    return isDefined(obj) ? obj : defaultValue;
}
/** Returns true if an object is an array.
 * @param obj Object to check.
 */
function isArray(obj) {
    return Array.isArray(obj);
}
/** Type guard for Boolean.
 * @param obj Object to check.
 */
function isBoolean(obj) {
    return typeof (obj) === "boolean" || obj instanceof Boolean;
}
/** Type guard for String.
 * @param obj Object to check.
 */
function isString(obj) {
    return typeof (obj) === "string" || obj instanceof String;
}
/** Type guard for Number.
  * @param obj Object to check.
 */
function isNumber(obj) {
    return typeof (obj) === "number" || obj instanceof Number;
}
/** Type guard for classes.
  * @param obj Object to check.
  * @param type Type check (eg. String HTMLElement, Date ect).
  */
function isTypeOf(obj, type) {
    var t = type;
    if (t.name === "String")
        return isString(obj);
    if (t.name === "Number")
        return isNumber(obj);
    if (t.name === "Boolean")
        return isBoolean(obj);
    return obj instanceof type;
}
/** Perform an action after a very short delay. */
function shortDelay(action) {
    window.setTimeout(action, 10);
}
function initTouch() {
    // TODO: add all touch events
    function translateTouchMove(event) {
        var touch = event.changedTouches[0];
        var mouseEvent = document.createEvent("MouseEvent");
        mouseEvent.initMouseEvent("mousemover", true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
        touch.target.dispatchEvent(mouseEvent);
        mouseEvent.initMouseEvent("mousemove", true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
        touch.target.dispatchEvent(mouseEvent);
        event.preventDefault();
    }
    document.addEventListener("touchmove", translateTouchMove, true);
}
String.prototype.writeLine = function () {
    Test.writeLine(this);
};
String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};
String.prototype.splitTrim = function (separator) {
    var result = [];
    var items = this.split(isDefined(separator) ? separator : " ");
    for (var _i = 0, items_8 = items; _i < items_8.length; _i++) {
        var s = items_8[_i];
        s = s.trim();
        if (s.length)
            result.push(s);
    }
    return result;
};
String.prototype.format = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};
Date.fromString = function (s) {
    var i = Date.parse(s);
    return new Date(i);
};
var DateShortFormat = "#M#/#DD#/#YYYY# #h#:#mm# #AMPM#";
var DateShortDayFormat = "#MM#/#DD# #hh#:#mm# #ampm#";
var DateLongFormat = "#DDDD# #MMMM# #D#, #YYYY# #h#:#mm# #AMPM#";
var DateDefaultFormat = DateLongFormat;
Date.prototype.format = function (formatString) {
    var YYYY, YY, MMMM, MMM, MM, M, DDDD, DDD, DD, D, hhh, hh, h, mm, m, ss, s, ampm, AMPM, dMod, th;
    var dateObject = this;
    YY = ((YYYY = dateObject.getFullYear()) + "").slice(-2);
    MM = (M = dateObject.getMonth() + 1) < 10 ? ("0" + M) : M;
    MMM = (MMMM = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"][M - 1]).substring(0, 3);
    DD = (D = dateObject.getDate()) < 10 ? ("0" + D) : D;
    DDD = (DDDD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
        "Saturday"][dateObject.getDay()]).substring(0, 3);
    th = (D >= 10 && D <= 20) ? "th" : ((dMod = D % 10) == 1) ? "st" : (dMod == 2) ? "nd" : (dMod == 3) ? "rd" : "th";
    formatString = (formatString) ? formatString : DateDefaultFormat;
    formatString = formatString.replace("#YYYY#", YYYY).replace("#YY#", YY).replace("#MMMM#", MMMM).replace("#MMM#", MMM).replace("#MM#", MM).replace("#M#", M).replace("#DDDD#", DDDD).replace("#DDD#", DDD).replace("#DD#", DD).replace("#D#", D).replace("#th#", th);
    h = (hhh = dateObject.getHours());
    if (h == 0)
        h = 24;
    if (h > 12)
        h -= 12;
    hh = h < 10 ? ('0' + h) : h;
    AMPM = (ampm = hhh < 12 ? "am" : "pm").toUpperCase();
    mm = (m = dateObject.getMinutes()) < 10 ? ("0" + m) : m;
    ss = (s = dateObject.getSeconds()) < 10 ? ("0" + s) : s;
    return formatString
        .replace("#hhh#", hhh)
        .replace("#hh#", hh)
        .replace("#h#", h)
        .replace("#mm#", mm)
        .replace("#m#", m)
        .replace("#ss#", ss)
        .replace("#s#", s)
        .replace("#ampm#", ampm)
        .replace("#AMPM#", AMPM);
};
Date.prototype.timeAgo = function () {
    var a = new Date();
    var b = this;
    var diff = a - b;
    var seconds = Math.floor(diff / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval > 1)
        return interval + " years ago";
    if (interval == 1)
        return "1 year ago";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1)
        return interval + " months ago";
    if (interval == 1)
        return "1 month ago";
    interval = Math.floor(seconds / 86400);
    if (interval > 1)
        return interval + " days ago";
    if (interval == 1)
        return "1 day ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1)
        return interval + " hours ago";
    if (interval == 1)
        return interval + "1 hour ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1)
        return interval + " minutes ago";
    if (interval == 1)
        return interval + "1 minute ago";
    return Math.floor(seconds) + " seconds ago";
};
//# sourceMappingURL=app.js.map