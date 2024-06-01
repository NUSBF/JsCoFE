
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.model.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Model Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template_d = null;
var __cmd        = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template_d = require ( './common.dtypes.xyz' );
  __cmd        = require ( '../common.commands' );
}

// ===========================================================================

const model_subtype = {
  sequnk : 'sequnk'
}

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataModel()  {

  if (__template_d)  __template_d.DataXYZ.call ( this );
               else  DataXYZ.call ( this );

  this._type    = 'DataModel';

  this.sequence = null;  // associated sequence class;
                         //   this.files.xyz  - model file
                         //   this.files.seq  - sequence file
  this.ncopies  = 1;     // number of copies in ASU to look for in MR
  this.nModels  = 1;     // number of MR models in model
  this.simtype  = 'seqid'; // target similarity type 'cardon', 'seqid' or 'rmsd'
  this.rmsd     = '';    // estimate of model dispersion
  this.seqId    = '';    // estimate of model homology
  this.xyzmeta  = {};
  this.seqrem   = false; // true if phaser sequence remark is in xyz file
  this.meta     = null;  // Gesamt alignment results

}


// if (__template_d)
//       DataModel.prototype = Object.create ( __template_d.DataXYZ.prototype );
// else  DataModel.prototype = Object.create ( DataXYZ.prototype );
// DataModel.prototype.constructor = DataModel;

if (__template_d)
  __cmd.registerClass1 ( 'DataModel',DataModel,__template_d.DataXYZ.prototype );
else    registerClass1 ( 'DataModel',DataModel,DataXYZ.prototype );

// ===========================================================================

DataModel.prototype.title = function()  { return 'MR model'; }

// when data class version is changed here, change it also in python
// constructors
DataModel.prototype.currentVersion = function()  {
  let version = 1;
  if (__template_d)
        return  version + __template_d.DataXYZ.prototype.currentVersion.call ( this );
  else  return  version + DataXYZ.prototype.currentVersion.call ( this );
}

DataModel.prototype.icon = function()  { return 'data'; }


// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  DataModel.prototype.extend = function() {
    let ensext = $.extend ( true,{},this );
    if (this.sequence)
      ensext.sequence = this.sequence.extend();
    return ensext;
  }


  DataModel.prototype.addToInspectData = function ( dsp )  {
    if (this.sequence)  {
      dsp.makeRow ( 'Associated sequence',this.sequence.dname,'Associated sequence' );
      dsp.trow++;
    }
    if (this.meta)  {
      if (this.nModels>1)  {
        if (('seqrem' in this) && this.seqrem)  {
          dsp.makeRow ( 'Model(s) seq.Id(s) \%',this.meta.seqId_ens.join(', '),
                        'Sequence Ids for models in model' );
          dsp.trow++;
        }
        dsp.table.setHeaderText ( 'Alignment'        ,dsp.trow,0,2,1 );
        dsp.table.setHorizontalAlignment (            dsp.trow,0,'left' );
        dsp.table.setHeaderText ( 'Q-score'          ,dsp.trow,1, 1,1 );
        dsp.table.setHeaderText ( 'R.m.s.d.'         ,dsp.trow,2, 1,1 );
        dsp.table.setHeaderText ( 'N<sub>align</sub>',dsp.trow,3, 1,1 );
  //      dsp.table.setHeaderText ( 'Seq. Id.'         ,dsp.trow,4, 1,1 );
        dsp.table.setLabel      ( ' '                ,dsp.trow,4, 2,2 );
        dsp.table.setCellSize   ( '90%',''           ,dsp.trow,4 );
        dsp.trow++;
        dsp.table.setLabel ( this.meta.qscore,dsp.trow,0, 1,1 );
        dsp.table.setLabel ( this.meta.rmsd  ,dsp.trow,1, 1,1 );
        dsp.table.setLabel ( this.meta.nalign,dsp.trow,2, 1,1 );
        dsp.trow++;
      } else if (this.meta.seqId)  {
        dsp.table.setHeaderText ( 'Scores',dsp.trow,0,2,1 );
        dsp.table.setHorizontalAlignment ( dsp.trow,0,'left' );
        let col = 1;
        if (this.meta.eLLG)  {
          dsp.table.setHeaderText ( 'eLLG',dsp.trow,col, 1,1 );
          dsp.table.setLabel ( this.meta.eLLG,dsp.trow+1,col-1, 1,1 );
          col++;
        }
        dsp.table.setHeaderText ( 'Seq. Id',dsp.trow,col, 1,1 );
        dsp.table.setLabel ( this.meta.seqId,dsp.trow+1,col-1, 1,1 );
        col++;
        if (this.meta.rmsd)  {
          dsp.table.setHeaderText ( 'R.M.S.D.',dsp.trow,col, 1,1 );
          dsp.table.setLabel ( this.meta.rmsd,dsp.trow+1,col-1, 1,1 );
          col++;
        }
        dsp.trow += 2;
      }
    }
    return dsp.trow;
  }


  DataModel.prototype.layCustomDropdownInput = function ( dropdown ) {

    let customGrid = dropdown.customGrid;
    let row = 0;

    function displaySequence ( seq_dname )  {
      customGrid.setLabel ( 'Sequence:',row,0,1,1 ).setFontItalic(true)
                                                   .setWidth  ( '70px' );
      
      customGrid.setLabel ( '&nbsp;' + seq_dname,row,1,1,3 )
                .setNoWrap();
      customGrid.setVerticalAlignment ( row,0,'middle' );
      customGrid.setVerticalAlignment ( row,1,'middle' );
      customGrid.setCellSize ( '','24px',row++,0 );
    }

//    if (dropdown.layCustom.startsWith('model'))  {
    if (startsWith(dropdown.layCustom,'model'))  {
      if (this.sequence)  {
        //row++;
        displaySequence ( this.sequence.dname );
        // customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );
      }
      else  {
        let nChains = this.getChainList().length;
        if (nChains<2)  displaySequence ( 'not associated' );
                  else  displaySequence ( 'complex of ' + nChains + ' chains' );
      }
      customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {
      DataXYZ.prototype.layCustomDropdownInput.call ( this,dropdown );
    } else if (startsWith(dropdown.layCustom,'phaser-mr'))  {
      if (this.sequence)
        displaySequence ( this.sequence.dname );
      else  {
        let nChains = this.getChainList().length;
        if (nChains<2)  displaySequence ( 'not associated' );
                  else  displaySequence ( 'complex of ' + nChains + ' chains' );
      }
      customGrid.setLabel ( 'Look for',row,0,1,1 ).setFontItalic ( true ).setNoWrap();
      customGrid.ncopies = customGrid.setInputText ( this.ncopies,row,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify the number of model copies to look for ' +
                      'in asymmetric unit' )
                    .setWidth_px ( 50 );
      customGrid.setLabel ( 'copies in ASU',row,2,1,1 ).setFontItalic ( true ).setNoWrap();
      customGrid.setVerticalAlignment ( row  ,0,'middle' );
      customGrid.setVerticalAlignment ( row++,2,'middle' );

      customGrid.setLabel ( 'Similarity to target',row,0,1,2 ).setFontItalic ( true ).setNoWrap();
      customGrid.simtype = new Dropdown();
      customGrid.simtype.setWidth ( '230px' );
      if (('seqrem' in this) && this.seqrem)
        customGrid.simtype.addItem ( 'read from model'     ,'','cardon',this.simtype=='cardon' );
      customGrid.simtype.addItem ( 'by sequence identity'       ,'','seqid',this.simtype=='seqid' );
      customGrid.simtype.addItem ( 'by rms difference (&Aring;)','','rmsd' ,this.simtype=='rmsd'  );
      customGrid.setWidget   ( customGrid.simtype, row,1,1,1 );
      customGrid.setCellSize ( '240px','',0,1 );
      customGrid.simtype.make();

      customGrid.rmsd = customGrid.setInputText ( this.rmsd,row,2,1,1 )
                    .setStyle ( 'text','real','',
            'Specify the measure of dispersion (in angstroms) for model' )
                    .setWidth_px ( 50 );
      customGrid.seqid = customGrid.addInputText ( this.seqId,row,2,1,1 )
                    .setStyle ( 'text','real','',
            'Specify sequence identity between target sequence and model structure ' +
            'between 0-1.' )
                    .setWidth_px ( 50 );
      customGrid.rmsd .setVisible ( this.simtype=='rmsd'  );
      customGrid.seqid.setVisible ( this.simtype=='seqid' );
      /*
      if (('seqrem' in this) && this.seqrem)  {
        customGrid.seqid_ens = customGrid.addLabel (
              'Seq. Id(s) = ' + this.meta.seqId_ens.join(', '),row,2,1,1 )
              .setTooltip ( 'Sequence similarity will be taken from model data');
        customGrid.seqid_ens.setVisible ( this.simtype=='cardon' );
      }
      */

      customGrid.setVerticalAlignment ( row  ,0,'middle' );
      customGrid.setVerticalAlignment ( row++,2,'middle' );

      customGrid.simtype.addOnChangeListener ( function(text,value){
        //if ('seqid_ens' in customGrid)
        //  customGrid.seqid_ens.setVisible ( value=='cardon'  );
        customGrid.rmsd .setVisible ( value=='rmsd'  );
        customGrid.seqid.setVisible ( value=='seqid' );
      });

      row++;
      customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );
    }

  }

  DataModel.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

//    if (dropdown.layCustom.startsWith('phaser-mr'))  {
    if (startsWith(dropdown.layCustom,'phaser-mr'))  {
      this.ncopies = parseInt ( customGrid.ncopies.getValue() );
      this.simtype = customGrid.simtype.getValue();
      if (this.simtype=='seqid')  {
        let v = customGrid.seqid.getValue();
        if (v && (!isNaN(v)))
              this.seqId = parseFloat ( v );
        else  msg += '|<b><i>Sequence Identity not given or poorly formatted</i></b>';
      } else if (this.simtype=='rmsd')  {
        let v = customGrid.rmsd.getValue();
        if (v && (!isNaN(v)))
              this.rmsd = parseFloat ( v );
        else  msg += '|<b><i>RMS difference not given or poorly formatted</i></b>';
      }
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {
      msg = DataXYZ.prototype.collectCustomDropdownInput.call ( this,dropdown );
    }

    return msg;

  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataModel.prototype.dataDialogHints = function ( subtype_list,n_allowed ) {
  let hints = [ 'MR model is missing. Use a suitable <i>"Model ' +
                'preparation"</i> task to create one.',
                'Have you imported a PDB or mmCIF file with coordinates and ' +
                'wonder why, instead, a <i>"Model"</i> data type is ' +
                'required for a Molecular Replacement task? <a href="javascript:' +
                    'launchHelpBox1(\'XYZs, Models and Ensembles\',' +
                                  '\'' + __user_guide_base_url +
                                    '/jscofe_qna.xyz_model_ensemble.html\',' +
                                  'null,10)"><i>' +
                String('Check here').fontcolor('blue') + '</i></a>.'
              ];
    return hints;  // No help hints by default
  }


} else  {
  //  for server side

  module.exports.DataModel = DataModel;

}
