
/*
 *  ==========================================================================
 *
 *    04.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.data_storage.js
 *       ~~~~~~~~~
 *  **** Storage :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Cloud Storage Data Classes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

var __cmd = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __cmd = require ( './common.commands' );

// ===========================================================================

function StorageFile()  {
  this._type   = 'StorageFile';
  this.id      = '';
  this.name    = '';
  this.size    = '';
  this.date    = '';
  this.message = '';
  this.code    = 'ok';
}

if (__cmd)
  __cmd.registerClass ( 'StorageFile',StorageFile,null );
else    registerClass ( 'StorageFile',StorageFile,null );


StorageFile.prototype.from_Object = function ( object )  {
  for (var property in object)
    if (object.hasOwnProperty(property))
      this[property] = object[property];
}

// ===========================================================================

function StorageDir()  {
  this._type = 'StorageDir';
  this.name  = '';
  this.size  = '';
  this.dirs  = [];  // sub-directories
  this.files = [];  // dataset files
}

if (__cmd)
  __cmd.registerClass ( 'StorageDir',StorageDir,null );
else    registerClass ( 'StorageDir',StorageDir,null );

StorageDir.prototype.addFile = function ( depth,nlist,file )  {
  // note that directory and file lists are not emptied here
  if (depth==nlist.length-1)  {  // all subdirectories done, add file
    var file1  = new StorageFile();
    file1.id   = file.id;
    file1.name = nlist[depth];
    file1.size = file.size;
    file1.date = file.date;
    this.files.push ( file1 );
  } else  {  // add next subdirectory
    var dir = null;
    for (var j=0;(j<this.dirs.length) && (!dir);j++)
      if (this.dirs[j].name==nlist[depth])
        dir = this.dirs[j];
    if (!dir)  {
      dir = new StorageDir();
      dir.name = nlist[depth];
      this.dirs.push ( dir );
    }
    dir.addFile ( depth+1,nlist,file );
  }
}

StorageDir.prototype.from_Object = function ( object )  {
  this.dirs = [];
  var dirs = object['dirs'];
  for (var i=0;i<dirs.length;i++)  {
    var dir = new StorageDir();
    dir.from_Object ( dirs[i] );
    this.dirs.push ( dir );
  }
  this.files = [];
  var files = object['files'];
  for (var i=0;i<files.length;i++)  {
    var file = new StorageFile();
    file.from_Object ( files[i] );
    this.files.push ( file );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='files') && (property!='dirs'))
      this[property] = object[property];
}


// ===========================================================================

function StorageList()  {
  this._type   = 'StorageList';
  this.path    = '';
  this.name    = '';
  this.size    = 0;
  this.dirs    = [];  // sub-directories (StorageDir)
  this.files   = [];  // dataset files (StorageFile)
  this.sectors = [];  // file templates and ranges, for example:
                      // "sectors" : [{"template":"hg-###.mar1600",
                      //               "ranges":[[1,29]]
                      //              },
                      //              {"template":"hg_###.mar1600",
                      //               "ranges":[[1,29],[31,84]]
                      //              }]
}

if (__cmd)
  __cmd.registerClass ( 'StorageList',StorageList,null );
else    registerClass ( 'StorageList',StorageList,null );

// ===========================================================================
//  Legacy code for old projects compatibility 
var FacilityFile = StorageFile;
var FacilityDir  = StorageDir;
var FacilityList = StorageList;

// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.StorageFile  = StorageFile;
  module.exports.StorageDir   = StorageDir;
  module.exports.StorageList  = StorageList;
  module.exports.FacilityFile = StorageFile;
  module.exports.FacilityDir  = StorageDir;
  module.exports.FacilityList = StorageList;
}
