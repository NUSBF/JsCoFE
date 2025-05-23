#!/usr/bin/env node

'use strict';

const https = require('https');
const express = require('express');
const busboy = require('busboy');
const bodyparser = require('body-parser');
const stream = require('stream');

const fs = require('fs');
const { tools, status } = require('./js/tools.js');
const datalink = require('./js/data_link.js');
const config = require('./js/config.js');
const log = require('./js/log.js');

/**
 * API route prefix.
 * @constant {string}
 */
const API_PREFIX = '/api';

/**
 * Class representing the Data Link Server.
 * Handles routing, data validation, middleware, and response formatting for the DataLink management API.
 */
class server {

  server = null;

  constructor() {
    this.datalink = new datalink();
    this.datalink.resumeData();
  }

  /**
   * Sends a JSON response with the appropriate HTTP status code.
   * @param {express.Response} res - The Express response object.
   * @param {Object} data - Data to send as JSON.
   */
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

  /**
   * Middleware to decode the request path. Responds with error if decoding fails.
   * @param {express.Request} req
   * @param {express.Response} res
   * @param {Function} next
   */
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

  /**
   * Validates cloud run ID or admin key in headers.
   */
  checkCloudRunId(req, res, next) {
    if (tools.validCloudRunId(req.params.user, req.headers.cloudrun_id) ||
        tools.validAdminKey(req.headers.admin_key)) {
      next();
    } else {
      this.jsonResponse(res, tools.errorMsg('Invalid User or Cloud Run ID', 403));
    }
  }

  /**
   * Checks if the provided source and ID are valid.
   */
  checkValidSourceId(req, res, next) {
    let check = tools.validSourceId(req.params.source, req.params.id);
    if (check === true) {
      next();
    } else {
      this.jsonResponse(res, check);
    }
  }

  /**
   * Middleware to check for valid admin key.
   */
  checkAdminKey(req, res, next) {
    if (tools.validAdminKey(req.headers.admin_key)) {
      next();
    } else {
      this.jsonResponse(res, tools.errorMsg('Invalid Admin Key', 403));
    }
  }

