
/*
 *  ==========================================================================
 *
 *    11.05.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.data_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project Data Classes
 *       ~~~~~~~~~  ProjectDesc
 *                  ProjectList
 *                  ProjectData
 *                  ProjectShare
 *                  DockData
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

var start_mode = {
  auto     : 'auto',
  standard : 'standard',
  expert   : 'expert',    // legacy
  migrate  : 'migrate'
};

var tasklist_mode = {
  basic : 'basic',
  full  : 'full'
};

// ===========================================================================

function ProjectDesc()  {

  this._type        = 'ProjectDesc';
  this.name         = '';    // short project ID
  this.title        = '';    // descriptive title
  this.owner        = {
    login  : '',   // login where project was created
    name   : '',
    email  : '',
    share  : []    // list of login share objects
  };

  this.folderPath   = 'My Projects';  // virtual project folder path
  this.labels       = [];             // list of optional project labels
  // this.archive = {
  //   id      : '',   // archive ID
  //   version : 0,    // archived project version
  //   pdbCode : ''    // associated PDB code
  // };

  this.jobCount     = 0;      // job count
  this.timestamp    = 0;      // Date.now()
  this.autorun      = false;  // true if a task in autorun mode is runnng
  this.startmode    = start_mode.standard;  // will be overwritten when
                                            // project is created
  this.tasklistmode = tasklist_mode.full;
  // this.project_version = 0;  // possibly, completely redundant and may be deleted
  this.disk_space   = 0.0;  // in MBs, corresponds to current project state
  this.cpu_time     = 0.0;  // in hours, accumulated over all project history
  this.njobs        = 0;    // over all project history
  this.dateCreated  = '';   // year/mm/dd
  this.dateLastUsed = '';   // year/mm/dd
  this.metrics      = {};   // for statistics and searches

}

ProjectDesc.prototype.init = function ( name_str,title_str,startmode,time_str )  {
  this.name         = name_str;
  this.title        = title_str;
  this.dateCreated  = time_str;
  this.dateLastUsed = time_str;
  this.startmode    = startmode;
  if ((this.startmode==start_mode.standard) ||
      (this.startmode==start_mode.expert))  // legacy
        this.tasklistmode = tasklist_mode.full;
  else  this.tasklistmode = tasklist_mode.basic;
}


function isProjectAccessible ( login,projectDesc )  {
  if (!('owner' in projectDesc))        return true;
  if (!('login' in projectDesc.owner))  return true;
  if (!projectDesc.owner.login)         return true;
  if (projectDesc.owner.login==login)   return true;
  if (projectDesc.owner.login=='localuser') return true;
  var found = false;
  for (var i=0;(i<projectDesc.owner.share.length) && (!found);i++)
    found = (projectDesc.owner.share[i].login==login);
  return found;
}


// ===========================================================================

function ProjectList()  {
  this._type     = 'ProjectList';
  this.projects  = [];     // will contain ProjectDesc
  this.current   = '';     // current project name
  this.startmode = start_mode.auto; // 'auto', 'expert', 'migrate'
  this.sortList  = null;   // sort options
  this.folders   = [ // project folders tree basic element
    { name      : 'My Projects',
      path      : 'My Projects',
      nprojects : 0,
      folders   : [],
      projects  : []
    }
  ];
  this.currentFolder = 'My Projects';
}

ProjectList.prototype._add_folder_path = function ( flist,level,folders,nprojects )  {
  if (level<flist.length)  {
    var k = -1;
    for (var i=0;(i<folders.length) && (k<0);i++)
      if (flist[level]==folders[i].name)
        k = i;
    if (k<0)  {
      k = folders.length;
      var fpath = flist[0];
      for (var i=1;i<=level;i++)
        fpath += '/' + flist[i];
      var folder = {
         name      : flist[level],
         path      : fpath,
         nprojects : 0,
         folders   : [],
         projects  : []
      };
      folders.push ( folder );
    }
    if (level==flist.length-1)
      folders[k].nprojects = nprojects;
    this._add_folder_path ( flist,level+1,folders[k].folders,nprojects );
  }
}

ProjectList.prototype.addFolderPath = function ( folderPath,nprojects )  {
  this._add_folder_path ( folderPath.split('/'),0,this.folders,nprojects );
}

ProjectList.prototype._reset_folders = function ( folders )  {
  for (var i=0;i<folders.length;i++)  {
    folders[i].nprojects = 0;
    this._reset_folders ( folders[i].folders );
  }
}

ProjectList.prototype.resetFolders = function()  {
  this._reset_folders ( this.folders );
}

ProjectList.prototype.isProject = function ( name_str )  {
  var is_project = false;
  for (var i=0;(i<this.projects.length) && (!is_project);i++)
    is_project = (this.projects[i].name == name_str);
  return is_project;
}

ProjectList.prototype.getProjectNo = function ( name_str )  {
  var projectNo = -1;
  for (var i=0;(i<this.projects.length) && (projectNo<0);i++)
    if (this.projects[i].name == name_str)
      projectNo = i;
  return projectNo;
}

ProjectList.prototype.getProject = function ( name_str )  {
  var project = null;
  for (var i=0;(i<this.projects.length) && (!project);i++)
    if (this.projects[i].name == name_str)
      project = this.projects[i];
  return project;
}


ProjectList.prototype.addProject = function ( name_str,title_str,
                                              startmode,time_str )  {
  if (!this.isProject(name_str))  {
    var pDesc = new ProjectDesc();
    pDesc.init ( name_str,title_str,startmode,time_str );
    this.projects.unshift ( pDesc );  // put new project at beginning
    this.current   = name_str;
    this.startmode = startmode;
    this.sortList  = null;
    return true;
  } else
    return false;
}


ProjectList.prototype.renameProject = function ( name_str,title_str,time_str )  {
  var pDesc = this.getProject ( name_str );
  if (pDesc)  {
    pDesc.title        = title_str;
    pDesc.dateLastUsed = time_str;
    return pDesc;
  } else
    return null;
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
  this._type     = 'ProjectData';
  this.desc      = new ProjectDesc();  // project description
  this.tree      = [];                 // project tree
  this.settings  = {};
  this.settings.prefix_key = 0;
  this.settings.prefix     = '';
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

  function __find_project_node ( node,dataId )  {
    if (node.dataId==dataId)
      return node;
    var nd = null;
    for (var i=0;(i<node.children.length) && (!nd);i++)
      nd = __find_project_node ( node.children[i],dataId );
    return nd;
  }

  function getProjectNode ( projectData,dataId )  {
    var node = null;
    for (var i=0;(i<projectData.tree.length) && (!node);i++)
      node = __find_project_node ( projectData.tree[i],dataId );
    return node;
  }


  function __delete_project_node ( nodes,dataId )  {
    var nodes1 = [];
    for (var i=0;i<nodes.length;i++)
      if (nodes[i].dataId!=dataId)  {
        nodes[i].children = __delete_project_node ( nodes[i].children,dataId );
        nodes1.push ( nodes[i] );
      } else
        for (var j=0;j<nodes[i].children.length;j++)
          nodes1.push ( nodes[i].children[j] );
    // for (var i=0;i<nodes.length;i++)
    //   if (nodes[i].dataId!=dataId)  {
    //     nodes[i].children = __delete_project_node ( nodes[i].children,dataId );
    //     nodes1.push ( nodes[i] );
    //   }
    return nodes1;
  }

  function deleteProjectNode ( projectData,dataId )  {
    projectData.tree = __delete_project_node ( projectData.tree,dataId );
  }


  function __find_project_node_branch ( node,dataId )  {
    if (node.dataId==dataId)
      return [node];
    var nd = [];
    for (var i=0;(i<node.children.length) && (nd.length<=0);i++)
      nd = __find_project_node_branch ( node.children[i],dataId );
    if (nd.length>0)
      nd.push ( node );
    return nd;
  }

  function getProjectNodeBranch ( projectData,dataId )  {
    var node_lst = [];
    try {
      for (var i=0;(i<projectData.tree.length) && (node_lst.length<=0);i++)
        node_lst = __find_project_node_branch ( projectData.tree[i],dataId );
    } catch(err){
      console.log ( ' +++++ exception in common.data_project.js:getProjectNodeBranch()' );
    }
    return node_lst;
  }

}

function __print_project_tree ( node,indent )  {
  console.log ( indent + '[' + node.dataId + '] ' + node.text );
  for (var i=0;i<node.children.length;i++)
    __print_project_tree ( node.children[i],'--' + indent );
}

function printProjectTree ( legend,projectData )  {
  console.log ( ' \n' + legend + '\njobCount=' + projectData.desc.jobCount );
  for (var i=0;i<projectData.tree.length;i++)
    __print_project_tree ( projectData.tree[i],'--' );
  console.log ( ' ' );
}


// ===========================================================================

function ProjectShare()  {
  this._type = 'ProjectShare';
  this.shared_projects = [];
}

ProjectShare.prototype.removeShare = function ( pDesc )  {
  var share = this.shared_projects;
  this.shared_projects = [];
  for (var i=0;i<share.length;i++)
    if ((pDesc.name!=share[i].name) || (pDesc.owner.login!=share[i].owner.login))
      this.shared_projects.push ( share[i] );
  return (share.length-this.shared_projects.length);
}

ProjectShare.prototype.addShare = function ( pDesc )  {
  var found = false;
  for (var i=0;(i<this.shared_projects.length) && (!found);i++)
    found = (pDesc.name==this.shared_projects[i].name) &&
            (pDesc.owner.login==this.shared_projects[i].owner.login);
  if (!found)
    this.shared_projects.push ( pDesc );
  return (!found);
}


// ===========================================================================

function DockData()  {
  this._type  = 'DockData';
  this.opened = false;  // closed by default
  this.tasks  = []; // [{ task:'TaskRefmac', title:'Refmac', icon:'task_refmac'}]
}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.start_mode           = start_mode;
  module.exports.tasklist_mode        = tasklist_mode;
  module.exports.ProjectDesc          = ProjectDesc;
  module.exports.ProjectList          = ProjectList;
  module.exports.ProjectData          = ProjectData;
  module.exports.getProjectNode       = getProjectNode;
  module.exports.deleteProjectNode    = deleteProjectNode;
  module.exports.printProjectTree     = printProjectTree;
  module.exports.getProjectNodeBranch = getProjectNodeBranch;
  module.exports.ProjectShare         = ProjectShare;
  module.exports.DockData             = DockData;
  module.exports.isProjectAccessible  = isProjectAccessible;
}
