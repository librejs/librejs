node index.js > whitelist


data=`cat whitelist`
echo "module.exports = {
	whitelist: $data
};" > whitelist
