#!/bin/bash

#    This file is part of GNU LibreJS.
#
#    GNU LibreJS is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    GNU LibreJS is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.

# this script requires transmission-daemon. Install it as a package.
echo "" > magnet-links.txt
curtorrent=""
for f in *.txt
do
    echo "Processing $f"
    curtorrent="torrents/$f.torrent"
    echo "Creating $curtorrent"
    transmission-create -o "$curtorrent" "$f"
    transmission-show --magnet "$curtorrent" >> magnet-links.txt
done
