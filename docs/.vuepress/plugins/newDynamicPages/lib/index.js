const { createPage } = require('@vuepress/core')
const { path, fs } = require('@vuepress/utils')

function formatDeviceName(n) {
  return n
  .replace(/ /g, '-')
  .replace(/\//g,'%2F')
  .replace(/ü/g,'u')
  .replace(/²/g,'2')
  .replace(/³/g,'3')
}

const iosList = require('../../../../../grabData/ios')
const deviceList = require('../../../../../grabData/deviceList')
const deviceGroups = require('../../../../../grabData/deviceGroups')
const jbList = require('../../../../../grabData/jailbreak')
const bigJson = {
  ios: iosList,
  jailbreak: jbList,
  device: deviceList,
  groups: deviceGroups
}

var jbPath = '/jailbreak'
var devicePath = '/device'

var pageList = []

pageList.push({
  path: '/firmware.html',
  frontmatter: {
    title: `AppleDB Firmwares`,
    description: `AppleDB firmware lookup`,
    chartType: 'firmwareVersion',
    iosList: iosList,
    sidebar: false,
    editLink: false,
    lastUpdated: false,
    contributors: false,
  }
})

for (var jb in jbList) {
  var redirects = []
  if (jbList[jb].hasOwnProperty('alias')) {
    redirects = jb.alias
    if (!Array.isArray(redirects)) redirects = [redirects]
    redirects = redirects.map(x => [jbPath, x].join('/') + '.html')
  }

  const urlPart = jbList[jb].name.replace(/ /g, '-')
  const url = [jbPath, urlPart].join('/') + '.html'

  pageList.push({
    path: url,
    frontmatter: {
      title: jbList[jb].name,
      description: `Compatible devices and software versions for ${jbList[jb].name}`,
      chartType: 'jailbreak',
      jailbreak: jbList[jb],
      redirect_from: redirects,
      sidebar: false,
      editLink: false,
      lastUpdated: false,
      contributors: false,
    }
  })
}

const getDevicePage = require('./getDevicePage')

for (const d of Object.keys(deviceList).map(x => deviceList[x]).filter(x => {
  return !(
    process.env.NODE_ENV === 'development' &&
    x.name === "Beats Solo³ Wireless Mickey's 90th Anniversary Edition"
  )
})) {
  const urlPart = formatDeviceName(d.key)
  const url = [devicePath, 'identifier', urlPart].join('/') + '.html'
  pageList.push(
    getDevicePage({
      name: d.name,
      path: url,
      devArr: d,
      grouped: false
    })
  )
}

for (const g of deviceGroups) {
  const urlPart = formatDeviceName(g.name)
  const url = [devicePath, urlPart].join('/') + '.html'
  pageList.push(
    getDevicePage({
      name: g.name,
      path: url,
      devArr: g.devices.map(x => deviceList[x]),
      grouped: true,
      hideChildren: g.hideChildren
    })
  )
}

var devListFromFw = []
for (const i of iosList.map(x => Object.keys(x.deviceMap))) devListFromFw.push(...i)
devListFromFw = Array.from(new Set(devListFromFw)).sort()

pageList.push(
  getDevicePage({
    name: "Firmware Chart",
    description: 'AppleDB firmware chart',
    path: "/firmwares.html",
    devArr: devListFromFw.map(x => deviceList[x]),
    grouped: true,
    mainList: true
  })
)

pageList.push({
  path: '/device-list.html',
  frontmatter: {
    title: 'Device List',
    description: 'AppleDB device list',
    chartType: 'deviceList',
    deviceList: deviceList,
    sidebar: false,
    editLink: false,
    lastUpdated: false,
    contributors: false,
  }
})

pageList.push({
  path: '/device-selection',
  frontmatter: {
    title: 'Device Selection',
    description: 'AppleDB device selection',
    chartType: 'deviceGroupList',
    redirect_from: ['/devices','/devices.html','/device','/device.html','/device-selection.html'],
    groupList: deviceGroups,
    sidebar: false,
    editLink: false,
    lastUpdated: false,
    contributors: false,
  }
})

Array.from(new Set(deviceGroups.map(x => x.type))).map(function(t) {
  const urlPart = formatDeviceName(t)
  const url = `/device-selection/${urlPart}.html`
  pageList.push({
    path: url,
    frontmatter: {
      title: `Device Selection (${t})`,
      description: 'AppleDB device selection',
      chartType: 'deviceGroup',
      widePage: true,
      type: t,
      group: deviceGroups.map(x => {
        const devArr = x.devices.map(y => deviceList[y])
        
        x.img = {
          count: devArr[0].imgCount,
          dark: devArr[0].imgDark
        }

        const released = Array.from(new Set(devArr.map(y => y.released))).flat().sort((a,b) => {
          if (new Date(a.released) < new Date(b.released)) return -1
          if (new Date(a.released) > new Date(b.released)) return 1
          return 0
        }).filter(x => x)
        if (released.join() != '') x.released = released.map(y => {
          const releasedArr = y.split('-')
          const dateStyleArr = [{ year: 'numeric'}, { dateStyle: 'medium'}, { dateStyle: 'medium'}]
          return new Intl.DateTimeFormat('en-US', dateStyleArr[releasedArr.length-1]).format(new Date(y))
        })

        const model = Array.from(new Set(devArr.map(y => y.model).flat()))
        if (model.join() != '') x.model = model

        const board = Array.from(new Set(devArr.map(y => y.board).flat()))
        if (board.join() != '') x.board = board

        const identifier = Array.from(new Set(devArr.map(y => (y.identifier != y.name) ? y.identifier : undefined).flat()))
        if (identifier.join() != '') x.identifier = identifier

        x.key = Array.from(new Set(devArr.map(y => y.key).flat()))

        return x
      })
      .filter(x => x.type == t),
      sidebar: false,
      editLink: false,
      lastUpdated: false,
      contributors: false,
    }
  })
})

const osStrArr = Array.from(new Set(iosList.map(x => x.osStr)))

let latestVersionArr = []
for (const bool of [true,false]) {
  for (const str of osStrArr)
  latestVersionArr.push({ osStr: str, beta: bool })

  for (const startsWith of ['11','12','13'])
  latestVersionArr.push({ osStr: 'macOS', beta: bool, startsWith: startsWith})

  for (const startsWith of ['8','9'])
  latestVersionArr.push({ osStr: 'watchOS', beta: bool, startsWith: startsWith})

  for (const os of ['iOS','tvOS','iPadOS','audioOS']) {
    latestVersionArr.push({ osStr: os, beta: bool, startsWith: '15'})
    latestVersionArr.push({ osStr: os, beta: bool, startsWith: '16'})
  }
}

const latestVersions = latestVersionArr
.map(x => iosList.filter(y => {
  const osStrCheck = y.hasOwnProperty('osStr') ? y.osStr == x.osStr : 1
  const betaCheck = y.hasOwnProperty('beta') ? y.beta == x.beta : 1
  const check = osStrCheck && betaCheck
  let startsWith = x.startsWith
  if (startsWith) {
    startsWith = y.version.startsWith(startsWith)
    return check && startsWith
  }
  return check
})
.filter(x => x.released)
.sort((a,b) => {
  const date = [a,b].map(x => new Date(x.released))
  if (date[0] < date[1]) return 1
  if (date[0] > date[1]) return -1
  return 0
})[0])
.filter(x => x)

module.exports = function() {
  return {
    name: 'vuepress-new-dynamic-pages',
    async onInitialized(app) {
      for (const p of pageList) app.pages.push(await createPage(app, p))
    },
    onPrepared: async (app) => {
      await app.writeTemp('main.js', `export default ${JSON.stringify(bigJson)}`)
      await app.writeTemp('latestVersion.js', `export default ${JSON.stringify(latestVersions)}`)
    }
  }
}