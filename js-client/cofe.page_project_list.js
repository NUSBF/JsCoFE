
/*
 *  =================================================================
 *
 *    06.03.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2025
 *
 *  =================================================================
 *
 */

'use strict';

/*
http://tablesorter.com/docs/#Introduction  seems like fraud web page
https://mottie.github.io/tablesorter/docs/example-widget-filter-custom.html

https://mottie.github.io/tablesorter/docs/example-css-highlighting.html

*/

// -------------------------------------------------------------------------
// projects page class

function ProjectListPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectListPage' );

  // set scrollbars 
  // $(this.grid.element).css ({ 
  //   'height' : 'calc(100vh - 32px)'
  //   // 'overflow-x' : 'hidden',
  //   // 'overflow-y' : 'auto'
  // });
  $(this.element).css({ 
    // 'width'      : '100%',
    // // 'height'     : '100vh',
    // // 'padding-bottom' : '32px',
    // // 'scrollbar-padding-bottom' : '34px',
    // 'height'     : 'calc(100vh - 32px)',
    'overflow-x' : 'auto',
    'overflow-y' : 'auto'
  });  

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  let projectList    = new ProjectList(__login_id);  // project list data
  this.projectTable  = null;                         // project list table
  let folder_btn     = null;
  let open_btn       = null;
  let add_btn        = null;
  let rename_btn     = null;
  let clone_btn      = null;
  let move_btn       = null;
  let del_btn        = null;
  let export_btn     = null;
  let import_btn     = null;
  let demoprj_btn    = null;
  let join_btn       = null;
  let help_btn       = null;
  let search_btn     = null;
  let search_dlg     = null;
  let panel          = null;
  // this.welcome_lbl   = null;
  let nCols          = 0;                  // column span of project table
  let table_row      = 0;                  // project list position in panel
  let sortCol        = 7;                  // sort column in the list of projects
  let self           = this;               // for reference to Base class
  let pageTitle_lbl  = null;

  let owners_folder  = __login_id + '\'s Projects';

  let tightScreen = (Math.max(window.screen.width,window.screen.height)<720*4/3);

  function getProjectName ( displayName )  {
    return strip_html_tags ( displayName.split(':</b>').pop() );
  }

  function currentProjectName()  {
    if (__current_folder.nprojects>0)  {
      let rowData = self.projectTable.getSelectedRowData();
      if (rowData)
        return getProjectName ( rowData[1] );
        // return rowData[1].split(':</b>').pop().replace(/<[^>]*>/g,'');
          // return self.tablesort_tbl.selectedRow.child[0].text.split(':</b>').pop();
    }
    return '';
  }

  function getCurrentProjectDesc()  {
    let pdesc = null;
    if (__current_folder.nprojects>0)  {
      let pname = currentProjectName();
      for (let i=0;(i<projectList.projects.length) && (!pdesc);i++)
        if (projectList.projects[i].name==pname)
          pdesc = projectList.projects[i];
    }
    return pdesc;
  }

  function getCurrentProjectNo()  {
    let pno = -1;
    if (__current_folder.nprojects>0)  {
      let pname = currentProjectName();
      for (let i=0;(i<projectList.projects.length) && (pno<0);i++)
        if (projectList.projects[i].name==pname)
          pno = i;
    }
    return pno;
  }

  function isCurrentProjectShared()  {
    let pdesc = getCurrentProjectDesc();
    if (pdesc)
      return (Object.keys(pdesc.share).length>0);
    return false;
  }

  function isCurrentProjectAuthored ( check_author )  {
    let pdesc = getCurrentProjectDesc();
    if (pdesc)  {
      if (check_author)
            return (getProjectAuthor(pdesc)==__login_id);
      else  return (pdesc.owner.login==__login_id);
    }
    return false;
  }

  function isCurrentFolderList()  {
    switch (__current_folder.type)  {
      case folder_type.custom_list   :
      case folder_type.list          :
      case folder_type.shared        :
      case folder_type.joined        : 
      case folder_type.all_projects  : return true;
      default : ;
    }
    return false;
  }

  function setPageTitle ( folder )  {
    if (pageTitle_lbl)  {
      pageTitle_lbl.setText ( '&nbsp;' + folderPathTitle(folder,__login_id,50) );
      pageTitle_lbl.setFont ( 'times','200%',true,true);
      pageTitle_lbl.setVisible ( true );
      pageTitle_lbl.setCursor  ( 'pointer' );
    }
    if (folder_btn)  {
      let icon = 'folder_projects';
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
      folder_btn.setImage   ( image_path(icon) );
      folder_btn.setVisible ( true );
      folder_btn.setCursor  ( 'pointer' );
    }
  }

  // function to save Project List
  function saveProjectList ( onDone_func,crProjectName )  {

    if (crProjectName)
          projectList.current = crProjectName;
    else  projectList.current = '';
    
    if (self.projectTable.table.selectedRow)  {
      if (!crProjectName)
        projectList.current = currentProjectName();
      for (let i=0;i<projectList.projects.length;i++)  {
        let pDesc = projectList.projects[i];
        if (pDesc.name==projectList.current)  {
          pDesc.dateLastUsed = getDateString();
          break;
        }
      }

    }
    
    // projectList.sortList = self.tablesort_tbl.getSortList();
    projectList.listState = self.projectTable.getTableState();
    serverRequest ( fe_reqtype.saveProjectList,projectList,'Project List',
      function(data){
        if (onDone_func)
          onDone_func ( data );
        self.updateUserRationDisplay ( data );
      },null,'persist' );
  
  }

  // function to open selected Project
  let openProject = function ( pspecs=null ) {
    saveProjectList ( function(data){ makeProjectPage(sceneId,pspecs); },null );
  }

  this._open_project = function ( prjName )  {
    saveProjectList ( function(data){ makeProjectPage(sceneId); },prjName );
  }

  let _add_project = function() {
    new AddProjectDialog ( projectList,function(pspecs){
      if (pspecs)  {
        if (projectList.addProject(pspecs.id,pspecs.title,getDateString()))  {
          projectList.current   = pspecs.id;
          // projectList.startmode = pspecs.startmode;
          makeProjectListTable();
          openProject ( pspecs );
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

  let archiveProject = function()  {
    let pDesc = getCurrentProjectDesc();
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

  let addProject = function()  {
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
  let renameProject = function() {

    if ((__current_folder.type==folder_type.archived) ||
        (__current_folder.type==folder_type.cloud_archive))  {

      new MessageBox ( 'Rename Project',
        '<div style="width:400px"><h2>Projects in this folder cannot be renamed</h2>' +
        'You may rename only your own projects, which were not shared with ' +
        'other users and were not archived.</div>','msg_stop' );

    } else  {

      panel.click();  // get rid of context menu

      if (isCurrentProjectShared())  {
        let msg = '<div style="width:450px"><h2>Rename Project</h2>';
        if (isCurrentProjectAuthored(true))
              msg += 'You cannot rename this project because you shared it with other ' +
                     'users.<p>Shared projects cannot be renamed until they are unshared.';
        else  msg += 'You cannot rename this project because it was shared with you.' +
                     '<p>Joined projects cannot be renamed.';
        new MessageBox ( 'Rename Project',msg,'msg_stop' );
        return;
      }

      let pDesc = getCurrentProjectDesc();
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

      let prjName   = pDesc.name;
      let inputBox  = new InputBox ( 'Rename Project' );
      inputBox.setText ( '','renameprj' );
      let ibx_grid = inputBox.grid;
      ibx_grid.setLabel    ( '<h2>Rename Project "' + prjName + '"</h2>',0,2,2,3 );
      ibx_grid.setLabel    ( 'New ID:',2,3,1,1 );
      let name_inp  = ibx_grid.setInputText ( prjName,2,4,1,1 )
            .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
            .setFontItalic ( true )
            .setWidth      ( '240px' );
      ibx_grid.setLabel    ( 'New Name:&nbsp;',3,3,1,1 );
      let title_inp = ibx_grid.setInputText ( pDesc.title,3,4,1,1 )
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
                'numbers, underscores, dashes and dots, and must start ' +
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
          let new_name = name_inp.getValue();
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

  let deleteProject = function()  {

    panel.click();  // get rid of context menu
    
    if (isCurrentProjectShared())  {
      let msg = '<div style="width:450px"><h2>Delete Project</h2>';
      if (isCurrentProjectAuthored(true))  {
        msg += 'This project cannot be deleted because it is shared with other ' +
               'users.<p>Use "Work Team" dialog (right-click on project line) ' +
               'to unshare project before deletion.';
        new MessageBox ( 'Delete Project',msg,'msg_stop' );
        return;
      }
    }

    let delName    = currentProjectName();
    let delMessage = '';
    let btnName    = 'Yes, delete';
    let dlgTitle   = 'Delete Project';
    if (isCurrentProjectAuthored(false))  {
      delMessage = '<h2>Delete Project</h2>' +
                   'Project <b>"' + delName +
                   '"</b> will be deleted. All project ' +
                   'structure and data will be lost.'    +
                   '<p>Please confirm your choice.';
    } else  {
      delMessage = '<h2>Unjoin Project</h2>' +
                   'Project <b>"' + delName  + '"</b>, shared with you, ' +
                   'will be unjoined, and you will be no longer ' +
                   'able to access it until joined again.'        +
                   '<p>Please confirm your choice.';
      btnName    = 'Please unjoin';
      dlgTitle   = 'Unjoin Project';
    }

    let inputBox = new InputBox ( dlgTitle );
    inputBox.setText ( '<div style="width:400px;">' + delMessage + '</div>',
                       'msg_confirm' );
    inputBox.launch  ( btnName,function(){
      serverRequest ( fe_reqtype.deleteProject,delName,dlgTitle,
        function(data){
          self.loadProjectList1();
        },null,'persist' );
      return true;  // close dialog
    });

  }

  let exportProject = function() {
    panel.click();  // get rid of context menu
    if (self.projectTable.table.selectedRow)  {
      projectList.current = currentProjectName();
      new ExportProjectDialog ( projectList );
    } else
      new MessageBox ( 'No project selected',
                       '<h2>No project is selected<h2>' +
                       'This is likely to be a program error. ' +
                       'Select project and try again.',
                       'msg_error' );
  }

  let prjWorkTeam = function()  {
    panel.click();  // get rid of context menu
    let pno = getCurrentProjectNo();
    if (pno>=0)  {
      new WorkTeamDialog ( projectList.projects[pno] );
    } else
      new MessageBox ( 'No Project',
                       '<h2>No Project is selected<h2>' +
                       'This is likely to be a program error. ' +
                       'Select project and try again.',
                       'msg_error' );
  }

  let cloneProject = function()  {
    panel.click();  // get rid of context menu

    let pDesc = getCurrentProjectDesc();
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

    let prjName  = pDesc.name;
    let inputBox = new InputBox ( 'Clone Project' );
    inputBox.setText ( '','cloneprj' );
    let ibx_grid = inputBox.grid;
    ibx_grid.setLabel ( '<h2>Clone Project "' + prjName + '"</h2>',0,2,2,3 );
    ibx_grid.setLabel ( 'Cloned Project ID:',2,3,1,1 );
    let name_sugg  = prjName + '-clone';
    // let title_sugg = self.tablesort_tbl.selectedRow.child[1].text.trim();
    let title_sugg = pDesc.title;
    if (pDesc.archive)  {
      name_sugg  = prjName + '-rev' + pDesc.archive.version;
      title_sugg = title_sugg.split(': Revision #')[0] + ': Revision #' +
                   pDesc.archive.version;
    } else
      title_sugg += ' (cloned)';
    let name_inp  = ibx_grid.setInputText ( name_sugg,2,4,1,1 )
          .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
          .setFontItalic ( true )
          .setWidth      ( '240px' )
          .setReadOnly   ( (pDesc.archive!=null) );
    ibx_grid.setLabel    ( 'Cloned Project Name:&nbsp;',3,3,1,1 );
    let title_inp = ibx_grid.setInputText ( title_sugg,3,4,1,1 )
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
      let new_name = name_inp.getValue();
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

          let grid = new Grid('');
          dlg.addWidget ( grid );
          grid.setLabel ( '<h3>Cloning project in progress, please wait ...</h3>',0,0,1,3 );
          let progressBar = new ProgressBar ( 0 );
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

  let repairProject = function()  {
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

  let delistProject = function()  {
    panel.click();  // get rid of context menu

    let pDesc = getCurrentProjectDesc();
    if (!pDesc)  {
      new MessageBox ( 'Current project not identified',
          '<h2>Current project is not identified</h2>' +
          '<i>This is a bug please report to developers.</i>',
          'msg_error'
      );
      return false;
    }

    let inputBox = new InputBox ( 'Delist project' );
    
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
    // returns true if project should be included in the list
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


  // function selectRow()  {
  //   let selRow = -1;  // find if a row needs to be selected
  //   if (projectList.current)  {
  //     let pte = self.projectTable.table.element; 
  //     for (let i=1;(i<pte.rows.length) && (selRow<0);i++)
  //       if (pte.rows[i].cells[1].innerHTML.split(':</b>').pop()==projectList.current)
  //         selRow = i;
  //     if (selRow>0)
  //       self.projectTable.selectRow ( selRow,1 );
  //   }
  //   return selRow;
  // }


  // function to create project list table and fill it with data
  function makeProjectListTable()  {

    if (__current_folder.nprojects>=0)  // works first time after login
          __current_folder = projectList.currentFolder;
    else  projectList.currentFolder = __current_folder;

    let archive_folder = (__current_folder.type==folder_type.archived) ||
                         (__current_folder.type==folder_type.cloud_archive);

    let selRow = -1;  // no selection in the page if <0

    function enableToolbarButtons()  {
      if (projectList.current)  {
        selRow = -1;  // no selection in the page if <0
        let pte = self.projectTable.table.element; 
        for (let i=1;(i<pte.rows.length) && (selRow<0);i++)  {
          let pname = pte.rows[i].cells[1].innerHTML.toString();
          if (getProjectName(pname)==projectList.current)  {
            selRow = i;
            if (!tightScreen)  {
              if (pname.indexOf('[')>=0)  del_btn.setText ( 'Unjoin' );
                                    else  del_btn.setText ( 'Delete' );
            }
          }
        }
        if (selRow>0)
          self.projectTable.selectRow ( selRow,1 );
      }
      if (selRow>=0)  {
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
        join_btn  .setDisabled ( (__dormant!=0) || __local_user );
      } else  {
        open_btn  .setDisabled ( true  );
        add_btn   .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
        rename_btn.setDisabled ( true  );
        clone_btn .setDisabled ( true  );
        move_btn  .setDisabled ( true  );
        del_btn   .setDisabled ( true  );
        import_btn.setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
        export_btn.setDisabled ( true  );
        join_btn  .setDisabled ( (__dormant!=0) || __local_user );
      }
    }

    function setContextMenu()  {

      self.projectTable.setContextMenu ( function(rowNo,row_element,rowData){

        let pDesc = rowData[rowData.length-1];

        let del_label = '';
        if (!tightScreen)  {
          del_label = 'Delete';
          if (row_element.cells[1].innerHTML.toString().indexOf('[')>=0)  
            del_label = 'Unjoin';
        }

        let contextMenu = new ContextMenu ( row_element,function(){
          self.projectTable.selectRow ( rowNo,1 );
          del_btn.setText ( del_label );
        });

        contextMenu.addItem('Open',image_path('go')).addOnClickListener(openProject  );
        if (!archive_folder)
          contextMenu.addItem('Rename',image_path('renameprj')).addOnClickListener(renameProject);
        if (!archive_folder)
          contextMenu.addItem(del_label,image_path('remove')).addOnClickListener(deleteProject);
        contextMenu.addItem('Export',image_path('export')  ).addOnClickListener(exportProject);
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
        if ((!archive_folder) && (__current_folder.type!=folder_type.joined) &&
            (!__local_user))
          contextMenu.addItem('Work team',image_path('workteam')).addOnClickListener(prjWorkTeam);
        if (__is_archive && pDesc.folderPath.startsWith(owners_folder))
          contextMenu.addItem('Archive',image_path('archive')).addOnClickListener(archiveProject);

        return contextMenu;

      });

    }

    let tdesc = {
      columns : [   
        { header  : '##',
          hstyle  : { 'text-align' : 'right' },
          tooltip : 'Project number',
          style   : { 'text-align' : 'right', 'width' : '30px', 'white-space' : 'nowrap' },
          sort    : true
        },
        { header  : 'ID',
          hstyle  : { 'text-align' : 'left' },
          tooltip : 'Project ID',
          style   : { 'text-align' : 'left', 'width' : '60px', 'white-space' : 'nowrap' },
          sort    : true
        },
        { header  : 'Name',
          hstyle  : { 'text-align' : 'left' },
          tooltip : 'Project name',
          style   : { 'text-align' : 'left', 'width' : 'auto' },
          sort    : true
        },
        { header  : 'R<sub>free</sub>',
          hstyle  : { 'text-align' : 'center' },
          tooltip : 'Best R<sub>free</sub> factor achieved in the project',
          style   : { 'text-align' : 'right', 'width' : '50px', 'white-space' : 'nowrap' },
          sort    : true
        },
        { header  : 'Disk<br>(MBytes)',
          hstyle  : { 'text-align' : 'center' },
          tooltip : 'Disk space occupied by the project',
          style   : { 'text-align' : 'right', 'width' : '50px', 'white-space' : 'nowrap' },
          sort    : false
        },
        { header  : 'CPU<br>(hours)',
          hstyle  : { 'text-align' : 'center' },
          tooltip : 'CPU time consumed by the project',
          style   : { 'text-align' : 'right', 'width' : '50px', 'white-space' : 'nowrap' },
          sort    : false
        },
        { header  : 'Date<br>Created',
          hstyle  : { 'text-align' : 'center' },
          tooltip : 'Date when project was created',
          style   : { 'text-align' : 'center', 'width' : '80px', 'white-space' : 'nowrap' },
          sort    : false
        },
        { header  : 'Last<br>Opened',
          hstyle  : { 'text-align' : 'center' },
          tooltip : 'Date when project was last opened',
          style   : { 'text-align' : 'center', 'width' : '80px', 'white-space' : 'nowrap' },
          sort    : false
        }
      ],
      rows        : [],
      vheaders    : 'row',
      style       : { 'cursor'      : 'pointer',                      
                      'font-family' : 'Arial, Helvetica, sans-serif'
                    },
      sortCol     : sortCol,
      mouse_hover : true,
      page_size   : self.calcPageSize(),  // 0 for no pages
      start_page  : 1,
      onclick     : function(rowData){
                      projectList.current = getProjectName ( rowData[0] );
                      let pDesc = rowData[rowData.length-1];
                      if (('owner' in pDesc) && 
                          (Object.keys(pDesc.share).length>0) &&
                          (pDesc.owner.login!=__login_id))
                            del_btn.setText ( 'Unjoin' );
                      else  del_btn.setText ( 'Delete' );
                      enableToolbarButtons();
                    },
      ondblclick  : function ( dataRow,callback_func){
                      openProject();
                    },
      showonstart : function(rowData){
                      return (projectList.current==getProjectName(rowData[0]));
                    },
      onsort      : function(tdata)  {
                      let showIndex = -1;
                      for (let i=0;(i<tdata.length) && (showIndex<0);i++)
                        if (projectList.current==getProjectName(tdata[i][0]))
                          showIndex = i;
                      return showIndex;
                    },
      onpage      : function(pageNo)  {
                      enableToolbarButtons();
                      setContextMenu();
                    }
    };

// console.log ( ' >>>> wh=' + window.innerHeight + ' - ' + tdesc.page_size)

    //  ===== Prepare table description

    if (archive_folder)
      tdesc.columns.splice ( 1,0, {
        header  : 'Archive ID',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'Archive ID',
        style   : { 'text-align' : 'left', 'width' : '60px', 'white-space' : 'nowrap' },
        sort    : true
      });

    if ('listState' in projectList)  {
      tdesc.sortCol    = projectList.listState.sortCol;
      tdesc.start_page = projectList.listState.crPage;
      for (let i=tdesc.columns.length-1;i>=0;i--)
        tdesc.columns[i].sort = projectList.listState.sort_list[i];
      if ('paginate' in projectList.listState)
        tdesc.paginate = projectList.listState.paginate;
    }

    //  ===== Add table data to table description

    let selectIndex = -1;  // selection in current view

    for (let i=0;i<projectList.projects.length;i++)  {
      let pDesc = projectList.projects[i];
      if (listProject(pDesc))  {
        let rowData = [];
        if (archive_folder)
          rowData.push ( pDesc.archive.id );
        let pName = pDesc.name;
        if (archive_folder)
          pName = pDesc.archive.project_name;
        if (projectList.current==pName)
          selectIndex = tdesc.rows.length;
        // when list of projects is served from FE, shared record is removed
        // in case of owner's login
        let joined = ['','',''];
        // let shared_project = false;
        if ('owner' in pDesc)  {
          if (Object.keys(pDesc.share).length>0)  {
            if (pDesc.owner.login!=__login_id)  {
              joined = ['<i>','</i>',"is not included in user\'s quota"];
              pName  = '<b>[<i>' + pDesc.owner.login  + '</i>]:</b>' + pName;
              // shared_project = true;
            }
          } else if (('author' in pDesc.owner) && pDesc.owner.author &&
                      (pDesc.owner.author!=pDesc.owner.login) &&
                      (pDesc.owner.author!=__login_id))
            pName  = '<b>(<i>' + pDesc.owner.author + '</i>):</b>' + pName;
        }
        rowData.push ( pName );
        rowData.push ( pDesc.title );

        let info = '';
        if (('metrics' in pDesc) && ('R_free' in pDesc.metrics)
                                 && (pDesc.metrics.R_free<'1.0'))  {
          info = '<table class="table-rations">' +
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
          rowData.push ( [pDesc.metrics.R_free.toFixed(4),info+'</table>'] );
        } else
          rowData.push ( '' );

        if (pDesc.hasOwnProperty('disk_space'))
              rowData.push ( [joined[0]+pDesc.disk_space.toFixed(1)+joined[1],joined[2]] );
        else  rowData.push ( [joined[0]+'-:-'+joined[1],joined[2]] );

        if (pDesc.hasOwnProperty('cpu_time'))
              rowData.push ( [joined[0]+pDesc.cpu_time.toFixed(4)+joined[1],joined[2]] );
        else  rowData.push ( [joined[0]+'-:-'+joined[1],joined[2]] );

        rowData.push ( pDesc.dateCreated  );
        rowData.push ( pDesc.dateLastUsed );
        rowData.push ( pDesc );

        tdesc.rows.push ( rowData    );

      }
    }

    if ((selectIndex<0) && (tdesc.rows.length>0))  {
      selectIndex = 0;
      projectList.current = getProjectName ( tdesc.rows[0][0] );
    }

    //  ===== Put number of projects in folder metadata

   let nrows = tdesc.rows.length;
    __current_folder.nprojects = nrows;
    switch (__current_folder.type)  {
      case folder_type.shared        : projectList.folders[1].nprojects = nrows;
                                       projectList.folders[1].nprjtree  = nrows;
                                     break;
      case folder_type.joined        : projectList.folders[2].nprojects = nrows;
                                       projectList.folders[2].nprjtree  = nrows;
                                     break;
      case folder_type.all_projects  : projectList.folders[3].nprojects = nrows;
                                       projectList.folders[3].nprjtree  = nrows;
                                     break;
      case folder_type.archived      : projectList.folders[4].nprojects = nrows;
                                       projectList.folders[4].nprjtree  = nrows;
                                     break;
      case folder_type.cloud_archive : projectList.folders[5].nprojects = nrows;
                                       projectList.folders[5].nprjtree  = nrows;
                                     break;
      default : ;
    }

    setPageTitle ( __current_folder );

    let addLbl   = 'Add';
    let addIcon  = 'add';
    let addWidth = '60pt';
    if (__current_folder.type==folder_type.cloud_archive)  {
      addLbl   = 'Access';
      addIcon  = 'folder_cloud_archive';
      addWidth = '75pt';
    }
    if (tightScreen)  {
      addLbl   = '';
      addWidth = '30pt';
    }
    add_btn.setButton ( addLbl,image_path(addIcon) ).setWidth(addWidth);

    let moveLbl  = '';
    let moveIcon = 'folder_projects';
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

    self.projectTable = new TablePages();
    panel.setWidget ( self.projectTable,table_row,0,1,nCols );

    self.projectTable.makeTable ( tdesc );
    if (search_dlg)  {
      search_dlg.setTable ( self.projectTable );
      search_dlg.applyFilter();
    }
    self.projectTable.setOnShowAllListener ( function(){
      saveProjectList ( function(rdata){},null );
    });

    // $(self.projectTable.element).css({'max-height':'600px','overflow-y':'scroll'});
    // $(panel.element).css({'max-height':'600px','overflow-y':'scroll'});

    if (nrows<=0)  {

      let message = 'folder';
      if (isCurrentFolderList())
        message = 'list';
  
      message = '<div style="width:100%;color:darkgrey">&nbsp;<p>&nbsp;<p><h3>' +
                'There are no projects in ' + message + ' "' +
                folderPathTitle(__current_folder,__login_id,1000) + '".' +
                '<p>Use "Add" button to create a new Project' +
                ';<br>"Import" button for importing a project exported from ' +
                  appName() +
                ';<br>"Join" button for joining project shared with you by ' +
                'another user;<br>or "Tutorials" button for loading ' +
                'tutorial/demo projects;<br>or click on page title or folder ' +
                'icon in it to change the folder.</h3></div>';
      panel.setLabel ( message, //.fontcolor('darkgrey'),
                       table_row+1,0,1,nCols )
            .setFontItalic ( true )
            .setNoWrap();

      panel.setHorizontalAlignment ( table_row+1,0,"center" );

       __current_project = null;

    // } else  {
    //   self.welcome_lbl.hide();
    }

    // setTimeout ( function(){
    //   console.log ( ' >>>> ' + self.projectTable.table.height_px() + ' : ' + window.innerHeight );
    // },1000);

  }


  function loadProjectList()  {
    //  Read list of projects from server
    document.body.style.cursor = 'wait';
    serverRequest ( fe_reqtype.getProjectList,0,'Project List',function(data){
      projectList = jQuery.extend ( true, new ProjectList(__login_id),data );
      makeProjectListTable();
      document.body.style.cursor = 'auto';
    },null,'persist');
  }

  this.loadProjectList1 = function()  {
    loadProjectList();
    self.getUserRation();
  }

  function browseFolders ( funcKey )  {
    // console.log ( projectList.folders );
    let title = 'Select project folder';
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
    let pDesc = getCurrentProjectDesc();
    let folderBrowser = new FoldersBrowser ( title,projectList,__current_folder,pDesc,funcKey,

      function ( key,data ){
      
        switch (key)  {
      
          case 'delete' : if (data.folder_type==folder_type.custom_list)  {
                            projectList.removeProjectLabels ( __login_id,data.folder_name );
                          }
          case 'select' : if (!projectList.setCurrentFolder(
                                  projectList.findFolder(data.folder_path)))  {
                            new MessageBox (
                                'Error',
                                '<h2>Error</h2>Selected folder:<p><i>"' +
                                data.folder_path + '</i>"<p>not found (1).',
                                'msg_error'
                            );
                          }
                          saveProjectList ( function(rdata){
                            makeProjectListTable();
                          },null );
                      break;
      
          case 'add'    : //projectList.resetFolders ( __login_id );
                          saveProjectList ( function(rdata){},null );
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
                            } else  {
                              if (projectList.currentFolder.type==folder_type.custom_list)
                                    addProjectLabel ( __login_id,pDesc,data.folder_path );
                              else  pDesc.folderPath = data.folder_path;
                              projectList.resetFolders ( __login_id );
                              saveProjectList ( function(rdata){
                                makeProjectListTable();
                              },null );
                            }
                          }
                      break;

          case 'rename' : if (data.folder_path==__current_folder.path)  {
                            let renFolder = projectList.findFolder ( data.rename_path );
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
                          if (isCurrentFolderList())
                            projectList.renameProjectLabels (
                                __login_id, data.folder_name,data.rename_name );
                          else
                            projectList.renameProjectPaths ( 
                                __login_id,  data.folder_path,data.rename_path );
                          saveProjectList ( function(rdata){
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

  this.makeHeader ( 3,function(callback_func){
    saveProjectList ( function(data){ callback_func(); },null );
  });

  this.headerPanel.setCellSize ( '30%','',0,3 );
  folder_btn = new ImageButton ( image_path('folder_projects'),'34px','34px' )
                  .setTooltip ( 'Browse project folders' )
                  .setVisible ( false );
                  // .setSize ( '28pt','26pt' );
                  // .setWidth ( '28pt' ).setHeight ( '24pt' );
  this.headerPanel.setWidget ( folder_btn,0,4,1,1 );
  this.headerPanel.setVerticalAlignment ( 0,4,'middle' );
  this.headerPanel.setHorizontalAlignment ( 0,4,'right' );

  pageTitle_lbl = this.headerPanel
                  .setLabel   ( '&nbsp;My Projects',0,5,1,1 )
                  .setFont    ( 'times','200%',true,true )
                  .setNoWrap  ()
                  .setVisible ( false );
                  // .setHorizontalAlignment ( 'center' );
  this.headerPanel.setCellSize            ( '60%','',0,5 );
  this.headerPanel.setVerticalAlignment   ( 0,5,'middle' );
  this.headerPanel.setHorizontalAlignment ( 0,5,'left'   );

  folder_btn.addOnClickListener ( function(){
    browseFolders ( 'select' );
  });
  pageTitle_lbl.addOnClickListener ( function(){
    browseFolders ( 'select' );
  });

  // Make Main Menu
  this.addMenuItem ( 'Change project folder','folder_projects',function(){
    saveProjectList ( function(data){},null );
    browseFolders ( 'select' );
  });
  // this.addMenuSeparator();

  let accLbl = 'My Account';
  if (__local_user)
    accLbl = 'Settings';
  this.addMenuItem ( accLbl,'settings',function(){
    saveProjectList ( function(data){ makeAccountPage(sceneId); },null );
  });

  if (__user_role==role_code.admin)
    this.addMenuItem ( 'Admin Page',role_code.admin,function(){
      saveProjectList ( function(data){ makeAdminPage(sceneId); },null );
    });
  else if (__user_role==role_code.localuser)
    this.addMenuItem ( 'System info','system_info',function(){
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

  this.addGlobusLinkToMenu();

  this.addLogoutToMenu ( function(){
    saveProjectList ( function(data){ logout(sceneId,0); },null );
  });

  // let btn_width    = '30pt';
  let btn_width    = [];
  let btn_height   = '26pt';
  // let left_margin  = '18pt';
  // let right_margin = '28pt';
  let left_margin  = '6pt';
  let right_margin = '8pt';

  //alert ( window.screen.width + '  ' + window.devicePixelRatio );

  if (tightScreen)  {  // 720 pt to px
    // tight screen (smartphone)

    left_margin  = '2pt';
    right_margin = '4pt';

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
    search_btn  = new Button ( '',image_path('search' ) );

    // for (let i=0;i<9;i++)
    for (let i=0;i<11;i++)
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
    search_btn  = new Button ( ''      ,image_path('search'   ) );
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
      '60pt',
    ];

  }

  search_btn .setTooltip ( 'Find projects using a search template' );

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
  search_btn .setWidth ( '30pt'       ).setHeight ( btn_height );

  // make panel
  panel = new Grid('');
  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( left_margin ,'',1,0,1,1 );
  this.grid.setWidget   ( panel          ,1,1,1,1 );
  this.grid.setCellSize ( right_margin,'',1,2,1,1 );
  // this.grid.setCellSize ( right_margin,'100%',1,2,1,1 );

//  panel.setVerticalAlignment ( 1,0,'top' );
  // panel.setVerticalAlignment ( 1,1,'middle' );

  // this.makeLogoPanel ( 2,0,3 );

  let row = 0;
  panel.setHorizontalAlignment ( row,0,'center'    );
  panel.setCellSize            ( '','8px'   ,row++,0    );
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

  for (let i=0;i<nCols-1;i++)
    panel.setCellSize ( btn_width[i],'',row,i );
  panel.setCellSize            ( 'auto'     ,'',row,nCols-1 );
  panel.setWidget              ( search_btn ,   row,nCols,1,1 );
  panel.setCellSize            ( '30pt'     ,'',row++,nCols++ );

  table_row = row;  // note the project list table position here

  open_btn  .setDisabled       ( true );
  add_btn   .setDisabled       ( true );
  rename_btn.setDisabled       ( true );
  clone_btn .setDisabled       ( true );
  move_btn  .setDisabled       ( true );
  del_btn   .setDisabled       ( true );
  import_btn.setDisabled       ( true );

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

  search_btn.addOnClickListener ( function(){
    search_dlg = new TableSearchDialog ( 'Find Project',self.projectTable,500,40,
      function(){ // on dialog close
        search_dlg = null; 
      }); 
  });

  //launchHelpBox ( '','./html/jscofe_myprojects.html',doNotShowAgain,1000 );

  //  Read list of projects from server in new thread, so that all widgets
  // are initialised
  window.setTimeout ( function(){
    loadProjectList ();
    offlineGreeting ( function(){} );
  },10);

}

registerClass ( 'ProjectListPage',ProjectListPage,BasePage.prototype );

ProjectListPage.prototype.calcPageSize = function()  {
  let rowHeight = 29.1953;
  if (this.projectTable)
    rowHeight = this.projectTable.getRowHeight();
  return  Math.floor ( (window.innerHeight-248*rowHeight/29.1953)/rowHeight );
}

ProjectListPage.prototype.onResize = function ( width,height )  {
  // if (this.projectTable.paginator.paginate)
  if (this.projectTable)
    this.projectTable.setPageSize ( this.calcPageSize() );
  // this.element.style.height = `${window.innerHeight - 32}px`;
  // this.element.style.height = (height+8) + 'px';
}

ProjectListPage.prototype.reloadProjectList = function()  {
  this.loadProjectList1();
}

ProjectListPage.prototype.loadProject = function ( prjName )  {
  this._open_project ( prjName );
}

function makeProjectListPage ( sceneId )  {
  makePage ( function(){ new ProjectListPage(sceneId); } );
  setHistoryState ( 'ProjectListPage' );
}
