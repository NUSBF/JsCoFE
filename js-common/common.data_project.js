
/*
 *  ==========================================================================
 *
 *    19.10.22   <--  Date of Last Modification.
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

'use strict';


var __conf = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __conf = require('../js-server/server.configuration');

function __isArchive()  {
  if (__conf)  return __conf.isArchive();
  return __is_archive;  // client side
}

// ===========================================================================

var start_mode = {
  auto     : 'auto',
  standard : 'standard',
  expert   : 'expert',    // legacy
  migrate  : 'migrate'
};

var tasklist_mode = {
  basic  : 'basic',
  full   : 'full'
};

var folder_type = {
  user          : 'user',
  common        : 'common',
  shared        : 'shared',
  joined        : 'joined',
  all_projects  : 'all_projects',
  list          : 'list',
  custom_list   : 'custom_list',
  archived      : 'archived',
  cloud_archive : 'cloud_archive',
  tutorials     : 'tutorials'
};

var folder_path = {
  shared        : 'Projects shared by me',
  joined        : 'Projects joined by me',
  all_projects  : 'All projects',
  archived      : 'Projects archived by me',
  cloud_archive : 'CCP4 Cloud Archive',
  tutorials     : 'Tutorials'
};

var folder_name = {
  shared        : 'Projects shared by me',
  joined        : 'Projects joined by me',
  all_projects  : 'All projects',
  archived      : 'Projects archived by me',
  cloud_archive : 'CCP4 Cloud Archive',
  tutorials     : 'Tutorials'
};


// ===========================================================================

function ProjectDesc()  {

  this._type = 'ProjectDesc';
  this.name  = '';    // short project ID
  this.title = '';    // descriptive title

  this.owner = {
    login  : '',   // login where project was created
    name   : '',
    email  : '',
    labels : {  // owner's labels index
      // 'label1' : 1,
      // 'label2' : 1,
    }
  };

  this.share = {  // shared users index
    // 'login' : { labels      : {
    //               'label1' : 1,
    //               'label2' : 1,
    //             },
    //             permissions : 'rw'
    //           }
  };

  this.folderPath   = '';   // virtual project folder path

  this.archive      = null;  // changes to object as below if project is archived
  // this.archive = {
  //   id        : '',   // archive ID
  //   version   : 0,    // archived project version
  //   coauthors : []    // list of co-authors
  //   pdbs      : []    // associated PDB codes
  //   dois      : []    // associated publication dois
  //   kwds      : []    // keywords
  // };

  this.jobCount     = 0;     // job count
  this.timestamp    = 0;     // Date.now()
  this.autorun      = false; // true if a task in autorun mode is runnng
  this.startmode    = start_mode.standard;  // will be overwritten when
                                            // project is created
  this.tasklistmode = tasklist_mode.full;
  this.disk_space   = 0.0;   // in MBs, corresponds to current project state
  this.cpu_time     = 0.0;   // in hours, accumulated over all project history
  this.njobs        = 0;     // over all project history
  this.dateCreated  = '';    // year/mm/dd
  this.dateLastUsed = '';    // year/mm/dd
  this.metrics      = {};    // for statistics and searches

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
  return (login in projectDesc.share);
  // var found = false;
  // for (var i=0;(i<projectDesc.owner.share.length) && (!found);i++)
  //   found = (projectDesc.owner.share[i].login==login);
  // return found;
}

function isProjectJoined ( login,projectDesc )  {
  return (projectDesc.owner.login!=login) &&
         (Object.keys(projectDesc.share).length>0);
}

function isProjectShared ( login,projectDesc )  {
  return (projectDesc.owner.login==login) &&
         (Object.keys(projectDesc.share).length>0);
}

function getProjectAuthor ( projectDesc )  {
var author = projectDesc.owner.login;
  if (('author' in projectDesc.owner) && projectDesc.owner.author)
    author = projectDesc.owner.author;
  return author;
}

function addProjectLabel ( loginName,projectDesc,label )  {
  if (loginName==projectDesc.owner.login)
    projectDesc.owner.labels[label] = 1;
  else if (loginName in projectDesc.share)
    projectDesc.share[loginName].labels[label] = 1;
}

function removeProjectLabel ( loginName,projectDesc,label )  {
  if (loginName==projectDesc.owner.login)
    delete projectDesc.owner.labels[label];
  else if (loginName in projectDesc.share)
    delete projectDesc.share[loginName].labels[label];
}

function checkProjectLabel ( loginName,projectDesc,label )  {
  if (loginName==projectDesc.owner.login)
    return (label in projectDesc.owner.labels);
  return (loginName in projectDesc.share) &&
         (label in projectDesc.share[loginName].labels);
}


function compareProjectLabels ( login,projectDesc1,projectDesc2 )  {
var labels1 = {};
var labels2 = {};

  if (projectDesc1.owner.login==login)
    labels1 = projectDesc1.owner.labels;
  else if (login in projectDesc1.share)
    labels1 = projectDesc1.share[login].labels;

  if (projectDesc2.owner.login==login)
    labels2 = projectDesc2.owner.labels;
  else if (login in projectDesc2.share)
    labels2 = projectDesc2.share[login].labels;

  var list1 = Object.keys(labels1);
  var same  = (list1.length==Object.keys(labels2).length);
  if (same)  {
    for (var i=0;(i<list1.length) && same;i++)
      same = (list1[i] in labels2);
  }

  // console.log ( ' *** ' + projectDesc1.name + " " +
  // JSON.stringify(labels1) + '  ' +
  // projectDesc2.name + ' ' +
  // JSON.stringify(labels2) + '   ' + same
  // );


  return same;

}

// ===========================================================================

function ProjectList ( loginName )  {
  this._type     = 'ProjectList';
  this.projects  = [];     // will contain ProjectDesc
  this.current   = '';     // current project name
  this.startmode = start_mode.auto; // 'auto', 'expert', 'migrate'
  this.sortList  = null;   // sort options
  this.seedFolders ( loginName );
}

ProjectList.prototype.seedFolders = function ( loginName )  {
  var f0name = loginName + '\'s Projects';
  this.folders = [  // project folders tree basic elements
    { name      : f0name,
      path      : f0name,
      nprojects : 0,
      type      : folder_type.user,
      folders   : []
    },{
      name      : folder_name.shared, // project folders tree basic element
      path      : folder_path.shared,
      nprojects : 0,
      type      : folder_type.shared,
      folders   : []
    },{
      name      : folder_name.joined, // project folders tree basic element
      path      : folder_path.joined,
      nprojects : 0,
      type      : folder_type.joined,
      folders   : []
    },{
      name      : folder_name.all_projects, // project folders tree basic element
      path      : folder_path.all_projects,
      nprojects : 0,
      type      : folder_type.all_projects,
      folders   : []
    }
  ];
  if (__isArchive())  {
    this.folders.push ({
      name      : folder_name.archived, // project folders tree basic element
      path      : folder_path.archived,
      nprojects : 0,
      type      : folder_type.archived,
      folders   : []
    });
    this.folders.push ({
      name      : folder_name.cloud_archive, // project folders tree basic element
      path      : folder_path.cloud_archive,
      nprojects : 0,
      type      : folder_type.cloud_archive,
      folders   : []
    });
  }
  this.setCurrentFolder ( this.folders[0] );
}

ProjectList.prototype.getRootFolderName = function ( folderNo,loginName )  {
var fdname = '???';
  if (folderNo<this.folders.length)  {
    fdname = this.folders[folderNo].name;
    switch (this.folders[folderNo].type)  {
      case folder_type.user      : if (this.folders[folderNo]
                                           .path.startsWith(loginName+'\'s '))
                                     fdname = 'My Projects';
                                break;
      case folder_type.tutorials : fdname = '<i>Tutorials</i>'; break;
      case folder_type.common    : break;
      default                    : fdname = '<i>' + fdname + '</i>';
    };
  }
  return fdname;
}

function folderPathTitle ( folder,loginName,maxLength )  {
var title  = folder.path;
var f0name = loginName + '\'s ';
  if (title.startsWith(f0name))
    title = title.replace(f0name,'My ');
  else
    switch (folder.type)  {
      case folder_type.shared        : title = folder_name.shared;        break;
      case folder_type.joined        : title = folder_name.joined;        break;
      case folder_type.all_projects  : title = folder_name.all_projects;  break;
      case folder_type.archived      : title = folder_name.archived;      break;
      case folder_type.cloud_archive : title = folder_name.cloud_archive; break;
      case folder_type.tutorials     : title = folder_name.tutorials;     break;
      default : ; //title = folder.name;
    }
  if ((maxLength>0) && (title.length>maxLength))
    title = '&hellip; ' + title.substr(title.length-maxLength+3);
  return title;
}

ProjectList.prototype._add_folder_path = function (
                                   flist,level,folders,nprojects,list_bool )  {
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
      var ftype = folder_type.common;
      if (list_bool)
        ftype = folder_type.custom_list;
      else if (level==0)  {
        ftype = folder_type.tutorials;
        if ((fpath!=folder_path.tutorials) && (fpath!=folder_type.custom_list))
          ftype = folder_type.user;
      }
      var folder = {
         name      : flist[level],
         path      : fpath,
         type      : ftype,
         nprojects : 0,
         folders   : []
      };
      folders.push ( folder );
    }
    if (level==flist.length-1)
      folders[k].nprojects = nprojects;
    this._add_folder_path ( flist,level+1,folders[k].folders,nprojects,list_bool );
  }
}

ProjectList.prototype.addFolderPath = function ( folderPath,nprojects,list_bool )  {
  this._add_folder_path ( folderPath.split('/'),0,this.folders,nprojects,list_bool );
}

ProjectList.prototype._reset_folders = function ( folders )  {
  for (var i=0;i<folders.length;i++)  {
    folders[i].nprojects = 0;
    this._reset_folders ( folders[i].folders );
  }
}

ProjectList.prototype._get_folder_list = function ( ftype )  {
var flist = [];
var i0    = 4;
  if (__isArchive())
    i0 = 6;
  for (var i=i0;i<this.folders.length;i++)
    if (this.folders[i].type==ftype)
      flist.push ( this.folders[i] );
  for (var i=0;i<flist.length;i++)
    for (var j=i+1;j<flist.length;j++)
      if (flist[j].name<flist[i].name)  {
        var fi   = flist[i];
        flist[i] = flist[j];
        flist[j] = fi;
      }
  return flist;
}

ProjectList.prototype._set_folder_paths = function ( folder )  {
  for (var i=0;i<folder.folders.length;i++)  {
    folder.folders[i].path = folder.path + '/' + folder.folders[i].name;
    this._set_folder_paths ( folder.folders[i] );
  }
}


ProjectList.prototype.setFolderPaths = function()  {
  for (var i=0;i<this.folders.length;i++)
    this._set_folder_paths ( this.folders[i] );
}


ProjectList.prototype.sortFolders = function()  {
var l1 = this._get_folder_list ( folder_type.custom_list );
var l2 = this._get_folder_list ( folder_type.tutorials   );
var l3 = this._get_folder_list ( folder_type.user        );
var i  = 4;
  if (__isArchive())
    i = 6;
  for (var j=0;j<l1.length;j++)
    this.folders[i++] = l1[j];
  for (var j=0;j<l2.length;j++)
    this.folders[i++] = l2[j];
  for (var j=0;j<l3.length;j++)
    this.folders[i++] = l3[j];
}


function _print_folder ( folder )  {
  console.log ( ' - ' + folder.path + '(' + folder.nprojects + ')' );
  for (var i=0;i<folder.folders.length;i++)
    _print_folder ( folder.folders[i] );
}

function printFolders ( projectList )  {
  console.log ( ' ======================================================== ' )
  console.log ( ' Project Folders' );
  for (var i=0;i<projectList.folders.length;i++)  {
    console.log ( '\n Folder #' + i );
    _print_folder ( projectList.folders[i] );
  }
  console.log ( '\n Current folder: ' + projectList.currentFolder.path + '\n ' );
  console.log ( ' ======================================================== ' )
}


ProjectList.prototype.resetFolders = function ( login )  {
var i0 = 4;
  if (__isArchive())
    i0 = 6;

  // check if the pre-defined folde structure is non-existent or corrupt
  // and make a deep reset in such case
  if ((!('folders' in this)) || (this.folders.length<6) ||
      (!this.folders[0].name.startsWith(login+'\'s '))  ||
       (this.folders[0].type!=folder_type.user)         ||
       (this.folders[1].type!=folder_type.shared)       ||
       (this.folders[2].type!=folder_type.joined)       ||
       (this.folders[3].type!=folder_type.all_projects) ||
       ((i0==6) && (
          (this.folders[4].type!=folder_type.archived)  ||
          (this.folders[5].type!=folder_type.cloud_archive))
       ) ||
       ((i0!=6) && (this.folders.length>=6) && 
        (this.folders[4].type==folder_type.archived) &&
        (this.folders[5].type==folder_type.cloud_archive)
       )
     )
    this.seedFolders ( login );

  // leave six predefined leading folders
  var folders  = this.folders;
  this.folders = this.folders.slice(0,i0);

  // complement with all custom lists
  for (var i=i0;i<folders.length;i++)
    if (folders[i].type==folder_type.custom_list)
      this.folders.push ( folders[i] );

  // set zero number of projects in all copied folders recursively
  this._reset_folders ( this.folders );
  this.folders[3].nprojects = this.projects.length;  // "All folders" length

  // reconstruct other folders from project descriptions

  var folderPaths = {};
  var listPaths   = {};
  var nshared = 0;
  var njoined = 0;

  for (var i=0;i<this.projects.length;i++)  {
    var folder_path = this.projects[i].folderPath;
    if (folder_path in folderPaths)
          folderPaths[folder_path]++;  // folder population
    else  folderPaths[folder_path] = 1;
    // special cases
    if (isProjectJoined(login,this.projects[i]))  njoined++;
    if (isProjectShared(login,this.projects[i]))  nshared++;
    var labels = {};
    if (this.projects[i].owner.login==login)
      labels = this.projects[i].owner.labels;
    else if (login in this.projects[i].share)
      labels = this.projects[i].share[login].labels;
    for (var label in labels)
      if (label in listPaths)  listPaths[label]++;
                         else  listPaths[label] = 1;
  }
  this.folders[1].nprojects = nshared;  // "shared by me"
  this.folders[2].nprojects = njoined;  // "joined by me"

  for (var fpath in folderPaths)
    this.addFolderPath ( fpath,folderPaths[fpath],false );

  for (var fpath in listPaths)
    this.addFolderPath ( fpath,listPaths[fpath],true );

  // set folder paths; this should not be required, only to repair after
  // accidental damage in buggy earlier implementations
  this.setFolderPaths();

  this.sortFolders();

  if (('currentFolder' in this) && this.currentFolder)
    // do this because folders may have changed
        this.setCurrentFolder ( this.findFolder(this.currentFolder.path) );
  else  this.setCurrentFolder ( this.folders[0] );

  // printFolders ( this );

}


ProjectList.prototype.setCurrentFolder = function ( folder )  {
  if (folder)  {
    this.currentFolder = {
      name      : folder.name,
      path      : folder.path,
      type      : folder.type,
      nprojects : folder.nprojects
    };
    return true;
  } else  {
    this.currentFolder = {
      name      : this.folders[0].name,
      path      : this.folders[0].path,
      type      : this.folders[0].type,
      nprojects : this.folders[0].nprojects
    };
  }
  return false;
}


ProjectList.prototype._rename_folders = function ( folders,oldpath,newpath )  {
  for (var i=0;i<folders.length;i++)  {
    if (folders[i].path.startsWith(oldpath))
      folders[i].path = folders[i].path.replace ( oldpath,newpath );
    this._rename_folders ( folders[i].folders,oldpath,newpath );
  }
}

ProjectList.prototype.renameFolders = function ( oldpath,newpath )  {
  this._rename_folders ( this.folders,oldpath,newpath );
}

ProjectList.prototype._find_folder = function ( folders,fpath )  {
var folder = null;
  for (var i=0;(i<folders.length) && (!folder);i++)  {
    if (folders[i].path==fpath)
          folder = folders[i];
    else  folder = this._find_folder ( folders[i].folders,fpath );
  }
  return folder;
}

ProjectList.prototype.findFolder = function ( fpath )  {
  return this._find_folder ( this.folders,fpath );
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
    pDesc.folderPath = this.currentFolder.path;
    if ([folder_path.all_projects,folder_path.shared,folder_path.joined]
        .indexOf(pDesc.folderPath)>=0)
      pDesc.folderPath = __login_id + '\'s Projects';  // virtual project folder path
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

// if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

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

// }

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
  module.exports.folder_type          = folder_type;
  module.exports.folder_path          = folder_path;
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
  module.exports.isProjectJoined      = isProjectJoined;
  module.exports.isProjectShared      = isProjectShared;
  module.exports.getProjectAuthor     = getProjectAuthor;
  module.exports.compareProjectLabels = compareProjectLabels;
}
