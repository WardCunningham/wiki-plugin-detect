// detect plugin, server-side component
// These handlers are launched with the wiki server.

function startServer (params) {
  var app = params.app,
      argv = params.argv;

  var detectors = {} // slug/item => event handler
  var emitters = {} // slug/item => event emitter

  function activate(schedule) {
    return "emitter"
  }

  function start(slugitem, schedule) {
    console.log({slugitem, schedule})
    detectors[slugitem] = {schedule}
    emitters[slugitem] = activate(schedule)
  }

  function stop(slugitem) {
    console.log({slugitem})
    delete detectors[slugitem]
    delete emitters[slugitem]
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
