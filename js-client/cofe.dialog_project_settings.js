
/*
 *  =================================================================
 *
 *    05.05.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_project_settings.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task Data Dialog (shows data availability for given task)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// ProjectSettingsDialog class

function ProjectSettingsDialog ( jobTree,callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Project Settings' );
  document.body.appendChild ( this.element );

  //checkProjectData ( jobTree.projectData );
  var settings = jobTree.projectData.settings;

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  this.grid.setLabel ( 'File name prefix to prepend all generated file names:&nbsp;&nbsp;',0,0,1,1 )
           .setTooltip ( 'Chosen prefix will be used for forming file names ' +
                         'in all project tasks' );
  var prefix_ddn = null;
  var prefix_inp = new InputText ( settings.prefix );
  prefix_inp.setStyle ( 'text',"^[A-Za-z0-9\\-\\._]+$",'',
                        'File prefix should contain only latin '   +
                        'letters, numbers, underscores, dashes '    +
                        'and dots, and must start with a letter. ' +
                        'Specified prefix, unless blank, will be ' +
                        'used for forming output file names in '   +
                        'this project' )
            .setFontItalic ( true    )
            .setWidth      ( '100pt' );
  if (__user_settings.hasOwnProperty('project_prefix') &&
      __user_settings.project_prefix)  {
    prefix_ddn = new Dropdown();
    prefix_ddn.setTooltip ( 'Choose whether "<i>Project name</i>" should be used for ' +
                            'file name prefixing (this is the default option ' +
                            'chosen in your account settings), or select "<i>Custom</i>" ' +
                            'for specifying a particular prefix in this project.' )
              .setWidth ( '130pt' );
    prefix_ddn.addItem ( 'Project name','',0,settings.prefix_key!=1 );
    prefix_ddn.addItem ( 'Custom'      ,'',1,settings.prefix_key==1 );
    prefix_ddn.make();
    this.grid.setWidget ( prefix_ddn,0,1,1,1 );
    var pname_inp = this.grid.setInputText ( jobTree.projectData.desc.name,0,2,1,1 )
                             .setReadOnly(true).setWidth('100pt');
    this.grid.addWidget ( prefix_inp,0,2,1,1 );
    pname_inp .setVisible ( settings.prefix_key==0 );
    prefix_inp.setVisible ( settings.prefix_key!=0 );
    prefix_ddn.addOnChangeListener ( function(text,value){
      pname_inp .setVisible ( value!=1 );
      prefix_inp.setVisible ( value==1 );
    });
  } else  {
    this.grid.setWidget ( prefix_inp,0,1,1,1 );
  }
  for (var c=0;c<3;c++)
    this.grid.setVerticalAlignment ( 0,c,'middle' );

  $(this.element).dialog({
    resizable : true,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {
      "Save": function() {
        if (prefix_ddn)
              settings.prefix_key = prefix_ddn.getValue();
        else  settings.prefix_key = 2;  // custom prefix
        if (prefix_inp.isVisible())
          settings.prefix = prefix_inp.getValue();
        window.setTimeout ( function(){ callback_func(); },0 );
        $( this ).dialog( "close" );
      },
      "Cancel": function() {
        $( this ).dialog( "close" );
      }
    }
  });

}

ProjectSettingsDialog.prototype = Object.create ( Widget.prototype );
ProjectSettingsDialog.prototype.constructor = ProjectSettingsDialog;
