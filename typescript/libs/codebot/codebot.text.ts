interface String {
    /** Append the String object to the document body. */
    writeLine(): void;
    /** Returns true if the String object is empty or whitespace. */
    isEmpty(): boolean;
    /** Split a String object into a trimmed array of strings.
     * @param separator String used to separate items (default " ").
     */
    splitTrim(separator?: string): string[];
    /** Format a String object using {n} arguments. */
    format(...args: any[]): string;
}

String.prototype.writeLine = function (): void {
    Test.writeLine(this);
}

String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
}

String.prototype.splitTrim = function (separator?: string): string[] {
    let result: string[] = [];
    let items = this.split(isDefined(separator) ? separator : " ");
    for (let s of items) {
        s = s.trim();
        if (s.length)
            result.push(s)
    }
    return result;
}

String.prototype.format = function (...args: any[]) {
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}
