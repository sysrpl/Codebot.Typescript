/**  */
interface FileEntry {
    key: string;
    name: string;
    size: number;
    type: string;
    modified: number
}

type FileEntries = Array<FileEntry>;
type FileListCallback = Action<FileEntries>;

/** FileProgress is the callback type used by FileManager.upload to receive feedback on upload activity.
 * @param sent The bytes sent so far.
 * @param total The total size in bytes of the upload.
 * @return Return true to continue the upload or false to abort.
 */
type FileProgressCallback = (sent: number, total: number) => boolean;

/** FileManager implements a protocol to manage remote files. */
class FileManager {
    private endpoint: string;

    constructor(endpoint?: string) {
        if (endpoint)
            this.endpoint = endpoint;
        else
            this.endpoint = "./";
        this.endpoint += "?method=files";
    }

    /** Compute a key hash given a File object.
     * @param file A File object taken from a inputElement.Files collection.
     * @returns The key hash of a File object.
     */
    computeKey(file: File): string {
        let key = window.navigator.userAgent + file.lastModifiedDate +
            file.name + file.size;
        return Math.abs(key.hashCode()).toString();
    }

    /** List the files on the remove server. 
     * @param callback Returns the list of files.
     */
    list(callback: FileListCallback): void {
        sendRequest(this.endpoint + "&action=list", (r => {
            let files = <FileEntries>JSON.parse(r.response);
            callback(files);
        }));
    }

    /** Remove a file on the remove server given a key. 
     * @param key The key identifying the file to remove.
     */
    remove(key: string): void {
        sendRequest(`${this.endpoint}&action=remove&key=${key}`);
    }

    /** Perform a chunked upload of a file. 
     * @param file A File object taken from a inputElement.Files collection.
     * @param endpoint Url of the upload backend. (e.g. ./?method=upload)
     * @param onprogress An optional FileProgressCallback for progress notification and upload abort. 
     * @param onerror An optional callback for error notification. 
     */
    upload(file: File, onprogress?: FileProgressCallback,
        onerror?: Proc): string {
        // 512KB blocks
        const blockSize = 524288;

        let endpoint = this.endpoint + "&action=upload";
        // A file upload is aborted when onprogress returns false
        let aborted = false;
        let offset = 0;
        let fileName = file.name;
        let fileSize = file.size;
        // Key is a hash that identifies the upload
        let key = this.computeKey(file);

        function notifyProgress(sent: number, total: number): boolean {
            if (aborted)
                return false;
            if (onprogress)
                aborted = !onprogress(sent, total);
            if (aborted)
                abort();
            return !aborted;
        }

        function notifyError() {
            if (onerror)
                onerror();
        }

        function sendData(data: FormData, onload?: Proc) {
            let request = new XMLHttpRequest();
            request.open("POST", endpoint, true);
            if (onload)
                request.onload = onload;
            request.onerror = notifyError;
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
            if (!notifyProgress(offset, fileSize))
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

        function resume() {
            let obj = JSON.parse(this.responseText);
            key = obj.key;
            offset = obj.offset;
            chunk();
        }

        function begin() {
            let data = new FormData();
            data.append("key", key);
            data.append("step", "begin");
            data.append("fileName", fileName);
            data.append("fileSize", fileSize);
            data.append("fileType", file.type);
            sendData(data, resume);
        }

        function end() {
            if (!notifyProgress(fileSize, fileSize))
                return abort();
            let data = new FormData();
            data.append("key", key);
            data.append("step", "end");
            sendData(data);
        }

        if (fileSize > 0)
            begin();
        else
            notifyError();

        return key;
    }

}