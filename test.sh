#!/bin/bash

if [ ! -f "addon-sdk/bin/activate" ]; then
    die "Addon SDK not available. Run git submodule update."
fi

pushd addon-sdk
source bin/activate
popd

echo "Running tests"
cfx test --verbose
