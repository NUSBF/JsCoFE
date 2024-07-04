
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  prepare log
//var log = require('./server.log').newLog(2);

const __modules = {};

function getModuleRef ( name,offset,pattern )  {
  let modref = name.substr(offset).toLowerCase();
  if (!(modref in __modules))
    __modules[modref] = require ( pattern + modref );
    // __modules[modref] = require ( pattern + modref ).name;
  return modref;
  // return '__modules.' + modref + '.' + name;
}

function getModuleRef1 ( name,modref,module )  {
  if (!(modref in __modules))
    __modules[modref] = require ( module );
    // __modules[modref] = require ( module ).name;
  return modref;
  // return '__modules.' + modref + '.' + name;
}

// auxiliary function for getObjectInstance(), not to be used by itself
function __object_to_instance ( key,value ) {

  if (value==null)
    return value;

  if (!value.hasOwnProperty('_type'))
    return value;

  let moduleRef = '';
  if (value._type.startsWith('Task'))  {
    moduleRef = getModuleRef ( value._type,4,'../js-common/tasks/common.tasks.' );
  } else if (value._type.startsWith('Data'))  {
    moduleRef = getModuleRef ( value._type,4,'../js-common/dtypes/common.dtypes.' );
  } else if (value._type=='UserRation')  {
    moduleRef = getModuleRef ( value._type,0,'../js-common/common.' );
  // } else if (value._type=='ProjectShare')  {
  //   moduleRef = getModuleRef1 ( value._type,'pd','../js-common/common.data_project' );
  // } else if (value._type=='ProjectList')  {
  //   moduleRef = getModuleRef1 ( value._type,'pd','../js-common/common.data_project' );
  } else if (value._type.startsWith('Project'))  {
    moduleRef = getModuleRef1 ( value._type,'pd','../js-common/common.data_project' );
  } else if (value._type=='UsageStats')  {
    moduleRef = getModuleRef ( value._type,0,'../js-server/server.fe.' );
  }

// console.log ( ' >>>> type=' + value._type );

  let obj = null;
  if (moduleRef.length>0)
    obj = new __modules[moduleRef][value._type]();
      //  obj = eval ( 'new ' + moduleRef + '()' );
  else obj = {};  // no class mapping

  for (let property in value)
    obj[property] = value[property];

  return obj;

}

// recreates particular class instance from stringified object
function getClassInstance ( class_json )  {
  // return JSON.parse ( class_json,__object_to_instance );
  try {
    return JSON.parse ( class_json,__object_to_instance );
  } catch(e) {
    return null;
  }
}

function makeClass ( classObject )  {
  return getClassInstance ( JSON.stringify(classObject) );
}

function makeTaskClass ( classType )  {
  if (classType)  {
    let moduleRef = getModuleRef ( classType,4,'../js-common/tasks/common.tasks.' );
    if (moduleRef.length>0)
      return new __modules[moduleRef][classType]();
      // return eval ( 'new ' + moduleRef + '()' );
  }
  return null;
}

// ==========================================================================
// export for use in node
module.exports.makeTaskClass    = makeTaskClass;
module.exports.getClassInstance = getClassInstance;
module.exports.makeClass        = makeClass;
