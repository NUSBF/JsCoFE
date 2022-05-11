
/*
 *  ===========================================================================
 *
 *    08.05.22   <--  Date of Last Modification.
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


 // ===========================================================================
// Folders dialog class

function FoldersBrowser ( title,folders,currentFolderPath,onReturn_fnc )  {
// folders = [
//   { name : 'Folder name 1', folders : [
//     { name : 'Folder name 1.1', folders : [] },
//     { name : 'Folder name 1.2', folders : [] },
//     ...
//   ]},
//   { name : 'Folder name 2', folders : [] },
//   ....
// ]

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  this.folders       = folders;
  this.currentFolder = currentFolderPath;
  this.onReturn_fnc  = onReturn_fnc;

  var grid = new Grid('-compact');
  this.addWidget ( grid );

  grid.setLabel ( '<h3>' + __login_user + '\'s project folders</h3>', 0,0,1,1 );

  this.ftree   = this.makeFolderTree(folders)
  var tree_div = new Widget ( 'div' );
  tree_div.element.setAttribute ( 'class','tree-content' );
  tree_div.addWidget ( this.ftree );
  grid.setWidget ( tree_div,1,0,1,1 );

  var w = 620;
  var h = 310;
  tree_div.setSize_px ( w,h );

  this.btn_ids = {
    select : this.id + '_select_btn',
    moveto : this.id + '_moveto_btn',
    add    : this.id + '_add_btn',
    rename : this.id + '_rename_btn',
    delete : this.id + '_delete_btn',
  };

  var self = this;

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : w + 'px',
    modal     : true,
    buttons   : [
      { text  : 'Select',
        id    : self.btn_ids.select,
        click : function(){
          self.onSelectBtn();
        }
      },
      { text  : 'Move to',
        id    : self.btn_ids.moveto,
        click : function(){}
      },
      { text  : 'Add folder',
        id    : self.btn_ids.add,
        click : function(){
          self.onAddFolder();
        }
      },
      { text  : 'Rename',
        id    : self.btn_ids.rename,
        click : function(){}
      },
      { text  : 'Delete',
        id    : self.btn_ids.delete,
        click : function(){}
      },
      { text  : 'Cancel',
        click : function(){
          $(this).dialog( "close" );
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

FoldersBrowser.prototype.setFolders = function ( pnode,folders,ftree )  {
  for (var i=0;i<folders.length;i++)  {
    var node = ftree.addNode ( pnode,folders[i].name,
                               image_path('folder_projects'),
                               null );
    node.dataId = folders[i].path;
    if (node.dataId==this.currentFolder)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }
}

FoldersBrowser.prototype.makeFolderTree = function ( folders )  {
  var ftree = new Tree ( '___' );
  for (var i=0;i<folders.length;i++)  {
    var node = ftree.addRootNode ( folders[i].name,
                                   image_path('folder_projects'),
                                   null );
    node.dataId = folders[i].path;
    if (node.dataId==this.currentFolder)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }

  var self = this;
  // ftree.createTree ( true,onLoaded_func,onRightClick_func,onDblClick_func,onSelect_func );
  ftree.createTree ( true,
    function(){
    },function(){
    },function(){  // onDblClick
      self.onSelectBtn();
    },function(){  // onSelect
    }
  );

  return ftree;

}

FoldersBrowser.prototype.onSelectBtn = function()  {
  var selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    $(this.element).dialog( "close" );
    var self = this;
    window.setTimeout ( function(){
      self.onReturn_fnc ( 'select',{ folder : selNode.dataId } );
    },0 );
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
               '<h2>Folder name not given</h2>' +
               'Folder name must be specified.',
               'msg_error' );
      return false;
    }
    var selNode = self.ftree.getSelectedNode();
    var pFolder = this.findFolder ( selNode.dataId );
    if (!pFolder)  {
      new MessageBox ( 'No current folder ',
               '<h2>Curret folder not found</h2>' +
               'This is likely to be a program error. Try to reload the page<br>' +
               'in browser and repeat. If problem persists, report to<br>' +
               'developers.',
               'msg_error' );
      return false;
    }
    window.setTimeout ( function(){
      var newNode = self.ftree.addNode ( selNode,folderName,
                                         image_path('folder_projects'),null );
      // self.onReturn_fnc ( 'add',{ folders : self.folders } );
    },0 );
    return true;
  });
}


// FoldersBrowser.prototype.onResize = function ( width,height )  {
//   var h = (height - 108) + 'px';
//   var w = (width  - 110) + 'px';
//   this.tree_div.element.style.height = h;
//   this.tree_div.element.style.width  = w;
// }
