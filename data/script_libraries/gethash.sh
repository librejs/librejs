#!/usr/bin/env bash
#
# gethash.sh
#
# Get the hash of a js file for use in the librejs database.
# Output a JSON object to be included in script-libraries.json

url=$1
t=$(mktemp)
wget --quiet -O $t $url
if [ $? -ne 0 ]
then
    echo $url not found
    exit 1
fi
s=$(iconv -f LATIN1 -t UTF8 $t | sha1sum | awk '{print $1}')
cat <<EOF
    "$s": {
        "filename": "$url",
        "result": "[freelib]"
    }
EOF

rm -f $t
