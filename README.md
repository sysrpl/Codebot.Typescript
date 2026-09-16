# Codebot.Typescript

A simple typescript starter project. Features a boot object that can declaritively include html, css, and javascript before invoking your "main" entry point.

```typescript
boot.use("jquery");

function main() {
	$("body").text("hello world");
}
```

## Using this library in a website

Every website shares this one copy of the library. Nothing is copied into a site, so a fix made here reaches every site the next time that site is built.

Each website lays out its TypeScript the same way:

```console
<site>/
  tsconfig.boot.json        builds boot.ts into wwwroot/build/boot.js
  wwwroot/typescript/
    libs     -> ~/Development/Dotnet/Codebot/Codebot.Typescript/source/libs
    typings  -> ~/Development/Dotnet/Codebot/Codebot.Typescript/source/typings
    legacy   -> ~/Development/Dotnet/Codebot/Codebot.Typescript/source/legacy
    boot/boot.ts            one reference line to this library's boot.ts
    tsconfig.base.json      compiler options shared by every bundle
    app/                    one folder per bundle, named after it
      app.ts                the entry file, with its references and main()
      tsconfig.json         builds app.ts into wwwroot/build/app.js
    shared/                 optional, code used by more than one bundle
```

The three links are symbolic links made from inside a site's ``wwwroot/typescript`` folder. For a site kept in ``~/Development/Dotnet/Websites/Core/<site>`` they are:

```console
ln -s ../../../../../Codebot/Codebot.Typescript/source/libs libs
ln -s ../../../../../Codebot/Codebot.Typescript/source/typings typings
ln -s ../../../../../Codebot/Codebot.Typescript/source/legacy legacy
```

The site's ``boot/boot.ts`` holds a single line:

```typescript
/// <reference path="../../../../../../Codebot/Codebot.Typescript/source/boot/boot.ts"/>
```

The shared compiler options live in ``tsconfig.base.json``. The ``rootDir`` points at the ``Dotnet`` folder because it holds both the site and this library:

```json
{
  "compilerOptions": {
    "target": "ES5",
    "module": "none",
    "rootDir": "../../../../..",
    "lib": ["DOM", "ES2015"],
    "noEmitOnError": true,
    "removeComments": true,
    "strict": false,
    "ignoreDeprecations": "6.0"
  }
}
```

A bundle folder's ``tsconfig.json`` only names its entry file and where the result goes:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outFile": "../../build/app.js"
  },
  "files": ["app.ts"]
}
```

The entry file begins by referencing the library, then any optional parts it uses, then its own files:

```typescript
/// <reference path="../libs/codebot/codebot.ts"/>
/// <reference path="../libs/codebot/optional/dialog/codebot.dialog.ts"/>
/// <reference path="main.ts"/>
```

To build, compile each bundle folder, and the boot loader when it changes. Each site's run script lists its bundles:

```console
tsc -p wwwroot/typescript/app
tsc -p tsconfig.boot.json
```

To add another app to a site, add a folder beside ``app`` with an entry file of the same name and a ``tsconfig.json`` like the one above, add a ``tsc -p`` line for it to the run script, and name ``/build/<bundle>.js`` in the page's ``<meta name="boot">`` tag.

## Making Web Requests

The library gives you two ways to ask your server for something without reloading the page. Both are built on the browser's ``fetch``.

The first way calls you back only when the request succeeds, and calls a second function when it fails:

```typescript
sendWebRequest("/api/movies",
    request => showMovies(request.responseJSON),
    request => showError("The server answered " + request.status));
```

A request succeeds when the server answers with a status in the 200s. Any other status, or a network failure such as a lost connection, goes to the error function instead. To post data use ``postWebRequest``. The data can be a ``FormData``, a string, or a plain object, which is turned into form data for you:

```typescript
postWebRequest("?action=save", { name: "Anthony", age: 50 },
    request => showSaved(),
    request => showError("Could not save"));
```

The second way calls you back whenever the server answers, whatever the status, which suits a server that always replies with json describing what happened:

```typescript
postRequest("?action=save", form, request => {
    let reply = JSON.parse(request.response);
    if (!reply.ok)
        showError(reply.reason);
});
```

``sendRequest`` is the matching way to get something. Check ``request.status`` when the status matters. Keep in mind that ``sendRequest`` and ``postRequest`` never call you back when the network fails, so a message such as "Saving..." could stay on screen forever. For anything important use the first way, which has an error function.

If you want to make several requests one after another, create a ``WebRequest`` object and reuse it. Starting a new request on the same object cancels the one before it, which is handy for things like search boxes where only the latest answer matters:

```typescript
let search = new WebRequest();

