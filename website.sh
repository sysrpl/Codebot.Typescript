#!/bin/bash

# Sets up a website to use this TypeScript library. Run it from inside the
# website's folder, for example:
#
#   cd ~/Development/Dotnet/Websites/Core/files.codebot.org
#   ../../../Codebot/Codebot.Typescript/website.sh
#
# It creates wwwroot/typescript with links to this library, the compiler
# settings, and a default app bundle. Nothing that already exists is replaced.

library="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/source"
site="$(pwd)"
typescript="$site/wwwroot/typescript"

if [ ! -d "$library/libs" ]; then
    echo "Could not find the library at $library"
    exit 1
fi

if [ "$site" = "$(dirname "$library")" ]; then
    echo "Run this script from inside a website folder, not the library"
    exit 1
fi

mkdir -p "$typescript" "$site/wwwroot/build"

# Write a file only when it does not exist yet
create() {
    if [ -e "$1" ]; then
        echo "kept    $1"
    else
        mkdir -p "$(dirname "$1")"
        cat > "$1"
        echo "created $1"
    fi
}

# Link the shared library folders, storing relative paths with ln -sr
for name in boot libs typings legacy; do
    link="$typescript/$name"
    if [ -L "$link" ]; then
        echo "kept    $link"
    elif [ -e "$link" ]; then
        echo "skipped $link: a real folder is already there, remove it to link the library"
    else
        ln -sr "$library/$name" "$link"
        echo "linked  $link -> $(readlink "$link")"
    fi
done

create "$typescript/tsconfig.base.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES5",
    "module": "none",
    "rootDir": ".",
    "lib": ["DOM", "ES2015"],
    "noEmitOnError": true,
    "removeComments": true,
    "strict": false,
    "ignoreDeprecations": "6.0"
  }
}
EOF

create "$typescript/app/tsconfig.json" <<'EOF'
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outFile": "../../build/app.js"
  },
  "files": ["app.ts"]
}
EOF

create "$typescript/app/app.ts" <<'EOF'
/// <reference path="../libs/codebot/codebot.ts"/>

// Optional parts of the library, uncomment the ones this app uses
// /// <reference path="../libs/codebot/optional/dialog/codebot.dialog.ts"/>
// /// <reference path="../libs/codebot/optional/tooltips/codebot.tooltips.ts"/>
// /// <reference path="../libs/codebot/optional/slider/codebot.slider.ts"/>
// /// <reference path="../libs/codebot/optional/scrollarea/codebot.scrollarea.ts"/>
// /// <reference path="../libs/codebot/optional/toggle/codebot.toggle.ts"/>

// Called once by boot.js after the page and its includes have loaded
function main() {
    console.log("app.js");
}
EOF

create "$site/tsconfig.boot.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES5",
    "module": "none",
    "rootDir": ".",
    "outFile": "wwwroot/build/boot.js",
    "lib": ["DOM", "ES2015"],
    "noCheck": true,
    "removeComments": true,
    "strict": false,
    "ignoreDeprecations": "6.0"
  },
  "files": ["wwwroot/typescript/boot/boot.ts"]
}
EOF

echo
echo "To build:"
echo "  tsc -p wwwroot/typescript/app"
echo "  tsc -p tsconfig.boot.json"
echo
echo "Pages load the result with:"
echo '  <meta name="boot" content="/build/app.js">'
echo '  <script src="/build/boot.js"></script>'
