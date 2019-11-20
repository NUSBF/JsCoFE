
/*
 *  =================================================================
 *
 *    19.07.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_import_pdb.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import PDB Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2018
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Export project dialog class

function ImportPDBDialog ( onOk_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Import from the PDB' );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Import data from the PDB</h3>',0,0,1,4 );

  grid.setLabel ( 'PDB entries:&nbsp;&nbsp;',1,0,1,1 ).setTooltip (
                  'Give a comma-separated list of PDB codes, ' +
                  'from which data will be imported' );
  var entry_list = grid.setInputText ( '', 1,1,1,3 )
              .setStyle ( '','','e.g. 1xyz,2xyz,3xyz ...','').setWidth_px(300);
//                  'A comma-separated list of PDB codes, ' +
//                  'from which data will be imported' ).setWidth('100%');
  grid.setVerticalAlignment ( 1,0,'middle' );

  /*
  grid.setLabel ( 'Import data:',2,0,1,1 ).setTooltip (
                  'Select data to import' );

  var coor_cbx = grid.setCheckbox ( 'Coordinates (XYZ)',true,2,1,1,1 )
                      .setTooltip ( 'Check to import coordinates' );
  var seq_cbx  = grid.setCheckbox ( 'Sequence(s)',false,2,2,1,1 )
                      .setTooltip ( 'Check to import sequence(s)' );
  var sf_cbx   = grid.setCheckbox ( 'Structure Factors',false,2,3,1,1 )
                      .setTooltip ( 'Check to import structure factors' );

  grid.setVerticalAlignment ( 1,0,'middle' );
  grid.setVerticalAlignment ( 2,0,'middle' );
  */

  // for some reasons, this id has to be unique
  var accept_btn_id = "accept_btn_" + new Date().getMilliseconds();

  function enableImportButton()  {
    $('#' + accept_btn_id).button ( 'option','disabled',
              (entry_list.getValue().replace(/\s+/, "")=='') );
    /*
    $('#import_btn').button ( 'option','disabled',
              (entry_list.getValue().replace(/\s+/, "")=='') ||
              ((!coor_cbx.getValue()) &&
               (!seq_cbx.getValue())  &&
               (!sf_cbx.getValue())
              )
           );
    */
  }

//  w = 3*$(window).width()/5 + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 'auto',
    modal     : true,
    open      : function(event, ui) {
      entry_list.addOnInputListener  ( enableImportButton );
    },
    buttons   : [
      { id    : accept_btn_id,
        text  : "Accept",
        disabled : true,
        click : function() {
          /*
          var importData = {};
          importData.meta       = task;
          importData.entry_list = entry_list.getValue();
          importData.coor_cbx   = coor_cbx  .getValue();
          importData.seq_cbx    = seq_cbx   .getValue();
          importData.sf_cbx     = sf_cbx    .getValue();
          serverRequest ( fe_reqtype.importPDBData,importData,
                          'Import data from the PDB',
                          function(){
                            alert ( 'ok');
                          },function(){
                            alert ( 'always' );
                          },function(){
                            alert ( 'fail' );
                          });
          */
          if (onOk_func)  {
            var pdb_list = entry_list.getValue().split(',');
            var err_list = '';
            var k = 0;
            for (var i=0;i<pdb_list.length;i++)  {
              pdb_list[i] = pdb_list[i].trim();
              if ((pdb_list[i].length!=4) || ('0123456789'.indexOf(pdb_list[i][0])<0))  {
                if (err_list!='')
                  err_list += ', ';
                if (k>5)  {
                  err_list += '<br>';
                  k = 0;
                }
                err_list += pdb_list[i];
                k++;
              }
            }
            if (err_list=='')  {
              onOk_func ( pdb_list );
              $(this).dialog("close");
            } else
              new MessageBox ( 'Invalid PDB code(s)',
                  'The following PDB codes:<p><b>' + err_list + '</b><p>' +
                  'are invalid. Please revise.' );
          } else
            $(this).dialog("close");
        }
      },{
        id    : "cancel_btn",
        text  : "Cancel",
        click : function() {
          $(this).dialog("close");
        }
      }
    ]
  });

  /*
  coor_cbx  .addOnChangeListener ( enableImportButton );
  seq_cbx   .addOnChangeListener ( enableImportButton );
  sf_cbx    .addOnChangeListener ( enableImportButton );
  */
  /*
  (function(dlg){

    $(dlg.element).on( "dialogclose",function(event,ui){
      serverRequest ( fe_reqtype.finishPrjImport,0,'Finish Project Import',
                      null,function(){
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      },function(){} );  // depress error messages
    });

  }(this))
  */

}


ImportPDBDialog.prototype = Object.create ( Widget.prototype );
ImportPDBDialog.prototype.constructor = ImportPDBDialog;
