
/* =========================================================================

  The port number assigner.

  Invokation:
    node ./assign_ports.js inputConfigFile outputConfigFile [feURLFile]

  where "inputConfigFile" is path to JSON-formatted configuration file, which
  may contain zero port numbers. If zero ports are found, they are assigned
  port numbers chosen from what is available in the system. The result is
  written in "outputConfigFile" which may be used for the configuration of
  Front End, Number Cruncher(s) and Local Service as necessary.

  The optional "feURLFile" parameter gives path to file with Front End URL.

  ========================================================================== */

//  load application modules
var conf  = require('./js-server/server.configuration');
var utils = require('./js-server/server.utils');

//  prepare log
var log = require('./js-server/server.log').newLog(15);

// ==========================================================================

function cmdLineError()  {
  log.error ( 6,'Incorrect command line. Stop.' );
  log.error ( 6,'Restart as "node ./assign_ports.js inputConfigFile outputConfigFile"' );
  process.exit();
}

if (process.argv.length<4)
  cmdLineError();

var msg = conf.readConfiguration ( process.argv[2] );
if (msg)  {
  log.error ( 7,'initial configuration failed. Stop.' );
  log.error ( 7,msg );
  process.exit();
}


// ==========================================================================

conf.assignPorts ( function(){
  conf.writeConfiguration ( process.argv[3] );
  if (process.argv.length==5)
    utils.writeString ( process.argv[4],conf.getFEConfig().url() );
});
