
/*
 *  ===========================================================================
 *
 *    17.11.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_facility.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  FacilityUserDialog
 *       ~~~~~~~~~  FacilityCheckDialog
 *                  FacilityBrowser
 *                  CloudFileBrowser
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  ===========================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


 // ===========================================================================
// Facility user dialog class

function FacilityUserDialog ( meta,onReturn_fnc )  {

  if (!meta.facility)  {
    new MessageBox ( 'Error','No facility to update.' );
    return;
  }

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Facility User Authentication' );
  document.body.appendChild ( this.element );

  var grid = new Grid('-compact');
  this.addWidget ( grid );

  var row = 0;
  grid.setImage ( meta.facility.icon,'','80px', row,0, 1,1 );
  grid.setLabel ( ' ', row,1, 1,1 ).setWidth_px(10).setHeight ( '0.5em' );
  grid.setLabel ( '<b>' + meta.facility.title + '</b>',row,2, 1,1 )
                  .setFontSize ( '150%' ).setNoWrap();
  grid.setVerticalAlignment ( row,2,'middle' );

  row++;
  grid.setLabel ( '<hr/>'   ,row++,0,1,4 );
  grid.setLabel ( 'User ID' ,row  ,0,1,1 );
  grid.setLabel ( '&nbsp;'  ,row  ,1,1,1 );
  grid.setLabel ( 'Password',row+1,0,1,1 );
  grid.setLabel ( '&nbsp;'  ,row+1,1,1,1 );
  grid.setVerticalAlignment ( row  ,0,'middle' );
  grid.setVerticalAlignment ( row+1,0,'middle' );

  var login_inp = new InputText ( meta.uid );
  var pwd_inp   = new InputText ( '' );
  if (meta.uid)
    login_inp.setReadOnly ( true );
  login_inp.setFontItalic ( true ).setStyle ( 'text','','login name','' );
  pwd_inp  .setFontItalic ( true ).setStyle ( 'password','','password','' );
  grid.setWidget ( login_inp,row  ,2,1,1 );
  grid.setWidget ( pwd_inp  ,row+1,2,1,1 );

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : [
      { text  : 'Authenticate',
        click : function(){
          var uid = login_inp.getValue().trim();
          var pwd = pwd_inp  .getValue().trim();
          if (uid=='')  {
            new MessageBox ( 'Error','User ID cannot be blank' );
          } else  {
            meta.uid = uid;
            meta.pwd = pwd;
            $(this).dialog( "close" );
            window.setTimeout ( function(){
              onReturn_fnc ( uid,pwd );
            },0 );
          }
        }
      },
      { text  : 'Cancel',
        click : function() {
          $(this).dialog( "close" );
          window.setTimeout ( function(){
            onReturn_fnc ( '','' );
          },0 );
        }
      }
    ]
  });

}

FacilityUserDialog.prototype = Object.create ( Widget.prototype );
FacilityUserDialog.prototype.constructor = FacilityUserDialog;


// ===========================================================================
// Facility check dialog class

function FacilityCheckDialog ( task,onDone_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Communication' );
  document.body.appendChild ( this.element );

  var grid = new Grid('-compact');
  this.addWidget ( grid );

  var row = 0;
  grid.setLabel ( 'Communicating with facility.<br>' +
                  'This may take long time, please wait ...', row++,0,1,1 );

  var progressBar = new ProgressBar ( 0 );
  grid.setWidget ( progressBar, row,0,1,1 );

  (function(dlg){

    $(dlg.element).dialog({
      resizable : false,
      height    : 'auto',
      width     : 'auto',
      modal     : true,
      buttons   : [
        { text  : 'Stop waiting',
          click : function() {
            new QuestionBox ( 'Stop waiting',
                  '&nbsp;<br><b>Stop waiting, are you sure?</b><p>' +
                  '<i>Closing this dialog will not terminate current ' +
                  'operation,<br>but unlock the interface and let you do ' +
                  'other tasks.<br>However, facility tree will not refresh ' +
                  'automatically<br>after request is complete.</i>',
                  'Stop waiting',function(){
                    $(dlg.element).dialog( "close" );
                  },'Wait',function(){} );
          }
        }
      ]
    });

    var meta     = {};
    meta.tid     = task.id;    // task id
    meta.project = task.project;

    function checkReady() {
      serverRequest ( fe_reqtype.checkFclUpdate,meta,task.title,function(data){
        if (data.status==fe_retcode.inProgress)  {
          window.setTimeout ( checkReady,2000 );
        } else  {
          $(dlg.element).dialog( "close" );
          if (data.status==fe_retcode.readError)
            new MessageBox ( 'Errors','&nbsp;<br><b>File read errors.</b><p>' +
                  '<i>This is a server-side error caused by program bug<br>' +
                  'or hardware malfunction. Apologies.</i>' );
          else if (data.status==fe_retcode.fileNotFound)
            new MessageBox ( 'Errors','&nbsp;<br><b>File not found.</b><p>' +
                  '<i>This is a server-side error caused by program bug<br>' +
                  'or hardware malfunction. Apologies.</i>' );
          else if ((data.status!=fe_retcode.ok) && (data.status!=fe_retcode.askPassword))
            new MessageBox ( 'Errors','&nbsp;<br><b>' + data.status + '</b><br>&nbsp;' );
          onDone_fnc(data);
          /*
          if ((data.status==fe_retcode.ok) || (data.status==fe_retcode.askPassword))
            onDone_fnc(data);
          else if (data.status==fe_retcode.readError)
            new MessageBox ( 'Errors','&nbsp;<br><b>File read errors.</b><p>' +
                  '<i>This is a server-side error caused by program bug<br>' +
                  'or hardware malfunction. Apologies.</i>' );
          else if (data.status==fe_retcode.fileNotFound)
            new MessageBox ( 'Errors','&nbsp;<br><b>File not found.</b><p>' +
                  '<i>This is a server-side error caused by program bug<br>' +
                  'or hardware malfunction. Apologies.</i>' );
          else
            new MessageBox ( 'Errors','&nbsp;<br><b>' + data.status + '</b><br>&nbsp;' );
          */
        }
      },null,function(){ // depress error messages in this case!
        window.setTimeout ( checkReady,2000 );
      });
    }
    window.setTimeout ( checkReady,2000 );

  }(this))

}

