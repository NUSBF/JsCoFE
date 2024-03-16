
/*
 *  ===========================================================================
 *
 *    16.03.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2022-2024
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
  this.nprjtree      = currentFolder.nprjtree;  // 0;

  // let crFolder = this.findFolder(currentFolder.path);
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

FoldersBrowser.prototype.setProjectList = function ( projectList,currentFolder,currentPDesc )  {
  this.projectList   = projectList;
  this.folders       = projectList.folders;
  this.currentFolder = currentFolder;
  this.currentPDesc  = currentPDesc;
  this.nprojects     = currentFolder.nprojects;
  this.nprjtree      = currentFolder.nprjtree;
}

FoldersBrowser.prototype.makeFoldersTree = function ( row,col,colSpan )  {

  this.ftree    = this.makeFolderTree ( this.folders );
  this.tree_div = new Widget ( 'div' );
  this.tree_div.element.setAttribute ( 'class','tree-content' );
  this.tree_div.addWidget ( this.ftree );
  this.grid.setWidget ( this.tree_div,row,col,1,colSpan );

  let w = 550;
  let h = 310;
  this.tree_div.setSize_px ( w-50,h );

  this.btn_ids = {
    select : this.id + '_select_btn',
    // moveto : this.id + '_moveto_btn',
    // add    : this.id + '_add_btn',
    // rename : this.id + '_rename_btn',
    delete : this.id + '_delete_btn',
  };

  let self = this;

  let funcTitle = 'Select';
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
  let toolbar = new Grid('-compact');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, row,col,1,1 );

  // make the toolbar

  let bsize = '36px';
  let cnt   = 0;
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

  let self = this;

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
  for (let i=0;i<folders.length;i++)  {
    let node = ftree.addNode ( pnode,folders[i].name + ' (' + folders[i].nprjtree + ')',
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
  let ftree = new Tree ( '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>' );
  for (let i=0;i<folders.length;i++)  {
    let icon = 'folder_projects_user';
    let nprj = ' <i>(' + folders[i].nprjtree + ')</i>';
    switch (folders[i].type)  {
      case folder_type.shared        :
      case folder_type.joined        :
      case folder_type.all_projects  : icon = 'folder_list';           break
      case folder_type.custom_list   : icon = 'folder_list_custom';    break;
      case folder_type.archived      : icon = 'folder_my_archive';     break;
      case folder_type.cloud_archive : icon = 'folder_cloud_archive';  break;
      case folder_type.tutorials     : icon = 'folder_tutorials';      break;
      default :     let nprj = ' (' + folders[i].nprjtree + ')';
    }
    let node = ftree.addRootNode ( this.projectList.getRootFolderName(i,__login_id) +
                                   nprj,image_path(icon),null );
    if (i==0)
      this.node0_id = node.id;
    node.dataId     = folders[i].path;
    node.folderType = folders[i].type;
    if (node.dataId==this.currentFolder.path)
      ftree.selectNode ( node,true );
    this.setFolders ( node,folders[i].folders,ftree );
  }

  let self = this;
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
  let selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    let myprojects = selNode.dataId.startsWith(__login_id+'\'s ');
    this.add_folder_btn.setEnabled ( myprojects );
    let enable_rd  = (myprojects && selNode.parentId) ||
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

/*
FoldersBrowser.prototype.onSelectBtn = function()  {
// Select button switches to the selected folder
let selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    if (((selNode.dataId!=folder_path.archived) && 
         (selNode.dataId!=folder_path.cloud_archive)) ||
         (__user_role==role_code.developer))  {
      this.onReturn_fnc ( 'select',{ folder_path : selNode.dataId } );
      $(this.element).dialog ( 'close' );
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
*/

FoldersBrowser.prototype.onSelectBtn = function()  {
// Select button switches to the selected folder
  let selNode = this.ftree.getSelectedNode();
  if (selNode)  {
    if (((selNode.dataId==folder_path.archived) || 
         (selNode.dataId==folder_path.cloud_archive)) &&
        (!__is_archive))  {
      new MessageBox ( 'Feature not available',
          '<h2>' + appName() + ' Archive is not available</h3>' +
          'Archive facility is not configured on this instance of ' +
          appName() + '.',
          'msg_stop' );
    } else  {
      this.onReturn_fnc ( 'select',{ folder_path : selNode.dataId } );
      $(this.element).dialog ( 'close' );
    }
  } else
    new MessageBox ( 'No selection in tree',
           '<h2>No folder is selected</h3>' +
           'This likely to be a program error. Select folder and try again.',
           'msg_error' );
}


