#!/bin/bash

rm build/*
mv tsconfig.json appconfig.json
mv bootconfig.json tsconfig.json
rm typings/boot.d.ts
tsc -d
mv build/boot.d.ts typings/
mv tsconfig.json bootconfig.json
mv appconfig.json tsconfig.json
tsc
