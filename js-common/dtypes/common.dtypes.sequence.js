
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

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

  //this.ensembles = [];    // list of chosen ensemble models for MR

}

if (__template)
      DataSequence.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataSequence.prototype = Object.create ( DataTemplate.prototype );
DataSequence.prototype.constructor = DataSequence;


// ===========================================================================

DataSequence.prototype.title = function()  { return 'Macromolecular sequence'; }
DataSequence.prototype.icon  = function()  { return 'data';                    }

//DataSequence.prototype.icon_small = function()  { return 'data_20x20'; }
//DataSequence.prototype.icon_large = function()  { return 'data';       }

// when data class version is changed here, change it also in python
// constructors
DataSequence.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataSequence.prototype.extend = function() {
    var seqext = $.extend ( true,{},this );
    seqext.xyzmeta = $.extend ( true,{},this.xyzmeta );
    /*
    seqext.ensembles = [];
    for (var i=0;i<this.ensembles.length;i++)
      seqext.ensembles.push ( this.ensembles[i].extend() );
    */
    return seqext;
  }


  DataSequence.prototype.makeDataSummaryPage = function ( task ) {
    var dsp = new DataSummaryPage ( this );

    if (this.files[file_key.seq]=='(unknown)')

      dsp.makeRow ( 'Contents','** UNKNOWN SEQUENCE **','Macromolecular sequence' );

    else  {

      dsp.makeRow ( 'Contents'            ,'','Macromolecular sequence' );

      var req_data  = {};
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
  var customGrid = dropdown.customGrid;
  var row        = 0;

    this.makeASUContentInput = function ( g )  {
      g.setLabel ( 'Number of copies in ASU:',0,0,1,1 ).setFontItalic ( true );
      customGrid.ncopies_inp = g.setInputText ( this.ncopies,0,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify the anticipated number of sequence copies ' +
                      'in asymmetric unit' )
                    .setWidth_px ( 50 );
      g.setVerticalAlignment ( 0,0,'middle' );
    }

//    if (dropdown.layCustom.startsWith('asu-content'))  {
    if (startsWith(dropdown.layCustom,'asu-content'))  {

      var grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      this.makeASUContentInput ( grid );

//    } else if (dropdown.layCustom.startsWith('stoichiometry'))  {
    } else if (startsWith(dropdown.layCustom,'stoichiometry'))  {

      var grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      grid.setLabel ( 'Number of copies in a.s.u.:',0,0,1,1 )
          .setFontItalic ( true ).setNoWrap ( true );
      var nc_value = this.ncopies;
      if ((dropdown.layCustom=='stoichiometry-wauto') && this.ncopies_auto)
        nc_value = '';
      customGrid.ncopies_inp = grid.setInputText ( nc_value,0,1,1,1 )
                    .setStyle ( 'text','integer','auto',
                      'Specify stoichiometric coefficent for given sequence ' +
                      'in the crystal' )
                    .setWidth_px ( 50 );
      grid.setVerticalAlignment ( 0,0,'middle' );

    }

    if (row>0)
      customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );

  }


  DataSequence.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

//    if ((dropdown.layCustom.startsWith('asu-content')) ||
//        (dropdown.layCustom.startsWith('stoichiometry')))  {
    if (startsWith(dropdown.layCustom,'asu-content') ||
        startsWith(dropdown.layCustom,'stoichiometry'))  {
      var nc_value = customGrid.ncopies_inp.getValue();
      this.ncopies_auto = (nc_value.length<=0);
      if (!this.ncopies_auto)
        this.ncopies = parseInt ( nc_value );
    }

    /*
    this.ensembles = [];  // list of chosen ensemble models for MR

    if ('widgets' in customGrid)  {
      var n = 0;
      for (var i=0;i<customGrid.widgets.length;i++)  {
        var k = customGrid.widgets[i].ddn.getValue();
        if (k>=0)  {
          var de     = customGrid.ensembles[k].extend();
          de.ncopies = parseInt   ( customGrid.widgets[i].ncopies.getValue() );
          de.rmsd    = parseFloat ( customGrid.widgets[i].rmsd   .getValue() );
          this.ensembles.push ( de );
        }
      }
    }
    */

    return msg;

  }


} else  {
  //  for server side

  module.exports.DataSequence = DataSequence;

}
