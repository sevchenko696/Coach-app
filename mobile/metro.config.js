const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const parentRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch parent lib/ and types/ so shared code can be imported
config.watchFolders = [
  path.resolve(parentRoot, 'types'),
  path.resolve(parentRoot, 'lib'),
]

// Ensure Metro resolves node_modules from the mobile directory only
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
]

module.exports = config
