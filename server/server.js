// detect plugin, server-side component
// These handlers are launched with the wiki server.

const events = require('events')

function startServer (params) {
  var app = params.app,
      argv = params.argv;

  var detectors = {} // slug/item => event handler
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
  //     {slugitem: "slug/item"},
  //     {slugitem: "slug/item"}
  //   ]
  // }

  function activate(schedule) {
    for (var source of schedule.sources||[]) {
        let sourcex = source
        console.log('source',sourcex)
        sourcex.recent = [null, null, null, null]
        sourcex.listener = (sample) => {sourcex.recent.shift(); sourcex.recent.push(sample); console.log({sourcex})}
        let emitter = emitterFor(sourcex.slugitem)
        emitter.on('sample',sourcex.listener)
    }
    return schedule
  }

  function deactivate(schedule) {
    for (var source of schedule.sources||[]) {
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

  app.get('/plugin/detect/:thing', (req, res) => {
    var thing = req.params.thing;
    return res.json({thing});
  });

  app.post('/plugin/detect/:slug/id/:id/', owner, (req, res) => {
    let slug = req.params['slug']
    let item = req.params['id']
    let slugitem = `${slug}/${item}`
    let command = req.body
    console.log('action',command.action||'status',slugitem)
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
