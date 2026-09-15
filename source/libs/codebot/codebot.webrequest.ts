/** LocalCache is used by the WebRequest object to capture responses.*/
class LocalCache {
    private data = {};

    remove(url: string): void {
        delete this.data[url];
    }

    exists(url: string): boolean {
        return this.data.hasOwnProperty(url) && isDefined(this.data[url]);
    }

    recall(url: string): string {
        return this.data[url];
    }

    store(url: string, value: string): void {
        this.data[url] = value;
    }
}

/** WebRequest handles asynchronous http 'get' and 'post' requests. */
class WebRequest {
    private localCache: LocalCache;
    private abortController?: AbortController;
    private requestId: number;
    private cache: boolean;
    private statusCode: number;
    private succcessCallback: WebRequestCallback;
    private errorCallback: WebRequestCallback;

    /** When true the success callback is invoked for any http status, not only 2xx. */
    anyStatus: boolean;

    private sendComplete(text?: string, bytes?: ArrayBuffer) {
        this.responseText = undefined;
        this.responseBytes = undefined;
        this.responseXML = undefined;
        if (this.requestType == "arraybuffer" || this.requestType == "blob")
            this.responseBytes = new Uint8Array(bytes);
        else if (this.requestType == "document")
            this.responseXML = new DOMParser().parseFromString(text, "text/html");
        else {
            this.responseText = text;
            if (this.cache)
                this.localCache.store(this.url, text);
        }
        if (this.succcessCallback)
            this.succcessCallback(this);
    }

    private sendError() {
        if (this.errorCallback)
            this.errorCallback(this);
    }

    private isCurrent(controller: AbortController, requestId: number): boolean {
        return this.abortController === controller && this.requestId === requestId && !controller.signal.aborted;
    }

    private fetchResponse(method: string, body?: FormData | string): void {
        let controller = new AbortController();
        let requestId = this.requestId;
        let options: RequestInit = {
            method: method,
            signal: controller.signal
        };
        if (isDefined(body))
            options.body = body;
        this.abortController = controller;
        this.statusCode = 0;
        let failed = () => {
            if (this.isCurrent(controller, requestId)) {
                this.abortController = undefined;
                this.sendError();
            }
        };
        fetch(this.url, options).then(
            response => {
                if (!this.isCurrent(controller, requestId))
                    return;
                this.statusCode = response.status;
                let ok = this.anyStatus || (response.status > 199 && response.status < 300);
                let bytes = this.requestType == "arraybuffer" || this.requestType == "blob";
                let read: Promise<any> = bytes ? response.arrayBuffer() : response.text();
                read.then(
                    data => {
                        if (!this.isCurrent(controller, requestId))
                            return;
                        this.abortController = undefined;
                        if (!ok) {
                            this.responseText = bytes ? undefined : data;
                            this.sendError();
                        }
                        else if (bytes)
                            this.sendComplete(undefined, data);
                        else
                            this.sendComplete(data);
                    },
                    failed
                );
            },
            failed
        );
    }

    constructor(requestType: XMLHttpRequestResponseType = "text") {
        this.requestType = requestType;
        this.localCache = new LocalCache();
        this.abortController = undefined;
        this.requestId = 0;
        this.statusCode = 0;
        this.anyStatus = false;
        this.succcessCallback = null;
        this.errorCallback = null;
    }

    public set onsuccess(handler: WebRequestCallback) {
        this.succcessCallback = handler;
    }

    public set onerror(handler: WebRequestCallback) {
        this.errorCallback = handler;
    }

    /** The http status of the last response, or 0 if none arrived. */
    public get status(): number {
        return this.statusCode;
    }

    /** The endpoint of the last send or post operation. */
    url: string;

    /** The format of data expected as a result */
    requestType: XMLHttpRequestResponseType;

    /** After send completes successfully the response in a byte array. */
    responseBytes: Uint8Array;

    /** After send completes successfully the response in a string. */
    responseText: string;

    /** After send completes successfully the response in an XML document. */
    responseXML: Document;

    /** After send completes successfully the response in a javascript object. */
    get responseJSON(): any {
        return JSON.parse(this.responseText);
    }

    /** The same as responseText. */
    get response(): string {
        return this.responseText;
    }

    /** Perform an asynchronous http get request.
     * @param url The endpoint for the requested resource.
     * @param onsuccess Your notification invoked after request completes successfully.
     * @param onerror Your notification invoked when the request fails.
     * @param cache When cache is true responses are reused for each distinct url.
     */
    send(url: string, onsuccess?: WebRequestCallback, onerror?: WebRequestCallback, cache?: boolean): void {
        this.cancel();
        this.url = url;
        this.succcessCallback = onsuccess;
        this.errorCallback = onerror;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else
            this.fetchResponse("GET");
    }

