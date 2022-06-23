
/*
 *  ==========================================================================
 *
 *    23.06.22   <--  Date of Last Modification.
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
  user         : 'user',
  common       : 'common',
  shared       : 'shared',
  joined       : 'joined',
  all_projects : 'all_projects',
  list         : 'list',
  custom_list  : 'custom_list',
  tutorials    : 'tutorials'
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

  this.folderPath   = '';   // virtual project folder path
  this.labels       = [];   // list of optional project labels
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

function isProjectJoined ( login,projectDesc )  {
  return (projectDesc.owner.login!=login) &&
         (projectDesc.owner.share.length>0);
}

function isProjectShared ( login,projectDesc )  {
  return (projectDesc.owner.login==login) &&
         (projectDesc.owner.share.length>0);
}

function getProjectAuthor ( projectDesc )  {
var author = projectDesc.owner.login;
  if (('author' in projectDesc.owner) && projectDesc.owner.author)
    author = projectDesc.owner.author;
  return author;
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
  var f0name   = loginName + '\'s Projects';
  this.folders = [  // project folders tree basic elements
    { name      : f0name,
      path      : f0name,
      nprojects : 0,
      type      : folder_type.user,
      folders   : [],
      projects  : []
    },{
      name      : 'Projects shared by me', // project folders tree basic element
      path      : 'Projects shared by me',
      nprojects : 0,
      type      : folder_type.shared,
      folders   : [],
      projects  : []
    },{
      name      : 'Projects joined by me', // project folders tree basic element
      path      : 'Projects joined by me',
      nprojects : 0,
      type      : folder_type.joined,
      folders   : [],
      projects  : []
    },{
      name      : 'All projects', // project folders tree basic element
      path      : 'All projects',
      nprojects : 0,
      type      : folder_type.all_projects,
      folders   : [],
      projects  : []
    }
  ];
  this.currentFolder = this.folders[0];
}

ProjectList.prototype.getRootFolderName = function ( folderNo,loginName )  {
var fdname = '???';
  if (folderNo<this.folders.length)  {
    fdname = this.folders[folderNo].name;
    switch (this.folders[folderNo].type)  {
      case folder_type.user   : if (fdname.startsWith(loginName))
                                   fdname = 'My Projects';
                                break;
      case folder_type.common : break;
      default                 : fdname = '<i>' + fdname + '</i>';
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
      case folder_type.shared       : title = 'Projects shared by me';  break;
      case folder_type.joined       : title = 'Projects joined by me';  break;
      case folder_type.all_projects : title = 'All Projects';           break;
      default : title = folder.name;
    }
  if ((maxLength>0) && (title.length>maxLength))
    title = '&hellip; ' + title.substr(title.length-maxLength+3);
  return title;
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
      var ftype = folder_type.common;
      if (!level)  {
        ftype = folder_type.tutorials;
        if ((fpath.toLowerCase()!=folder_type.tutorials) &&
            (fpath!=folder_type.custom_list))
          ftype = folder_type.user;
      }
      var folder = {
         name      : flist[level],
         path      : fpath,
         type      : ftype,
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

ProjectList.prototype._get_folder_list = function ( ftype )  {
var flist = [];
  for (var i=4;i<this.folders.length;i++)
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

ProjectList.prototype.sortFolders = function()  {
var l1 = this._get_folder_list ( folder_type.custom_list );
var l2 = this._get_folder_list ( folder_type.tutorials   );
var l3 = this._get_folder_list ( folder_type.user        );
var i  = 4;
  for (var j=0;j<l1.length;j++)
    this.folders[i++] = l1[j];
  for (var j=0;j<l2.length;j++)
    this.folders[i++] = l2[j];
  for (var j=0;j<l3.length;j++)
    this.folders[i++] = l3[j];
  // for (var i=4;i<this.folders.length;i++)
  //   for (var j=i+1;j<this.folders.length;j++)  {
  //     var swap = false;
  //     if ((this.folders[i].type==folder_type.custom_list) &&
  //         (this.folders[j].type==folder_type.custom_list) &&
  //         (this.folders[j].name<this.folders[i].name))
  //       swap = true;
  //     if ((this.folders[i].type!=folder_type.custom_list) &&
  //         (this.folders[j].type==folder_type.custom_list))
  //       swap = true;
  //     if ((this.folders[i].type!=folder_type.custom_list) &&
  //         (this.folders[j].type==folder_type.custom_list))
  //       swap = true;
  //
  //     switch (this.folders[i].type)  {
  //       case folder_type.custom_list :
  //               swap = (this.folders[j].type==folder_type.custom_list) &&
  //                      (this.folders[j].name<this.folders[i].name);
  //             break;
  //       case folder_type.tutorials :
  //               swap = (this.folders[j].type==folder_type.custom_list);
  //             break;
  //       default :
  //               swap = (this.folders[i].type!=folder_type.custom_list) &&
  //                      (this.folders[j].name<this.folders[i].name);
  //     }
  //     if (swap)  {
  //       var fldi = this.folders[i];
  //       this.folders[i] = this.folders[j];
  //       this.folders[j] = fldi;
  //     }
  //   }
}

ProjectList.prototype.resetFolders = function ( login,recalculate_bool )  {
var folders = this.folders;
  this.folders = this.folders.slice(0,4);
  for (var i=4;i<folders.length;i++)
    if (folders[i].type==folder_type.custom_list)
      this.folders.push ( folders[i] );
  this._reset_folders ( this.folders );
  this.folders[3].nprojects = this.projects.length;  // "All folders"
  if (recalculate_bool)  {
    var folderPaths = {};
    var nshared = 0;
    var njoined = 0;
    for (var i=0;i<this.projects.length;i++)  {
      var folder_path = this.projects[i].folderPath;
      if (folder_path in folderPaths)
            folderPaths[folder_path]++;
      else  folderPaths[folder_path] = 1;
      if (isProjectJoined(login,this.projects[i]))  njoined++;
      if (isProjectShared(login,this.projects[i]))  nshared++;
    }
    this.folders[1].nprojects = nshared;  // "shared by me"
    this.folders[2].nprojects = njoined;  // "joined by me"
    for (var fpath in folderPaths)
      this.addFolderPath ( fpath,folderPaths[fpath] );
    this.sortFolders();
    if (!this.findFolder(this.currentFolder.path))
      this.currentFolder = this.folders[0];
  }

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
}
