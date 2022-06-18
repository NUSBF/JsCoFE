
/*
 *  ===========================================================================
 *
 *    18.06.22   <--  Date of Last Modification.
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

function FoldersBrowser ( title,projectList,currentFolderPath,funcKey,
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

  this.projectList       = projectList;
  this.folders           = projectList.folders;
  this.currentFolderPath = currentFolderPath;
  this.funcKey           = funcKey;
  this.onReturn_fnc      = onReturn_fnc;
  this.nprojects         = 0;

  var crFolder = this.findFolder(currentFolderPath);
  if (crFolder)
    this.nprojects = crFolder.nprojects;

  if ((funcKey=='move') && (this.nprojects<=0))  {
    new MessageBox ( 'No projects to move',
        '<h2>No projects to move</h2>The folder is empty, no projects to move',
        'msg_stop' );
    return;
  }

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  var grid = new Grid('-compact');
  this.addWidget ( grid );

  // grid.setLabel ( '<h3>' + __login_user + '\'s project folders</h3>', 0,0,1,1 );
  // grid.setLabel ( '<h2>My Project Folders</h2>', 0,0,1,1 );
  grid.setLabel ( '&nbsp;<br><span style="font-size:160%"><b>My Project Folders</b></span>', 0,0,1,1 );

  this.ftree   = this.makeFolderTree(this.folders)
  var tree_div = new Widget ( 'div' );
  tree_div.element.setAttribute ( 'class','tree-content' );
  tree_div.addWidget ( this.ftree );
  grid.setWidget ( tree_div,1,0,1,1 );

  var w = 550;
  var h = 310;
  tree_div.setSize_px ( w-50,h );

  this.btn_ids = {
    select : this.id + '_select_btn',
    moveto : this.id + '_moveto_btn',
    add    : this.id + '_add_btn',
    rename : this.id + '_rename_btn',
    delete : this.id + '_delete_btn',
  };

  var self = this;

  var funcTitle = 'Select';
  if (funcKey!='select')
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
          if (funcKey=='select')  self.onSelectBtn();
                            else  self.onMoveTo();
        }
      },
      // { text  : 'Move to',
      //   id    : self.btn_ids.moveto,
      //   click : function(){
      //     self.onMoveTo();
      //   }
      // },
      { text  : 'Add folder',
        id    : self.btn_ids.add,
        click : function(){
          self.onAddFolder();
        }
      },
      { text  : 'Rename',
        id    : self.btn_ids.rename,
        click : function(){
          self.onRenameFolder();
        }
      },
      { text  : 'Delete',
        id    : self.btn_ids.delete,
        click : function(){
          self.onDeleteFolder();
        }
      },
      { text  : 'Close',
        click : function(){
          $(this).dialog ( 'close' );
          window.setTimeout ( function(){
            onReturn_fnc ( 'cancel',{} );
          },0 );
        }
      }
    ]
  });

}

FoldersBrowser.prototype = Object.create ( Widget.prototype );
FoldersBrowser.prototype.constructor = FoldersBrowser;


// ---------------------------------------------------------------------------

FoldersBrowser.prototype.disableButton = function ( btn_id,disable_bool )  {
  $('#' + this.btn_ids[btn_id]).button ( "option", "disabled",disable_bool );
}

FoldersBrowser.prototype.hideButton = function ( btn_id,hide_bool )  {
  if (hide_bool)  $('#' + this.btn_ids[btn_id]).hide();
            else  $('#' + this.btn_ids[btn_id]).show();
}

FoldersBrowser.prototype.setFolders = function ( pnode,folders,ftree )  {
  for (var i=0;i<folders.length;i++)  {
    var node = ftree.addNode ( pnode,folders[i].name,
                               image_path('folder_projects'),
                               null );
    node.dataId = folders[i].path;
    if (node.dataId==this.currentFolderPath)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }
}

FoldersBrowser.prototype.makeFolderTree = function ( folders )  {
//  var ftree = new Tree ( '<u><i><b>' + __login_user + '\'s project folders<b></i></u>' );
// var ftree = new Tree ( '<i><b>Project Folders<b></i><br>' +
//                        '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' );
  var ftree = new Tree ( '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' );
  for (var i=0;i<folders.length;i++)  {
    var icon = 'folder_projects_user';
    if (folders[i].name.startsWith('**'))
      icon = 'folder_projects_list';
    var node = ftree.addRootNode ( this.projectList.getRootFolderName(i,__login_id),
                                   image_path(icon),null );
    node.dataId = folders[i].path;
    if (node.dataId==this.currentFolderPath)
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
    this.disableButton ( 'add',!myprojects );
    this.disableButton ( 'rename',(!(selNode.parentId)) || (!myprojects) );
    this.disableButton ( 'delete',(!(selNode.parentId)) || (!myprojects) );
    if (this.funcKey=='move')
      this.disableButton ( 'select',!myprojects );
  }
}

FoldersBrowser.prototype.onSelectBtn = function()  {
var selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    $(this.element).dialog ( 'close' );
    this.onReturn_fnc ( 'select',{ folder : selNode.dataId } );
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
    else
      folder = this._find_folder ( fpath,folders[i].folders );
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
    else
      k = this._delete_folder ( fpath,folders[i].folders );
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
    var newNode = self.ftree.addNode ( selNode,folderName,
                                       image_path('folder_projects'),null );
    newNode.dataId = fpath;
    self.projectList.addFolderPath ( fpath,0 );
    self.onReturn_fnc ( 'add',{ folder : fpath } );
    return true;
  });
}

FoldersBrowser.prototype.onDeleteFolder = function()  {
var selNode = this.ftree.getSelectedNode();
var folder  = this.findFolder ( selNode.dataId );
  if ((folder.nprojects>0) || (folder.folders.length>0)
                           || (folder.projects.length>0))  {
    new MessageBox ( 'Non-empty folder',
          '<h2>Folder ' + folder.name + ' is not empty</h2>' +
          'Delete all projects and any sub-folders in this folder ' +
          'before deleting it.','msg_stop' );
  } else  {
    var self = this;
    new QuestionBox ( 'Delete folder',
                      '<h2>Folder ' + folder.name + ' will be deleted</h2>' +
                      'Please confirm.',[
        { name    : 'Yes, delete',
          onclick : function(){
                      self.deleteFolder     ( selNode.dataId );
                      self.ftree.deleteNode ( selNode        );
                      var node  = self.ftree.getSelectedNode();
                      var fpath = '';
                      if (node)
                        fpath = node.dataId;
                      self.onReturn_fnc ( 'delete',{ folder : fpath } );
                    }
        },{
          name    : 'Cancel',
          onclick : null
        }
      ],'msg_confirm' );
  }
}

FoldersBrowser.prototype.onMoveTo = function()  {
var selNode = this.ftree.getSelectedNode();
var folder  = this.findFolder ( selNode.dataId );
  if (!selNode.dataId.startsWith(__login_id+'\'s '))
    return;
  if (selNode.dataId==this.currentFolderPath)
    new MessageBox ( 'Already in folder',
          '<h2>Already in "' + folder.name + '"</h2>' +
          'The currently selected project is already in the chosen folder.',
          'msg_stop' );
  else  {
    var self = this;
    // new QuestionBox ( 'Move project to folder',
    //                   '<h2>Selected project will be moved to<br>"' +
    //                   folder.name + '"</h2>' +
    //                   'Please confirm.','Please move',function(){
    //   $(self.element).dialog ( 'close' );
    //   self.onReturn_fnc ( 'move',{ folder : selNode.dataId } );
    // },'Cancel',null,'msg_confirm' );
    new QuestionBox ( 'Move project to folder',
                      '<h2>Selected project will be moved to<br>"' +
                      folder.name + '"</h2>' +
                      'Please confirm.',[
        { name    : 'Please move',
          onclick : function(){
                      $(self.element).dialog ( 'close' );
                      self.onReturn_fnc ( 'move',{ folder : selNode.dataId } );
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

  var inputBox  = new InputBox ( 'Rename folder' );
  inputBox.setText ( '','renameprj' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Rename folder "' + selNode.dataId.split('/').pop() +
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
      new MessageBox ( 'No folder name',
               '<h2>Folder name not given</h2>New folder name must be given.',
               'msg_stop' );
      return false;
    } else if (newName.indexOf('/')>=0)  {
      new MessageBox ( 'Invalid folder name',
            '<h2>Invalid folder name</h2>Folder name must not contain slashes.',
            'msg_stop' );
      return false;
    }
    var fpl           = selNode.dataId.split('/');
    fpl[fpl.length-1] = newName;
    var folder        = self.findFolder ( selNode.dataId );
    folder.name       = newName;
    var newPath       = fpl.join('/');
    self.projectList.renameFolders ( selNode.dataId,newPath );
    self.onReturn_fnc  ( 'rename',{ folder: selNode.dataId, rename: newPath } );
    self.ftree.setText ( selNode,newName );
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