FacilityCheckDialog.prototype = Object.create ( Widget.prototype );
FacilityCheckDialog.prototype.constructor = FacilityCheckDialog;


// ===========================================================================
// Facility user dialog class

function FacilityBrowser ( inputPanel,task )  {

  this.inputPanel = inputPanel;  // input panel from facility import dialog
  this.task       = task;        // facility import task

  this.uid = '';
  this.pwd = '';

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Facility Browser' );
  document.body.appendChild ( this.element );

  this.grid = new Grid('-compact');
  this.addWidget ( this.grid );

  this.tree_panel = this.grid.setPanel ( 0,0,1,1 );
  this.tree_panel.element.setAttribute ( 'class','tree-content' );
  this.facilityTree = null;

  this.loadFacilityTree();

  var w0 = Math.round ( 2*$(window).width()/3 );
  var h0 = Math.round ( 5*$(window).height()/6 );

  this.btn_ids = [this.id+'_update_btn',this.id+'_choose_btn'];

  (function(browser){
    $(browser.element).dialog({
      resizable : true,
      height    : h0,
      width     : w0,
      modal     : true,
      buttons   : [
        { text  : 'Update',
          id    : browser.btn_ids[0],
          click : function(){
            browser.openItem();
          }
        },
        { text  : 'Choose',
          id    : browser.btn_ids[1],
          click : function(){
            browser.updateItem ( false );
            //$(this).dialog( "close" );
          }
        },
        { text  : 'Cancel',
          click : function() {
            $(this).dialog( "close" );
          }
        }
      ]
    });
  }(this))

}

FacilityBrowser.prototype = Object.create ( Widget.prototype );
FacilityBrowser.prototype.constructor = FacilityBrowser;

// -------------------------------------------------------------------------

FacilityBrowser.prototype.disableButton = function ( btn_no,disable_bool )  {
  $('#' + this.btn_ids[btn_no]).button ( "option", "disabled",disable_bool );
}

FacilityBrowser.prototype.onTreeLoaded = function()  {
  if (this.task.inprogress)
    this.startWaitLoop();
}

FacilityBrowser.prototype.onTreeContextMenu = function ( node )  {
  var items = {};
  var item = this.facilityTree.getSelectedItem();
  if (['Facility','FacilityUser','FacilityVisit'].indexOf(item._type)>=0)  {
    (function(browser){
      items.updateItem = { // The "Add job" menu item
        label  : "Update",
        icon   : image_path('refresh'),
        action : function(){ browser.openItem(); }
      };
    }(this))
  } else if (item._type=='FacilityFile')  {
    (function(browser){
      items.updateItem = { // The "Add job" menu item
        label  : "Choose",
        icon   : image_path('upload'),
        action : function(){ browser.openItem(); }
      };
    }(this))
  }
  return items;
}

FacilityBrowser.prototype.openItem = function()  {
  var item = this.facilityTree.getSelectedItem();
  if (['Facility','FacilityUser','FacilityVisit'].indexOf(item._type)>=0)
    this.updateItem ( false );
}