FoldersBrowser.prototype._find_folder = function ( fpath,folders )  {
  let folder = null;
  for (let i=0;(i<folders.length) && (!folder);i++)
    if (folders[i].path==fpath)
          folder = folders[i];
    else  folder = this._find_folder ( fpath,folders[i].folders );
  return folder;
}

FoldersBrowser.prototype.findFolder = function ( fpath )  {
  return this._find_folder ( fpath,this.folders );
}

FoldersBrowser.prototype._delete_folder = function ( fpath,folders )  {
  let k = -1;
  for (let i=0;(i<folders.length) && (k==-1);i++)
    if (folders[i].path==fpath)
          k = i;
    else  k = this._delete_folder ( fpath,folders[i].folders );
  if (k>=0)  {
    folders.splice(k,1);
    k = -2;  // terminate the recursion
  }
  return k;
}

FoldersBrowser.prototype.deleteFolder = function ( fpath )  {
  return this._delete_folder ( fpath,this.folders );
}

FoldersBrowser.prototype.onAddFolder = function()  {
  let self = this;
  let inputBox = new InputBox ( 'Add folder' );
  inputBox.setText ( '','folder_projects_new' );
  let ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Add new folder</h2>',0,2,2,3 );
  ibx_grid.setLabel    ( 'Name:',2,3,1,1 );
  let name_inp  = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., XX-Series','' )
        .setFontItalic ( true )
        .setWidth      ( '400px' );
  ibx_grid.setNoWrap   ( 2,2 );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );
  inputBox.launch ( 'Add',function(){
    let folderName = name_inp.getValue();
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
    let selNode = self.ftree.getSelectedNode();
    let pFolder = self.findFolder ( selNode.dataId );
    if (!pFolder)  {
      new MessageBox ( 'No current folder ',
               '<h2>Current folder not found</h2>' +
               'This is likely to be a program error. Try to reload the page<br>' +
               'in browser and repeat. If problem persists, report to<br>' +
               'developers.',
               'msg_error' );
      return false;
    }
    let fpath = selNode.dataId + '/' + folderName;
    if (self.findFolder(fpath))  {
      new MessageBox ( 'Duplicate folder name',
            '<h2>Duplicate folder name</h2>Folder names must be unique within any folder.',
            'msg_stop' );
      return false;
    }
    let newNode = self.ftree.addNode ( selNode,folderName + ' (0)',
                                       image_path('folder_projects'),null );
    newNode.dataId = fpath;
    self.projectList.addFolderPath ( fpath,0,false );
    self.onReturn_fnc ( 'add',{ folder_path : fpath } );
    self.onSelect();
    return true;
  });
}

