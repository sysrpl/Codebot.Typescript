interface String {
    /** Append the String object to the document body. */
    writeLine(): void;
    /** Returns a hash of the string. */
    hashCode(): number;
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

String.prototype.hashCode = function() {
    let hash = 0;
    if (this.length == 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; 
    }
    return hash;
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

interface Number {
    /** Format a number with comma separators */
    withCommas(): string;
}

Number.prototype.withCommas = function () {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
}

class Guid {
    value: string;

    constructor () {
        this.value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }); 
    }

    toString(): string {
        return this.value; 
    }
}
