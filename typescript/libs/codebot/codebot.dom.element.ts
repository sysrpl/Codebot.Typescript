interface ClientPoint {
	clientX: number;
	clientY: number;
}

interface HTMLElement {
	__defineGetter__: any;
	__defineSetter__: any;
	/** Returns the nth child which is a HTMElement. 
	 * @param index The child index of the HTMElement.
	*/
	nthElementChild(index: number): HTMLElement;
	/** Returns true if the class attribute of the HTMLElement.
	 * @param value The values to check. */
	hasClass(value: string | string[]): boolean;
	/** Add a value to the class attribute of the HTMLElement.
	 * @param value One or more values to add.
	 */
	addClass(value: string | string[]): void;
	/** Add a value from the class attribute of the HTMLElement. 
	 * @param value One or more values to remove.
	 */
	removeClass(value: string | string[]): void;
	/** Convert a client point location to point relative to the HTMLElement.
	 * @param The point relative to the window.
	 */
	mapPoint(point: ClientPoint): Point;
	/** The bounds of an HTMLElement in pixels relative to its
	 * window position. */
	readonly bounds: Rect;
}

HTMLElement.prototype.nthElementChild = function (index: number): HTMLElement {
	let element = this.firstElementChild;
	while (index > 0) {
		index--;
		element = element.nextElementSibling;
	}
	return element;
}

HTMLElement.prototype.hasClass = function (value: string): boolean {
	let values = isString(value) ? [value] : value;
	let i = values.length;
	let items = this.className.splitTrim();
	for (let item of items)
		if (values.contains(item))
			i--;;
	return i == 0;
}

HTMLElement.prototype.addClass = function (value: string | string[]): void {
	let names = isString(value) ? [value] : value;
	let items = this.className.splitTrim();
	for (let item of items) {
		if (names.contains(item))
			continue;
		names.push(item);
	}
	this.className = names.join(" ");
}

HTMLElement.prototype.removeClass = function (value: string | string[]): void {
	let values = isString(value) ? [value] : value;
	let names: string[] = [];
	let items = this.className.split(" ");
	for (let item of items)
		if (values.contains(item))
			continue;
		else
			names.push(item);
	this.className = names.join(" ");
}

HTMLElement.prototype.mapPoint = function (event: MouseEvent): Point {
	let rect = this.getBoundingClientRect();
	return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

HTMLElement.prototype.__defineGetter__("bounds", function () {
	let rect = this.getBoundingClientRect();
	return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});

/** Find script node inside an HTMLElement object and executes them. 
 * @param element The HTMLElement object to search.
*/
function executeScripts(element: HTMLElement) {

	function nodeNameEquals(elem: HTMLElement, name: string) {
		return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
	}

	function evalScript(elem) {
		let data: string = (elem.text || elem.textContent || elem.innerHTML || "");
		let head = document.getElementsByTagName("head")[0] || document.documentElement;
		let script = document.createElement("script");
		script.type = "text/javascript";
		try {
			script.appendChild(document.createTextNode(data));
		} catch (e) {
			script.text = data;
		}
		head.insertBefore(script, head.firstChild);
		head.removeChild(script);
	}

	let scripts = [], script;
	let children = element.childNodes, child;
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
function loadScript(url: string, callback: Proc): void {
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	let loaded = false;
	script.onload = script["onreadystatechange"] = function () {
		if (!loaded && (!this.readyState || this.readyState == "complete")) {
			loaded = true;
			callback();
		}
	}
	let node = document.getElementsByTagName("script")[0];
	node.parentNode.insertBefore(script, node);
}

/** A query selector string or one or more HTMLElements. */
type QuerySelect = string | HTMLElement | Array<HTMLElement>;

/** Query the DOM using a selector and return a single HTMLElement.
 * @param query The selector text.
 */
function getElement(query: QuerySelect): HTMLElement {
	if (isString(query))
		return document.querySelector(query) as HTMLElement;
	else if (query instanceof HTMLElement)
		return query;
	else
		return query[0];
}

/** Query the DOM using a selector and return all matching HTMLElements.
 * @param query The selector text.
 * @returns An array of HTMLElements.
 */
function getElements(query: QuerySelect): Array<HTMLElement> {
	if (isString(query)) {
		let nodes: any = document.querySelectorAll(query);
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
function setStyle(query: QuerySelect, styles: any): void {
	let elements = getElements(query);
	let keys = Object.keys(styles);
	for (let e of elements) {
		let style = e.style;
		for (let k of keys) {
			let value = styles[k];
			style[k] = isNumber(value) ? value + "px" : value;
		}
	}
}

/** Removes one or more inline styles from HTMLElements.
 * @param query The selector or elements to modify.
 * @param styles A list of styles names such as "margin-left" and "background-color".
 */
function removeStyle(query: QuerySelect, styles: string | Array<string>): void {
	let items = isString(styles) ? styles.splitTrim(" ") : styles;
	let elements = getElements(query);
	for (let item of items) {
		let n = 'A'.charCodeAt(0);
		let z = 'Z'.charCodeAt(0);
		while (n <= z) {
			let c = String.fromCharCode(n);
			if (item.includes(c)) {
				item = item.replace(c, "-" + c.toLowerCase());
			}
			n++;
		}
		for (let element of elements)
			element.style.removeProperty(item);
	}
}

interface EventCapable {
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

/** Type guard for objects supporting addEventListener. 
 * @param obj The object to test.
 */
function isEventCapable(obj: any): obj is EventCapable {
	return isDefined(obj["addEventListener"]);
}

/** Attach an event listener to zero or more objects.
 * @param query The objects to attach the event.
 * @param name The name of the event to attach (for example "load", "resize", ect).
 * @param event The event handler to be invoked.  
 */
function addEvent(query: QuerySelect | EventCapable, name: string, event: any) {
	let items: Array<EventCapable> = isEventCapable(query) ? [query] : getElements(query);
	for (let item of items)
		item.addEventListener(name, event);
}

/** Add a value to the class attribute to zero or more HTMLElements. 
 * @param query The objects to modify,
 * @param value One or more values to add.
 */
function addClass(query: QuerySelect, value: string | string[]) {
	let items = getElements(query);
	for (let e of items)
		e.addClass(value);
}

/** Remove a value from the class attribute to zero or more HTMLElements. 
 * @param query The objects to modify,
 * @param value One or more values to remove.
 * 
 */
function removeClass(query: QuerySelect, value: string | string[]) {
	let items = getElements(query);
	for (let e of items)
		e.removeClass(value);
}