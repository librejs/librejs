PATH=$PATH:./node_modules/.bin
which browserify > /dev/null || (echo "can not find browserify" && false) || exit


# Build the main file
browserify main_background.js -o bundle.js

# Create a temp directory
mkdir ./build_temp

# Move source files to temp directory
cp -r icons ./build_temp
cp -r ./html ./build_temp
cp manifest.json ./build_temp
cp contact_finder.js ./build_temp
cp bundle.js ./build_temp

# build zip file from temp directory
cd ./build_temp
zip -r librejs.zip *
# remove old file
rm ../librejs.xpi || true
# move new zip file
mv librejs.zip ../
# go back to source dir and remove temp directory
cd ../
rm -r ./build_temp
# change the zip file to a xpi file that can be uploaded
mv librejs.zip librejs.xpi
