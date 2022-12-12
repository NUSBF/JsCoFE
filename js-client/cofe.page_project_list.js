
/*
 *  =================================================================
 *
 *    12.12.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_project_list.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project list page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

/*
http://tablesorter.com/docs/#Introduction
https://mottie.github.io/tablesorter/docs/example-widget-filter-custom.html

https://mottie.github.io/tablesorter/docs/example-css-highlighting.html

*/

// -------------------------------------------------------------------------
// projects page class

function ProjectListPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectListPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  var projectList    = new ProjectList(__login_id);  // project list data
  this.tablesort_tbl = null;                         // project list table
  var folder_btn     = null;
  var open_btn       = null;
  var add_btn        = null;
  var rename_btn     = null;
  var clone_btn      = null;
  var move_btn       = null;
  var del_btn        = null;
  var export_btn     = null;
  var import_btn     = null;
  var demoprj_btn    = null;
  var join_btn       = null;
  var help_btn       = null;
  var panel          = null;
  this.welcome_lbl   = null;
  var nCols          = 0;                  // column span of project table
  var table_row      = 0;                  // project list position in panel
  var self           = this;               // for reference to Base class
  var pageTitle_lbl  = null;

  var owners_folder  = __login_id + '\'s Projects';

  var tightScreen = (Math.max(window.screen.width,window.screen.height)<720*4/3);

  function currentProjectName()  {
    if (__current_folder.nprojects>0)
          return self.tablesort_tbl.selectedRow.child[0].text.split(':</b>').pop();
    else  return '';
  }

  function getCurrentProjectDesc()  {
    var pdesc = null;
    if (__current_folder.nprojects>0)  {
      var pname = currentProjectName();
      for (var i=0;(i<projectList.projects.length) && (!pdesc);i++)
        if (projectList.projects[i].name==pname)
          pdesc = projectList.projects[i];
    }
    return pdesc;
  }

  function getCurrentProjectNo()  {
    var pno = -1;
    if (__current_folder.nprojects>0)  {
      var pname = currentProjectName();
      for (var i=0;(i<projectList.projects.length) && (pno<0);i++)
        if (projectList.projects[i].name==pname)
          pno = i;
    }
    return pno;
  }

  function isCurrentProjectShared()  {
    var pdesc = getCurrentProjectDesc();
    if (pdesc)
      return (Object.keys(pdesc.share).length>0);
    return false;
  }

  function isCurrentProjectAuthored ( check_author )  {
    var pdesc = getCurrentProjectDesc();
    if (pdesc)  {
      if (check_author)
            return (getProjectAuthor(pdesc)==__login_id);
      else  return (pdesc.owner.login==__login_id);
    }
    return false;
  }

  function setPageTitle ( folder )  {
    if (pageTitle_lbl)  {
      pageTitle_lbl.setText ( '&nbsp;' + folderPathTitle(folder,__login_id,50) );
      pageTitle_lbl.setFont ( 'times','200%',true,true );
      pageTitle_lbl.setVisible ( true );
    }
    if (folder_btn)  {
      var icon = 'folder_projects';
      switch (folder.type)  {
        case folder_type.custom_list   : icon = 'folder_list_custom';    break;
        case folder_type.list          :
        case folder_type.shared        :
        case folder_type.joined        :
        case folder_type.all_projects  : icon = 'folder_list';           break;
        case folder_type.archived      : icon = 'folder_my_archive';     break;
        case folder_type.cloud_archive : icon = 'folder_cloud_archive';  break;
        case folder_type.tutorials     : icon = 'folder_tutorials';      break;
        case folder_type.user          : icon = 'folder_projects_user';  break;
        default : ;
      }
      folder_btn.setImage ( image_path(icon) );
      folder_btn.setVisible ( true );
    }
  }

  // function to save Project List
  function saveProjectList ( onDone_func,crProjectName )  {
    if (self.tablesort_tbl.selectedRow)  {
      if (crProjectName)
            projectList.current = crProjectName;
      else  projectList.current = currentProjectName();
      for (var i=0;i<projectList.projects.length;i++)  {
        var pDesc = projectList.projects[i];
        if (pDesc.name==projectList.current)  {
          pDesc.dateLastUsed = getDateString();
          break;
        }
      }
    } else  {
      projectList.current = '';
    }
    projectList.sortList = self.tablesort_tbl.getSortList();
    serverRequest ( fe_reqtype.saveProjectList,projectList,'Project List',
      function(data){
        if (onDone_func)
          onDone_func ( data );
        self.updateUserRationDisplay ( data );
      },null,'persist' );
  }

  // function to open selected Project
  var openProject = function() {
    saveProjectList ( function(data){ makeProjectPage(sceneId); },null );
  }

  this._open_project = function ( prjName )  {
    saveProjectList ( function(data){ makeProjectPage(sceneId); },prjName );
  }

  var _add_project = function() {
    new AddProjectDialog ( projectList,function(pspecs){
      if (pspecs)  {
        if (projectList.addProject(pspecs.id,pspecs.title,
                                  pspecs.startmode,getDateString()))  {
          projectList.current   = pspecs.id;
          projectList.startmode = pspecs.startmode;
          makeProjectListTable();
          openProject();
          /* -- this part for not opening the project automatically
          saveProjectList ( function(data){
            projectList.current = pspecs.id;
            makeProjectListTable   ();
            welcome_lbl.setVisible ( (projectList.projects.length<1) );
          },null );
          */
          return true;  // close dialog
        } else  {
          new MessageBox ( 'Duplicate Project ID',
              'The Project ID chosen (<b>' + pspecs.id + '</b>)<br>' +
              'is already in the list. Please choose a different Project ID.',
              'msg_excl_yellow' );
          return false;  // keep dialog
        }
      }
    });
  }

  var archiveProject = function()  {
    var pDesc = getCurrentProjectDesc();
    if (!pDesc)  {
      new MessageBox ( 'Current project not identified',
          '<h2>Current project is not identified</h2>' +
          '<i>This is a bug please report to developers.</i>',
          'msg_error'
      );
      return;
    }
    new ProjectArchiveDialog ( pDesc,function(){} );
  }

  var addProject = function()  {
    if (__current_folder.type==folder_type.cloud_archive)  {
      new AccessArchiveDialog ( function(done){
        if (done)
          self.loadProjectList1();
      });
    } else if (__current_folder.path.startsWith(owners_folder) ||
               (__current_folder.type==folder_type.all_projects))  {
      _add_project();
    } else  {
      new QuestionBox (
        'Cannot create project in this folder',
        '<h2>Cannot create Project in this folder</h2>' +
        'Projects can be created only in <i>My Projects</i> area.' +
        '<p>Create new Project in <i>My Projects</i> and switch there?',[
        { name    : 'Yes',
          onclick : function(){
                      projectList.setCurrentFolder ( projectList.folders[0] )
                      __current_folder = projectList.currentFolder;
                      // setPageTitle ( __current_folder );
                      _add_project();
                    }
        },{
          name    : 'Cancel',
          onclick : function(){}
        }],'msg_question'
      );
    }      
  }

  // function to rename selected Project
  var renameProject = function() {

    if ((__current_folder.type==folder_type.archived) ||
        (__current_folder.type==folder_type.cloud_archive))  {

      new MessageBox ( 'Rename Project',
        '<div style="width:400px"><h2>Projects in this folder cannot be renamed</h2>' +
        'You may rename only your own projects, which were not shared with ' +
        'other users and were not archived.</div>','msg_stop' );

    } else  {

      panel.click();  // get rid of context menu

      if (isCurrentProjectShared())  {
        var msg = '<div style="width:450px"><h2>Rename Project</h2>';
        if (isCurrentProjectAuthored(true))
              msg += 'You cannot rename this project because you shared it with other ' +
                     'users.<p>Shared projects cannot be renamed until they are unshared.';
        else  msg += 'You cannot rename this project because it was shared with you.' +
                     '<p>Joined projects cannot be renamed.';
        new MessageBox ( 'Rename Project',msg,'msg_stop' );
        return;
      }

      var pDesc = getCurrentProjectDesc();
      if (!pDesc)  {
        new MessageBox ( 'Current project not identified',
            '<h2>Current project is not identified</h2>' +
            '<i>This is a bug please report to developers.</i>',
            'msg_error'
        );
        return;
      }

      if (pDesc.archive)  {
        new MessageBox ( 'Rename Project',
          '<div style="width:400px"><h2>Projects from Archive cannot be renamed</h2>' +
          'Projects which were obtained by cloning from ' + appName() + 
          ' Archive cannot be renamed.</div>',
          'msg_stop' );
        return;
      }

      var prjName   = pDesc.name;
      var inputBox  = new InputBox ( 'Rename Project' );
      inputBox.setText ( '','renameprj' );
      var ibx_grid = inputBox.grid;
      ibx_grid.setLabel    ( '<h2>Rename Project "' + prjName + '"</h2>',0,2,2,3 );
      ibx_grid.setLabel    ( 'New ID:',2,3,1,1 );
      var name_inp  = ibx_grid.setInputText ( prjName,2,4,1,1 )
            .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
            .setFontItalic ( true )
            .setWidth      ( '240px' );
      ibx_grid.setLabel    ( 'New Name:&nbsp;',3,3,1,1 );
      var title_inp = ibx_grid.setInputText
                          ( self.tablesort_tbl.selectedRow.child[1].text,3,4,1,1 )
            .setStyle      ( 'text','','Put a descriptive title here','' )
            .setFontItalic ( true )
            .setWidth      ( '520px' );
      ibx_grid.setNoWrap   ( 2,2 );
      ibx_grid.setNoWrap   ( 3,2 );
      ibx_grid.setVerticalAlignment ( 2,3,'middle' );
      ibx_grid.setVerticalAlignment ( 3,3,'middle' );
      inputBox.addWidget   ( ibx_grid );

      inputBox.launch ( 'Rename',function(){
        if (name_inp.getValue().length<=0)  {
          new MessageBox ( 'No Project ID',
                  '<b>Project ID is not given</b>.<p>' +
                  'Project cannot be renamed with empty ID.',
                  'msg_error' );
          return false;
        } else if (name_inp.element.validity.patternMismatch)  {
          new MessageBox ( 'Invalid Project ID',
                '<div style="width:400px"><h2>Invalid project ID</h2>' +
                '<b>Project ID</b> should contain only latin letters, ' +
                'numbers, undescores, dashes and dots, and must start ' +
                'with a letter.</div>','msg_stop' );
          return false;
        }

        if (title_inp.getValue().length<=0)  {
          new MessageBox ( 'No Project Name',
                  '<b>Project Name is not given</b>.<p>' +
                  'Project cannot be renamed with empty name.',
                  'msg_error' );
          return false;
        }
        pDesc = projectList.renameProject ( prjName,title_inp.getValue(),getDateString() );
        if (pDesc)  {
          var new_name = name_inp.getValue();
          if ((new_name!=pDesc.name) && projectList.getProject(new_name))  {
            new MessageBox ( 'Duplicate Project ID',
                    '<div style="width:400px;"><h2>Duplicate Project ID</h2>' +
                    'Project with ID <b>"' + new_name +
                    '"</b> already exists (check all folders).</div>',
                    'msg_excl_yellow' );
            return false;
          }
          pDesc.new_name      = new_name;
          projectList.current = prjName;
          serverRequest ( fe_reqtype.renameProject,pDesc,'Rename Project',
            function(data){
              if (data.code=='ok')  {
                pDesc.name = new_name;
                delete pDesc.new_name;
                saveProjectList ( function(data){
                  projectList.current = new_name;
                  makeProjectListTable();
                },null );
              } else  {
                new MessageBox ( 'Project renaming rejected',
                  '<h2>Project renaming rejected</h2><i>' + data.code + '</i>.',
                  'msg_error'
                );
                makeProjectListTable();
              }
            },null,'persist' );
          return true;  // close dialog
        } else  {
          new MessageBox ( 'Project ID not found',
              'The Project ID <b>'+prjName+'</b> is not found in the list.<p>' +
              'This is program error, please report as a bug.','msg_error' );
          return false;
        }
      });

    }

  }

  var deleteProject = function()  {
    panel.click();  // get rid of context menu
    var delName    = currentProjectName();
    var delMessage = '';
    var btnName    = 'Yes, delete';
    var dlgTitle   = 'Delete Project';
    if (isCurrentProjectAuthored(false))  {
      delMessage = '<h2>Delete Project</h2>' +
                   'Project <b>"' + delName +
                   '"</b> will be deleted. All project ' +
                   'structure and data will be lost.'    +
                   '<p>Please confirm your choice.';
    // } else if (__current_folder.type==folder_type.custom_list)  {
    //   delMessage = '<h2>Delist Project</h2>' +
    //                'Project <b>"' + delName  +
    //                '"</b> will be removed from list <i>"'   +
    //                __current_folder.path     + '"</i>. The project will ' +
    //                'remain intact in its folder.' +
    //                '<p>Please confirm.';
    //   btnName    = 'Please delist';
    //   dlgTitle   = 'Delist Project';
    } else  {
      delMessage = '<h2>Unjoin Project</h2>' +
                   'Project <b>"' + delName  + '"</b>, shared with you, ' +
                   'will be unjoined, and you will be no longer ' +
                   'able to access it until joined again.'        +
                   '<p>Please confirm your choice.';
      btnName    = 'Please unjoin';
      dlgTitle   = 'Unjoin Project';
    }
    var inputBox = new InputBox ( dlgTitle );
    inputBox.setText ( '<div style="width:400px;">' + delMessage + '</div>',
                       'msg_confirm' );
    inputBox.launch  ( btnName,function(){
      // if (__current_folder.type==folder_type.custom_list)  {
      //   saveProjectList ( function(rdata){
      //     // loadProjectList();
      //     // makeProjectListTable();
      //   },null );
      // } else  {
        serverRequest ( fe_reqtype.deleteProject,delName,dlgTitle,
          function(data){
            self.loadProjectList1();
          },null,'persist' );
      // }
      return true;  // close dialog
    });
  }

  var exportProject = function() {
    panel.click();  // get rid of context menu
    if (self.tablesort_tbl.selectedRow)  {
      projectList.current = currentProjectName();
      new ExportProjectDialog ( projectList );
    } else
      new MessageBox ( 'No project selected',
                       '<h2>No project is selected<h2>' +
                       'This is likely to be a program error. ' +
                       'Select project and try again.',
                       'msg_error' );
  }

  var sharePrj = function()  {
    panel.click();  // get rid of context menu
    var pno = getCurrentProjectNo();
    if (pno>=0)  {
      shareProject ( projectList.projects[pno],function(desc){
        if (desc)  {
          projectList.projects[pno] = desc;
          projectList.resetFolders ( __login_id );
          saveProjectList ( function(data){},null );
        }
      });
    } else
      new MessageBox ( 'No Project',
                       '<h2>No Project is selected<h2>' +
                       'This is likely to be a program error. ' +
                       'Select project and try again.',
                       'msg_error' );
  }

  var cloneProject = function()  {
    panel.click();  // get rid of context menu

    var pDesc = getCurrentProjectDesc();
    if (!pDesc)  {
      new MessageBox ( 'Current project not identified',
          '<h2>Current project is not identified</h2>' +
          '<i>This is a bug please report to developers.</i>',
          'msg_error'
      );
      return false;
    }

    if (self.ration && (self.ration.storage>0.0) &&
        (self.ration.storage_used+pDesc.disk_space>self.ration.storage))  {
      new MessageBox ( 'Disk Quota is short',
          '<div style="width:500px;"><h3>Insufficient Disk Space</h3>' +
          'The project cannot be cloned because disk quota is short. ' +
          'Your account currently uses <b>' + round(self.ration.storage_used,1) +
          '</b> MBytes out of <b>' + round(self.ration.storage,1) +
          '</b> MBytes allocated.<p>' +
          '<i><b>Hint 1:</b></i> deleting jobs and projects will free up disk space.<p>' +
          '<i><b>Hint 2:</b></i> resource usage can be monitored using disk and ' +
          'CPU widgets in the top-right corner of the screen.<p>' +
          '<i><b>Recommended action:</b></i> export an old project and then ' +
          'delete it from the list. You will be able to re-import that ' +
          'project later using the file exported.</div>','msg_stop' );
      return false;
    }

    var prjName  = pDesc.name;
    var inputBox = new InputBox ( 'Clone Project' );
    inputBox.setText ( '','cloneprj' );
    var ibx_grid = inputBox.grid;
    ibx_grid.setLabel ( '<h2>Clone Project "' + prjName + '"</h2>',0,2,2,3 );
    ibx_grid.setLabel ( 'Cloned Project ID:',2,3,1,1 );
    var name_sugg  = prjName + '-clone';
    var title_sugg = self.tablesort_tbl.selectedRow.child[1].text.trim();
    if (pDesc.archive)  {
      name_sugg  = prjName + '-rev' + pDesc.archive.version;
      title_sugg = title_sugg.split(': Revision #')[0] + ': Revision #' +
                   pDesc.archive.version;
    } else
      title_sugg += ' (cloned)';
    var name_inp  = ibx_grid.setInputText ( name_sugg,2,4,1,1 )
          .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
          .setFontItalic ( true )
          .setWidth      ( '240px' )
          .setReadOnly   ( (pDesc.archive!=null) );
    ibx_grid.setLabel    ( 'Cloned Project Name:&nbsp;',3,3,1,1 );
    var title_inp = ibx_grid.setInputText ( title_sugg,3,4,1,1 )
          .setStyle      ( 'text','','Put a descriptive title here','' )
          .setFontItalic ( true )
          .setWidth      ( '520px' )
          .setReadOnly   ( (pDesc.archive!=null) );
    ibx_grid.setNoWrap   ( 2,3 );
    ibx_grid.setNoWrap   ( 3,3 );
    ibx_grid.setVerticalAlignment ( 2,3,'middle' );
    ibx_grid.setVerticalAlignment ( 3,3,'middle' );

    inputBox.launch ( 'Clone',function(){
      if (name_inp.getValue().length<=0)  {
        new MessageBox ( 'No Project ID',
                 '<b>Project ID is not given</b>.<p>' +
                 'Project cannot be renamed with empty ID.',
                 'msg_excl_yellow' );
        return false;
      }
      if (title_inp.getValue().length<=0)  {
        new MessageBox ( 'No Project Name',
                 '<b>Project Name is not given</b>.<p>' +
                 'Project cannot be renamed with empty name.',
                 'msg_excl_yellow' );
        return false;
      }
      var new_name = name_inp.getValue();
      if (projectList.getProject(new_name))  {
        new MessageBox ( 'Duplicate Project ID',
                 '<div style="width:400px;"><h2>Duplicate Project ID</h2>' +
                 'Project with ID <b>"' + new_name +
                 '"</b> already exists (check all folders).</div>','msg_stop' );
        return false;
      }
      pDesc.new_name  = new_name;
      pDesc.new_title = title_inp.getValue();

      new WaitDialog ( 'Clone Project','',
        function(dlg,close_func){

          var grid = new Grid('');
          dlg.addWidget ( grid );
          grid.setLabel ( '<h3>Cloning project in progress, please wait ...</h3>',0,0,1,3 );
          var progressBar = new ProgressBar ( 0 );
          grid.setWidget ( progressBar, 1,0,1,3 );
          grid.setLabel ( '<i style="font-size:85%;">this may take long time; ' +
                          'the dialog will close automatically</i>',2,0,1,3 );
          // projectList.current = prjName;

          function checkCloneReady() {
            serverRequest ( fe_reqtype.checkCloneProject,new_name,
                            'Check Project Clone Status',function(rdata){
              if (rdata.code=='done')  {
                close_func();
                self.loadProjectList1();
              } else if (rdata.code=='fail')  {
                close_func();
                new MessageBox ( 'Project cloning failed',
                  '<h2>Project cloning failed</h2>' +
                  '<i>Please report this to your ' + appName() + ' maintainer</i>.',
                  'msg_error'
                );
              } else
                window.setTimeout ( checkCloneReady,1000 );
            },null,function(){ // depress error messages in this case!
              window.setTimeout ( checkCloneReady,1000 );
            });
          }

          serverRequest ( fe_reqtype.cloneProject,pDesc,'Clone Project',
            function(data){
              if (data.code=='ok')  {
                checkCloneReady();
              } else  {
                close_func();
                new MessageBox ( 'Project cloning rejected',
                  '<h2>Project cloning rejected</h2><i>' + data.code + '</i>.',
                  'msg_error'
                );
                // makeProjectListTable();
              }
            },null,'persist' );
        });
      return true;  // close dialog
    });

  }

  var repairProject = function()  {
    panel.click();  // get rid of context menu
    new QuestionBox (
        'Repair Project',
        '<h2>Repair Project</h2>',[
        { name    : 'Repair',
          onclick : function(){
                      new MessageBox ( 'Not implemented','<h2>Function not implemented</h2>' );
                    }
        },{
          name    : 'Cancel',
          onclick : function(){
                      new MessageBox ( 'Not implemented','<h2>Function not implemented</h2>' );
                    }
        }],'msg_error' );

  }

  var delistProject = function()  {
    panel.click();  // get rid of context menu

    var pDesc = getCurrentProjectDesc();
    if (!pDesc)  {
      new MessageBox ( 'Current project not identified',
          '<h2>Current project is not identified</h2>' +
          '<i>This is a bug please report to developers.</i>',
          'msg_error'
      );
      return false;
    }

    var inputBox = new InputBox ( 'Delist project' );
    
    if (__current_folder.type==folder_type.cloud_archive)  {

      inputBox.setText (
          '<div style="width:400px;">' +
          '<h2>Delist Project</h2>Project <b>"'  + pDesc.name  +
          '"</b> will be removed from the list of accessed projects of the ' + 
          appName() + ' Archive.<p>Please confirm.</div>',
          'folder_cloud_archive_delist' );

      inputBox.launch  ( 'Delist',function(){
        serverRequest ( fe_reqtype.deleteProject,pDesc.name,'Delist project',
          function(data){
            self.loadProjectList1();
          },null,'persist' );
        return true;  // close dialog
      });

    } else  {

      inputBox.setText (
          '<div style="width:400px;">' +
          '<h2>Delist Project</h2>Project <b>"'  + pDesc.name  +
          '"</b> will be removed from list <i>"' + __current_folder.path +
          '"</i>. This is not a deletion; the project will remain intact ' +
          'in its folder.<p>Please confirm.</div>',
          'folder_list_custom_delist' );
      inputBox.launch  ( 'Delist',function(){
        removeProjectLabel ( __login_id,pDesc,__current_folder.path );
        projectList.resetFolders ( __login_id );
        saveProjectList ( function(rdata){
          // loadProjectList();
          makeProjectListTable();
        },null );
        return true;  // close dialog
      });

    }

  }


  function listProject ( projectDesc )  {
    if (projectDesc.archive && projectDesc.archive.in_archive)  {
      if (projectDesc.owner.login==__login_id)
            return (__current_folder.type==folder_type.archived);
      else  return (__current_folder.type==folder_type.cloud_archive);
    } else  {
      return (
        (projectDesc.folderPath==__current_folder.path) ||
        ((__current_folder.type==folder_type.joined) &&
          isProjectJoined(__login_id,projectDesc)) ||
        ((__current_folder.type==folder_type.shared) &&
          isProjectShared(__login_id,projectDesc)) ||
        ((__current_folder.type==folder_type.custom_list) &&
          checkProjectLabel(__login_id,projectDesc,__current_folder.path)) ||
        (__current_folder.type==folder_type.all_projects) 
      );
    }
  }

  // function to create project list table and fill it with data
  function makeProjectListTable()  {

    if (self.tablesort_tbl)
      projectList.sortList = self.tablesort_tbl.getSortList();
    else if (!('sortList' in projectList))
      projectList.sortList = [[5,1]];

    if (__current_folder.nprojects>=0)  // works first time after login
      __current_folder = projectList.currentFolder;
    // var owners_folder = __login_id + '\'s Projects';

    var nrows = 0;
    for (var i=0;i<projectList.projects.length;i++)
      if (listProject(projectList.projects[i]))
        nrows++;

    __current_folder.nprojects = nrows;
    switch (__current_folder.type)  {
      case folder_type.shared        : projectList.folders[1].nprojects = nrows;  break;
      case folder_type.joined        : projectList.folders[2].nprojects = nrows;  break;
      case folder_type.all_projects  : projectList.folders[3].nprojects = nrows;  break;
      case folder_type.archived      : projectList.folders[4].nprojects = nrows;  break;
      case folder_type.cloud_archive : projectList.folders[5].nprojects = nrows;  break;
      default : ;
    }

    setPageTitle ( __current_folder );

    var archive_folder = (__current_folder.type==folder_type.archived) ||
                         (__current_folder.type==folder_type.cloud_archive);

    self.tablesort_tbl = new TableSort();
    var tbs_headers = [];
    if (archive_folder)
      tbs_headers = ['Archive ID'];
    self.tablesort_tbl.setHeaders ( tbs_headers.concat([
      'ID','Name',
      '<center>R<sub>free</sub></center>',
      '<center>Disk<br>(MBytes)</center>',
      '<center>CPU<br>(hours)</center>',
      '<center>Date<br>Created</center>',
      '<center>Last<br>Opened</center>'
    ]));

    panel.setWidget ( self.tablesort_tbl,table_row,0,1,nCols );

    var message = '<div style="width:100%;color:darkgrey">&nbsp;<p>&nbsp;<p><h3>' +
                  'There are no projects in folder "' +
                  folderPathTitle(__current_folder,__login_id,1000) + '".' +
                  '<p>Use "Add" button to create a new Project' +
                  ';<br>"Import" button for importing a project exported from ' +
                    appName() +
                  ';<br>"Join" button for joining project shared with you by ' +
                  'another user;<br>or "Tutorials" button for loading ' +
                  'tutorial/demo projects;<br>or click on page title or folder ' +
                  'icon in it to change the folder.</h3></div>';
    self.welcome_lbl = panel.setLabel ( message, //.fontcolor('darkgrey'),
                                   table_row+1,0,1,nCols )
                       .setFontItalic ( true )
                       .setNoWrap();
    panel.setHorizontalAlignment ( table_row+1,0,"center" );

    var addLbl   = 'Add';
    var addIcon  = 'add';
    var addWidth = '60pt';
    if (__current_folder.type==folder_type.cloud_archive)  {
      addLbl   = 'Access';
      addIcon  = 'folder_cloud_archive';
      addWidth = '75pt';
    }
    if (tightScreen)
      addWidth = '30pt';
    add_btn.setButton ( addLbl,image_path(addIcon) ).setWidth(addWidth);

    var moveLbl  = '';
    var moveIcon = 'folder_projects';
    if ([folder_type.custom_list,folder_type.shared,folder_type.joined,
          folder_type.all_projects].includes(__current_folder.type))  {
      if (!tightScreen)
        moveLbl = 'Delist';
      moveIcon = 'folder_list_custom_delist';
    } else if (__current_folder.type==folder_type.cloud_archive)  {
      if (!tightScreen)
        moveLbl = 'Delist';
      moveIcon = 'folder_cloud_archive_delist';
    } else if (!tightScreen)
      moveLbl = 'Move';
    move_btn.setButton ( moveLbl,image_path(moveIcon) );

    if (nrows<=0)  {

      __current_project = null;

      var trow = self.tablesort_tbl.addRow();
      if (archive_folder)
        trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      self.tablesort_tbl.createTable ( null );
      open_btn  .setDisabled ( true  );
      add_btn   .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn.setDisabled ( true  );
      clone_btn .setDisabled ( true  );
      move_btn  .setDisabled ( true  );
      del_btn   .setDisabled ( true  );
      import_btn.setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn.setDisabled ( true  );
      join_btn  .setDisabled ( (__dormant!=0) );

    } else  {

      var selectedRow = null;
      nrows = 0;
      // alert ( __current_folder );
      for (var i=0;i<projectList.projects.length;i++)
        if (listProject(projectList.projects[i]))  {

          var trow = self.tablesort_tbl.addRow();

          //contextMenu.setWidth ( '10px' );
          // contextMenu.setHeight_px ( 400 );
          // contextMenu.setZIndex ( 101 );

          var pDesc = projectList.projects[i];
          var pName = pDesc.name;
          if (archive_folder)
            pName = pDesc.archive.project_name;
          // when list of projects is served from FE, shared record is removed
          // in case of owner's login
          var joined = ['','',''];
          var shared_project = false;
          if ('owner' in pDesc)  {
            // if (pDesc.owner.share.length>0)  {
            if (Object.keys(pDesc.share).length>0)  {
              if (pDesc.owner.login!=__login_id)  {
                joined = ['<i>','</i>',"is not included in user\'s quota"];
                pName  = '<b>[<i>' + pDesc.owner.login  + '</i>]:</b>' + pName;
                shared_project = true;
              }
            } else if (('author' in pDesc.owner) && pDesc.owner.author &&
                       (pDesc.owner.author!=pDesc.owner.login) &&
                       (pDesc.owner.author!=__login_id))
              pName  = '<b>(<i>' + pDesc.owner.author + '</i>):</b>' + pName;
          }

          var contextMenu;
          (function(shared_prj){

            var del_label = '';
            if (!tightScreen)  {
              del_label = 'Delete';
              if (shared_prj)
                del_label = 'Unjoin';
            }

            $(trow.element).click(function(){
              del_btn.setText(del_label);
            });

            /*
            var can_move = ((__current_folder.type==folder_type.user) &&
                             __current_folder.path.startsWith(owners_folder)) ||
                           (__current_folder.type==folder_type.tutorials);

            var can_move = ((__current_folder.type==folder_type.user) &&
                            //  __current_folder.path.startsWith(owners_folder)) ||
                             pDesc.folderPath.startsWith(owners_folder)) ||
                           (__current_folder.type==folder_type.tutorials);
            */

            contextMenu = new ContextMenu ( trow,function(){
              del_btn.setText ( del_label );
            });
            contextMenu.addItem('Open',image_path('go')).addOnClickListener(openProject  );
            if (!archive_folder)
              contextMenu.addItem('Rename',image_path('renameprj')).addOnClickListener(renameProject);
            if (!archive_folder)
              contextMenu.addItem(del_label,image_path('remove')).addOnClickListener(deleteProject);
            contextMenu.addItem('Export',image_path('export')  ).addOnClickListener(exportProject);
            if ((!archive_folder) && (__current_folder.type!=folder_type.joined))
              contextMenu.addItem('Share',image_path('share')).addOnClickListener(sharePrj);
            contextMenu.addItem('Clone',image_path('cloneprj')).addOnClickListener(cloneProject );
            if (((__current_folder.type==folder_type.user) &&
                  __current_folder.path.startsWith(owners_folder)) ||
                (__current_folder.type==folder_type.tutorials))
              contextMenu.addItem('Move',image_path('folder_projects') )
                         .addOnClickListener(function(){ browseFolders('move') });
            else if (__current_folder.type==folder_type.custom_list)
              contextMenu.addItem('Delist',image_path('folder_list_custom_delist') )
                         .addOnClickListener(function(){ delistProject(); });
            else if (__current_folder.type==folder_type.cloud_archive)
              contextMenu.addItem('Delist',image_path('folder_cloud_archive_delist') )
                         .addOnClickListener(function(){ delistProject(); });
            if (__is_archive && pDesc.folderPath.startsWith(owners_folder))
              contextMenu.addItem('Archive',image_path('archive')).addOnClickListener(archiveProject);
            // contextMenu.addItem('Repair',image_path('repair')).addOnClickListener(repairProject);

          }(shared_project))

          if (archive_folder)
            trow.addCell ( pDesc.archive.id  ).setNoWrap();
          trow.addCell ( pName  ).setNoWrap();
          trow.addCell ( pDesc.title ).insertWidget ( contextMenu,0 );
          if (('metrics' in pDesc) && ('R_free' in pDesc.metrics)
                                   && (pDesc.metrics.R_free<'1.0'))  {
            var info = '<table class="table-rations">' +
                       '<tr><td colspan="2"><b><i>Best scores (job ' +
                       padDigits(pDesc.metrics.jobId,4) + ')</i></b></td></tr>' +
                       '<tr><td colspan="2"><hr/></td></tr>';
            function add_info ( title,value )  {
              info += '<tr><td>' + title + '</td><td>' + value + '</td></tr>';
            }
            add_info ( 'R-free/R-factor','<b>' + round(pDesc.metrics.R_free,4) +
                       '</b> / ' + round(pDesc.metrics.R_factor,4) );
            add_info ( 'Residues/Units modelled&nbsp;&nbsp;&nbsp;',
                       '<b>' + pDesc.metrics.nRes_Model   + '</b> / ' +
                       '<b>' + pDesc.metrics.nUnits_Model + '</b>' );
            //add_info ( 'R-free'  ,round(pDesc.metrics.R_free,4)   );
            //add_info ( 'R-factor',round(pDesc.metrics.R_factor,4) );
            //add_info ( 'Residues modelled',pDesc.metrics.nRes_Model );
            info += '</table><table class="table-rations">' +
                       '<tr><td colspan="2">&nbsp;<br><b><i>Project data</i></b></td></tr>' +
                       '<tr><td colspan="2"><hr/></td></tr>';
            add_info ( 'Space group',pDesc.metrics.SG       );
            add_info ( 'High resolution&nbsp;&nbsp;&nbsp;',
                       round(pDesc.metrics.res_high,2) + ' &Aring;' );
            if (pDesc.metrics.Solvent>0.0)
              add_info ( 'Solvent content&nbsp;&nbsp;&nbsp;',
                         round(pDesc.metrics.Solvent,1) + '%' );
            if (pDesc.metrics.MolWeight>0.0)
              add_info ( 'ASU Molecular weight',round(pDesc.metrics.MolWeight,1) );
            if (pDesc.metrics.nRes_ASU>0)
              add_info ( 'Residues/Units expected&nbsp;&nbsp;&nbsp;',
                         '<b>' + pDesc.metrics.nRes_ASU   + '</b> / ' +
                         '<b>' + pDesc.metrics.nUnits_ASU + '</b>' );
            if (('ha_type' in pDesc.metrics) && (pDesc.metrics.ha_type.length>0))
              add_info ( 'HA type',pDesc.metrics.ha_type );
            trow.addCell ( pDesc.metrics.R_free ).setNoWrap()
                .setTooltip1(info + '</table>','show',false,20000);
          } else
            trow.addCell ( '' );
          if (pDesc.hasOwnProperty('disk_space'))
                trow.addCell ( joined[0]+round(pDesc.disk_space,1)+joined[1] )
                    .setNoWrap().setTooltip(joined[2]);
          else  trow.addCell ( joined[0]+'-:-'+joined[1] )
                    .setNoWrap().setTooltip(joined[2]);
          if (pDesc.hasOwnProperty('cpu_time'))
                trow.addCell ( joined[0]+round(pDesc.cpu_time,4)+joined[1] )
                    .setNoWrap().setTooltip(joined[2]);
          else  trow.addCell ( joined[0]+'-:-'+joined[1] )
                    .setNoWrap().setTooltip(joined[2]);
          trow.addCell ( pDesc.dateCreated ).setNoWrap().setHorizontalAlignment('center');
          // trow.addCell ( pDesc.dateLastUsed + 'T' + (1000+i) // '<span style="visibility:hidden;font-size:1px;">' + (1000+i) + '</span>'
          trow.addCell ( pDesc.dateLastUsed ).setNoWrap().setHorizontalAlignment('center');
          //tablesort_tbl.addRow ( trow );
          if ((nrows==0) || (pDesc.name==projectList.current))
            selectedRow = trow;
          nrows++;

        }

      self.tablesort_tbl.createTable ( function(){  // onSorted callback
        saveProjectList ( null,null );
      });
      if (projectList.sortList)
        window.setTimeout ( function(){
          self.tablesort_tbl.applySortList ( projectList.sortList,true );
        },10 );
      self.tablesort_tbl.selectRow ( selectedRow );
      selectedRow.click();  // just sets the Delete/Unjoin button label
      open_btn  .setDisabled ( false );
      add_btn   .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn.setDisabled ( archive_folder );
      clone_btn .setDisabled ( false );
      move_btn  .setEnabled  ( __current_folder.path.startsWith(owners_folder) ||
          [folder_type.tutorials,folder_type.custom_list,folder_type.cloud_archive]
          .includes(__current_folder.type) );
      // del_btn   .setDisabled ( (__current_folder.type==folder_type.archived)  );
      del_btn   .setDisabled ( archive_folder  );
      import_btn.setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn.setDisabled ( false );
      join_btn  .setDisabled ( (__dormant!=0) );

      self.welcome_lbl.hide();

    }

    self.tablesort_tbl.setHeaderNoWrap   ( -1      );
    var colNo = 0;
    if (archive_folder)
      self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'70%' );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( colNo++,'5%'  );

    self.tablesort_tbl.setHeaderFontSize ( '100%' );
    self.onResize ( window.innerWidth,window.innerHeight );

    self.tablesort_tbl.addSignalHandler ( 'row_dblclick',function(trow){
      openProject();
    });

    // self.tablesort_tbl.addSignalHandler ( 'row_click',function(trow){
    //   __close_all_menus();
    // });

  }

  function loadProjectList()  {
    //  Read list of projects from server
    serverRequest ( fe_reqtype.getProjectList,0,'Project List',function(data){
// printFolders ( data );
      projectList = jQuery.extend ( true, new ProjectList(__login_id),data );
// printFolders ( projectList );
      makeProjectListTable();
    },null,'persist');
  }

  this.loadProjectList1 = function()  {
    loadProjectList();
    self.getUserRation();
  }

  function browseFolders ( funcKey )  {
    // console.log ( projectList.folders );
    var title = 'Select project folder';
    if (funcKey!='select')  {
      if (isCurrentProjectShared())  {
        new MessageBox ( 'Cannot move a shared project',
              '<h2>Cannot move a shared project</h2>' +
              'The currently selected project cannot be moved into<br>' +
              'another project folder because it is shared with other<br>' +
              'user(s).',
              'msg_stop' );
        return;
      }
      title = 'Move project to folder';
    }
    var pDesc = getCurrentProjectDesc();
    new FoldersBrowser ( title,projectList,__current_folder,pDesc,funcKey,

      function ( key,data ){
      
        switch (key)  {
      
          case 'delete' :
          case 'select' : if (!projectList.setCurrentFolder(
                                  projectList.findFolder(data.folder_path)))  {
                            new MessageBox (
                                'Error',
                                '<h2>Error</h2>Selected folder:<p><i>"' +
                                data.folder_path + '</i>"<p>not found (1).',
                                'msg_error'
                            );
                          } else if (data.folder_type==folder_type.custom_list)  {
                            projectList.removeProjectLabel ( __login_id,data.folder_name );
                          }
                          // projectList.resetFolders ( __login_id );
                          saveProjectList ( function(rdata){
                            // loadProjectList();
                            makeProjectListTable();
                          },null );
                      break;
      
          case 'add'    : projectList.resetFolders ( __login_id );
                          saveProjectList ( function(rdata){
                            // loadProjectList();
                            // makeProjectListTable();
                          },null );
                      break;

          case 'move'   : if (pDesc)  {
                            if (!projectList.setCurrentFolder(
                                    projectList.findFolder(data.folder_path)))  {
                              new MessageBox (
                                  'Error',
                                  '<h2>Error</h2>Selected folder:<p><i>"' +
                                  data.folder_path + '</i>"<p>not found (2).',
                                  'msg_error'
                                );
                            // } else if ((data.folder_path==folder_path.archived) ||
                            //            (data.folder_path==folder_path.cloud_archive))  { 
                            //   new ProjectArchiveDialog ( pDesc,function(){} );
                            } else  {
                              if (projectList.currentFolder.type==folder_type.custom_list)
                                    addProjectLabel ( __login_id,pDesc,data.folder_path );
                              else  pDesc.folderPath = data.folder_path;
                              projectList.resetFolders ( __login_id );
                              saveProjectList ( function(rdata){
                                // loadProjectList();
                                makeProjectListTable();
                              },null );
                            }
                          }
                      break;

          case 'rename' : if (data.folder_path==__current_folder.path)  {
                            var renFolder = projectList.findFolder ( data.rename_path );
                            setPageTitle ( renFolder );
                            if (!projectList.setCurrentFolder(renFolder))
                              new MessageBox (
                                  'Error',
                                  '<h2>Error</h2>Selected folder:<p><i>"' +
                                  data.rename + '</i>"<p>not found (2).',
                                  'msg_error'
                                );
                            __current_folder = projectList.currentFolder;
                          }
                          for (var i=0;i<projectList.projects.length;i++)
                            if (startsWith(projectList.projects[i].folderPath,data.folder))
                              projectList.projects[i].folderPath =
                                projectList.projects[i].folderPath.replace (
                                  data.folder_path,data.rename
                                );
                          projectList.resetFolders ( __login_id );
                          saveProjectList ( function(rdata){
                            // loadProjectList();
                            makeProjectListTable();
                          },null );
                      break;
          
          case 'cancel' : projectList.resetFolders ( __login_id );
                      break;
          
          default       : new MessageBox ( 'Unknown action key',
                              '<h2>Unknown action key</h2>' +
                              'This is likely to be a program error. ' +
                              'Please report code PPL-BF-001 to developers.',
                              'msg_error' );
        
        }

      });

  }

  this.makeHeader ( 3,null );

  this.headerPanel.setCellSize ( '30%','',0,2 );
  folder_btn = new ImageButton ( image_path('folder_projects'),'34px','34px' )
                  .setTooltip ( 'Browse project folders' )
                  .setVisible ( false );
                  // .setSize ( '28pt','26pt' );
                  // .setWidth ( '28pt' ).setHeight ( '24pt' );
  this.headerPanel.setWidget ( folder_btn,0,3,1,1 );
  this.headerPanel.setVerticalAlignment ( 0,3,'middle' );
  this.headerPanel.setHorizontalAlignment ( 0,3,'right' );

  pageTitle_lbl = this.headerPanel
                  .setLabel   ( '&nbsp;My Projects',0,4,1,1 )
                  .setFont    ( 'times','200%',true,true )
                  .setNoWrap  ()
                  .setVisible ( false );
                  // .setHorizontalAlignment ( 'center' );
  this.headerPanel.setCellSize ( '60%','',0,4 );
  this.headerPanel.setVerticalAlignment ( 0,4,'middle' );
  this.headerPanel.setHorizontalAlignment ( 0,4,'left' );

  folder_btn.addOnClickListener ( function(){
    browseFolders ( 'select' );
  });
  pageTitle_lbl.addOnClickListener ( function(){
    browseFolders ( 'select' );
  });

  // Make Main Menu
  this.addMenuItem ( 'Change project folder','folder_projects',function(){
    browseFolders ( 'select' );
  });
  // this.addMenuSeparator();

  var accLbl = 'My Account';
  if (__local_user)
    accLbl = 'Settings';
  this.addMenuItem ( accLbl,'settings',function(){
    saveProjectList ( function(data){ makeAccountPage(sceneId); },null );
  });

  if (__user_role==role_code.admin)
    this.addMenuItem ( 'Admin Page',role_code.admin,function(){
      saveProjectList ( function(data){ makeAdminPage(sceneId); },null );
    });

  if ((__user_role==role_code.developer) || (__user_role==role_code.admin))  {
    this.addMenuSeparator();
    if (__jobs_safe)
      this.addMenuItem ( 'Failed Tasks Safe','development',function(){
        new ExportFromSafeDialog ( function(){} );
      });
    this.addMenuItem ( 'Developer\'s Documentation','development',function(){
      new HelpBox ( '',__dev_reference_base_url + 'index.html',null )
    });
  }

  this.addLogoutToMenu ( function(){
    saveProjectList ( function(data){ logout(sceneId,0); },null );
  });

  // var btn_width    = '30pt';
  var btn_width    = [];
  var btn_height   = '26pt';
  var left_margin  = '18pt';
  var right_margin = '28pt';

  //alert ( window.screen.width + '  ' + window.devicePixelRatio );

  if (tightScreen)  {  // 720 pt to px
    // tight screen (smartphone)

    left_margin  = '2pt';
    right_margin = '22pt';

    open_btn    = new Button ( '',image_path('go'       ) );
    add_btn     = new Button ( '',image_path('add'      ) );
    rename_btn  = new Button ( '',image_path('renameprj') );
    clone_btn   = new Button ( '',image_path('cloneprj' ) );
    move_btn    = new Button ( '',image_path('folder_projects'));
    del_btn     = new Button ( '',image_path('remove'   ) );
    export_btn  = new Button ( '',image_path('export'   ) );
    import_btn  = new Button ( '',image_path('import'   ) );
    join_btn    = new Button ( '',image_path('join'     ) );
    // if (__demo_projects)  {
    //   demoprj_btn = new Button ( '',image_path('demoprj') );
    //   btn_width.push ( '30pt' );
    //   demoprj_btn.setWidth ( btn_width[0] ).setHeight ( btn_height );
    // }
    demoprj_btn = new Button ( '',image_path('demoprj') );
    help_btn    = new Button ( '',image_path('help') ); //.setTooltip('Documentation' );


    // for (var i=0;i<9;i++)
    for (var i=0;i<11;i++)
      btn_width.push ( '30pt' );

  } else  {

    open_btn    = new Button ( 'Open'  ,image_path('go'       ) );
    add_btn     = new Button ( 'Add'   ,image_path('add'      ) );
    rename_btn  = new Button ( 'Rename',image_path('renameprj') );
    clone_btn   = new Button ( 'Clone' ,image_path('cloneprj' ) );
    move_btn    = new Button ( 'Move'  ,image_path('folder_projects'));
    del_btn     = new Button ( 'Delete',image_path('remove'   ) );
    export_btn  = new Button ( 'Export',image_path('export'   ) );
    import_btn  = new Button ( 'Import',image_path('import'   ) );
    join_btn    = new Button ( 'Join'  ,image_path('join'     ) );
    demoprj_btn = new Button ( 'Tutorials',image_path('demoprj') );
    help_btn    = new Button ( 'Help'  ,image_path('help') ); //.setTooltip('Documentation' );
    btn_width = [
      '65pt',
      '60pt',
      '80pt',
      '70pt',
      '65pt',
      '70pt',
      '70pt',
      '70pt',
      '60pt',
      '80pt',
      '60pt'
    ];

    // btn_width = [
    //   '65pt',
    //   '60pt',
    //   '80pt',
    //   '70pt',
    //   '70pt',
    //   '70pt',
    //   '70pt',
    //   '60pt',
    // ];
    //
    // if (__demo_projects)  {
    //   demoprj_btn = new Button ( 'Tutorials',image_path('demoprj') );
    //   btn_width.push ( '80pt' );
    //   demoprj_btn.setWidth ('80pt').setHeight(btn_height).setNoWrap();
    // }
    // help_btn   = new Button ( 'Help',image_path('help') ); //.setTooltip('Documentation' );
    // btn_width.push ( '60pt' );

  }

  open_btn   .setWidth ( btn_width[0] ).setHeight ( btn_height );
  add_btn    .setWidth ( btn_width[1] ).setHeight ( btn_height );
  rename_btn .setWidth ( btn_width[2] ).setHeight ( btn_height );
  clone_btn  .setWidth ( btn_width[3] ).setHeight ( btn_height );
  move_btn   .setWidth ( btn_width[4] ).setHeight ( btn_height );
  del_btn    .setWidth ( btn_width[5] ).setHeight ( btn_height );
  export_btn .setWidth ( btn_width[6] ).setHeight ( btn_height );
  import_btn .setWidth ( btn_width[7] ).setHeight ( btn_height );
  join_btn   .setWidth ( btn_width[8] ).setHeight ( btn_height );
  demoprj_btn.setWidth ( btn_width[9] ).setHeight ( btn_height );
  help_btn   .setWidth ( btn_width[10]).setHeight ( btn_height );

  // make panel
  panel = new Grid('');
  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( left_margin ,''    ,1,0,1,1 );
  this.grid.setWidget   ( panel              ,1,1,1,1 );
  this.grid.setCellSize ( right_margin,'100%',1,2,1,1 );