FacilityBrowser.prototype.onTreeItemSelect = function()  {
var selItem  = this.facilityTree.getSelectedItem();
var nodeList = this.facilityTree.calcSelectedNodeIds();

  if (this.task.inprogress)  {
    this.disableButton ( 0,true );
    this.disableButton ( 1,true );
  } else if (['FacilityList','Facility','FacilityUser','FacilityVisit',
       'FacilityDataset','FacilityDir'].indexOf(selItem._type)>=0)  {
    //this.facilityTree.forceSingleSelection();
    for (var i=1;i<nodeList.length;i++)
      this.facilityTree.deselectNodeById ( nodeList[i] );
    this.disableButton ( 0,
              (['FacilityDataset','FacilityDir'].indexOf(selItem._type)>=0) );
    this.disableButton ( 1,true  );
  } else  {  // FacilityFile is selected
    var nodeList = this.facilityTree.calcSelectedNodeIds();
    if (nodeList.length>1)  {
      var uid = this.facilityTree.getUserID();
      for (var i=1;i<nodeList.length;i++)  {
        var nid  = nodeList[i];
        var item = this.facilityTree.item_map[nid];
        if ((item._type!='FacilityFile') || (this.facilityTree.getUserID1(nid)!=uid))
          this.facilityTree.deselectNodeById ( nid );
      }
    }
    this.disableButton ( 0,true  );
    this.disableButton ( 1,false );
  }

}


FacilityBrowser.prototype.loadFacilityTree = function()  {
  //jobTree.closeAllJobDialogs();
  // jobTree.stopTaskLoop();
  (function(browser){

    var facilityTree = new FacilityTree ( 'icat','' );
    facilityTree.element.style.paddingTop    = '0px';
    facilityTree.element.style.paddingBottom = '25px';
    facilityTree.element.style.paddingLeft   = '10px';
    facilityTree.element.style.paddingRight  = '40px';
    facilityTree.readFacilitiesData ( 'Facilities',
              function()    { browser.onTreeLoaded     (); },
              function(node){ return browser.onTreeContextMenu(node); },
              function()    { browser.openItem         (); },
              function()    { browser.onTreeItemSelect (); }
    );
    browser.tree_panel.addWidget ( facilityTree );

    if (browser.facilityTree)
      browser.facilityTree.delete();

    browser.facilityTree = facilityTree;

  }(this))
}


FacilityBrowser.prototype.startWaitLoop = function()  {
  (function(browser){
    browser.task.inprogress = 1;
    browser.onTreeItemSelect();
    new FacilityCheckDialog ( browser.task,function(data){
      browser.task.inprogress = 0;
      browser.onTreeItemSelect();
      if (data.status==fe_retcode.ok)  {
        if (data.hasOwnProperty('flist'))  {
          browser.task.setUploadedFiles ( browser.inputPanel,data.flist );
          $(browser.element).dialog( "close" );
        } else
          browser.loadFacilityTree();
      } else if (data.status==fe_retcode.askPassword)
        browser.updateItem ( true );
    });
  }(this))
}


FacilityBrowser.prototype.updateItem = function ( askpwd )  {
  var meta      = {};
  meta.facility = this.facilityTree.getFacility();  // facility item
  meta.user     = this.facilityTree.getUser    ();  // facility user item
  meta.visit    = this.facilityTree.getVisit   ();  // facility visit item
  meta.uid      = '';                               // facility user id
  meta.pwd      = '';                               // facility user password
  meta.tid      = this.task.id;                     // task id
  meta.project  = this.task.project;                // project id
  meta.item     = shallowCopy ( this.facilityTree.getSelectedItem() );

  if (meta.user)  {
    meta.uid = meta.user.id;
    if (meta.uid==this.uid)
      meta.pwd = this.pwd;
  }

  (function(browser){

    function requestUpdate ( req_meta )  {
      serverRequest ( fe_reqtype.updateFacility,req_meta,browser.task.title,
        function(data){
          if (data.status==fe_retcode.ok)
                browser.startWaitLoop();
          else  alert ( 'server replied data=' + JSON.stringify(data) );
        });
    }

    function askPassword ( request_meta )  {
      new FacilityUserDialog ( request_meta,function(uid,pwd){
        if (uid && pwd)  {
          request_meta.uid = uid;
          request_meta.pwd = pwd;
          browser.uid = uid;
          browser.pwd = pwd;
          requestUpdate ( request_meta );
        }
      });
    }

    if (meta.item._type=='FacilityFile')  { // for fetching files, first asking
                           // without password in case file is already in cache
      // add all selected file entries in the request meta
      meta.selFiles = [];  // selected files to fetch and import
      var nodeList  = browser.facilityTree.calcSelectedNodeIds();
      for (var i=0;i<nodeList.length;i++)  {
        var nid  = nodeList[i];
        var item = browser.facilityTree.item_map[nid];
        if (item._type=='FacilityFile')  {
          var file = shallowCopy ( item );
          file.did = browser.facilityTree.getDatasetID1 ( nid );
          file.dirpath = browser.facilityTree.getDirPath ( nid );
          meta.selFiles.push ( file );
        }
      }
      if (askpwd)  askPassword   ( meta );
             else  requestUpdate ( meta );
    } else if (askpwd)  {
      askPassword ( meta );
    } else if (meta.pwd)  {
      requestUpdate ( meta );
    } else  {  // password is required in all other cases
      askPassword ( meta );
    }

  }(this))

}



