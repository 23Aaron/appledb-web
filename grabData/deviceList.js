const fs = require('fs');
const path = require('path');
const p = './appledb/deviceFiles'

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

var deviceFiles = [];
deviceFiles = getAllFiles(p, deviceFiles)
deviceFiles = deviceFiles.filter(file => file.endsWith('.json'));
deviceFiles = deviceFiles.map(function(x) {
  const filePathStr = x.split(path.sep)
  const pathStrLength = p.split('/').length - 3
  
  return filePathStr.splice(pathStrLength, filePathStr.length).join(path.sep)
})
var deviceObj = {};

for (const file in deviceFiles) {
  const obj = require('..' + path.sep + deviceFiles[file])
  if (obj.board && !Array.isArray(obj.board)) obj.board = [obj.board]
  if (!obj.identifier) obj.identifier = obj.name
  deviceObj[obj.identifier] = obj
}

module.exports = deviceObj;