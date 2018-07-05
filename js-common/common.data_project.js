
/*
*  ==========================================================================
 *
 *    07.06.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.data_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project Data Classes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

function ProjectDesc()  {
  this._type        = 'ProjectDesc';
  this.name         = '';
  this.title        = '';
  this.disk_space   = 0.0;  // in MBs, corresponds to current project state
  this.cpu_time     = 0.0;  // in hours, accumulated over all project history
  this.njobs        = 0;    // over all project history
  this.dateCreated  = '';   // year/mm/dd
  this.dateLastUsed = '';   // year/mm/dd
}

function ProjectList()  {
  this._type    = 'ProjectList';
  this.projects = [];     // will contain ProjectDesc
  this.current  = '';     // current project name
  this.sortList = null;   // sort options
}

ProjectList.prototype.isProject = function ( name_str )  {
  var is_project = false;
  for (var i=0;(i<this.projects.length) && (!is_project);i++)
    is_project = (this.projects[i].name == name_str);
  return is_project;
}


ProjectList.prototype.addProject = function ( name_str,title_str,time_str )  {
  if (!this.isProject(name_str))  {
    var pDesc          = new ProjectDesc();
    pDesc.name         = name_str;
    pDesc.title        = title_str;
    pDesc.dateCreated  = time_str;
    pDesc.dateLastUsed = time_str;
    this.projects.push ( pDesc );
    this.current       = name_str;
    this.sortList      = null;
    return true;
  } else
    return false;
}

ProjectList.prototype.deleteProject = function ( name_str )  {
var new_projects = [];
  this.current = name_str;
  for (var i=0;i<this.projects.length;i++)  {
    if (!this.current)
      this.current = this.projects[i].name;
    if (this.projects[i].name!=name_str)
      new_projects.push ( this.projects[i] );
    else
      this.current = '';
  }
  if ((!this.current) && (new_projects.length>0))
    this.current = new_projects.length - 1;
  this.projects = new_projects;
}


// ===========================================================================

function ProjectData()  {
  this._type    = 'ProjectData';
  this.desc     = new ProjectDesc();  // project description
  this.jobCount = 0;                  // job count
  this.tree     = [];                 // project tree
}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.ProjectDesc = ProjectDesc;
  module.exports.ProjectList = ProjectList;
  module.exports.ProjectData = ProjectData;
}