// ===========================================================================
// Cloud File Browser

function CloudFileBrowser ( inputPanel,task,fileKey,extFilter,onSelect_func,onClose_func )  {

  this.inputPanel = inputPanel;  // input panel from facility import dialog
  this.tree_type  = 'files';     // cloud file tree type specificator
  if (task.hasOwnProperty('tree_type'))
    this.tree_type = task.tree_type;
  this.task       = task;        // facility import task
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
  this.loadStorageTree ( this.task.currentCloudPath );

  var dlg_options = {
    resizable : true,
    modal     : true
  }

  // dlg_options.width  = Math.max ( 500,Math.round ( 1*$(window).width()/2 ) );
  dlg_options.width  = Math.max ( 500,Math.round ( (1*window.innerWidth)/2 ) );
  //dlg_options.width  = 500;
  // dlg_options.height = Math.round ( 5*$(window).height()/6 );
  dlg_options.height = Math.round ( (5*window.innerHeight)/6 );
console.log ( 'wh=' + window.innerHeight + '   width=' + dlg_options.width+ '    height=' + dlg_options.height );
  this.btn_ids = [this.id+'_open_btn',this.id+'_select_btn',this.id+'_cancel_btn'];
  dlg_options.buttons = [{
    text  : 'Cancel',
    id    : this.btn_ids[2],
    click : function() {
      $(this).dialog( "close" );
    }
  }];

  $(this.element).dialog ( dlg_options );

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

CloudFileBrowser.prototype.loadStorageTree = function ( cloudPath )  {

  (function(browser){

    browser.tree_loading = true;

    var storageTree = new StorageTree ( browser.tree_type,cloudPath,
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
          } else  {
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

  var items = this.storageTree.getSelectedItems();
  if (items.length>0)  {
    if (items[0]._type=='FacilityDir')  {
      var cloudPath = '';
      if (this.task.currentCloudPath)  {
        if (items[0].name=='..')  {
          var lst = this.task.currentCloudPath.split('/');
          cloudPath = lst.slice(0,lst.length-1).join('/');
        } else
          cloudPath = this.task.currentCloudPath + '/' + items[0].name;
      } else
        cloudPath = items[0].name;
      (function(browser){
        window.setTimeout ( function(){
          browser.loadStorageTree ( cloudPath );
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

    var storageTree = new StorageTree ( 'files',path,this.file_key,this.dir_desc );
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
  var items = this.storageTree.getSelectedItems();
  for (var i=items.length-1;i--;)  {
    if (items[i].name=='..')
      items.splice(i,1);
  }
  if (items.length>0)  {
    if ((items[0]._type=='FacilityDir') && (this.file_key>=2))  {
      if (this.onSelect_func) {
        if (items[0].name=='..')  {
          this.onSelect_func ( this.storageTree.storageList );
          $(this.element).dialog( "close" );
          //$(this.element).dialog( "destroy" );
        } else  {
          (function(browser){
            browser.getStorageList ( browser.task.currentCloudPath+'/'+items[0].name,
                                     function(storageList){
              $(browser.element).dialog( "close" );
              browser.onSelect_func ( storageList );
            });
          }(this))
        }
      }
    } else if (this.onSelect_func)  {
      if (this.onSelect_func(items)==1)
        //$(this.element).dialog( "destroy" );
        $(this.element).dialog( "close" );
    }
  }
}


CloudFileBrowser.prototype.onTreeItemSelect = function()  {
  if (this.storageTree)  {
    var items   = this.storageTree.getSelectedItems();
    var n_dirs  = 0;
    var n_files = 0;
    var parent_dir = false;
    for (var i=0;i<items.length;i++)
      if (items[i]._type=='FacilityDir')  {
        n_dirs++;
        if (items[i].name=='..')
          parent_dir = true;
      } else
        n_files++;
    if (this.file_key==3)  {
      var disable = (n_dirs!=1) || (n_files>0);
      this.disableButton  ( 0,disable );
      this.disableButton  ( 1,disable || parent_dir );
    } else if (this.file_key==2)  {
      var disable = (n_dirs!=1) || (n_files>0);
      this.disableButton  ( 0,disable );
      this.disableButton  ( 1,disable );
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
