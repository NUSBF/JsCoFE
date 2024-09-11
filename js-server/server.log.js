
/*
 *  =================================================================
 *
 *    11.09.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.log.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Log file functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

const com_utils = require('../js-common/common.utils');

// ==========================================================================

const vrb = {  // verbosity levels
  standard : 0,
  detailed : 1,
  debug    : 2,
  debug1   : 3,
  debug2   : 4
}

var verbosity = vrb.standard;

function setVerbosity ( verbosity_level )  {
  verbosity = verbosity_level;
}


function log ( logId )  {
  this.idstr = '] ' + com_utils.padDigits(logId,2) + '-';
}

function newLog ( logId )  {
  return new log(logId);
}

log.prototype.write = function ( code,message ) {
  let d = new Date();
  console.log ( '[' + d.toISOString() + this.idstr + com_utils.padDigits(code,3)
                    + ' ' + message );
}

log.prototype.standard = function ( code,message ) {
  if (verbosity>=vrb.standard)
    this.write ( code,'... ' + message );
}

log.prototype.detailed = function ( code,message ) {
  if (verbosity>=vrb.detailed)
    this.write ( code,'--- ' + message );
}

log.prototype.debug = function ( code,message ) {
  if (verbosity>=vrb.debug)
    this.write ( code,'=== ' + message );
}

log.prototype.debug1 = function ( code,message ) {
  if (verbosity>=vrb.debug1)
    this.write ( code,'==1 ' + message );
}

log.prototype.debug2 = function ( code,message ) {
  if (verbosity>=vrb.debug1)
    this.write ( code,'==2 ' + message );
}

log.prototype.warning = function ( code,message ) {
  this.write ( code,'+++ ' + message );
}

log.prototype.error = function ( code,message ) {
  this.write ( code,'*** ' + message );
}


// ==========================================================================
// export for use in node
module.exports.vrb          = vrb;
module.exports.setVerbosity = setVerbosity;
module.exports.log          = log;
module.exports.newLog       = newLog;
