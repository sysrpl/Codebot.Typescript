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
 * @param prepare An optional callback to prepare the request before it's sent.
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

/** Perform an XMLHttpRequest using a Promise.
 * @param url The endpoint for the request.
 * @param prepare Optional data to POST.
 * @return A Promise to await.
 */
function fetch(url: string, data?: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let r = new XMLHttpRequest();
        r.open(data ? "POST" : "GET", url);
        r.onload = () => {
            if (r.status >= 200 && r.status < 300)
                resolve(r.responseText);
            else
                reject({
                    status: r.status,
                    message: r.statusText
                });
        };
        r.onerror = () => {
            reject({
                status: r.status,
                message: r.statusText
            });
        };
        if (data)
        {
            let d = data instanceof FormData || isString(data) ? data : objectToFormData(data);
            r.send(d);
        }
        else
            r.send();
    });
}