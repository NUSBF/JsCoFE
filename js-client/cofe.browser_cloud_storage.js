
/*
 *  ===========================================================================
 *
 *    15.12.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.browser_cloud_storage.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CloudFileBrowser
 *       ~~~~~~~~~  
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ===========================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// ===========================================================================
// Cloud File Browser

function CloudFileBrowser ( inputPanel,task,fileKey,extFilter,onSelect_func,onClose_func )  {

  this.inputPanel = inputPanel;  // input panel from data import dialog
  this.tree_type  = 'files';     // cloud file tree type specificator
  if (task.hasOwnProperty('tree_type'))
    this.tree_type = task.tree_type;
  this.task       = task;        // data import task
  this.file_key   = fileKey;     // 0: do not show images
                                 // 1: show images
                                 // 2: show only images
                                 // 3: browse directories, show all files
                                 // 4: show only importable files
                                 // 5: show only .ccp4_demo and .ccp4cloud files
  this.ext_filter = extFilter;   // []: take all files, otherwise list of
                                 //     acceptable extensions in lower case
  this.onSelect_func = onSelect_func;

  this.uid = '';
  this.pwd = '';

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Cloud File Browser' );
  document.body.appendChild ( this.element );

  this.grid = new Grid('-compact');
  this.grid.setWidth ( '100%' );
  this.addWidget ( this.grid );

  this.dir_desc   = this.grid.setLabel ( '',0,0,1,1 ).setWidth ( '100%' );
  this.tree_panel = this.grid.setPanel ( 1,0,1,1 );
  this.tree_panel.element.setAttribute ( 'class','tree-content' );
  this.storageTree = null;

  this.tree_loading = false;
  this.tree_top     = '/';
  if ('rootCloudPath' in this.task)
    this.tree_top = this.task.rootCloudPath;
  this.loadStorageTree ( this.task.currentCloudPath,this.tree_top );

  let dlg_options = {
    resizable : true,
    modal     : true
  }

  // dlg_options.width  = Math.max ( 500,Math.round ( 1*$(window).width()/2 ) );
  dlg_options.width  = Math.max ( 500,Math.round ( (1*window.innerWidth)/2 ) );
  //dlg_options.width  = 500;
  // dlg_options.height = Math.round ( 5*$(window).height()/6 );
  dlg_options.height = Math.round ( (5*window.innerHeight)/6 );
  // console.log ( 'wh=' + window.innerHeight + '   width=' + dlg_options.width+ '    height=' + dlg_options.height );
  this.btn_ids = [this.id+'_open_btn',this.id+'_select_btn',this.id+'_cancel_btn'];
  dlg_options.buttons = [{
    text  : 'Cancel',
    id    : this.btn_ids[2],
    click : function() {
      $(this).dialog( "close" );
    }
  }];


  $(this.element).dialog ( dlg_options );

  // this.element.style="position:fixed; left:10px; top:170px;"

  (function(dlg){
    $(dlg.element).on( "dialogclose",function(event,ui){
      $(dlg.element).dialog( "destroy" );
      if (onClose_func)
        onClose_func();
      dlg.delete();
    });
  }(this))

}

CloudFileBrowser.prototype = Object.create ( Widget.prototype );
CloudFileBrowser.prototype.constructor = CloudFileBrowser;


// -------------------------------------------------------------------------

CloudFileBrowser.prototype.disableButton = function ( btn_no,disable_bool )  {
  $('#' + this.btn_ids[btn_no]).button ( 'option','disabled',disable_bool );
}

CloudFileBrowser.prototype.setButtonLabel = function ( btn_no,label_text )  {
  $('#' + this.btn_ids[btn_no]).button ( 'option','label',label_text );
}

CloudFileBrowser.prototype.loadStorageTree = function ( cloudPath,topPath )  {

  (function(browser){

    browser.tree_loading = true;

    let storageTree = new StorageTree ( browser.tree_type,cloudPath,topPath,
                                                browser.file_key,browser.dir_desc );

    storageTree.element.style.paddingTop    = '0px';
    storageTree.element.style.paddingBottom = '25px';
    storageTree.element.style.paddingLeft   = '10px';
    storageTree.element.style.paddingRight  = '40px';
    storageTree.readStorageData ( 'Cloud File Storage',browser.ext_filter,
      function(){
        if (storageTree.storageList)  {
          if (storageTree.storageList.size>=0)  {
            // if (storageTree.storageList.path)
            //       browser.task.currentCloudPath = cloudPath;
            // else  browser.task.currentCloudPath = storageTree.storageList.path;
            browser.task.currentCloudPath = storageTree.storageList.path;
            $(browser.element).dialog ( 'option','buttons',[
              { text  : 'Open',
                id    : browser.btn_ids[0],
                click : function(){
                  browser.openItem();
                }
              },{
                text  : 'Select',
                id    : browser.btn_ids[1],
                click : function(){
                  browser.selectItem();
                }
              },{
                text  : 'Close',
                id    : browser.btn_ids[2],
                click : function() {
                  $(this).dialog( "close" );
                }
              }
            ]);
            if (browser.storageTree)
              browser.storageTree.delete();
            browser.tree_panel.addWidget ( storageTree );
            browser.storageTree = storageTree;
            browser.onTreeItemSelect();
            //browser.onTreeLoaded();
          } else if (browser.tree_type!='abspath') {
            $(browser.element).dialog ( 'option','width' ,600 );
            $(browser.element).dialog ( 'option','height',330 );
            $(browser.element).dialog ( 'option','buttons',[
              { text  : 'Ok',
                id    : browser.btn_ids[2],
                click : function() {
                  $(this).dialog( "close" );
                }
              }
            ]);
            if (browser.storageTree)
              browser.storageTree.delete();
            browser.storageTree = null;
            browser.tree_panel.addWidget ( new Label (
                '<h2>Cloud File Storage Not Allocated</h2>' +
                'Cloud file storage is not allocated for user <i>"' + __login_user +
                '"</i>. Cloud storage is used for keeping raw experimental data, ' +
                'as well as partly processed data, brought from data producing ' +
                'facilities such as synchrotrons.' +
                '<p>Please contact your ' + appName() + ' maintainer if you believe ' +
                'that you should have access to Cloud storage.' ) );
          }
        }
        browser.tree_loading = false;
        //Test data : /Users/eugene/Projects/jsCoFE/data
      },
      function(node){ return null; }, // browser.onTreeContextMenu(node); },
      function()    { browser.openItem         (); },
      function()    { browser.onTreeItemSelect (); }
    );

  }(this))

}


CloudFileBrowser.prototype.openItem = function()  {

  if (this.tree_loading)
    return;

  let items = this.storageTree.getSelectedItems();
  if (items.length>0)  {
    if (items[0]._type=='StorageDir')  {
      let cloudPath = '';
      if (this.task.currentCloudPath)  {
        if (items[0].name=='..')  {
          let lst = this.task.currentCloudPath.split('/');
          cloudPath = lst.slice(0,lst.length-1).join('/');
        } else
          cloudPath = this.task.currentCloudPath + '/' + items[0].name;
      } else
        cloudPath = items[0].name;
      (function(browser){
        window.setTimeout ( function(){
          browser.loadStorageTree ( cloudPath,browser.tree_top );
        },0);
      }(this))
    } else if (this.file_key==2)  {
      // this if is actually never invoked as "Select" button is grayed if
      // item is not a directory
      if (this.onSelect_func)
        this.onSelect_func ( this.storageTree.storageList );
      $(this.element).dialog( "close" );
      //$(this.element).dialog( "destroy" );
    } else if (this.onSelect_func)  {
      if (this.onSelect_func(items)==1)
        //$(this.element).dialog( "destroy" );
        $(this.element).dialog( "close" );
    }
  }

}


CloudFileBrowser.prototype.getStorageList = function ( path,callback_func )  {

  if (!path)  {

    callback_func ( this.storageTree.storageList );

  } else  {

    let storageTree = new StorageTree ( 'files',path,'/',this.file_key,this.dir_desc );
    storageTree.tree_type = this.tree_type;
    storageTree.readStorageData ( 'Cloud File Storage',this.ext_filter,
      function(){
        if (storageTree.storageList)  {
          callback_func ( storageTree.storageList );
        } else  {
          callback_func ( {} );
        }
      },
      function(node){ return null; }, // browser.onTreeContextMenu(node); },
      function()    {},
      function()    {}
    );

  }

}


CloudFileBrowser.prototype.selectItem = function()  {
  let items = this.storageTree.getSelectedItems();
  for (let i=items.length-1;i--;)  {
    if (items[i].name=='..')
      items.splice(i,1);
  }
  if (items.length>0)  {
    if ((items[0]._type=='StorageDir') && (this.file_key>=2))  {
      if (this.onSelect_func) {
        if (items[0].name=='..')  {
          this.onSelect_func ( this.storageTree.storageList );
          $(this.element).dialog( "close" );
        } else  {
          let browser = this;
          this.getStorageList ( this.task.currentCloudPath+'/'+items[0].name,
            function(storageList){
                browser.onSelect_func ( storageList );
                $(browser.element).dialog( "close" );
            });
        }
      }
    } else if (this.file_key==2)  {
      // image file clicked for selection
      let browser = this;
      this.getStorageList ( this.task.currentCloudPath,
        function(storageList){
          browser.onSelect_func ( storageList );
          $(browser.element).dialog( "close" );
        });
    } else if (this.onSelect_func)  {
      if (this.onSelect_func(items)==1)
        $(this.element).dialog( "close" );
    }
  }
}


CloudFileBrowser.prototype.onTreeItemSelect = function()  {
  if (this.storageTree)  {
    let items   = this.storageTree.getSelectedItems();
    let n_dirs  = 0;
    let n_files = 0;
    let parent_dir = false;
    for (let i=0;i<items.length;i++)
      if (items[i]._type=='StorageDir')  {
        n_dirs++;
        if ((items[i].name=='..') || (items[i].name=='**top**'))
          parent_dir = true;
      } else
        n_files++;
    if (this.file_key==3)  {
      let disable = (n_dirs!=1) || (n_files>0);
      this.disableButton  ( 0,disable );
      this.disableButton  ( 1,disable || parent_dir );
    } else if (this.file_key==2)  {
      // select image directories
      let disable = (n_dirs!=1) || (n_files>0);
      this.disableButton  ( 0,disable );
      // this.disableButton  ( 1,disable );
      this.disableButton  ( 1,disable && (n_files<=0) );
    } else if ((n_dirs==1) && (n_files==0))  {
      this.disableButton  ( 0,false  );
      this.disableButton  ( 1,true   );
      //this.setButtonLabel ( 1,'Open' );
    } else if ((n_dirs==0) && (n_files>0)) {
      this.disableButton  ( 0,true   );
      this.disableButton  ( 1,false  );
      //this.setButtonLabel ( 1,'Select' );
    } else  {
      this.disableButton  ( 1,true );
    }
  }
}
