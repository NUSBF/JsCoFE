
/*
 *  =================================================================
 *
 *    01.08.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2020-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// AddProjectDialog dialog class

function AddProjectDialog ( projectList,onclose_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Add New Project' );
  document.body.appendChild ( this.element );
  this.setScrollable ( 'hidden','hidden' );

  let grid = new Grid('');
  this.addWidget ( grid );
  let row = 0;

  grid.setLabel ( 'ID'    ,row  ,0,1,1 ).setWidth('120px').setFontBold(true);
  grid.setLabel ( '&nbsp;',row  ,1,1,1 ).setWidth('20px' );
  grid.setLabel ( 'Name'  ,row++,2,1,1 ).setWidth('550px').setFontBold(true);

  let name_inp = grid.setInputText ( '',row,0,1,1 )
        .setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project-1','' )
        .setFontItalic ( true  )
        .setWidth      ( '120px' );
  grid.setLabel ( '&nbsp;',row ,1,1,1 ).setWidth('20px' );
  let title_inp = grid.setInputText ( '',row++,2,1,1 )
        .setStyle      ( 'text','','Put a descriptive title here','' )
        .setFontItalic ( true  )
        .setWidth      ( '520px' );

  grid.setLabel ( '&nbsp;',row++,0,1,3 ).setHeight_px(12);
  grid.setLabel ( '<b>Project plan</b>',row++,0,1,3 );

  let project_plans = this.makeProjectPlansWidget ( projectList );

  grid.setWidget ( project_plans,row,0,1,3 );

  /*

  let autosolve_rbt = new RadioButton ( 'Autostart',
                                        projectList.startmode==start_mode.auto     );
  let expert_rbt    = new RadioButton ( 'Standard',
                                        (projectList.startmode==start_mode.standard) ||
                                        (projectList.startmode==start_mode.expert) // legacy
                                      );
  let migrate_rbt   = new RadioButton ( 'Hop on',
                                        projectList.startmode==start_mode.migrate  );

  autosolve_rbt.setSize ( '100px','40px' );
  expert_rbt   .setSize ( '100px','40px' );
  migrate_rbt  .setSize ( '100px','40px' );

  grid.setWidget ( autosolve_rbt,row++,0,1,2 );
  grid.setWidget ( autosolve_rbt,row,0,1,1 );
  grid.setLabel  (
    'Simplified mode for starting with one of automatic workflows featuring ' +
    'structure solution scenarios in ' + appName() + ', and optimised list of ' +
    'essential tasks for structure completion (can be switched to the ' +
    'full list).',
    row++,1,1,1 ).setFontSize('90%').setFontItalic(true);

  grid.setWidget ( expert_rbt,row,0,1,1 );
  grid.setLabel  (
    'Standard mode for operating all ' + appName() + ' tasks manually, with ' +
    'access to the full list of tasks by default.',
    row++,1,1,1 ).setFontSize('90%').setFontItalic(true);

  grid.setWidget ( migrate_rbt,row,0,1,1 );
  grid.setLabel  (
    'Quick start from phased (possibly partially built and refined) ' +
    'structure or heavy-atom substructure, for further refinement and model ' +
    'building, with the optimised list of essential tasks for structure ' +
    'completion (can be switched to the full list).',
    row++,1,1,1 ).setFontSize('90%').setFontItalic(true);

  */

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 720,
    modal     : true,
    buttons: [
      {
        id   : "Add_btn",
        text : "Add Project",
        click: function() {

          let msg = [];

          if (name_inp.getValue().length<=0)
            msg.push ( '<b>Project ID</b> must be provided.' );
          else if (name_inp.element.validity.patternMismatch)
            msg.push ( '<b>Project ID</b> should contain only latin letters, ' +
                       'numbers, underscores,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
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
                      'and try again.', 'msg_warning');
          } else  {

            let pspecs = {
              id    : name_inp.getValue(),
              title : title_inp.getValue()
            };

            // if (autosolve_rbt.getValue())   pspecs.startmode = start_mode.auto;
            // else if (expert_rbt.getValue()) pspecs.startmode = start_mode.standard;
            //                            else pspecs.startmode = start_mode.migrate;

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

}

AddProjectDialog.prototype = Object.create ( Widget.prototype );
AddProjectDialog.prototype.constructor = AddProjectDialog;


AddProjectDialog.prototype.makeProjectPlansWidget = function ( projectList )  {

  let panel = new Grid ( '-compact' );
  // panel.setWidth_px  ( 600 );
  panel.setHeight_px ( 200 );

  let plan_panel = panel.setPanel ( 1,0,1,1 );
  $(plan_panel.element).css ({
    'font-size'      : '90%',
    'padding-top'    : '6px',
    'padding-left'   : '12px',
    'padding-right'  : '12px',
    'padding-bottom' : '0px',
    'width'          : '654px',
    'min-height'     : '160px',
    'margin-top'     : -5,
    'margin-bottom'  : -5,
    'border'         : '1px solid lightgray' 
  });

  let plans = [
    { code  : plan_type.no_plan,
      title : 'Manual mode',
      data  : ['as required for your project'],
      desc  : 'develop project manually using suitable tasks',
      task  : null,
      avail_key : ['ok','','']
    }, { 
      code  : plan_type.mr_af,
      title : 'Molecular Replacement using AlphaFold model',
      data  : ['reflection data (merged or unmerged)',
               'sequence',
               '(optional) ligand description'
               ],
      desc  : 'Structure template prediction, pruning and slicing; ' +
              'ASU estimate; Molecular Replacement; ' +
              'ligand fitting (if provided); refinement and water modelling',
      task  : 'TaskWFlowAFMR',
      avail_key : ['ok','','']
    }, { 
      code  : plan_type.mr_db,
      title : 'Molecular Replacement using structure databases',
      data  : ['reflection data (merged or unmerged)',
               'sequence',
               '(optional) ligand description'
               ],
      desc  : 'Finding structure template in the PDB, AFDB and ESM data banks; ' +
              'ASU estimate; Molecular Replacement; ' +
              'ligand fitting (if provided); refinement and water modelling',
      task  : 'TaskWFlowAMR',
      avail_key : ['ok','','']
    }, { 
      code  : plan_type.mr_noseq,
      title : 'Molecular Replacement with unknown sequence and model',
      data  : ['reflection data (merged or unmerged)',
               '(optional) ligand description'
               ],
      desc  : 'Finding structure template in the PDB; ' +
              'ASU estimate; Molecular Replacement; ' +
              'ligand fitting (if provided); refinement and water modelling'
    },{ 
      code  : plan_type.mr_model,
      title : 'Molecular Replacement using a known model',
      data  : ['reflection data (merged or unmerged)',
               'structure model',
               '(optional) sequence',
               '(optional) ligand description'
               ],
      desc  : 'Model preparation; ASU estimate; Molecular Replacement; ' +
              'ligand fitting (if provided); refinement and water modelling'
    }, { 
      code  : plan_type.ep_auto,
      title : 'Automatic Experimental Phasing',
      data  : ['reflection data with anomalous signal (merged or unmerged)',
               'sequence',
               '(optional) ligand description'
               ],
      desc  : 'ASU estimate; automatic Experimental Phasing; ' +
              'ligand fitting (if provided); refinement and water modelling',
      task  : 'TaskWFlowAEP',
      avail_key : ['ok','','']
    }
  ];
  
  function show_plan ( planCode )  {

    let n = -1;
    for (let i=0;(i<plans.length) && (n<1);i++)
      if (plans[i].code==planCode)
        n = i;

    if (n>=0)  {
       
      let msg = '';
      if (plans[n].code==plan_type.no_plan)  {
        msg = '<b>No project plan will be used</b>; develop your project manually ' +
              'by using suitable tasks.' +
              '<p>Alternatively, choose a predefined plan to automatically develop your project.' +
              '<b>You can switch to manual mode from any plan</b>' 
      } else  {
        msg = '<b><i>Data needed:</i></b><ul><li>' + 
              plans[n].data.join('</li><li>') + '</li></ul>' +
              '<p><b><i>Plan description:</i></b>&nbsp;' +
              plans[n].desc;
      }
      if (plans[n].avail_key[0]!='ok')  {
        msg += '<p><b><i>This plan is not available:</i></b> ' + 
               plans[n].avail_key[1].replace('task is ','').replace('task ','');
        n = -1;
      }
      plan_panel.setText ( msg );
    }
  
    $('#Add_btn').button ( 'option', 'disabled',(n<0) );

  }

  panel.plan_sel = new Dropdown();
  panel.plan_sel.setWidth ( '680px' );

  panel.plan_sel.addItem ( plans[0].title,'',plans[0].code,true );
  for (let i=1;i<plans.length;i++)  {
    let task = makeNewInstance ( plans[i].task );
    plans[i].avail_key = task.isTaskAvailable();
    panel.plan_sel.addItem ( 'Plan ' + i + '. ' + plans[i].title +
                             ((plans[i].avail_key[0]=='ok') ? '' : ' (not available)'),
                             '',plans[i].code,false );
  }
  panel.setWidget ( panel.plan_sel, 0,0,1,1 );
  panel.plan_sel.make();

  show_plan ( plan_type.no_plan );

  panel.plan_sel.addOnChangeListener ( function(text,value){
    show_plan ( value );
  });

  return panel;

}
