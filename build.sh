#!/bin/bash
PATH=$PATH:./node_modules/.bin
which browserify > /dev/null || (echo "can not find browserify" && false) || exit

# prepare / update testing environment if needed
JASMINE_VER=3.2.1
JASMINE_LIB="test/lib/jasmine-$JASMINE_VER"
if ! [ -d "$JASMINE_LIB" ]; then
  mkdir -p test/lib
  rm -rf test/lib/jasmine-*
  JASMINE_URL="https://github.com/jasmine/jasmine/releases/download/v$JASMINE_VER/jasmine-standalone-$JASMINE_VER.zip"
  curl -L -o "$JASMINE_LIB.zip" "$JASMINE_URL" && unzip -d test/ $JASMINE_LIB.zip lib/**
  rm -f "$JASMINE_LIB.zip"
fi

# Build the main file
browserify main_background.js -o bundle.js

# Create a temp directory
mkdir ./build_temp

# Move source files to temp directory
if [ "$1" == "-t" ] || [ "$1" == "--test" ]; then
  cp -r ./test ./build_temp
fi
cp -r ./icons ./build_temp
cp -r ./html ./build_temp
cp -r ./content ./build_temp
cp -r ./common ./build_temp
cp manifest.json ./build_temp
cp bundle.js ./build_temp

# build zip file from temp directory
cd ./build_temp || exit
zip -r librejs.zip ./*
# remove old file
rm ../librejs.xpi || true
# move new zip file
mv librejs.zip ../
# go back to source dir and remove temp directory
cd ../
rm -r ./build_temp
# change the zip file to a xpi file that can be uploaded
mv librejs.zip librejs.xpi
