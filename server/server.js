// detect plugin, server-side component
// These handlers are launched with the wiki server.

const events = require('events')

function startServer (params) {
  var app = params.app,
      argv = params.argv;

  var detectors = {} // slug/item => annotated schedule
  var emitters = emittersFor(app) // "slug/item" => emitter

  function emittersFor (app) {
    if (!app.serviceEmitters) {
      app.serviceEmitters = {}
    }
    return app.serviceEmitters
  }

  function emitterFor (slugitem) {
    if (!emitters[slugitem]) {
      emitters[slugitem] = new events.EventEmitter()
    }
    return emitters[slugitem]
  }

  // {
  //   sources: [
  //     {slugitem: "slug/item", service: {...}, recent: [...], notified: bool, listener: function},
  //     {slugitem: "slug/item", service: {...}}
  //   ]
  // }

  function activate(schedule) {
    for (let source of schedule.sources||[]) {
      source.recent = [null, null, null, null]
      source.notified = {}
      source.listener = (sample) => record(source, sample)
      let emitter = emitterFor(source.slugitem)
      emitter.on('sample',source.listener)
    }
    return schedule
  }

  function record(source, sample) {
    source.recent.shift()
    source.recent.push(sample)
    if(source.recent[0]) {
      evaluate(source)
    }
  }

  function evaluate(source) {
    let values = {} // signalname => [bool, bool, ...]
    for (let sample of source.recent) {
      for (let signal of sample.result) {
        let name = signal.name
        let value = trouble(signal.data)
        values[name] = values[name] || []
        values[name].push(value)
      }
    }
    for (let name in values) {
      let notified = source.notified[name]
      let all = values[name].reduce((sum,each) => sum && !!each)
      let none = values[name].reduce((sum,each) => sum && !each)
      if (all && !notified) {
        notify(name, values[name][0])
        source.notified[name]=true
      }
      if (none && notified) {
        notify(name, null)
        source.notified[name]=false
      }
    }
  }

  function trouble(data) {
    if (data.hasOwnProperty('exit')) {
      if (data.exit != 0) {
        return data.error
      }
    } else {
      let values = Object.values(data)
      let avg = values.reduce((sum,each)=>sum+each) / values.length
      if (avg > 0.5) {
        return "greater than 0.5"
      }
    }
    return null
  }

  function notify(signal, trouble) {
    console.log('=== notice === ', signal, trouble||'trouble cleared')
  }

  function deactivate(schedule) {
    for (let source of schedule.sources||[]) {
      emitterFor(source.slugitem).removeListener('sample', source.listener)
    }
  }

  function start(slugitem, schedule) {
    console.log({slugitem, schedule})
    detectors[slugitem] = activate(schedule)
  }

  function stop(slugitem) {
    console.log({slugitem})
    deactivate(detectors[slugitem]||{sources:[]})
    delete detectors[slugitem]
  }

  function owner(req, res, next) {
    if(app.securityhandler.isAuthorized(req)) {
      next()
    } else {
      res.status(403).send({
        error: 'operation reserved for site owner'
      })
    }
  }

  // {
  //   action: "start",
  //   schedule: {...}
  // }

  app.post('/plugin/detect/:slug/id/:id/', owner, (req, res) => {
    let slug = req.params['slug']
    let item = req.params['id']
    let slugitem = `${slug}/${item}`
    let command = req.body
    if (command.action) {
      if (command.action == 'start') {
        start(slugitem, command.schedule)
      } else if (command.action == 'stop') {
        stop(slugitem)
      }
    }
    let status = detectors[slugitem] ? 'active' : 'inactive'
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({status}));
  })

};

module.exports = {startServer};
