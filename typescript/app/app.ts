let state = {
    button: <HTMLElement>undefined,
    file: <HTMLInputElement>undefined,
    progress: <HTMLProgressElement>undefined,
    status: <HTMLElement>undefined,
    fileManager: <FileManager>undefined
}

function buttonClick() {
    state.file.click();
}

let startTime: number;

function fileProgress(sent: number, total: number): boolean {
    if (sent == total) {
        let duration = (Date.now() - startTime) / 1000;
        let rate = Math.floor(sent / 1024 / duration);
        let totalKb = Math.floor(total / 1024);
        state.status.innerText = `Complete: ${rate.withCommas()} KB/s / ${totalKb.withCommas()} KB transfered`;
    }
    else {
        let percent = Math.floor(sent / total * 100);
        let sentKb = Math.floor(sent / 1024);
        let totalKb = Math.floor(total / 1024);
        state.status.innerText = `${percent}% / ${sentKb.withCommas()} of ${totalKb.withCommas()} KB transfered`;
    }
    return true;
}

function fileChange() {
    if (state.file.files.length) {
        let f = state.file.files[0];
        startTime = Date.now();
        state.fileManager.upload(f, fileProgress);

    } else {
        console.log("no files");
    }
}

function main() {
    state.button = get("#button");
    state.file = get("#file") as HTMLInputElement;
    state.fileManager = new FileManager();
    state.status = get("#status");
    state.progress = get("progress") as HTMLProgressElement;
    state.button.addEventListener("click", buttonClick);
    state.file.addEventListener("change", fileChange);
}
