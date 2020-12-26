
/*
 *  =================================================================
 *
 *    25.12.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_add_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Add Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// AddProjectDialog dialog class

function AddProjectDialog ( projectList,onclose_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Add New Project' );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  var row = 0;
  //grid.setLabel ( '<h3>Project data</h3>',row++,0,1,2 );

  grid.setLabel ( 'ID'  ,row  ,0,1,1 ).setWidth('120px').setFontBold(true);
  grid.setLabel ( 'Name',row++,1,1,1 ).setWidth('500px').setFontBold(true);

  var name_inp = grid.setInputText ( '',row,0,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
        .setFontItalic ( true  )
        .setWidth      ( '120px' );
  var title_inp = grid.setInputText ( '',row++,1,1,1 )
        .setStyle      ( 'text','','Put a descriptive title here','' )
        .setFontItalic ( true  )
        .setWidth      ( '520px' );

  grid.setLabel ( '<h3>Initialisation mode</h3>',row++,0,1,2 );

  var autosolve_rbt = new RadioButton ( 'Autosolve',
                                        projectList.startmode==start_mode.auto );
  var expert_rbt    = new RadioButton ( 'Expert',
                                        projectList.startmode==start_mode.expert );
  var migrate_rbt   = new RadioButton ( 'Migration',
                                        projectList.startmode==start_mode.migrate );

  autosolve_rbt.setSize ( '100px','50px' );
  expert_rbt   .setSize ( '100px','50px' );
  migrate_rbt  .setSize ( '100px','50px' );

  grid.setWidget ( autosolve_rbt,row++,0,1,2 );
  grid.setWidget ( autosolve_rbt,row,0,1,1 );
  grid.setLabel  (
    'Simple start in standard cases using automated phasing (MR and EP/SAD), ' +
    'model building and optional ligand fitting. Results can be further ' +
    'refined with Refmac and Coot, and few other pre-selected tools. You ' +
    'should have merged or unmerged reflection dataset, sequence file and ' +
    'optional structural homolog ready for upload.<br>&nbsp;',
    row++,1,1,1 ).setFontSize('85%').setFontItalic(true);

  grid.setWidget ( expert_rbt,row,0,1,1 );
  grid.setLabel  (
    'Suitable for more experienced ' + appName() + ' users when fine-grained ' +
    'control of all structure solution stages is required, or for running ' +
    'standalone tasks outside the structure solution context (e.g., GESAMT or ' +
    'PISA).<br>&nbsp;<br>&nbsp;',
    row++,1,1,1 ).setFontSize('85%').setFontItalic(true);

  grid.setWidget ( migrate_rbt,row,0,1,1 );
  grid.setLabel  (
    'Quick start from phased (possibly partially built and refined) structure ' +
    'or heavy-atom substructure, for further refinement and model building. ' +
    'MTZ file with phases and optional reflection dataset, atomic coordinates ' +
    'and ligand description library will be needed for upload.',
    row++,1,1,1 ).setFontSize('85%').setFontItalic(true);

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 700,
    modal     : true,
    buttons: [
      {
        id   : "Add_btn",
        text : "Add Project",
        click: function() {

          var msg = [];

          if (name_inp.getValue().length<=0)
            msg.push ( '<b>Project ID</b> must be provided.' );
          else if (name_inp.element.validity.patternMismatch)
            msg.push ( '<b>Project ID</b> should contain only latin letters, ' +
                       'numbers, undescores,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                       '&nbsp;&nbsp;&nbsp;dashes and dots, and must start ' +
                       'with a letter.' );

          if (title_inp.getValue().length<=0)
            msg.push ( '<b>Project Name</b> must be provided.<p>' );

          if (msg.length>0)  {
            new MessageBox ( 'Incomplete data',
                     'New project cannot be created due to the following:<p>' +
                      msg.join('<br>') +
                      '<p>Please provide all needful data in correct format ' +
                      'and try again.' );
          } else  {

            var pspecs = {
              id    : name_inp.getValue(),
              title : title_inp.getValue()
            };

            if (autosolve_rbt.getValue())   pspecs.startmode = start_mode.auto;
            else if (expert_rbt.getValue()) pspecs.startmode = start_mode.expert;
                                       else pspecs.startmode = start_mode.migrate;

            if (onclose_fnc(pspecs))
              $(this).dialog("close");

          }

        }
      },
      {
        id   : "cancel_btn",
        text : "Cancel",
        click: function() {
          onclose_fnc ( null );
          $(this).dialog("close");
        }
      }
    ]
  });

  $(autosolve_rbt.element).click ( function(){
    $('#choose_btn').button ( 'enable' );
    expert_rbt .setValue ( false );
    migrate_rbt.setValue ( false );
  });

  $(expert_rbt.element).click ( function(){
    $('#choose_btn').button ( 'enable' );
    autosolve_rbt.setValue ( false );
    migrate_rbt  .setValue ( false );
  });

  $(migrate_rbt.element).click ( function(){
    $('#choose_btn').button ( 'enable' );
    autosolve_rbt.setValue ( false );
    expert_rbt   .setValue ( false );
  });

}

AddProjectDialog.prototype = Object.create ( Widget.prototype );
AddProjectDialog.prototype.constructor = AddProjectDialog;
