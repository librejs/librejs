#!/bin/bash

# Usage:
# ./generate-magnet.sh <url> <license-identifier>
# e.g.
# ./generate-magnet.sh https://www.gnu.org/licenses/agpl-3.0.txt agpl-3.0

wget "$1" -O "$2.txt" && transmission-create "$2.txt" -o "$2.txt.torrent" && transmission-show -m "$2.txt.torrent" && rm "$2.txt" "$2.txt.torrent"
