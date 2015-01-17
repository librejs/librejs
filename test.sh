#!/bin/bash

cfx test -p ~/.mozilla/firefox/profiles/httpsEverywhere | grep -v '^console'
