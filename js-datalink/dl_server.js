#!/usr/bin/env node

'use strict';

const express = require('express');
const bodyparser = require('body-parser');

const { tools, status } = require('./js/tools.js');
const datalink = require('./js/data_link.js');
const config = require('./js/config.js');
const log = require('./js/log.js');

const API_PREFIX = '/api';

class server {

  constructor() {
    this.datalink = new datalink();
    this.datalink.resumeData();
  }

  jsonResponse(res, data) {
    res.set('Content-Type', 'application/json');
    let code = 200;
    if (data.code) {
      code = data.code;
      delete data.code;
    }
    let json = JSON.stringify(data);
    res.status(code).send(json);
  }

  middleware(req, res, next) {
    try {
      decodeURIComponent(req.path)
      next();
    }
    catch(err) {
      log.error(`Failed to decode parameter: ${req.url}`);
      this.jsonResponse(res, tools.errorMsg(`Invalid request - ${req.url}`, 400));
    }
  }

  checkCloudRunId(req, res, next) {
    if (tools.validCloudRunId(req.params.user, req.headers.cloudrun_id) ||
        tools.validAdminKey(req.headers.admin_key)) {
      next();
    } else {
      this.jsonResponse(res, tools.errorMsg('Invalid User or Cloud Run ID', 403));
    }
  }

  checkAdminKey(req, res, next) {
    if (tools.validAdminKey(req.headers.admin_key)) {
      next();
    } else {
      this.jsonResponse(res, tools.errorMsg('Invalid Admin Key', 403));
    }
  }

  getSources(req, res) {
    let data;
    if (! req.params.id || req.params.id === '*') {
      data = this.datalink.getAllSources();
    } else {
      data = this.datalink.getSource(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  getSourceCatalog(req, res) {
    let data;
    if (req.params.id === '*') {
      data = this.datalink.getAllSourceCatalogs();
    } else {
      data = this.datalink.getSourceCatalog(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  async searchSourceCatalog(req, res) {
    this.jsonResponse(res, await this.datalink.searchSourceCatalog(req.params.search));
  }

  updateSourceCatalog(req, res) {
    let data = {};
    if (req.params.id === '*') {
      data = this.datalink.updateAllSourceCatalogs();
    } else {
      data = this.datalink.updateSourceCatalog(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  getLocalCatalog(req, res) {
    this.jsonResponse(res, this.datalink.catalog);
  }

  fetchData(req, res) {
    let force = false;
    if (req.query.force == 1) {
      force = true;
    }
    this.jsonResponse(res, this.datalink.fetchData(req.params.user, req.params.source, req.params.id, force));
  }

  getDataStatus(req, res) {
    this.jsonResponse(res, this.datalink.getDataStatus(req.params.user, req.params.source, req.params.id));
  }

  removeData(req, res) {
    this.jsonResponse(res, this.datalink.removeData(req.params.user, req.params.source, req.params.id));
  }

  updateData(req, res) {
    this.jsonResponse(res, this.datalink.updateData(req.params.user, req.params.source, req.params.id, req.body));
  }

  start(port = config.get('server.port'), host = config.get('server.host')) {

    // set up express router
    const router = express.Router();
    router.use((req, res, next) => this.middleware(req, res, next));
    router.use(bodyparser.json());

    // data source info/catalog endpoints
    router.get(['/sources', '/sources/:id'], (req, res) => this.getSources(req, res) );
    router.get(['/sources/:id/catalog'], (req, res) => this.getSourceCatalog(req, res) );
    router.get('/search/:search', (req, res) => this.searchSourceCatalog(req, res) );

    router.put('/sources/:id/update',
      (req, res, next) => this.checkAdminKey(req, res, next),
      (req, res) => this.updateSourceCatalog(req, res) );

    // data retrieval and local data catalog endpoints
    // get data status for all users
    router.get(['/data'],
      (req, res, next) => this.checkAdminKey(req, res, next),
      (req, res) => this.getDataStatus(req, res) );
    // get data status for user, user and source, and specific data entry
    router.get(['/data/:user', '/data/:user/:source', '/data/:user/:source/:id' ],
      (req, res, next) => this.checkCloudRunId(req, res, next),
      (req, res) => this.getDataStatus(req, res) );
    // fetch data for user
    router.put('/data/:user/:source/:id',
      (req, res, next) => this.checkCloudRunId(req, res, next),
      (req, res) => this.fetchData(req, res) );
    // delete data for user
    router.delete('/data/:user/:source/:id',
      (req, res, next) => this.checkCloudRunId(req, res, next),
      (req, res) => this.removeData(req, res) );
    // update data for user
    router.patch(['/data/:user/:source/:id'],
      (req, res, next) => this.checkCloudRunId(req, res, next),
      (req, res) => this.updateData(req, res) );

    const app = express();
    app.use(API_PREFIX, router);

    app.get(['/', '/api'], function(req,res) {
      res.send(router.stack.map( r => r.route?.path ));
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

server = new server();
server.start();
