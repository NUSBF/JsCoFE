
/*
 *  =================================================================
 *
 *    13.08.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.class_map.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Class extension functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

//  prepare log
//var log = require('./server.log').newLog(2);

var classMap = {};

function getClassName ( name,offset,pattern )  {
  var n = name.substr(offset).toLowerCase();
  if (!(n in classMap))
    classMap[n] = require ( pattern + n );
  return 'classMap.' + n + '.' + name;
}

// auxiliary function for getObjectInstance(), not to be used by itself
function __object_to_instance ( key,value ) {

  if (value==null)
    return value;

  if (!value.hasOwnProperty('_type'))
    return value;

  var className = '';
  if (value._type.startsWith('Task'))  {
    className = getClassName ( value._type,4,'../js-common/tasks/common.tasks.' );
  } else if (value._type.startsWith('Data'))  {
    className = getClassName ( value._type,4,'../js-common/dtypes/common.dtypes.' );
  } else if (value._type=='UserRation')  {
    className = getClassName ( value._type,0,'../js-common/common.' );
  } else if (value._type=='UsageStats')  {
    className = getClassName ( value._type,0,'../js-server/server.fe.' );
  }

  var obj = null;
  if (className.length>0)
       obj = eval ( 'new ' + className + '()' );
  else obj = {};  // no class mapping

  for (var property in value)
    obj[property] = value[property];

  return obj;

}

// recreates particular class instance from stringified object
function getClassInstance ( class_json )  {
  try {
    return JSON.parse ( class_json,__object_to_instance );
  } catch(e) {
    return null;
  }
}

function makeClass ( classObject )  {
  return getClassInstance ( JSON.stringify(classObject) );
}

// ==========================================================================
// export for use in node
module.exports.getClassInstance = getClassInstance;
module.exports.makeClass        = makeClass;
