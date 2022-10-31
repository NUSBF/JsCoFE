
/*
 *  ===========================================================================
 *
 *    30.10.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.browser_folders.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  FoldersBrowser
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022
 *
 *  ===========================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// ===========================================================================
// Folders dialog class

function FoldersBrowser ( title,projectList,currentFolder,currentPDesc,funcKey,
                          onReturn_fnc )  {
// funcKey = 'select' or 'move'
// folders = [
//   { name : 'Folder name 1', folders : [
//     { name : 'Folder name 1.1', folders : [] },
//     { name : 'Folder name 1.2', folders : [] },
//     ...
//   ]},
//   { name : 'Folder name 2', folders : [] },
//   ....
// ]

  this.projectList   = projectList;
  this.folders       = projectList.folders;
  this.currentFolder = currentFolder;
  this.currentPDesc  = currentPDesc;
  this.funcKey       = funcKey;
  this.onReturn_fnc  = onReturn_fnc;
  this.nprojects     = currentFolder.nprojects; // 0;

  // var crFolder = this.findFolder(currentFolder.path);
  // if (crFolder)
  //   this.nprojects = crFolder.nprojects;

  if ((funcKey=='move') && (this.nprojects<=0))  {
    new MessageBox ( 'No projects to move',
        '<h2>No projects to move</h2>The folder is empty, no projects to move',
        'msg_stop' );
    return;
  }

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  this.grid = new Grid('-compact');
  this.addWidget ( this.grid );

  this.grid.setLabel (
    '<span style="font-size:160%"><b>Project Folders</b></span>',
    1,0,1,1
  ).setNoWrap(); //.setVerticalAlignment('middle');
  this.grid.setLabel ( '&nbsp;&nbsp;&nbsp;',1,1,1,1 );
  this.makeToolBar   ( 1,2 );
  this.grid.setCellSize ( '30%' ,'',1,0 );
  this.grid.setCellSize ( 'auto','',1,1 );
  this.grid.setCellSize ( '30%' ,'',1,2 );
  this.grid.setVerticalAlignment ( 1,0,'bottom' );
  this.grid.setVerticalAlignment ( 1,1,'middle' );
  this.grid.setVerticalAlignment ( 1,2,'middle' );

  // this.grid.setLabel   ( '&nbsp;&nbsp;&nbsp;',1,1,1,1 );
  this.makeFoldersTree ( 2,0,4 );

}

FoldersBrowser.prototype = Object.create ( Widget.prototype );
FoldersBrowser.prototype.constructor = FoldersBrowser;


// ---------------------------------------------------------------------------

FoldersBrowser.prototype.makeFoldersTree = function ( row,col,colSpan )  {

  this.ftree    = this.makeFolderTree ( this.folders );
  this.tree_div = new Widget ( 'div' );
  this.tree_div.element.setAttribute ( 'class','tree-content' );
  this.tree_div.addWidget ( this.ftree );
  this.grid.setWidget ( this.tree_div,row,col,1,colSpan );

  var w = 550;
  var h = 310;
  this.tree_div.setSize_px ( w-50,h );

  this.btn_ids = {
    select : this.id + '_select_btn',
    // moveto : this.id + '_moveto_btn',
    // add    : this.id + '_add_btn',
    // rename : this.id + '_rename_btn',
    delete : this.id + '_delete_btn',
  };

  var self = this;

  var funcTitle = 'Select';
  if (this.funcKey!='select')
    funcTitle = 'Move';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : w + 'px',
    modal     : true,
    buttons   : [
      { text  : funcTitle,
        id    : self.btn_ids.select,
        click : function(){
          if (self.funcKey=='select')  self.onSelectBtn();
                                 else  self.onMoveTo();
        }
      },
      // { text  : 'Move to',
      //   id    : self.btn_ids.moveto,
      //   click : function(){
      //     self.onMoveTo();
      //   }
      // },
      // { text  : 'Add folder',
      //   id    : self.btn_ids.add,
      //   click : function(){
      //     self.onAddFolder();
      //   }
      // },
      // { text  : 'Rename',
      //   id    : self.btn_ids.rename,
      //   click : function(){
      //     self.onRenameFolder();
      //   }
      // },
      // { text  : 'Delete',
      //   id    : self.btn_ids.delete,
      //   click : function(){
      //     self.onDeleteFolder();
      //   }
      // },
      { text  : 'Close',
        click : function(){
          $(this).dialog ( 'close' );
          window.setTimeout ( function(){
            self.onReturn_fnc ( 'cancel',{} );
          },0 );
        }
      }
    ]
  });

}

FoldersBrowser.prototype.makeToolBar = function ( row,col )  {

  this.toolbar_div = new Widget('div');
  // this.toolbar_div.element.setAttribute ( 'class','toolbox-content' );
  var toolbar = new Grid('-compact');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, row,col,1,1 );

  // make the toolbar

  var bsize = '36px';
  var cnt   = 0;
  this.add_folder_btn = toolbar.setButton ( '',image_path('folder_new'),0,cnt++,1,1 )
                           .setSize(bsize,bsize).setTooltip('Add sub-folder');
  this.add_list_btn   = toolbar.setButton ( '',image_path('folder_list_custom_new'),0,cnt++,1,1 )
                           .setSize(bsize,bsize).setTooltip('Add custom list');
  this.rename_btn     = toolbar.setButton ( '',image_path('renameprj'),0,cnt++,1,1 )
                           .setSize(bsize,bsize).setTooltip('Rename');
  this.delete_btn     = toolbar.setButton ( '',image_path('remove'),0,cnt++,1,1 )
                           .setSize(bsize,bsize).setTooltip('Remove');
  this.help_btn       = toolbar.setButton ( '',image_path('help'),0,cnt++,1,1 )
                           .setSize(bsize,bsize).setTooltip('Help');

  var self = this;

  this.add_folder_btn.addOnClickListener ( function(){ self.onAddFolder   (); });
  this.add_list_btn  .addOnClickListener ( function(){ self.onAddList     (); });
  this.rename_btn    .addOnClickListener ( function(){ self.onRenameFolder(); });
  this.delete_btn    .addOnClickListener ( function(){ self.onDeleteFolder(); });

  this.help_btn.addOnClickListener ( function(){
    new HelpBox ( '',__user_guide_base_url + 'jscofe_project.html',null );
  });

}


FoldersBrowser.prototype.disableButton = function ( btn_id,disable_bool )  {
  $('#' + this.btn_ids[btn_id]).button ( "option", "disabled",disable_bool );
}

FoldersBrowser.prototype.setFolders = function ( pnode,folders,ftree )  {
  for (var i=0;i<folders.length;i++)  {
    var node = ftree.addNode ( pnode,folders[i].name + ' (' + folders[i].nprojects + ')',
                               image_path('folder_projects'),
                               null );
    node.dataId     = folders[i].path;
    node.folderType = folders[i].type;
    if (node.dataId==this.currentFolder.path)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }
}

FoldersBrowser.prototype.makeFolderTree = function ( folders )  {
  var ftree = new Tree ( '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' );
  for (var i=0;i<folders.length;i++)  {
    var icon = 'folder_projects_user';
    var nprj = ' <i>(' + folders[i].nprojects + ')</i>';
    switch (folders[i].type)  {
      case folder_type.shared        :
      case folder_type.joined        :
      case folder_type.all_projects  : icon = 'folder_list';           break
      case folder_type.custom_list   : icon = 'folder_list_custom';    break;
      case folder_type.archived      : icon = 'folder_my_archive';     break;
      case folder_type.cloud_archive : icon = 'folder_cloud_archive';  break;
      case folder_type.tutorials     : icon = 'folder_tutorials';      break;
      default :     var nprj = ' (' + folders[i].nprojects + ')';
    }
    var node = ftree.addRootNode ( this.projectList.getRootFolderName(i,__login_id) +
                                   nprj,image_path(icon),null );
    if (i==0)
      this.node0_id = node.id;
    node.dataId     = folders[i].path;
    node.folderType = folders[i].type;
    if (node.dataId==this.currentFolder.path)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }

  var self = this;
  // ftree.createTree ( true,onLoaded_func,onRightClick_func,onDblClick_func,onSelect_func );
  ftree.createTree ( true,
    function(){
    },function(){
    },function(){  // onDblClick
      if (self.funcKey=='select')
            self.onSelectBtn();
      else  self.onMoveTo();
    },function(){  // onSelect
      self.onSelect();
    }
  );

  return ftree;

}

FoldersBrowser.prototype.onSelect = function()  {
var selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    var myprojects = selNode.dataId.startsWith(__login_id+'\'s ');
    this.add_folder_btn.setEnabled ( myprojects );
    var enable_rd  = (myprojects && selNode.parentId) ||
                     (selNode.icon.indexOf('folder_list_custom')>=0);
    this.rename_btn.setEnabled ( enable_rd );
    this.delete_btn.setEnabled ( enable_rd );
    if (this.funcKey=='move')
      this.disableButton ( 'select',
        (!myprojects) && 
        ([folder_type.custom_list,folder_type.archived,folder_type.cloud_archive]
          .indexOf(selNode.folderType)<0)
      );
  }
}

FoldersBrowser.prototype.onSelectBtn = function()  {
// Select button switches to the selected folder
var selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    if (((selNode.dataId!=folder_path.archived) && 
         (selNode.dataId!=folder_path.cloud_archive)) ||
         (__user_role==role_code.developer))  {
      $(this.element).dialog ( 'close' );
      this.onReturn_fnc ( 'select',{ folder_path : selNode.dataId } );
    } else if (!__is_archive)  {
      new MessageBox ( 'Feature not available',
          '<h2>Archive is not available</h3>' +
          'CCP4 Cloud Archive is not configured.',
          'msg_stop' );
    } else  {
      console.log ( '"' + selNode.dataId + '"' ); 
      new MessageBox ( 'Feature not available',
          '<h2>Folder is not available</h3>' +
          'Archive folders and their functionality are currently ' +
          'under<br>development. Please come back later.',
          'msg_stop' );
    }
  } else
    new MessageBox ( 'No selection in tree',
           '<h2>No folder is selected</h3>' +
           'This likely to be a program error. Select folder and try again.',
           'msg_error' );
}

FoldersBrowser.prototype._find_folder = function ( fpath,folders )  {
var folder = null;
  for (var i=0;(i<folders.length) && (!folder);i++)
    if (folders[i].path==fpath)
          folder = folders[i];
    else  folder = this._find_folder ( fpath,folders[i].folders );
  return folder;
}

FoldersBrowser.prototype.findFolder = function ( fpath )  {
  return this._find_folder ( fpath,this.folders );
}

FoldersBrowser.prototype._delete_folder = function ( fpath,folders )  {
var k = -1;
  for (var i=0;(i<folders.length) && (k==-1);i++)
    if (folders[i].path==fpath)
          k = i;
    else  k = this._delete_folder ( fpath,folders[i].folders );
  if (k>=0)  {
    for (var i=k;i<folders.length-1;i++)
      folders[i] = folders[i+1];
    folders.pop();
    k = -2;  // terminate the recursion
  }
  return k;
}

FoldersBrowser.prototype.deleteFolder = function ( fpath )  {
  return this._delete_folder ( fpath,this.folders );
}

FoldersBrowser.prototype.onAddFolder = function()  {
var self = this;
var inputBox = new InputBox ( 'Add folder' );
  inputBox.setText ( '','folder_projects_new' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Add new folder</h2>',0,2,2,3 );
  ibx_grid.setLabel    ( 'Name:',2,3,1,1 );
  var name_inp  = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., XX-Series','' )
        .setFontItalic ( true )
        .setWidth      ( '400px' );
  ibx_grid.setNoWrap   ( 2,2 );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );
  inputBox.launch ( 'Add',function(){
    var folderName = name_inp.getValue();
    if (folderName.length<=0)  {
      new MessageBox ( 'No folder name',
               '<h2>Folder name not given</h2>New folder name must be specified.',
               'msg_stop' );
      return false;
    } else if (folderName.indexOf('/')>=0)  {
      new MessageBox ( 'Invalid folder name',
            '<h2>Invalid folder name</h2>Folder name must not contain slashes.',
            'msg_stop' );
      return false;
    }
    var selNode = self.ftree.getSelectedNode();
    var pFolder = self.findFolder ( selNode.dataId );
    if (!pFolder)  {
      new MessageBox ( 'No current folder ',
               '<h2>Current folder not found</h2>' +
               'This is likely to be a program error. Try to reload the page<br>' +
               'in browser and repeat. If problem persists, report to<br>' +
               'developers.',
               'msg_error' );
      return false;
    }
    var fpath = selNode.dataId + '/' + folderName;
    if (self.findFolder(fpath))  {
      new MessageBox ( 'Duplicate folder name',
            '<h2>Duplicate folder name</h2>Folder names must be unique within any folder.',
            'msg_stop' );
      return false;
    }
    var newNode = self.ftree.addNode ( selNode,folderName + ' (0)',
                                       image_path('folder_projects'),null );
    newNode.dataId = fpath;
    self.projectList.addFolderPath ( fpath,0,false );
    self.onReturn_fnc ( 'add',{ folder_path : fpath } );
    self.onSelect();
    return true;
  });
}

FoldersBrowser.prototype.onAddList = function()  {
var self = this;
var inputBox = new InputBox ( 'Add list' );
  inputBox.setText ( '','folder_list_custom_new' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Add new list</h2>',0,2,2,3 );
  ibx_grid.setLabel    ( 'Name:',2,3,1,1 );
  var name_inp  = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., XX-Series','' )
        .setFontItalic ( true )
        .setWidth      ( '400px' );
  ibx_grid.setNoWrap   ( 2,2 );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );
  inputBox.launch ( 'Add',function(){
    var folderName = name_inp.getValue();
    if (folderName.length<=0)  {
      new MessageBox ( 'No list name',
               '<h2>List name not given</h2>New list name must be specified.',
               'msg_stop' );
      return false;
    } else if (folderName.indexOf('/')>=0)  {
      new MessageBox ( 'Invalid list name',
            '<h2>Invalid list name</h2>List name must not contain slashes.',
            'msg_stop' );
      return false;
    }
    var fpath = folderName;
    if (self.findFolder(fpath))  {
      new MessageBox ( 'Duplicate list name',
            '<h2>Duplicate list name</h2>List names must be unique and different ' +
            'from names of top-level folders.',
            'msg_stop' );
      return false;
    }
    self.projectList.addFolderPath ( fpath,0,true );
    self.folders = self.projectList.folders;
    var folder   = self.findFolder ( fpath );
    if (folder)  {
      folder.type = folder_type.custom_list;
      self.projectList.setCurrentFolder ( folder );
      self.currentFolder = self.projectList.currentFolder;
      self.projectList.sortFolders();
      self.tree_div.removeChild ( self.ftree );
      self.ftree = self.makeFolderTree ( self.folders );
      self.tree_div.addWidget ( self.ftree );
      self.onReturn_fnc ( 'add',{ folder_path : fpath } );
    } else
      new MessageBox ( 'Error','<h2>Error</h2>Error when adding List.','msg_error' );
    return true;
  });
}

FoldersBrowser.prototype.onDeleteFolder = function()  {
var selNode = this.ftree.getSelectedNode();
var folder  = this.findFolder ( selNode.dataId );

  if (folder)  {
    if ((folder.type!=folder_type.custom_list) &&
        ((folder.nprojects>0) || (folder.folders.length>0)))  {
      new MessageBox ( 'Non-empty folder',
            '<h2>Folder ' + folder.name + ' is not empty</h2>' +
            'Delete all projects and any sub-folders in this folder ' +
            'before deleting it.','msg_stop' );
    } else  {

      var self  = this;
      var label = 'Folder';
      if (folder.type==folder_type.custom_list)
        label = 'List';
      var label_l = name.toLowerCase();

      new QuestionBox ( 'Delete ' + label_l,
                        '<h2>' + label + ' ' + folder.name + ' will be deleted</h2>' +
                        'Please confirm.',[
          { name    : 'Yes, delete',
            onclick : function(){
                        self.deleteFolder ( selNode.dataId );
                        var fpath = self.folders[0].path;
                        if (selNode.parentId)  {
                          self.ftree.deleteNode ( selNode );
                          var node = self.ftree.getSelectedNode();
                          if (node)
                            fpath = node.dataId;
                        } else  {
                          self.ftree.deleteRootNode ( selNode );
                          self.ftree.selectNodeById ( self.node0_id );
                        }
                        self.onReturn_fnc ( 'delete',{ folder_path : fpath } );
                      }
          },{
            name    : 'Cancel',
            onclick : null
          }
        ],'msg_confirm' );
    }

  } else
    new MessageBox ( 'Error','<h2>Error</h2>Error deleting folder','msg_error' );

}

FoldersBrowser.prototype.onMoveTo = function()  {
var selNode = this.ftree.getSelectedNode();
var folder  = this.findFolder ( selNode.dataId );
var fldPath = folderPathTitle ( folder,__login_id,0 );
var label   = 'Folder';

  if (folder.type==folder_type.custom_list)
    label = 'List';
  var label_l = label.toLowerCase();

  // sanity check
  if ((!selNode.dataId.startsWith(__login_id+'\'s ')) &&
      ([folder_type.custom_list,folder_type.archived,folder_type.cloud_archive]
        .indexOf(selNode.folderType)<0))
    return;

  if (selNode.dataId==this.currentFolder.path)  {
    new MessageBox ( 'Already in the ' + label_l,
          '<h2>Already in the ' + label + '</h2>' +
          'Project <i>"' + this.currentPDesc.name + '"</i> is already in ' + label_l +
          '<p><i>"' + fldPath + '"</i>',
          'msg_stop' );
  } else if ((selNode.folderType==folder_type.archived) ||
             (selNode.folderType==folder_type.cloud_archive)) { 
    new ProjectArchiveDialog ( this.currentPDesc,function(){
      $(self.element).dialog ( 'close' );
      self.onReturn_fnc ( 'move',{ folder_path : selNode.dataId });
    } );
  } else  {
    var self = this;
    new QuestionBox ( 'Move project to ' + label_l,
                      '<h2>Move project to ' + label + '</h2>' +
                      'Project <i>"'  + this.currentPDesc.name + '"</i> will be moved to ' +
                      label_l + '<p><i>"' + fldPath +
                      '"</i><p>Please confirm.',[
        { name    : 'Please move',
          onclick : function(){
                      $(self.element).dialog ( 'close' );
                      self.onReturn_fnc ( 'move',{ folder_path : selNode.dataId });
                    }
        },{
          name    : 'Cancel',
          onclick : null
        }
      ],'msg_confirm' );
  }

}

FoldersBrowser.prototype.onRenameFolder = function()  {
var selNode = this.ftree.getSelectedNode();
var label   = 'Folder';

  if (selNode.dataId.startsWith(folder_type.custom_list))
    label = 'List';
  var label_l = name.toLowerCase();

  var inputBox  = new InputBox ( 'Rename ' + label_l );
  inputBox.setText ( '','renameprj' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Rename ' + label_l + ' "' + selNode.dataId.split('/').pop() +
                         '"</h2>',0,2,2,3 ).setWidth ( '400px' );
  ibx_grid.setLabel    ( 'New name:',2,3,1,1 ).setNoWrap();
  var name_inp  = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text','','','' )
        .setFontItalic ( true   )
        .setWidth      ( '300px' );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );

  var self = this;
  inputBox.launch ( 'Rename',function(){
    var newName = name_inp.getValue();
    if (newName.length<=0)  {
      new MessageBox ( 'No ' + label_l + ' name',
               '<h2>' + label + ' name not given</h2>New ' + label_l +
               ' name must be given.',
               'msg_stop' );
      return false;
    } else if (newName.indexOf('/')>=0)  {
      new MessageBox ( 'Invalid ' + label_l + ' name',
            '<h2>Invalid ' + label_l + ' name</h2>' + label +
            ' name must not contain slashes.',
            'msg_stop' );
      return false;
    }
    var fpl           = selNode.dataId.split('/');
    fpl[fpl.length-1] = newName;
    var folder        = self.findFolder ( selNode.dataId );
    folder.name       = newName;
    var newPath       = fpl.join('/');
    self.projectList.renameFolders ( selNode.dataId,newPath );
    self.onReturn_fnc  ( 'rename',{
        folder_path : selNode.dataId,
        rename_path : newPath
    });
    self.ftree.setText ( selNode,newName + ' (' + folder.nprojects + ')' );
    selNode.dataId = newPath;
    return true;
  });

}


// FoldersBrowser.prototype.onResize = function ( width,height )  {
//   var h = (height - 108) + 'px';
//   var w = (width  - 110) + 'px';
//   this.tree_div.element.style.height = h;
//   this.tree_div.element.style.width  = w;
// }