    /** Perform an asynchronous http post request.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     * @param onsuccess Your notification invoked after request completes successfully.
     * @param onerror Your notification invoked when the request fails.
     * @param cache When cache is true responses are reused for each distinct url.
     */
    post(url: string, data: FormData | String | Object, onsuccess?: WebRequestCallback,
        onerror?: WebRequestCallback, cache?: boolean): void {
        this.cancel();
        this.url = url;
        this.succcessCallback = onsuccess;
        this.errorCallback = onerror;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else if (data instanceof FormData)
            this.fetchResponse("POST", data);
        else if (isString(data))
            this.fetchResponse("POST", String(data));
        else
            this.fetchResponse("POST", objectToFormData(data));
    }

    /** Cancel any pending send or post operations. */
    cancel(): void {
        this.requestId++;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = undefined;
        }
    }
}

/** WebRequestCallback is the type used to notify you when a request completes. */
type WebRequestCallback = (request: WebRequest) => void;

/** RequestCallback is the same as WebRequestCallback. */
type RequestCallback = WebRequestCallback;

/** Perform a one off asynchronous http get request.
 * @param url The endpoint for the requested resource.
 * @param onsuccess Optional notification invoked when the request loads.
 * @param onerror Optional notification invoked when the request fails.
 */
function sendWebRequest(url: string, onsuccess?: WebRequestCallback, onerror?: WebRequestCallback) {
    let r = new WebRequest();
    r.send(url, onsuccess, onerror);
}

/** Perform a one off asynchronous http get request.
 * @param url The endpoint for the requested resource.
 * @param requestType The type of data requested.
 * @param onsuccess Optional notification invoked when the request loads.
 * @param onerror Optional notification invoked when the request fails.
 */
function sendWebRequestType(url: string, requestType: XMLHttpRequestResponseType,
    onsuccess?: WebRequestCallback, onerror?: WebRequestCallback) {
    let r = new WebRequest(requestType);
    r.send(url, onsuccess, onerror);
}

/** Perform a one off asynchronous http post request.
 * @param url The endpoint for the requested resource.
 * @param data A string or object posted to the enpoint.
 * @param onsuccess Optional notification invoked when the request loads.
 * @param onerror Optional notification invoked when the request fails.
 */
function postWebRequest(url: string, data: FormData | String | Object,
    onsuccess?: WebRequestCallback, onerror?: WebRequestCallback) {
    let r = new WebRequest();
    r.post(url, data, onsuccess, onerror);
}

/** Perform a one off asynchronous http post request.
 * @param url The endpoint for the requested resource.
 * @param data A string or object posted to the enpoint.
 * @param requestType The type of data requested.
 * @param onsuccess Optional notification invoked when the request loads.
 * @param onerror Optional notification invoked when the request fails.
 */
function postWebRequestType(url: string, data: FormData | String | Object,
    requestType: XMLHttpRequestResponseType, onsuccess?: WebRequestCallback,
    onerror?: WebRequestCallback) {
    let r = new WebRequest(requestType);
    r.post(url, data, onsuccess, onerror);
}

/** Perform a one off asynchronous http get request. The callback is invoked
 * whatever the http status, so check request.status when it matters.
 * @param url The endpoint for the requested resource.
 * @param callback Optional notification invoked when a response arrives.
 */
function sendRequest(url: string, callback?: RequestCallback) {
    let r = new WebRequest();
    r.anyStatus = true;
    r.send(url, callback);
}

/** Perform a one off asynchronous http post request. The callback is invoked
 * whatever the http status, so check request.status when it matters.
 * @param url The endpoint for the requested resource.
 * @param data A string or object posted to the enpoint.
 * @param callback Optional notification invoked when a response arrives.
 */
function postRequest(url: string, data: FormData | String | Object, callback?: RequestCallback) {
    let r = new WebRequest();
    r.anyStatus = true;
    r.post(url, data, callback);
}

/** Copies an object's enumerable properties into a FormData object.
 * @param obj An object with enumerable properties.
 * @returns A FormData object populated with values.
 */
function objectToFormData(obj: Object): FormData {
    if (obj == undefined)
        return undefined;
    let data = new FormData();
    let keys = Object.keys(obj);
    for (let k of keys) {
        let value = obj[k];
        data.append(k, value);
    }
    return data;
}

/** Perform a sumbit of a form using an XMLHttpRequest
 * @param form The HTMLFormElelemnt to submit.
 * @param prepare An option callback to prepare the request before it's sent.
 * @return The XMLHttpRequest object already sent.
 */
function formSubmit(form: HTMLFormElement, prepare?: Action<XMLHttpRequest>): XMLHttpRequest {
    let formData = new FormData(form);
    let request = new XMLHttpRequest();
    if (prepare)
        prepare(request);
    request.open(form.getAttribute("method"), form.getAttribute("action"), true);
    request.send(formData);
    return request;
}
