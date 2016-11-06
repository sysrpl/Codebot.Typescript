/** LocalCache is used by the Request object to capture responses.*/
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

/** Request handles asynchronous http 'get' and 'post' requests. */
class Request {
    private localCache: LocalCache;
    private httpRequest: XMLHttpRequest;
    private callback: RequestCallback;
    private cache: boolean;
    private posting: boolean;

    private sendComplete(response: string) {
        this.response = response;
        if (this.cache) {
            this.localCache.store(this.url, this.response);
        }
        this.callback(this);
    }

    private httpRequestChange() {
        if (this.httpRequest.readyState == 4 && this.httpRequest.status == 200) {
            this.sendComplete(this.httpRequest.responseText);
        }
    }

    constructor() {
        this.localCache = new LocalCache();
        this.httpRequest = new XMLHttpRequest();
        let request = this;
        this.httpRequest.onreadystatechange = function () {
            request.httpRequestChange();
        }
    }

    /** The endpoint of the last send or post operation. */
    url: string;

    /** The information returned after send completes successfully. */
    response: string;

    /** Perform an asynchronous http get request.
     * @param url The endpoint for the requested resource.
     * @param callback Your notification invoked after request completes successfully.
     * @param cache When cache is true responses are reused for each distinct url. 
     */
    send(url: string, callback: RequestCallback, cache?: boolean): void {
        this.httpRequest.abort();
        this.url = url;
        this.callback = callback;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else {
            this.httpRequest.open("GET", url);
            this.httpRequest.send();
        }
    }

    /** Perform an asynchronous http post request.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    post(url: string, data: string, callback?: RequestCallback, cache?: boolean): void {
        this.httpRequest.abort();
        this.url = url;
        this.callback = callback;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else {
            this.httpRequest.open("POST", url);
            this.httpRequest.send(data);
        }
    }

    /** Cancel any pending send or post operations.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    cancel(): void {
        this.httpRequest.abort();
    }
}

/** RequestCallback is the type used to notify you when send completes duccessfully. */
type RequestCallback = (request: Request) => void;

/** Perform a one off asynchronous http get request.
 * @param url The endpoint for the requested resource.
 * @param callback Your notification invoked after the request completes successfully.
 */
function sendRequest(url: string, callback: RequestCallback) {
    let r = new Request();
    r.send(url, callback);
}

/** Perform a one off asynchronous http post request.
 * @param url The endpoint for the requested resource.
 * @param data Data posted to recipient enpoint.
 */
function postRequest(url: string, data: string, callback?: RequestCallback) {
    let r = new Request();
    r.post(url, data, callback);
}