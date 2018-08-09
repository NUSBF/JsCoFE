
/*
 *  =================================================================
 *
 *    08.08.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.xyz.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Data Class
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

function DataXYZ()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type    = 'DataXYZ';
  this.xyzmeta  = {};
  this.exclLigs = ['(agents)'];  // list of excluded ligands for PISA
  this.selChain = '(all)';       // selected chains for comparison

}

if (__template)
      DataXYZ.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataXYZ.prototype = Object.create ( DataTemplate.prototype );
DataXYZ.prototype.constructor = DataXYZ;


// ===========================================================================

DataXYZ.prototype.title      = function()  { return 'Coordinates';             }
DataXYZ.prototype.icon_small = function()  { return './images/data_20x20.svg'; }
DataXYZ.prototype.icon_large = function()  { return './images/data.svg';       }

// when data class version is changed here, change it also in python
// constructors
DataXYZ.prototype.currentVersion = function() { return 1; } // from 01.12.2017

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataXYZ.prototype.addToInspectData = function ( dsp )  {}

  DataXYZ.prototype.getSpaceGroup = function() {
    if ('cryst' in this.xyzmeta)
      if (this.xyzmeta.cryst.spaceGroup.length>0)
        return this.xyzmeta.cryst.spaceGroup;
    return 'Unspecified';
  }

  DataXYZ.prototype.getCellParametersHTML= function() {
    if ('cryst' in this.xyzmeta)
      if (this.xyzmeta.cryst.a>2.0)
        return  this.xyzmeta.cryst.a     + '&nbsp;&nbsp;' +
                this.xyzmeta.cryst.b     + '&nbsp;&nbsp;' +
                this.xyzmeta.cryst.c     + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                this.xyzmeta.cryst.alpha + '&nbsp;&nbsp;' +
                this.xyzmeta.cryst.beta  + '&nbsp;&nbsp;' +
                this.xyzmeta.cryst.gamma;
    return 'Unspecified';
  }

  DataXYZ.prototype.getCellParameters = function() {
    if ('cryst' in this.xyzmeta)
      if (this.xyzmeta.cryst.a>2.0)
        return  [this.xyzmeta.cryst.a,
                 this.xyzmeta.cryst.b,
                 this.xyzmeta.cryst.c,
                 this.xyzmeta.cryst.alpha,
                 this.xyzmeta.cryst.beta,
                 this.xyzmeta.cryst.gamma];
    return [0.0,0.0,0.0,0.0,0.0,0.0];
  }


  DataXYZ.prototype.inspectXYZData = function ( dsp ) {
    //  {
    //    cryst: {
    //        spaceGroup: 'P 31 2 1',
    //        a     : 64.720,
    //        b     : 64.720,
    //        c     : 69.570,
    //        alpha : 90.00,
    //        beta  : 90.00,
    //        gamma : 120.00
    //      },
    //    xyz: [
    //      { 'model':1,
    //        'chains': [
    //          { 'id': 'A', 'file': 'fname_A.pdb', 'type': 'AA',  'size': 100 }, // aminoacids
    //          { 'id': 'B', 'file': 'fname_B.pdb', 'type': 'DNA', 'size': 50 },  // DNA
    //          { 'id': 'C', 'file': 'fname_C.pdb', 'type': 'RNA', 'size': 50 }   // RNA
    //                  ]
    //      }
    //    ]
    //  }

    if ('cryst' in this.xyzmeta)  {
      if (this.xyzmeta.cryst.spaceGroup.length>0)  {
        dsp.makeRow ( 'Space Group',this.xyzmeta.cryst.spaceGroup,'Space group' );
        dsp.makeRow ( 'Cell parameters (a,b,c,&alpha;,&beta;,&gamma;)',
                      this.getCellParametersHTML(),'Cell parameters' );
      }
    }

    var n   = 1;
    var xyz = this.xyzmeta.xyz;
    for (var i=0;i<xyz.length;i++)
      n += xyz[i].chains.length;

    dsp.table.setHeaderText ( 'Contents',dsp.trow,0, n,1 );
    dsp.table.setHorizontalAlignment ( dsp.trow,0,'left' );
    dsp.table.setHeaderText ( 'Model'   ,dsp.trow,1, 1,1 );
    dsp.table.setHeaderText ( 'Chain'   ,dsp.trow,2, 1,1 );
    dsp.table.setHeaderText ( 'Type'    ,dsp.trow,3, 1,1 );
    dsp.table.setHeaderText ( 'Size'    ,dsp.trow,4, 1,1 );
    dsp.table.setLabel      ( ' '       ,dsp.trow,5, n,1 );
    dsp.table.setCellSize   ( '90%',''  ,dsp.trow,5 );
    dsp.trow++;

    for (var i=0;i<this.xyzmeta.xyz.length;i++)  {
      var xyzi = this.xyzmeta.xyz[i];
      var col  = 1;
      dsp.table.setLabel ( xyzi.model,dsp.trow,0,xyzi.chains.length,1 );
      for (var j=0;j<xyzi.chains.length;j++)  {
        dsp.table.setLabel ( xyzi.chains[j].id  ,dsp.trow,col  , 1,1 );
        dsp.table.setLabel ( xyzi.chains[j].type,dsp.trow,col+1, 1,1 );
        dsp.table.setLabel ( xyzi.chains[j].size,dsp.trow,col+2, 1,1 );
        col = 0;
        dsp.trow++;
      }
    }

  }

  DataTemplate.prototype.makeDataSummaryPage = function ( task )  {
  var dsp = new DataSummaryPage ( this );
    if (this._type=='DataStructure')
      dsp.makeRow ( 'XYZ file name',this.files[file_key.xyz],'Name of file with XYZ coordinates' );
    else
      for (var key in this.files) {
        if (this.files.hasOwnProperty(key))
          dsp.makeRow ( 'File name',this.files[key],'Imported file name' );
    this.inspectXYZData   ( dsp  );
    this.addToInspectData ( dsp  );
    dsp .addUglyMolButton ( task );
    return dsp;
  }

  var _agents = [
      'BE7',  'MRD',  'MHA',  'BU3',  'EDO',  'PGO',  'BU2',  'PDO',
      'BU1',  'PG6',  '1BO',  'PE7',  'PG5',  'TFP',  'DHD',  'PEU',
      'TRS',  'TAU',  'SBT',  'SAL',  'MPD',  'IOH',  'IPA',  'PGE',
      'PIG',  'B3P',  'BTB',  'NHE',  'C8E',  'OTE',  'PE4',  'XPE',
      'PE8',  'P33',  'N8E',  '2OS',  '1PS',  'CPS',  'DMX',  'MPO',
      'GCD',  'IDT',  'DXG',  'CM5',  'ACA',  'ACT',  'ACN',  'CCN',
      'AGC',  'GLC',  'MAN',  'DR6',  'NH4',  'AZI',  'BNG',  'BOG',
      'LAK',  'BGC',  'BMA',  'BCN',  'BRO',  'CAC',  'CBX',  'FMT',
      'ACY',  'CBM',  'CLO',  'FCL',  'CIT',  '3CO',  'NCO',  'CU1',
      'CYN',  'MA4',  'BTC',  'CYS',  'TAR',  'GLO',  'MTL',  'DPR',
      'SOR',  'SYL',  'DMU',  'DDQ',  'DMS',  'DMF',  'DIO',  'DOX',
      '12P',  'SDS',  'LMT',  'EOH',  'EEE',  'EDO',  'EGL',  'FLO',
      'TRT',  'FCY',  'FRU',  'GBL',  'GLC',  'GLY',  'GPX',  'HTO',
      'HTG',  'B7G',  'C10',  '16D',  'HEZ',  'IOD',  'IDO',  'IOD',
      'ICI',  'ICT',  'IPA',  'TLA',  'LAT',  'LBT',  'LDA',  'MN3',
      'MRY',  'MOH',  'BEQ',  'C15',  'MG8',  'POL',  'NO3',  'JEF',
      'P4C',  'CE1',  'DIA',  'CXE',  'IPH',  'PIN',  '15P',  'CRY',
      'GOL',  'PGR',  'PGO',  'PGQ',  'SPD',  'SPK',  'SPM',  'SUC',
      'SO4',  'SUL',  'TBU',  'TMA',  'TEP',  'SCN',  'TRE',  'PGE',
      'ETF',  '144',  'UMQ',  'URE',  'YT3',  'ZN2',  'FE2',  '3NI',
      'AL' ,  'BA' ,  'BR' ,  'CD' ,  'CA' ,  'CM' ,  'CS' ,  'CL' ,
      'CO' ,  'CU' ,  'CN' ,  'FE' ,  'PB' ,  'LI' ,  'MG' ,  'MN' ,
      'HG' ,  'NI' ,  'RB' ,  'AG' ,  'NA' ,  'SR' ,  'Y1' ,  'ZN' ,
      'F'  ,  'K'
  ];


  DataXYZ.prototype.layCustomDropdownInput = function ( dropdown ) {

    var customGrid = dropdown.customGrid;

    if (dropdown.layCustom=='cell-info')  {

      customGrid.setLabel ( 'Space group:&nbsp;',0,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( this.getSpaceGroup(),0,1,1,1 ).setNoWrap();
      customGrid.setLabel ( 'Cell:&nbsp;',1,0,1,1 ).setFontItalic(true);
      customGrid.setLabel ( this.getCellParametersHTML(),1,1,1,2 );
      customGrid.setLabel ( ' ',2,0,1,1 ).setHeight_px ( 8 );

    } else if (dropdown.layCustom=='pisa')  {

      if (this.xyzmeta.ligands.length>0)  {

        if (this.exclLigs.indexOf('(agents)')>=0)  {
          this.exclLigs = [];
          for (var i=0;i<this.xyzmeta.ligands.length;i++)
            if (_agents.indexOf(this.xyzmeta.ligands[i])>=0)
              this.exclLigs.push ( this.xyzmeta.ligands[i] );
        }

        var ncols = 6;
        customGrid.setLabel ( 'Uncheck ligands that are not part of biochemical system:',
                              0,0,1,ncols+1 ).setFontItalic(true).setNoWrap();
        customGrid.cbxs = [];
        var row = 1;
        var col = 0;
        for (var i=0;i<this.xyzmeta.ligands.length;i++)  {
          if (col>=ncols)  {
            col = 0;
            row++;
          }
          customGrid.cbxs.push (
            customGrid.setCheckbox ( this.xyzmeta.ligands[i],
                            (this.exclLigs.indexOf(this.xyzmeta.ligands[i])<0),
                            row,col,1,1 ).setWidth_px ( 50 )
          );
          customGrid.setCellSize ( '50px','', row,col++ );
        }

        while (col<ncols)
          customGrid.setLabel ( ' ',row,col++,1,1 ).setWidth ( '50px' );

      }

//    } else if (dropdown.layCustom.startsWith('chain-sel')) {
    } else if (startsWith(dropdown.layCustom,'chain-sel')) {

      customGrid.setLabel ( 'Select chain:&nbsp;',0,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( 0,0,'middle' );

      customGrid.chainSel = new Dropdown();
      customGrid.chainSel.setWidth ( '120%' );
      customGrid.chainSel.addItem ( 'All','','(all)',this.chainSel=='(all)' );
      var xyz = this.xyzmeta.xyz;
      for (var i=0;i<xyz.length;i++)  {
        var chains = xyz[i].chains;
        for (var j=0;j<chains.length;j++)
          if ((chains[j].type=='Protein') || (dropdown.layCustom=='chain-sel')) {
            var id = chains[j].id;
            if (xyz.length>1)
              id = '/' + xyz[i].model + '/' + id;
            customGrid.chainSel.addItem ( id,'',id,this.chainSel==id );
          }
      }
      customGrid.setWidget ( customGrid.chainSel, 0,1,1,2 );
      //customGrid.setCellSize ( '160px','',0,1 );
      customGrid.chainSel.make();

      customGrid.setLabel ( ' ',1,0,1,2 ).setHeight_px ( 8 );

    }

  }

  DataXYZ.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

    if (dropdown.layCustom=='pisa')  {

      this.exclLigs = [];
      for (var i=0;i<this.xyzmeta.ligands.length;i++)
        if (!customGrid.cbxs[i].getValue())
          this.exclLigs.push ( this.xyzmeta.ligands[i] );

//    } else if (dropdown.layCustom.startsWith('chain-sel'))  {
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {

      this.chainSel = customGrid.chainSel.getValue();

    }

    return msg;

  }


} else  {
  //  for server side
  module.exports.DataXYZ = DataXYZ;

}
