
/*
 *  =================================================================
 *
 *    08.10.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.sequence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Sequence Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;  // always null when running in browser

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.template' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataSequence()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type   = 'DataSequence';

  this.size    = 0;     // number of residues
  this.weight  = 0.0;   // molecular weight
  this.ncopies = 1;     // expected number of copies in ASU
  this.nfind   = 1;     // copies to find
  this.ncopies_auto = true;  // flag to find ncopies automatically
  this.npred   = 1;     // number of copies in complex for structure prediction

  //this.ensembles = [];    // list of chosen ensemble models for MR

}

if (__template)
      DataSequence.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataSequence.prototype = Object.create ( DataTemplate.prototype );
DataSequence.prototype.constructor = DataSequence;


// ===========================================================================

DataSequence.prototype.title = function()  { return 'Macromolecular sequence'; }
DataSequence.prototype.icon  = function()  { return 'data';                    }

// when data class version is changed here, change it also in python
// constructors
DataSequence.prototype.currentVersion = function()  {
  let version = 1;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}

DataSequence.prototype.makeSample = function()  {
// this function created a fake data object for use in Workflow Creator
  this.setSubtype ( 'protein' );
  return this;
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

/*
  DataSequence.prototype.setUnknown = function() {
    this.setSubtype ( 'unknown' );
    this.files[file_key.seq] = '(unknown)';
    this.jobId      = '0';                 // Id of producing job
    this.dataId     = '0000-00';           // (unique) data Id
    this.dname      = 'unknown sequence';  // data name for displaying
  }
*/

  DataSequence.prototype.extend = function() {
    let seqext     = $.extend ( true,{},this );
    seqext.xyzmeta = $.extend ( true,{},this.xyzmeta );
    return seqext;
  }


  DataSequence.prototype.makeDataSummaryPage = function ( task ) {
    let dsp = new DataSummaryPage ( this );

    if (this.files[file_key.seq]=='(unknown)')

      dsp.makeRow ( 'Contents','** UNKNOWN SEQUENCE **','Macromolecular sequence' );

    else  {

      dsp.makeRow ( 'Length',this.size  ,'Number of residues or base pairs' );
      dsp.makeRow ( 'Weight',round(this.weight,2),'Molecular weight' );

      dsp.makeRow ( 'Contents','','Macromolecular sequence' );

      let req_data  = {};
      req_data.meta = {};
      req_data.meta.project = task.project;
      req_data.meta.id      = this.jobId;
      req_data.meta.file    = 'output/' + this.files[file_key.seq];

      serverRequest ( fe_reqtype.getJobFile,req_data,'Inspect sequence data',
                      function(data){
        dsp.table.setLabel ( '<pre>'+data+'</pre>', dsp.trow-1,1, 1,1 );
      },null,'persist');

    }

    return dsp;

  }


  DataSequence.prototype.layCustomDropdownInput = function ( dropdown )  {
  let customGrid = dropdown.customGrid;
  let row        = 0;
  let grid       = null;

    this.makeASUContentInput = function ( g )  {
      g.setLabel ( 'Number of copies in ASU:',0,0,1,1 ).setFontItalic ( true );
      customGrid.ncopies_inp = g.setInputText ( this.ncopies,0,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify the anticipated number of sequence copies ' +
                      'in asymmetric unit' )
                    .setWidth_px ( 50 );
      g.setVerticalAlignment ( 0,0,'middle' );
    }

    if (startsWith(dropdown.layCustom,'asu-content'))  {

      grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      this.makeASUContentInput ( grid );

    } else if (startsWith(dropdown.layCustom,'stoichiometry'))  {

      grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      grid.setLabel ( 'Number of copies in a.s.u.:',0,0,1,1 )
          .setFontItalic ( true ).setNoWrap ( true );
      let nc_value = Math.max ( 1,this.ncopies );
      /*
      if ((dropdown.layCustom=='stoichiometry-wauto') && this.ncopies_auto)
        nc_value = '';
      customGrid.ncopies_inp = grid.setInputText ( nc_value,0,1,1,1 )
                    .setStyle ( 'text','integer','auto',
                      'Specify stoichiometric coefficent for given sequence ' +
                      'in the crystal' )
                    .setWidth_px ( 50 );
      */
      customGrid.ncopies_inp = grid.setInputText ( nc_value,0,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify stoichiometric coefficent for given sequence ' +
                      'in the crystal' )
                    .setWidth_px ( 50 );
      grid.setVerticalAlignment ( 0,0,'middle' );

      if (row>0)
        customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );

    } else if (startsWith(dropdown.layCustom,'ncopies-spred'))  {

      grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      grid.setLabel ( 'Number of copies in complex:',0,0,1,1 )
          .setFontItalic ( true ).setNoWrap ( true );
      if (!('npred' in this))
        this.npred = 1;
      let ncsp_value = Math.max ( 1,this.npred );
      customGrid.ncopies_inp = grid.setInputText ( ncsp_value,0,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify number of sequence copies in complex' )
                    .setWidth_px ( 50 );
      grid.setVerticalAlignment ( 0,0,'middle' );

      if (row>0)
        customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );

    } else if (dropdown.layCustom=='chain-input-list')  {

      if (!('chain_list' in this))
        this.chain_list = []; // list of linked coordinate chains (for MR model prep)
      grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      grid.setLabel ( 'Associated chains:',0,0,1,1 )
          .setFontItalic ( true ).setNoWrap ( true );
      customGrid.chain_list_inp = grid.setInputText ( this.chain_list,0,1,1,1 )
                    .setStyle ( 'text','','A,B,C,...',
                      'Comma-separated list of chains from template structure ' +
                      'corresponding to given sequence; put * for all chains in the model ' +
                      '(homomeric complexes only)' )
                    .setWidth_px ( 200 );
      grid.setVerticalAlignment ( 0,0,'middle' );

    } else if (dropdown.layCustom=='texteditor')  {
      // just a place hoilder for keeping row height
      customGrid.setLabel ( '&nbsp;',0,0,1,1 )   
                .setFontItalic(true).setNoWrap().setHeight_px(34);
    }

  }


  DataSequence.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

    if (startsWith(dropdown.layCustom,'asu-content')   ||
        startsWith(dropdown.layCustom,'stoichiometry') ||
        startsWith(dropdown.layCustom,'ncopies-spred'))  {
      /*
      let nc_value = customGrid.ncopies_inp.getValue();
      this.ncopies_auto = (nc_value.length<=0);
      if (!this.ncopies_auto)
        this.ncopies = parseInt ( nc_value );
      */
      let nc_value = customGrid.ncopies_inp.getValue().trim();
      if ((!nc_value) || customGrid.ncopies_inp.element.validity.patternMismatch)
        msg = 'Number of copies must be positive integer';
      else  {
        nc_value = parseInt ( nc_value );
        if (startsWith(dropdown.layCustom,'ncopies-spred'))
              this.npred   = nc_value;
        else  this.ncopies = nc_value;
      }
    } else if (dropdown.layCustom=='chain-input-list')  {
      this.chain_list = customGrid.chain_list_inp.getValue();
    }

    return msg;

  }

  // subtypeDescription() should return detail description of given subtype
  // in context of specific data object. This description is used in
  // TaskDataDialog. Empty return will suppress description output in
  // task data dialog.
  DataSequence.prototype.subtypeDescription = function ( subtype )  {
    switch (subtype)  {
      case 'protein' : return '(protein)';
      case 'rna'     : return '(RNA)';
      case 'dna'     : return '(DNA)';
      default : ;
    }
    return DataTemplate.prototype.subtypeDescription.call ( this,subtype );
  }

  // See use of this function in cofe.dialog_taskdata.js
  DataSequence.prototype.ddesc_bridge_word = function()  {
    return ' ';
  }


} else  {
  //  for server side

  module.exports.DataSequence = DataSequence;

}
