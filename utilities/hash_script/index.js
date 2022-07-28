const fetch = require("node-fetch")
const crypto = require("crypto")
const obj = {}

const fetch_arr = ["jquery"]

function promise_wrapping(promise, ...rest) {
  return new Promise((res, rej) => {
    promise
    .then(x => res([x, ...rest]))
    .catch(x => rej())
  })
}

Promise.all(fetch_arr.map(value => fetch(`https://api.cdnjs.com/libraries/${value}`)))
.then(res => Promise.all(res.map(x => x.json())))
//.then(libs => Promise.all(libs.assets.map(asset => asset.files.map(file => fetch(`https://api.cdnjs.com/${libs.name}/${asset.version}/${file}`)))))
.then(result => {
  let x = [];
  result.map(single => {
    single.assets.map(version => {
      version.files.filter(file => {
        if (file.endsWith(".js")) { return file }
      }).map(file => {
        x.push([`https://cdnjs.cloudflare.com/ajax/libs/${single.name}/${version.version}/${file}`, file, version.version, single.name])
      })
    })
  })
  return Promise.all(x.map(z => promise_wrapping(fetch(z[0]), z[1], z[2], z[3])))
})
.then(x => Promise.all(x.map(a => promise_wrapping(a[0].text(), a[1], a[2], a[3]))))
.then(q => {
  q.map(single => {
    if (!obj[single[3]]) obj[single[3]] = []
    const hash = crypto.createHash("sha256")
    const updated = hash.update(single[0]).digest("hex")
    obj[single[3]].push({ "filename": single[1], "version": single[2], "hash": updated })
  })
  console.log(JSON.stringify(obj))
})
