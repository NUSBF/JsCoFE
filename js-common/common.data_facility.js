
/*
 *  ==========================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.data_facility.js
 *       ~~~~~~~~~
 *  **** Facility :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Facility Data Classes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

var facility_names = {
  icat : 'icat'
}


// ===========================================================================

function FacilityFile()  {
  this._type = 'FacilityFile';
  this.id    = '';
  this.name  = '';
  this.size  = '';
  this.date  = '';
}

FacilityFile.prototype.from_Object = function ( object )  {
  for (var property in object)
    if (object.hasOwnProperty(property))
      this[property] = object[property];
}


// ===========================================================================

function FacilityDir()  {
  this._type = 'FacilityDir';
  this.name  = '';
  this.size  = '';
  this.dirs  = [];  // sub-directories
  this.files = [];  // dataset files
}

FacilityDir.prototype.addFile = function ( depth,nlist,file )  {
  // note that directory and file lists are not emptied here
  if (depth==nlist.length-1)  {  // all subdirectories done, add file
    var file1  = new FacilityFile();
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
      dir = new FacilityDir();
      dir.name = nlist[depth];
      this.dirs.push ( dir );
    }
    dir.addFile ( depth+1,nlist,file );
  }
}

FacilityDir.prototype.from_Object = function ( object )  {
  this.dirs = [];
  var dirs = object['dirs'];
  for (var i=0;i<dirs.length;i++)  {
    var dir = new FacilityDir();
    dir.from_Object ( dirs[i] );
    this.dirs.push ( dir );
  }
  this.files = [];
  var files = object['files'];
  for (var i=0;i<files.length;i++)  {
    var file = new FacilityFile();
    file.from_Object ( files[i] );
    this.files.push ( file );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='files') && (property!='dirs'))
      this[property] = object[property];
}


// ===========================================================================

function FacilityDataset()  {
  this._type = 'FacilityDataset';
  this.id    = '';
  this.path  = '';
  this.dirs  = [];  // dataset directories
  this.files = [];  // dataset files
}

FacilityDataset.prototype.addFiles = function ( files )  {
  var dlist  = this.path.split('/');
  this.dirs  = [];  // dataset directories
  this.files = [];  // dataset files
  for (var i=0;i<files.length;i++)  {
    var fname = files[i].name;
    var nlist = fname.split('/');
    if (nlist.length>1)  {
      var ncommon = 0;
      if (dlist.length<nlist.length)
        for (var j=0;j<dlist.length;j++)
          if (dlist[j]==nlist[j])  ncommon++;
                             else  break;
      if (ncommon==nlist.length-1)  {  // dataset and file paths are identical
        fname = nlist[ncommon];  // file will be added below
      } else  {
        var dir = null;
        for (var j=0;(j<this.dirs.length) && (!dir);j++)
          if (this.dirs[j].name==nlist[ncommon])
            dir = this.dirs[j];
        if (!dir)  {
          dir = new FacilityDir();
          dir.name = nlist[ncommon];
          this.dirs.push ( dir );
        }
        dir.addFile ( ncommon+1,nlist,files[i] );
        fname = null;  // to block adding file in file part below
      }
    }
    if (fname)  {
      var file  = new FacilityFile();
      file.id   = files[i].id;
      file.name = fname;
      file.size = files[i].size;
      file.date = files[i].date;
      this.files.push ( file );
    }
  }
}

FacilityDataset.prototype.from_Object = function ( object )  {
  this.dirs = [];
  var dirs = object['dirs'];
  for (var i=0;i<dirs.length;i++)  {
    var dir = new FacilityDir();
    dir.from_Object ( dirs[i] );
    this.dirs.push ( dir );
  }
  this.files = [];
  var files = object['files'];
  for (var i=0;i<files.length;i++)  {
    var file = new FacilityFile();
    file.from_Object ( files[i] );
    this.files.push ( file );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='files') && (property!='dirs'))
      this[property] = object[property];
}


// ===========================================================================

function FacilityVisit ( vname,vid,vdate )  {
  this._type    = 'FacilityVisit';
  this.name     = vname;
  this.id       = vid;
  this.date     = vdate;  // year/mm/dd
  this.datasets = [];
}

FacilityVisit.prototype.addDatasets = function ( datasets )  {
  this.datasets = [];
  for (var i=0;i<datasets.length;i++)
    if (datasets[i].files.length>0)  {
      var dataset = new FacilityDataset();
      dataset.id   = datasets[i].id;
      dataset.path = datasets[i].path;
      dataset.addFiles ( datasets[i].files );
      this.datasets.push ( dataset );
    }
}

FacilityVisit.prototype.from_Object = function ( object )  {
  this.datasets = [];
  var datasets = object['datasets'];
  for (var i=0;i<datasets.length;i++)  {
    var dataset = new FacilityDataset();
    dataset.from_Object ( datasets[i] );
    this.datasets.push ( dataset );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='datasets'))
        this[property] = object[property];
}


// ===========================================================================

function FacilityUser ( uid )  {
  this._type  = 'FacilityUser';
  this.id     = uid;
  this.visits = [];
}

FacilityUser.prototype.getVisit = function ( vid )  {
var visit = null;
  for (var i=0;(i<this.visits.length) && (!visit);i++)
    if (this.visits[i].id==vid)
      visit = this.visits[i];
  return visit;
}

FacilityUser.prototype.addVisits = function ( vnames,vids,vdates )  {
var visits = [];
  if (vnames)
    for (var i=0;i<vnames.length;i++)  {
      var visit = this.getVisit ( vids[i] );
      if (!visit)
        visit = new FacilityVisit ( vnames[i],vids[i],vdates[i] );
      visits.push ( visit );
    }
  this.visits = visits;
}

FacilityUser.prototype.from_Object = function ( object )  {
  this.visits = [];
  var visits = object['visits'];
  for (var i=0;i<visits.length;i++)  {
    var visit = new FacilityVisit('','','');
    visit.from_Object ( visits[i] );
    this.visits.push ( visit );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='visits'))
        this[property] = object[property];
}


// ===========================================================================

function Facility()  {
  this._type  = 'Facility';
  this.name   = '';
  this.title  = '';
  this.icon   = '';
  this.users  = [];
}

Facility.prototype.getUser = function ( uid )  {
var user = null;
  for (var i=0;(i<this.users.length) && (!user);i++)
    if (this.users[i].id==uid)
      user = this.users[i];
  return user;
}

Facility.prototype.addVisits = function ( uid,vnames,vids,vdates )  {
var user = this.getUser ( uid );
  if (!user)  {
    user = new FacilityUser ( uid );
    this.users.push ( user );
  }
  user.addVisits ( vnames,vids,vdates );
}

Facility.prototype.from_Object = function ( object )  {
  this.users = [];
  var users = object['users'];
  for (var i=0;i<users.length;i++)  {
    var user = new FacilityUser('');
    user.from_Object ( users[i] );
    this.users.push ( user );
  }
  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='users'))
        this[property] = object[property];
}


// ===========================================================================

function FacilityList()  {
  this._type      = 'FacilityList';
  this.facilities = [];
}

FacilityList.prototype.getFacility = function ( fcl_name )  {
  var facility = null;
  for (var i=0;(i<this.facilities.length) && (!facility);i++)
    if (this.facilities[i].name==fcl_name)
      facility = this.facilities[i];
  return facility;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

  var cmd = require('./common.commands');

  FacilityList.prototype.addFacility = function ( fcl_name,title_str )  {
    if (!this.getFacility(fcl_name))  {
      var facility = new Facility();
      facility.name  = fcl_name;
      facility.title = title_str;
      if (fcl_name==facility_names.icat)
        facility.icon = cmd.image_path('facility_icat');
      this.facilities.push ( facility );
      return true;
    } else
      return false;
  }

} else  {

  FacilityList.prototype.addFacility = function ( fcl_name,title_str )  {
    if (!this.getFacility(fcl_name))  {
      var facility = new Facility();
      facility.name  = fcl_name;
      facility.title = title_str;
      if (fcl_name==facility_names.icat)
        facility.icon = image_path('facility_icat');
      this.facilities.push ( facility );
      return true;
    } else
      return false;
  }

}

FacilityList.prototype.addVisits = function ( fcl_name,uid,vnames,vids,vdates ) {
var facility = this.getFacility ( fcl_name );
  if (facility)
    facility.addVisits ( uid,vnames,vids,vdates );
}

FacilityList.prototype.addDatasets = function ( fcl_name,uid,vid,datasets ) {
var facility = this.getFacility ( fcl_name );
  if (facility)  {
    var user = facility.getUser ( uid );
    if (user)  {
      var visit = user.getVisit ( vid );
      if (visit)
        visit.addDatasets ( datasets );
    }
  }
}

FacilityList.prototype.to_JSON = function()  {
  return JSON.stringify(this);
}

FacilityList.prototype.from_JSON = function ( json_str )  {

  this.facilities = [];

  var object = JSON.parse ( json_str );
  var facilities = object['facilities'];
  for (var i=0;i<facilities.length;i++)  {
    var facility = new Facility();
    facility.from_Object ( facilities[i] );
    this.facilities.push ( facility );
  }

  for (var property in object)
    if (object.hasOwnProperty(property) && (property!='facilities'))
        this[property] = object[property];

}


// ===========================================================================

function StorageList()  {
  this._type   = 'StorageList';
  this.path    = '';
  this.name    = '';
  this.size    = 0;
  this.dirs    = [];  // sub-directories (FacilityDir)
  this.files   = [];  // dataset files (FacilityFile)
  this.sectors = [];  // file templates and ranges, for example:
                      // "sectors" : [{"template":"hg-###.mar1600",
                      //               "ranges":[[1,29]]
                      //              },
                      //              {"template":"hg_###.mar1600",
                      //               "ranges":[[1,29],[31,84]]
                      //              }]

}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.facility_names  = facility_names;
  module.exports.FacilityFile    = FacilityFile;
  module.exports.FacilityDir     = FacilityDir;
  module.exports.FacilityDataset = FacilityDataset;
  module.exports.FacilityVisit   = FacilityVisit;
  module.exports.FacilityUser    = FacilityUser;
  module.exports.Facility        = Facility;
  module.exports.FacilityList    = FacilityList;
  module.exports.StorageList     = StorageList;
}