//  panel.setVerticalAlignment ( 1,0,'top' );
  panel.setVerticalAlignment ( 1,1,'middle' );

  this.makeLogoPanel ( 2,0,3 );

  var row = 0;
  panel.setHorizontalAlignment ( row,0,'center'    );
  panel.setCellSize            ( '','10pt'  ,row++,0    );
  nCols = 0;
  panel.setWidget              ( open_btn   ,row,nCols++,1,1 );
  panel.setWidget              ( add_btn    ,row,nCols++,1,1 );
  panel.setWidget              ( rename_btn ,row,nCols++,1,1 );
  panel.setWidget              ( clone_btn  ,row,nCols++,1,1 );
  panel.setWidget              ( move_btn   ,row,nCols++,1,1 );
  panel.setWidget              ( del_btn    ,row,nCols++,1,1 );
  panel.setWidget              ( export_btn ,row,nCols++,1,1 );
  panel.setWidget              ( import_btn ,row,nCols++,1,1 );
  panel.setWidget              ( join_btn   ,row,nCols++,1,1 );
  // if (demoprj_btn)
  panel.setWidget              ( demoprj_btn,row,nCols++,1,1 );
  panel.setWidget              ( help_btn   ,row,nCols++,1,1  );

  for (var i=0;i<nCols-1;i++)
    panel.setCellSize ( btn_width[i],'',row,i );
  panel.setCellSize            ( 'auto','',row++,nCols-1 );

  open_btn  .setDisabled       ( true );
  add_btn   .setDisabled       ( true );
  rename_btn.setDisabled       ( true );
  clone_btn .setDisabled       ( true );
  move_btn  .setDisabled       ( true );
  del_btn   .setDisabled       ( true );
  import_btn.setDisabled       ( true );
  table_row = row;  // note the project list table position here

  // add a listeners to toolbar buttons
  open_btn  .addOnClickListener ( openProject   );
  add_btn   .addOnClickListener ( addProject    );
  rename_btn.addOnClickListener ( renameProject );
  clone_btn .addOnClickListener ( cloneProject  );
  move_btn  .addOnClickListener ( function(){
    if ((__current_folder.type==folder_type.custom_list) ||
        (__current_folder.type==folder_type.cloud_archive))
          delistProject();
    else  browseFolders('move');
  });
  del_btn   .addOnClickListener ( deleteProject );
  export_btn.addOnClickListener ( exportProject );

  // add a listener to 'import' button
  import_btn.addOnClickListener ( function(){
    new ImportProjectDialog ( self.loadProjectList1 );
  });

  // add a listener to 'import' button
  join_btn.addOnClickListener ( function(){
    new ImportSharedProjectDialog ( self.loadProjectList1 );
  });

  // add a listener to 'demo project' button
  // if (demoprj_btn)
  //   demoprj_btn.addOnClickListener ( function(){
  //     // new ImportDemoProjectDialog ( self.loadProjectList1 );
  //     (function(self){
  //       self.currentCloudPath = __demo_projects;
  //       new CloudFileBrowser ( null,self,5,[],function(items){
  //         serverRequest ( fe_reqtype.startDemoImport,{
  //                           'cloudpath' : self.currentCloudPath,
  //                           'demoprj'   : items[0]
  //                         },'Demo Project Import',function(data){
  //                           new ImportDemoProjectDialog ( self.loadProjectList1 );
  //                         });
  //         return 1;  // do close browser window
  //       });
  //     }(this))
  //   });

  (function(self){
    demoprj_btn.addOnClickListener ( function(){
      if (__demo_projects)  {
        self.currentCloudPath = __demo_projects;
        new CloudFileBrowser ( null,self,5,[],function(items){
          serverRequest ( fe_reqtype.startDemoImport,{
                            'cloudpath' : self.currentCloudPath,
                            'demoprj'   : items[0]
                          },'Tutorial/Demo Project Import',function(data){
                            new ImportDemoProjectDialog ( self.loadProjectList1 );
                          });
          return 1;  // do close browser window
        });
      } else  {
        new MessageBox (
          'Tutorials/Demo not installed',
          '<div style="width:450px">' +
          '<h3>Tutorials package is not installed</h3>' +
          'See installation instructions in CCP4 Download Pages or contact your ' +
          appName() + ' maintainer.' +
          '</div>','msg_excl_yellow'
        );
      }
    });
  }(this))

  help_btn.addOnClickListener ( function(){
    //new HelpBox ( '','./html/jscofe_myprojects.html',null );
    new HelpBox ( '',__user_guide_base_url + 'jscofe_myprojects.html',null );
  });

  //launchHelpBox ( '','./html/jscofe_myprojects.html',doNotShowAgain,1000 );

  //  Read list of projects from server in new thread, so that all widgets
  // are initialised
  window.setTimeout ( function(){
    loadProjectList();
    offlineGreeting ( function(){} );
    // new MessageBox ( 'Information','<h3>Information</h3>This is information',
    //                  'msg_information' );
  },10);

}

ProjectListPage.prototype = Object.create ( BasePage.prototype );
ProjectListPage.prototype.constructor = ProjectListPage;

ProjectListPage.prototype.onResize = function ( width,height )  {
//  var h = (height - 164) + 'px';
//  this.tablesort_tbl.table_div.element.style.height = h;
  if (this.tablesort_tbl)  {
    this.tablesort_tbl.fixHeader();
    if (this.welcome_lbl && (!this.welcome_lbl.isVisible()))
      this.tablesort_tbl.setTableHeight ( height-72 );
  }
}

ProjectListPage.prototype.reloadProjectList = function()  {
  this.loadProjectList1();
}

ProjectListPage.prototype.loadProject = function ( prjName )  {
  this._open_project ( prjName );
}

function makeProjectListPage ( sceneId )  {
  makePage ( new ProjectListPage(sceneId) );
  setHistoryState ( 'ProjectListPage' );
}