  /**
   * Gets metadata for one or all data sources.
   */
  getSources(req, res) {
    let data;
    if (! req.params.id || req.params.id === '*') {
      data = this.datalink.getAllSources();
    } else {
      data = this.datalink.getSource(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  /**
   * Retrieves the catalog of one or all data sources.
   */
  getSourceCatalog(req, res) {
    let data;
    if (req.params.id === '*') {
      data = this.datalink.getAllSourceCatalogs();
    } else {
      data = this.datalink.getSourceCatalog(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  /**
   * Searches all catalogs using a field and query value.
   * @param {express.Response} res
   * @param {string} field
   * @param {string} value
   */
  async searchSourceCatalogs(res, field, value) {
    this.jsonResponse(res, await this.datalink.searchSourceCatalogs(field, value));
  }

  /**
   * Updates source catalog(s).
   */
  updateSourceCatalog(req, res) {
    let data = {};
    if (req.params.id === '*') {
      data = this.datalink.updateAllSourceCatalogs();
    } else {
      data = this.datalink.updateSourceCatalog(req.params.id);
    }
    this.jsonResponse(res, data);
  }

  /**
   * Initiates a data fetch for a given source entry.
   */
  fetchData(req, res) {
    let force = false;
    if (req.query.force == 1) {
      force = true;
    }
    this.jsonResponse(res, this.datalink.fetchData(req.params.user, req.params.source, req.params.id, force));
  }

  /**
   * Returns the status of data downloads for a user/source/id.
   */
  getDataStatus(req, res) {
    this.jsonResponse(res, this.datalink.getDataStatus(req.params.user, req.params.source, req.params.id));
  }

  /**
   * Removes downloaded data for a specific user/source/id.
   */
  removeData(req, res) {
    this.jsonResponse(res, this.datalink.removeData(req.params.user, req.params.source, req.params.id));
  }

  /**
   * Updates metadata or state for a specific user/source/id.
   */
  updateData(req, res) {
    this.jsonResponse(res, this.datalink.updateData(req.params.user, req.params.source, req.params.id, req.body));
  }

  /**
   * Handles file uploads using Busboy for multipart form data.
   */
  uploadData(req, res, next) {
    // check username
    if (! tools.validUserName(req.params.user)) {
      this.jsonResponse(res, tools.errorMsg(`Invalid user name ${req.params.user}`, 400));
      return;
    }

    const entry = this.datalink.addEntryFromSource(req.params.user, req.params.source, req.params.id);
    if (! entry) {
      this.jsonResponse(res, tools.errorMsg(`Unable to add catalog entry for ${user}/${source}/${id}`, 500));
      return;
    }

    const bb = busboy( { headers: req.headers, preservePath: true } );

    let has_error = false;
    let err_msg = `Error adding to ${req.params.user}/${req.params.source}/${req.params.id}`;

    bb.on('file', (name, in_stream, info) => {
      this.datalink.uploadData(entry, in_stream, info.filename)
      .catch( (err) => {
        // if an error has already been triggered, just return as otherwise jsonResponse will be called twice and throw an error.
        if (has_error) {
          return;
        }
        has_error = true;
        // detach stream
        req.unpipe(bb);
        log.error(err);
        this.datalink.dataError(entry);
        this.jsonResponse(res, err);
      });
    });

    bb.on('finish', () => {
      this.datalink.dataComplete(entry);
      this.jsonResponse(res, tools.successMsg(`Added files to ${req.params.user}/${req.params.source}/${req.params.id}`));
    });

    bb.on('error', (err) => {
      if (has_error) {
        return;
      }
      has_error = true;
      req.unpipe(bb);
      log.error(err);
      this.datalink.dataError(entry);
      this.jsonResponse(res, tools.errorMsg(err_msg, 500));
    });

    req.pipe(bb);
  }

  /**
   * Starts the Express server, sets up routes, middleware, and static file serving.
   * @param {number} [port=config.get('server.port')] - Server port.
   * @param {string} [host=config.get('server.host')] - Server host.
   */
  start(port = config.get('server.port'), host = config.get('server.host')) {

    // set up express router
    const router = express.Router();
    router.use((req, res, next) => this.middleware(req, res, next));
    router.use(bodyparser.json());

    // data source info/catalog endpoints
    router.get(['/sources', '/sources/:id'], (req, res) => this.getSources(req, res) );
    router.get(['/sources/:id/catalog'], (req, res) => this.getSourceCatalog(req, res) );

    // search endpoint
    router.get('/search', (req, res) => this.searchSourceCatalogs(res, req.query.f, req.query.q) );
    // pdb only search (for backwards compatibility)
    router.get('/search/:search', (req, res) => this.searchSourceCatalogs(res, 'pdb', req.params.search) );

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

    if (config.get('data_sources.upload.enabled')) {
      // data upload for user
      router.post(['/data/:user/:source/:id/upload'],
        (req, res, next) => this.checkValidSourceId(req, res, next),
        (req, res, next) => this.checkCloudRunId(req, res, next),
        (req, res, next) => this.uploadData(req, res, next) );
    }

    // data link statistics
    router.get('/stats', (req, res) => {
      this.jsonResponse(res, this.datalink.getDataStats());
    });

    const app = express();
    app.use(API_PREFIX, router);

    // static data
    app.use(express.static('public'))

    app.use((req, res, next) => {
      this.jsonResponse(res, tools.errorMsg(`Cannot ${req.method} ${req.url}`, 404));
    });

    // default to app.listen (http)
    let cs = app;
    let scheme = 'http';

    // if ssl is set, try and load certificates and set up https createServer
    if (config.get('server.ssl')) {
      let key, cert;
      try {
        key = fs.readFileSync(config.get('server.ssl_key'));
        cert = fs.readFileSync(config.get('server.ssl_cert'));
      } catch (err) {
        log.error(`Error loading certificate/key - ${err}`);
        this.stop();
        return;
      }

      // createServer options
      const options = {
        key: key,
        cert: cert
      }

      // create the https server
      cs = https.createServer(options, app);
      scheme = 'https';
    }

    this.server = cs.listen(port, host, function(err) {
      if (err) {
        log.error(err)
      } else {
        log.info(`Data Link Server - Running on ${scheme}://${host}:${port}`);
      }
    });

    // set requestTimeout - sets the timeout value in milliseconds for receiving the entire request from the client.
    // https://nodejs.org/api/http.html#serverrequesttimeout
    this.server.requestTimeout = config.get('server.request_timeout_secs') * 1000;
    log.debug(`Server requestTimeout set to ${server.requestTimeout} ms`);
  }

  /**
   * Stops the Express server and exits the process.
   */
  stop() {
    log.info('Shutting down.');
    if (this.server) {
      this.server.close();
    }
    process.exit(0);
  }

}

server = new server();
server.start();
