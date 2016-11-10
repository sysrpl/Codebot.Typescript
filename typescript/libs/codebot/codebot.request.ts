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

/** FileProgress is the callback type used with fileUplad to receive feedback on upload activity.
 * @param sent The bytes sent so far.
 * @param total The total size in bytes of the upload.
 * @return Return true to continue the upload or false to abort.
 */
type FileProgressCallback = (sent: number, total: number) => boolean;

/** Perform a chunked upload of a file. 
 * @param file A single File object taken from a inputElement.Files collection.
 * @param url The action endpoint url to receive the comminication.
 * @param onprogress An optional FileProgressCallback for progress feedback and abort control. 
 * @param onerror An optional callback for error notification. 
*/
function fileUpload(file: File, url: string, onprogress?: FileProgressCallback, onerror?: Proc): void {
    // 512KB blocks
    const blockSize = 524288;

    // A file upload is aborted when onprogress returns false
    let aborted = false;
    let fileName = file.name;
    let fileSize = file.size;
    let offset = 0;
    // Key is a hash that uniquely identifies the upload
    let key = (window.navigator.userAgent + fileName) + Date.now().toString + Math.random();
    let hash = key.hashCode();
    key = hash.toString();

    function invokeProgress(sent: number, total: number): boolean {
        if (aborted)
            return false;
        if (onprogress)
            aborted = !onprogress(sent, total);
        if (aborted)
            abort();
        return !aborted;
    }

    function requestError(ev: ErrorEvent) {
        if (onerror)
            onerror();
    }

    function sendData(data: FormData, onload?: Proc) {
        let request = new XMLHttpRequest();
        request.open("POST", url, true);
        if (onload)
            request.onload = onload;
        request.onerror = requestError;
        request.send(data);
    }

    function abort() {
        aborted = true;
        let data = new FormData();
        data.append("key", key);
        data.append("step", "abort");
        sendData(data);
    }

    function next() {
        if (offset < fileSize)
            chunk();
        else
            end();
    }

    function chunk() {
        if (!invokeProgress(offset, fileSize))
            return abort();
        let head = offset;
        let tail = Math.min(offset + blockSize, fileSize);
        offset = tail;
        let blob = file.slice(head, tail);
        let data = new FormData();
        data.append("key", key);
        data.append("step", "chunk");
        data.append("fileData", blob);
        sendData(data, next);
    }

    function begin() {
        let data = new FormData();
        data.append("key", key);
        data.append("step", "begin");
        data.append("fileName", fileName);
        data.append("fileSize", fileSize);
        sendData(data, chunk);
    }

    function end() {
        if (!invokeProgress(fileSize, fileSize))
            return abort();
        let data = new FormData();
        data.append("key", key);
        data.append("step", "end");
        sendData(data);
    }

    if (fileSize > 0)
        begin();
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