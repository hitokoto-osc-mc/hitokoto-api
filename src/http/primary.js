// This exec file is intended to impl http server entrance
const os = require('os')
// const path = require('path')
// const cluster = require('cluster')
const { EventEmitter } = require('events')
const nconf = require('nconf')
// const chalk = require('chalk')
const { logger } = require('../logger')
const { Workers } = require('../utils/master/workers')
module.exports = exports = {}

const workersNumber = nconf.get('workers') || os.cpus().length
const listeningPort = nconf.get('server:port') || 8000
const workers = new Workers({ workersNumber, listeningPort })
const { requestsCounter } = require('../utils/master/requestsCounterMerge')

exports.startWorkersPool = async () => {
  // register custom handler
  workers.registerMessageHandler(
    'update_requests_statistics',
    requestsCounter.getWorkersRequestsRecordHandler(),
  )
  workers.registerMessageHandler('started', (message) => {
    logger.verbose('[core.http.primary] notify workers to start jobs')
    workers.notify({
      key: 'start_job',
    })
  })
  await workers.start()
  return workers
}

const bridgeEvent = new EventEmitter()
exports.WorkersBridge = class WorkersBridge {
  static get bridge() {
    return bridgeEvent
  }

  static get workers() {
    return workers
  }

  static registerListener(key, handler) {
    workers.registerMessageHandler(key, handler)
  }
}