FoldersBrowser.prototype.onAddList = function()  {
  let self = this;
  let inputBox = new InputBox ( 'Add list' );

  inputBox.setText ( '','folder_list_custom_new' );
  let ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Add new list</h2>',0,2,2,3 );
  ibx_grid.setLabel    ( 'Name:',2,3,1,1 );
  let name_inp  = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., XX-Series','' )
        .setFontItalic ( true )
        .setWidth      ( '400px' );
  ibx_grid.setNoWrap   ( 2,2 );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );
  inputBox.launch ( 'Add',function(){
    let folderName = name_inp.getValue();
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
    let fpath = folderName;
    if (self.findFolder(fpath))  {
      new MessageBox ( 'Duplicate list name',
            '<h2>Duplicate list name</h2>List names must be unique and different ' +
            'from names of top-level folders.',
            'msg_stop' );
      return false;
    }
    self.projectList.addFolderPath ( fpath,0,true );
    self.folders = self.projectList.folders;
    let folder   = self.findFolder ( fpath );
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
  let selNode = this.ftree.getSelectedNode();
  let folder  = this.findFolder ( selNode.dataId );

  if (folder)  {
    if ((folder.type!=folder_type.custom_list) &&
        ((folder.nprojects>0) || (folder.folders.length>0)))  {
      new MessageBox ( 'Non-empty folder',
            '<h2>Folder ' + folder.name + ' is not empty</h2>' +
            'Delete all projects and any sub-folders in this folder ' +
            'before deleting it.','msg_stop' );
    } else  {

      let self  = this;
      let label = 'Folder';
      if (folder.type==folder_type.custom_list)
        label = 'List';
      let label_l = folder.name.toLowerCase();

      new QuestionBox ( 'Delete ' + label_l,
                        '<h2>' + label + ' ' + folder.name + ' will be deleted</h2>' +
                        'Please confirm.',[
          { name    : 'Yes, delete',
            onclick : function(){
                        self.deleteFolder ( selNode.dataId );
                        let fpath = self.folders[0].path;
                        if (selNode.parentId)  {
                          self.ftree.deleteNode ( selNode );
                          let node = self.ftree.getSelectedNode();
                          if (node)
                            fpath = node.dataId;
                        } else  {
                          self.ftree.deleteRootNode ( selNode );
                          self.ftree.selectNodeById ( self.node0_id );
                        }
                        self.onReturn_fnc ( 'delete',{ 
                          folder_path : fpath,
                          folder_name : folder.name,  
                          folder_type : folder.type
                        });
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
  let selNode = this.ftree.getSelectedNode();
  let folder  = this.findFolder ( selNode.dataId );
  let fldPath = folderPathTitle ( folder,__login_id,0 );
  let label   = 'Folder';

  if (folder.type==folder_type.custom_list)
    label = 'List';
  let label_l = label.toLowerCase();

  // sanity check
  if ((!selNode.dataId.startsWith(__login_id+'\'s ')) &&
      ([folder_type.custom_list,folder_type.archived,folder_type.cloud_archive]
        .indexOf(selNode.folderType)<0))
    return;

  if (((selNode.folderType!=folder_type.custom_list) && 
       (selNode.dataId==this.currentFolder.path)) ||
      ((selNode.folderType==folder_type.custom_list) && 
        checkProjectLabel(__login_id,this.currentPDesc,selNode.dataId)))  {
    new MessageBox ( 'Already in the ' + label_l,
          '<h2>Already in the ' + label + '</h2>Project <i>"' + 
          this.currentPDesc.name + '"</i> is already in ' + label_l +
          '<p><i>"' + fldPath + '"</i>',
          'msg_stop' );
  } else if ((selNode.folderType==folder_type.archived) ||
             (selNode.folderType==folder_type.cloud_archive)) {
    new ProjectArchiveDialog ( this.currentPDesc,function(){
      $(self.element).dialog ( 'close' );
      self.onReturn_fnc ( 'move',{ folder_path : selNode.dataId });
    });
  } else  {
    let self     = this;
    let title    = 'Move project to ' + label_l;
    let message  = '<h2>Move project to ' + label + '</h2>' + 'Project <i><b>"' +
                   this.currentPDesc.name + '"</b></i> will be moved to ' +
                   label_l + ' <i><b>"' + fldPath + '"</b></i>';
    let btn_name = 'Please move';
    if (folder.type==folder_type.custom_list)  {
      title    = 'Add project to ' + label_l;
      message  = '<h2>Add project to ' + label + '</h2>' + 'Project <i><b>"' +
                 this.currentPDesc.name + '"</b></i> will be added to ' +
                 label_l + ' <i><b>"' + fldPath + '"</b></i>';
      btn_name = 'Please add';
    }
    new QuestionBox ( title,
                      '<div style="width:400px">' + message + 
                      '<p>Please confirm.</div>',[
        { name    : btn_name,
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
  let selNode = this.ftree.getSelectedNode();
  let label   = 'Folder';

  if (selNode.dataId.startsWith(folder_type.custom_list))
    label = 'List';
  let label_l = name.toLowerCase();

  let inputBox  = new InputBox ( 'Rename ' + label_l );
  inputBox.setText ( '','renameprj' );
  let ibx_grid = inputBox.grid;
  ibx_grid.setLabel    ( '<h2>Rename ' + label_l + ' "' + selNode.dataId.split('/').pop() +
                         '"</h2>',0,2,2,3 ).setWidth ( '400px' );
  ibx_grid.setLabel    ( 'New name:',2,3,1,1 ).setNoWrap();
  let name_inp = ibx_grid.setInputText ( '',2,4,1,1 )
        .setStyle      ( 'text','','','' )
        .setFontItalic ( true   )
        .setWidth      ( '300px' );
  ibx_grid.setVerticalAlignment ( 2,3,'middle' );
  inputBox.addWidget   ( ibx_grid );

  let self = this;
  inputBox.launch ( 'Rename',function(){
    let newName = name_inp.getValue();
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
    let oldPath       = selNode.dataId;
    let fpl           = oldPath.split('/');
    fpl[fpl.length-1] = newName;
    let folder        = self.findFolder ( selNode.dataId );
    let oldName       = folder.name;
    folder.name       = newName;
    let newPath       = fpl.join('/');
    self.projectList.renameFolders ( selNode.dataId,newPath );
    self.onReturn_fnc  ( 'rename',{
        folder_path : oldPath,
        rename_path : newPath,
        folder_name : oldName,
        rename_name : newName
    });
    self.ftree.setText ( selNode,newName + ' (' + folder.nprjtree + ')' );
    selNode.dataId = newPath;
    return true;
  });

}


// FoldersBrowser.prototype.onResize = function ( width,height )  {
//   let h = (height - 108) + 'px';
//   let w = (width  - 110) + 'px';
//   this.tree_div.element.style.height = h;
//   this.tree_div.element.style.width  = w;
// }