function searchTyped(text: string) {
    search.send("/api/search?q=" + encodeURIComponent(text), request => showResults(request.responseJSON));
}
```

You can also call ``search.cancel()`` yourself. Passing ``true`` as the last argument to ``send`` or ``post`` remembers each answer by its address, and asking for the same address again reuses it without contacting the server.

After a request completes, the answer is available in a few forms:

| Property | What it holds |
|---|---|
| ``responseText`` | the answer as text |
| ``response`` | the same as ``responseText`` |
| ``responseJSON`` | the answer turned from json into an object |
| ``responseBytes`` | the answer as bytes, when the request was created with ``new WebRequest("arraybuffer")`` |
| ``responseXML`` | the answer as a document, when the request was created with ``new WebRequest("document")`` |
| ``status`` | the http status, or ``0`` if no answer arrived |

## Server Side Events

Normally your page asks the server for something and the server answers. Server side events work the other way round. Your page opens a connection to the server and keeps it open, and the server sends messages down it whenever something happens, for example when a new movie is added. The Codebot.Web framework sends these messages with ``Broadcast``, and this library receives them.

To listen, subscribe to the names of the messages you care about, then connect to the server's event address:

```typescript
function main() {
    Messages.subscribe("movies", loadMovies, movieAdded);
    Messages.connect("/events");
}

function loadMovies() {
    sendWebRequest("/api/movies", request => showMovies(request.responseJSON));
}

function movieAdded(movie: any) {
    addMovieToList(movie);
}
```

When the server calls ``Broadcast("movies", json)``, every page subscribed to ``movies`` has its function called with the payload, already turned from json into an object. Messages with other names are passed to whoever subscribed to those names instead.

The first function you give to ``subscribe`` is called each time the connection opens. That includes the first time and every time it reconnects. While a page is disconnected, any messages the server sends are missed, so this is the place to ask the server for the latest information. You can pass ``null`` for either function if you don't need it.

The library looks after the connection for you. If the connection fails it opens a new one within 5 seconds. And whenever someone returns to your page's tab it opens a fresh connection, because a phone or tablet that has been asleep can be left with a connection that looks open but no longer works. If a message arrives that is not valid json, the message is written to the browser console so you can see what the server sent.

There is one failure it does not retry. If the server refuses the connection with a 401 or a 403 - the roles behind it have changed, or the session has gone - the library stops listening for good and writes a note to the console, rather than knocking every 5 seconds at a door that is not going to open. A page that wants to recover from this should send the visitor to sign in again.

### Closing a Connection

``connect`` returns a function which closes the connection. Call it when your page no longer wants to hear from the server, for example when someone signs out:

```typescript
let closeEvents = Messages.connect("/events");

function signedOut() {
    closeEvents();
}
```

Closing stops the library from reconnecting, and disconnects the connection's own event handlers, so nothing is called afterwards, not even for a message that was already on its way. The server notices the connection has gone and forgets it. Calling the function a second time does nothing.

The functions you gave to ``Messages.subscribe`` are not removed, because they are shared by every connection a page makes. If a page closes a connection and later connects again, subscribe only once, or the same function will be called twice for each message.

### Listening Without Messages

If you would rather handle every message yourself, use ``subscribeEvent`` directly. It works the same way but calls your function with every message the connection receives, and it also returns a function which closes the connection:

```typescript
let close = subscribeEvent("/events", () => console.log("connected"), message => {
    console.log(message.name, message.payload);
});
```

## Optional Components

The folders inside ``libs/codebot/optional`` hold components that a page includes only when it uses them, by adding a reference to its entry file. They are dialogs, tooltips, a slider, a scroll area, a toggle, and a login form.

The slider can show a fill below its knob, which is useful for things like a volume or brightness control. Pass ``true`` as the third argument when creating it. The fill is an element with the class ``fill``, so you style it in your CSS, and it is drawn on vertical sliders:

```typescript
let brightness = new Slider("#brightness", "#brightness-value", true);
brightness.orientation = SliderOrientation.Vertical;
```

When a page has both a slider and a scroll area, dragging the slider no longer scrolls the area behind it.
