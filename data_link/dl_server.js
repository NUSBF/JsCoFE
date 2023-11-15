#!/usr/bin/env node

'use strict';

const express = require('express');
const bodyparser = require('body-parser');

const app = express();

const { tools, status } = require('./js/tools.js');
const datalink = require('./js/data_link.js');
const config = require('./js/config.js');
const log = require('./js/log.js');

class server {

  constructor() {
    this.datalink = new datalink();
  }

  jsonResponse(res, data) {
    res.set('Content-Type', 'application/json');
    res.send(tools.jsonMessage(data));
  }

  middleware(req, res, next) {
    next();
  }

  checkCloudId(req, res, next) {
    if (tools.validCloudId(req.params.user, req.body.cloud_id)) {
      next();
    } else {
      this.jsonResponse(res, tools.errorMsg('Invalid User or Cloud Run ID'));
    }
  }

  getSources(req, res) {
    this.jsonResponse(res, this.datalink.getSources());
  }

  getSourceCatalog(req, res) {
    let response = {};
    if (req.params.id) {
      response = this.datalink.getSourceCatalog(req.params.id);
      if (response.error) {
        res.status(404).send(response);
        return;
      }
    } else {
      response = this.datalink.getAllSourceCatalogs();
    }
    this.jsonResponse(res, response);
  }

  async searchSourceCatalog(req, res) {
    this.jsonResponse(res, await this.datalink.searchSourceCatalog(req.params.id.toLowerCase()));
  }

  updateSourceCatalog(req, res) {
    let response = {};
    if (req.params.id) {
      response = this.datalink.updateSourceCatalog(req.params.id);
    } else {
      response = this.datalink.updateAllSourceCatalogs();
    }
    this.jsonResponse(res, response);
  }

  getLocalCatalog(req, res) {
    this.jsonResponse(res, this.datalink.catalog);
  }

  dataAquire(req, res) {
    let force = false;
    if (req.query.force == 1) {
      force = true;
    }
    this.jsonResponse(res, this.datalink.dataAquire(req.params.user, req.params.source, req.params.id, force));
  }

  dataStatus(req, res) {
    this.jsonResponse(res, this.datalink.dataStatus(req.params.user, req.params.source, req.params.id));
  }

  dataRemove(req, res) {
    this.jsonResponse(res, this.datalink.dataRemove(req.params.user, req.params.source, req.params.id));
  }

  dataInUse(req, res) {
    this.jsonResponse(res, this.datalink.dataInUse(req.params.user, req.params.source, req.params.id, req.params.value));
  }

  start(port = 8900, host = '') {
    app.use((req, res, next) => this.middleware(req, res, next));

    app.use(bodyparser.json());

    // app.use(bodyparser.urlencoded({ extended: true }));

    // data source info/catalog endpoints
    app.get(['/sources'], (req, res) => this.getSources(req, res) );
    app.get(['/source/catalog', '/source/catalog/:id'], (req, res) => this.getSourceCatalog(req, res) );
    app.get(['/source/search/:id'], (req, res) => this.searchSourceCatalog(req, res) );

    app.put(['/source/update', '/source/update/:id'], (req, res) => this.updateSourceCatalog(req, res) );

    // local catalog endpoints
    app.get(['/local/catalog'], (req, res) => this.getLocalCatalog(req, res) );

    // data retrieval endpoints
    app.put(['/data/aquire/:user/:source/:id'],
      (req, res, next) => this.checkCloudId(req, res, next),
      (req, res) => this.dataAquire(req, res) );
    app.put(['/data/remove/:user/:source/:id'],
      (req, res, next) => this.checkCloudId(req, res, next),
      (req, res) => this.dataRemove(req, res) );
    app.put(['/data/status/:user', '/data/status/:user/:source/:id', ],
      (req, res, next) => this.checkCloudId(req, res, next),
      (req, res) => this.dataStatus(req, res) );

    app.patch(['/data/inuse/:value/:user/:source/:id'],
      (req, res, next) => this.checkCloudId(req, res, next),
      (req, res) => this.dataInUse(req, res) );

    app.get('/', function(req,res) {
      res.send(app._router.stack.map( r => r.route?.path ));
    });

    app.listen( port, host, function(err) {
      if (err) {
        log.info(err)
      } else {
        log.info(`Data Link Server - Running on ${host}:${port}`);
      }
    });
  }

  stop() {
    server.close(() => {
        console.log('Shutting down.');
        process.exit(0);
    });
  }

}

const PORT = config.get('server.port');
const HOST = config.get('server.host');

server = new server();
server.start(PORT, HOST);