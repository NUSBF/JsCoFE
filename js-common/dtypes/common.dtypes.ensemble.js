
/*
 *  =================================================================
 *
 *    09.04.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.ensemble.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Ensemble Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.xyz' );

// ===========================================================================

var ensemble_subtype = {
  sequnk : 'sequnk'
}

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataEnsemble()  {

  if (__template)  __template.DataXYZ.call ( this );
             else  DataXYZ.call ( this );

  this._type    = 'DataEnsemble';

  this.sequence = null;  // associated sequence class;
                         //   this.files.xyz  - ensemble file
                         //   this.files.seq  - sequence file
  this.ncopies  = 1;     // number of copies in ASU to look for in MR
  this.nModels  = 1;     // number of MR models in ensemble
  this.simtype  = 'seqid'; // target similarity type 'seqid' or 'rmsd'
  this.rmsd     = '';    // estimate of ensemble dispersion
  this.seqId    = '';    // estimate of ensemble homology
  this.xyzmeta  = {};
  this.meta     = null;  // Gesamt alignment results

}


if (__template)
      DataEnsemble.prototype = Object.create ( __template.DataXYZ.prototype );
else  DataEnsemble.prototype = Object.create ( DataXYZ.prototype );
DataEnsemble.prototype.constructor = DataEnsemble;


// ===========================================================================

DataEnsemble.prototype.title = function()  { return 'Structure ensemble'; }

// when data class version is changed here, change it also in python
// constructors
DataEnsemble.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.DataXYZ.prototype.currentVersion.call ( this );
  else  return  version + DataXYZ.prototype.currentVersion.call ( this );
}

DataEnsemble.prototype.icon = function()  { return 'data'; }


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataEnsemble.prototype.extend = function() {
    var ensext = $.extend ( true,{},this );
    if (this.sequence)
      ensext.sequence = this.sequence.extend();
    return ensext;
  }


  DataEnsemble.prototype.addToInspectData = function ( dsp )  {
    if (this.sequence)  {
      dsp.makeRow ( 'Associated sequence',this.sequence.dname,'Associated sequence' );
    }
    if (this.meta)  {
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
//      dsp.table.setLabel ( this.meta.seqid ,dsp.trow,3, 1,1 );
      dsp.trow++;
    }
    return dsp.trow;
  }


  DataEnsemble.prototype.layCustomDropdownInput = function ( dropdown ) {

    var customGrid = dropdown.customGrid;
    var row = 0;

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
        customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );
      }
//    } else if (dropdown.layCustom.startsWith('phaser-mr'))  {
    } else if (startsWith(dropdown.layCustom,'phaser-mr'))  {
      if (this.sequence)
        displaySequence ( this.sequence.dname );
      customGrid.setLabel ( 'Look for',row,0,1,1 ).setFontItalic ( true );
      customGrid.ncopies = customGrid.setInputText ( this.ncopies,row,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify the number of model copies to look for ' +
                      'in asymmetric unit' )
                    .setWidth_px ( 50 );
      customGrid.setLabel ( 'copies in ASU',row,2,1,1 ).setFontItalic ( true );
      customGrid.setVerticalAlignment ( row  ,0,'middle' );
      customGrid.setVerticalAlignment ( row++,2,'middle' );

      customGrid.setLabel ( 'Similarity to target',row,0,1,2 ).setFontItalic ( true );
      customGrid.simtype = new Dropdown();
      customGrid.simtype.setWidth ( '200px' );
      customGrid.simtype.addItem ( 'by sequence identity'       ,'','seqid',this.simtype=='seqid' );
      customGrid.simtype.addItem ( 'by rms difference (&Aring;)','','rmsd' ,this.simtype=='rmsd'  );
      customGrid.setWidget   ( customGrid.simtype, row,1,1,1 );
      customGrid.setCellSize ( '210px','',0,1 );
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
      //alert ( JSON.stringify(this.meta));
      //customGrid.setLabel ( '(estimated r.m.s.d. to target, &Aring;)',row,2,1,1 )
      //          .setFontItalic ( true );

      customGrid.setVerticalAlignment ( row  ,0,'middle' );
      customGrid.setVerticalAlignment ( row++,2,'middle' );

      customGrid.simtype.addOnChangeListener ( function(text,value){
        customGrid.rmsd .setVisible ( value=='rmsd'  );
        customGrid.seqid.setVisible ( value=='seqid' );
      });

      row++;
      customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );
    }

  }

  DataEnsemble.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

//    if (dropdown.layCustom.startsWith('phaser-mr'))  {
    if (startsWith(dropdown.layCustom,'phaser-mr'))  {
      this.ncopies = parseInt ( customGrid.ncopies.getValue() );
      this.simtype = customGrid.simtype.getValue();
      if (this.simtype=='seqid')  {
        var v = customGrid.seqid.getValue();
        if (v && (!isNaN(v)))
              this.seqId = parseFloat ( v );
        else  msg += '<b><i>Sequence Identity not given or poorly formatted</i></b>';
      } else  {
        var v = customGrid.rmsd.getValue();
        if (v && (!isNaN(v)))
              this.rmsd = parseFloat ( v );
        else  msg += '<b><i>RMS difference not given or poorly formatted</i></b>';
      }
    }

    return msg;

  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataEnsemble.prototype.dataDialogHints = function ( subtype_list ) {
  var hints = [ 'An ensemble of MR models is missing. Use a suitable <i>"Ensemble ' +
                'preparation"</i> task to create one.',
                'Have you imported a PDB or mmCIF file with coordinates and ' +
                'wonder why, instead, an <i>"Ensemble"</i> data type is ' +
                'required for a Molecular Replacement task? <a href="javascript:' +
                    'launchHelpBox(\'Ensemble and XYZ\',' +
                                  '\'./html/jscofe_faq_ensemble_xyz.html\',' +
                                  'null,10)"><i>' +
                String('Check here').fontcolor('blue') + '</i></a>.'
              ];
    return hints;  // No help hints by default
  }


} else  {
  //  for server side
  module.exports.DataEnsemble = DataEnsemble;

}
