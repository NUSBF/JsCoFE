
/*
 *  =================================================================
 *
 *    29.03.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_archive_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project Archive Dialog (archives given project)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// ProjectArchiveDialog class

function ProjectArchiveDialog ( projectDesc,callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Project archiving' );
  document.body.appendChild ( this.element );

  this.projectDesc = projectDesc;
  this.archiving_started = false;

  this.ration = null;
  if (__current_page)
    this.ration = __current_page.ration;

  var self = this;

  if (this.makeLayout())  {

    $(this.element).dialog({
      resizable : false,
      height    : 'auto',
      maxHeight : 600,
      width     : 820,
      modal     : true,
      closeOnEscape : false,
      open      : function(event,ui) {
                    //hide close button.
                    $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                  },
      buttons   : [
        { id    : 'archdlg_archive_btn',
          text  : 'Archive',
          click : function() {
                    if (self.validateData())  {
                      var title = 'Confirm archiving';
                      var msg   = '<h2>Confirm archiving</h2>' +
                                  'You are about to archive project <b>"' +
                                  projectDesc.name + '"</b>.';
                      var btext = 'Yes, archive';
                      if (self.projectDesc.archive)  {
                        title = 'Confirm archive updating';
                        msg   = '<h2>Confirm archive updating</h2>' +
                                'You are about to update archived project <b>"' +
                                projectDesc.name + '"</b>.';
                        btext = 'Yes, update';
                      }
                      new QuestionBox ( title,
                        '<div style="width:400px">' +
                        msg + '<p>This operation cannot be undone and will take ' +
                        '10-20 minutes for average-size projects, during which ' +
                        'time your ' + appName() + ' account will be suspended.' +
                        '<p>Please confirm.',[
                          { name    : btext,
                            onclick : function(){
                              window.setTimeout ( function(){
                                self.archiveProject();
                              },100);
                            }
                          },{
                            name    : 'Cancel',
                            onclick : function(){}
                          }],'msg_confirm' );
                    }
                    // window.setTimeout ( function(){ callback_func(); },0 );
                    // $( this ).dialog( "close" );
                  }
        }, {
          id    : 'archdlg_cancel_btn',
          text  : 'Cancel', 
          click : function() {
                    if (self.archiving_started)
                          // makeLoginPage ( __current_page.sceneId );
                          logout ( __current_page.element.id,3 );
                    else  $( this ).dialog( "close" );
                  }
        }
      ]

    });

  } else  {

    $(this.element).dialog({
      resizable : false,
      height    : 'auto',
      width     : 600,
      modal     : true,
      buttons   : [{
          id    : 'archdlg_cancel_btn',
          text  : 'Close', 
          click : function() {
                    if (self.archiving_started)
                          // makeLoginPage ( __current_page.sceneId );
                          logout ( __current_page.element.id,3 );
                    else  $( this ).dialog( "close" );
                  }
      }]

    });

  }

}

ProjectArchiveDialog.prototype = Object.create ( Widget.prototype );
ProjectArchiveDialog.prototype.constructor = ProjectArchiveDialog;

// ProjectArchiveDialog.prototype.putConfirmQ = function ( row,text )  {
//   this.grid.setLabel ( text,row,2,1,1 );
//   return null;
// }

ProjectArchiveDialog.prototype.makeLayout = function()  {

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  var doclink = '<a href="javascript:launchHelpBox1(\'' + appName() + ' Archive\',' +
                '\'' + __user_guide_base_url + 'jscofe_archive.html\',null,10)">' +
                '<span style="color:blue">';

  this.grid.setLabel    ( ' ',0,0,1,1 );
  this.grid.setCellSize ( '','6px', 0,0 );
  this.grid.setImage    ( image_path('folder_cloud_archive'),'48px','48px', 1,0,1,1 );
  this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );

  var author = getProjectAuthor ( this.projectDesc );

  var title     = '<h2>Archive Project "' + this.projectDesc.name + '"</h2>';
  var archiveID = '';
  var coauthors = '';
  var pdbs      = '';
  var dois      = '';
  var kwds      = '';
  if (this.projectDesc.archive)  {
    title     = '<h2>Update Archived Project ' + this.projectDesc.archive.id + '</h2>';
    archiveID = this.projectDesc.archive.id;
    coauthors = this.projectDesc.archive.coauthors;
    pdbs      = this.projectDesc.archive.pdbs.join(',');
    dois      = this.projectDesc.archive.dois.join(',');
    kwds      = this.projectDesc.archive.kwds.join(',');
  }

  if (author!=__login_id)  {
    this.grid.setImage ( image_path('msg_stop'),'48px','48px', 1,0,1,1 );
    this.grid.setLabel ( title + 
        'Projects can be archived only by originators. Please delegate this ' +
        'action to your collaborator, who originally created the project.<p>' + 
        'Read all details about ' + appName() + ' archiving ' + doclink + 
        'here</span></a>.',
        0,2,2,1 );        
    return false;
  }

  if (isProjectJoined(__login_id,this.projectDesc))  {
    this.grid.setImage ( image_path('msg_stop'),'48px','48px', 1,0,1,1 );
    this.grid.setLabel ( title + 
        'Projects can be archived only by their owners. Please delegate this ' +
        'action to your collaborator, who shared this project with you.<p>' + 
        'Read all details about ' + appName() + ' archiving ' + doclink + 
        'here</span></a>.',
        0,2,2,1 );        
    return false;
  }

  if (this.projectDesc.archive && 
      (this.projectDesc.archive.depositor.login!=__login_id))  {
    this.grid.setImage ( image_path('msg_stop'),'48px','48px', 1,0,1,1 );
    this.grid.setLabel ( title + 
        'Projects can be updated in ' + appName() + ' Archive only by their ' +
        'original depositors. Please delegate this action to your collaborator, ' +
        'who archived first version of this project.<p>' + 
        'Read all details about ' + appName() + ' archiving ' + doclink + 
        'here</span></a>.',
        0,2,2,1 );        
    return false;
  }

  if ((!this.projectDesc.archive) && this.ration && 
      (this.ration.archives.length>=this.ration.archive_year))  {
    this.grid.setImage ( image_path('msg_stop'),'48px','48px', 1,0,1,1 );
    this.grid.setLabel ( title + 
        'Your Archive quota (' + this.ration.archive_year + 
        ' archived projects per year) is used up. Please contact your ' + 
        appName() + ' maintainer to increase your quota.<p>' + 
        'Read all details about ' + appName() + ' archiving ' + doclink + 
        'here</span></a>.',
        0,2,2,1 );        
    return false;
  }
    
  this.grid.setLabel ( title + doclink + 'Read what ' + appName() + 
      ' archiving means before proceeding</span></a> and fill in the form ' +
      'below (make sure to scroll the form down to the end)',
      0,2,2,1 );        

  this.grid.setVerticalAlignment ( 0,2,'middle' );

  this.grid.setHLine ( 2, 2,2, 1,1 );

  var panel = this.grid.setPanel ( 3,2,1,1 );
  $(panel.element).css({
    'width'      : 700,
    'height'     : 300,
    'overflow-y' : 'scroll'
  });

  var pgrid = new Grid ( '-compact' );
  panel.addWidget ( pgrid );
  var row = 0;

  // declaration

  pgrid.setLabel ( '<b>1. Declaration.</b><i> ' +
    'I archive project </i><b>"' + this.projectDesc.name + 
    '"</b><i>, developed by myself and my co-authors listed below in Section 3, '   +
    'who all have consented to this archiving, for the benefit of research ' +
    'community, as scientific evidence of my/our results, for citing in ' +
    'publications, and for educational purposes. '      +
    'I/we understand and agree that the archived project will be accessible to '     +
    'all other users of ' + appName() + ', who will be able to inspect it, '     +
    'clone, export and make additions in thus cloned or exported copies, where ' +
    'my/our original archived work will remain unchanged, and the whole project '    +
    'will retain my/our authorship. '  +
    'I/we further understand that there is no obligation to archive my/our work ' +
    'and do so in good faith for reasons listed in the beginning of this Declaration. '  +
    'I have read and understood terms of project archiving in ' + appName()   +
    ', given ' + doclink + 'here</span></a>, and informed my co-authors ' +
    'of archiving</i>.',
    row++,2,1,1
  );

  var sgrid = pgrid.setGrid ( '-compact', row++,2,1,1 );

  sgrid.setLabel ( __login_user + ':&nbsp;', 0,0,1,1 );

  this.signed_sel = new Dropdown();
  this.signed_sel.addItem ( ' ','','no_choice',true );
  this.signed_sel.addItem ( 'Agreed and signed','','signed',false );
  this.signed_sel.setWidth ( '200px' );
  sgrid.setWidget ( this.signed_sel, 0,1,1,1 );
  this.signed_sel.make();

  sgrid.setLabel ( getDateString(), 0,2,1,1 );

  sgrid.setVerticalAlignment ( 0,0,'middle' );
  sgrid.setVerticalAlignment ( 0,2,'middle' );

  // archive ID

  if (this.projectDesc.archive)
    pgrid.setLabel ( '&nbsp;<br><b>2. Archive ID.</b> ' +
      'Archive ID will be reused as shown below.',
      row++,2,1,1
    );
  else 
    pgrid.setLabel ( '&nbsp;<br><b>2. Archive ID.</b> ' +
      'You may choose your own up to 8-character long Archive ID for your ' +
      'project. It will be declined if already found in the archive. Leave ' +
      'the field blank for automatic choice.',
      row++,2,1,1
    );

  var igrid = pgrid.setGrid ( '-compact', row++,2,1,1 );

  igrid.setLabel ( 'Archive ID:&nbsp;', 0,0,1,1 ).setNoWrap()
       .setFontItalic(true).setHorizontalAlignment('right');
  this.aid_inp = igrid.setInputText ( archiveID,0,1,1,1 ).setWidth ( '140px' )
                      .setStyle ( 'text','','MYOWN.ID',
                                  'Archive ID may contain letters, digits and ' +
                                  'periods. It will be capitalised.' )
                      .addOnInputListener(function(){
                        var s = this.value.trim().toUpperCase();
                        if (s && (!s.match(/^[0-9A-Z.]+$/)))
                          s = s.slice(0,-1);
                        this.value = s;
                      });
  if (this.projectDesc.archive)
        this.aid_inp.setReadOnly(true);
  else  this.aid_inp.setMaxInputLength(8);



  // co-authors

  pgrid.setLabel ( '&nbsp;<br><b>3. Co-authors.</b> ' +
    'Put list of your co-authors here, one per line, or ' +
    '<b>"None" for no co-authors</b>',
    row++,2,1,1
  );

  this.coauthors_edt = new ACEditor ( 650,100,{
       'border'     : '1px solid gray',
       'box-shadow' : '6px 6px lightgray',
       'font-size'  : '16px',
       'theme'      : 'chrome',
       'mode'       : 'python'
     }
  );
  pgrid.setWidget ( this.coauthors_edt,row++,2,1,1 );
  this.coauthors_edt.init ( coauthors,
    'John R. Smith, University of Nowhere, jrsmith@uninowhere.edu\n' +
    'Mary A. Berry, Nocorporation Ltd., m.a.Berry@nocorp.com'
  );

  // annotation

  pgrid.setLabel ( '&nbsp;<br><b>4. Annotation.</b> ' +
    'Provide as much annotation details as possible below; they will be used ' +
    'in archive searches. <b>Put asterisk (*)</b> where annotation details are not ' +
    'currently available -- you will be able to add them later.',
    row++,2,1,1
  );

  var agrid = pgrid.setGrid ( '-compact', row++,2,1,1 );

  agrid.setLabel ( 'Associated PDB code(s):&nbsp;', 0,0,1,1 ).setNoWrap()
       .setFontItalic(true).setHorizontalAlignment('right');
  this.pdb_inp = agrid.setInputText ( pdbs,0,1,1,1 ).setWidth ( '440px' )
                     .setStyle ( 'text','','1XYZ, 2XYZ, 3XYZ, ...',
                                 'Comma-separated list of PDB codes associated ' +
                                 'with this project. Typically, specify PDB codes ' +
                                 'of deposited structures' );

  agrid.setLabel ( 'Publication DOI(s):&nbsp;', 1,0,1,1 ).setNoWrap()
       .setFontItalic(true).setHorizontalAlignment('right');
  this.doi_inp = agrid.setInputText ( dois,1,1,1,1 ).setWidth ( '440px' )
                    .setStyle ( 'text','','10.1107/S2059798322007987, ...',
                                'Comma-separated list of DOI of relevant ' +
                                'publications.' );

  agrid.setLabel ( 'Keywords:&nbsp;', 2,0,1,1 ).setNoWrap()
       .setFontItalic(true).setHorizontalAlignment('right');
  this.kwd_inp = agrid.setInputText ( kwds,2,1,1,1 ).setWidth ( '440px' )
                    .setStyle ( 'text','','hydrolase, carboxypeptidase, ...',
                                'Comma-separated list of keywords suitable for ' +
                                'archive searches.' );
                   
  for (var r=0;r<3;r++)
    agrid.setVerticalAlignment ( r,0,'middle' );

  return true;

}


ProjectArchiveDialog.prototype.getInputList = function ( inp )  {
  var line = inp.getValue().trim();
  var lst  = [];
  if (line && ((line=='*') || (line.indexOf('*')<0)))  {
    lst = line.split(',').filter(Boolean);
    for (var i=0;i<lst.length;i++)
      lst[i] = lst[i].trim();
  }
  return lst;
}


ProjectArchiveDialog.prototype.validateData = function()  {

  var msg_list = [];

  if (this.signed_sel.getValue()!='signed')
    msg_list.push ( 'sign declaration' );

  this.aid = this.aid_inp.getValue().trim().toUpperCase();
  // if ((this.aid.length>0) && this.aid_inp.element.validity.patternMismatch)
  //   msg_list.push ( 'provide up to 8-character long Archive ID made of letters, ' +
  //                   'digits and periods, or leave blank for automatic choice' );

  this.coauthors = this.coauthors_edt.getText().trim();
  if ((!this.coauthors) || (this.coauthors.length<4) ||
      ((this.coauthors.length==4) && (this.coauthors.toLowerCase()!='none')))
    msg_list.push ( 'specify co-authors or put "None"' );

  this.pdbs = this.getInputList ( this.pdb_inp );
  if (this.pdbs.length<=0)
    msg_list.push ( 'provide valid non-empty PDB code(s) annotation' );
  else if (this.pdbs[0]!='*')  {
    var pdbok = true;
    for (var i=0;(i<this.pdbs.length) && pdbok;i++)
      pdbok = (this.pdbs[i].length==4);// && /^[0-9]$/.test(this.pdbs[i].charAt(0));
    if (!pdbok)
      msg_list.push ( 'provide valid PDB code(s)' );
  }

  this.dois = this.getInputList ( this.doi_inp );
  if (this.dois.length<=0)
    msg_list.push ( 'provide valid non-empty publication DOI(s) annotation' );

  this.kwds = this.getInputList ( this.kwd_inp );
  if (this.kwds.length<=0)
    msg_list.push ( 'provide valid non-empty keyword(s) annotation' );

  // return true;

  if (msg_list.length>0)  {
    new MessageBox ( 'Invalid input',
        '<h2>Invalid input</h2>Please correct your input:<ul><li>' +
        msg_list.join('</li><li>') + '</li></ul>',
        'msg_stop'
    );
    // strangely enough, MessageBox behaves as non-modal here; suspect
    // library bug
  }

  return (msg_list.length<=0);

}


ProjectArchiveDialog.prototype.archiveProject = function()  {

  $('#archdlg_archive_btn').button().hide();
  $('#archdlg_cancel_btn' ).button('disable');

  stopSessionChecks();

  var self = this;

  serverRequest ( fe_reqtype.archiveProject,{
    pdesc      : this.projectDesc,
    annotation : {
      id        : this.aid,
      coauthors : this.coauthors,
      pdbs      : this.pdbs,
      dois      : this.dois,
      kwds      : this.kwds
    }
  },'Start Project Archiving', function(response){

    $('#archdlg_cancel_btn' ).button('enable');

    var message = '';
    switch (response.code)  {

      case 'not_owner' : message = '<h2>No privileges</h2>' +
                           'Projects can be archived only by their owners, ' +
                           'who created them in first place.';
                      break;

      case 'not_depositor' : 
                         message = '<h2>No privileges</h2>' +
                           'Projects can be updated in ' + appName() + 
                           ' Archive only by their original depositors.';
                      break;

      // case 'shared'    : message = '<h2>Shared Project</h2>' +
      //                      'Project <b>' + self.projectDesc.name + '</b> ' +
      //                      'is shared with other users. Please unshare the ' +
      //                      'project with all other users before archiving ' +
      //                      'and share Archive ID with your collaborators after ' +
      //                      'archiving instead.';
      //                 break;

      case 'duplicate_project_name' :
                         message = '<h2>Duplicate Project Name</h2>' +
                           'Chosen Archive ID:<p><center><b>' + 
                           response.archiveID +
                           '</b></center><p>coincides with project name found ' +
                           'in your account. You can resolve this conflict by ' +
                           'renaming or deleting/unjoining the same-named ' +
                           'project; by choosing another Archive ID; or leaving ' +
                           'Archive ID blank for automatic choice.';
                      break;

      case 'duplicate_archive_id' :
                         message = '<h2>Duplicate Archive ID</h2>' +
                           'Chosen Archive ID:<p><center><b>' + 
                           response.archiveID +
                           '</b></center><p>is already found in ' + appName() +
                           'Archive. Please choose another Archive ID or leave ' +
                           'blank for automatic choice.';
                      break;

      case 'no_space'  : message = '<h2>No space left in Archive</h2>' +
                           'Your project cannot be archived because there is ' +
                           'no space left in the Archive. Please inform ' +
                           report_problem ( 
                             appName() + ' archiving problem',
                              'No space left in the Archive, please increase',
                              ''
                           ) + '.<p>Sincere apologies for any inconvenience ' +
                           'this may have caused.';
                      break;

      case 'no_quota'  : var q = '';
                         if (self.ration)
                           q = '(' + self.ration.archive_year + 
                               ' archived projects per year) ';
                         message = '<h2>No Archive Quota</h2>' +
                           'Your Archive quota ' + q + 
                           'is used up. Please contact your ' + appName() + 
                           ' maintainer to increase your quota.' +
                           '<p>Sincere apologies for any inconvenience ' +
                           'this may have caused.';
                      break;

      case 'ok'        : self.archiving_started = true;
                         $('#archdlg_cancel_btn' ).button().text('Log out');
                         if (self.projectDesc.archive)
                            message = '<h2>Archived Project "' + self.projectDesc.name + 
                              '" is being updated</h2>Updating is currently in ' +
                              'progress. Updated project will be referenced by ' +
                              'the same Archive ID as the original version:'; 
                         else
                            message = '<h2>Project "' + self.projectDesc.name + 
                              '" is being archived</h2>Archiving is currently in ' +
                              'progress. The following Archive ID was issued for ' +
                              'your project:'; 
                         message += '<p><center><b>' + response.archiveID +
                           '</b></center><p>please take a note of it. Archive ID ' +
                           'is used for accessing archived projects and referencing ' +
                           'them in publication and elsewhere.' +
                           '<p>For the process to complete uninterrupted, your ' + 
                           appName() + ' account is now suspended. ' +
                           '<p>Please log out now. Your account will be released ' +
                           'automatically when archiving ends.<br>Contact ' + 
                           report_problem ( 
                             appName() + ' archiving problem',
                              'Archiving project ' + self.projectDesc.name + 
                              ' seems to be stuck',
                              ''
                           ) + ' if your account is not released after 2 hours.';
                      break;

      default :  message = '<h2>Unknown return code ' + response.code + 
                           '</h2><i>Please report as a bug</h2>';
    }
    
    self.grid.setLabel ( message,0,2,2,1 );
    self.grid.truncateRows ( 1 );

  },null,'persist' );

}