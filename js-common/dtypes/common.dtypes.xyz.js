
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template_d = null;
var __cmd        = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template_d = require ( './common.dtypes.template' );
  __cmd        = require ( '../common.commands' );
}

// ===========================================================================

const xyz_subtype = {
  MMCIF_ONLY  : 'mmcif_only'
}

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataXYZ()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type         = 'DataXYZ';
  this.xyzmeta       = {};
  this.exclLigs      = ['(agents)'];  // list of excluded ligands for PISA
  //this.selChain      = '(all)';       // selected chains for comparison
  this.chainSel      = '';
  this.chainSelType  = '';
  this.BF_correction = 'none';       // "none", "alphafold", "rosetta"
  this.coot_meta     = null;

}

// if (__template_d)
//       DataXYZ.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataXYZ.prototype = Object.create ( DataTemplate.prototype );
// DataXYZ.prototype.constructor = DataXYZ;

if (__template_d)
  __cmd.registerClass1 ( 'DataXYZ',DataXYZ,__template_d.DataTemplate.prototype );
else    registerClass1 ( 'DataXYZ',DataXYZ,DataTemplate.prototype );

// ===========================================================================

DataXYZ.prototype.title = function()  { return 'Structure Model'; }
DataXYZ.prototype.icon  = function()  { return 'data';            }

// when data class version is changed here, change it also in python
// constructors
DataXYZ.prototype.currentVersion = function()  {
let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


DataXYZ.prototype.makeSample = function()  {
// this function created a fake data object for use in Workflow Creator
  this.setSubtype ( 'protein' );
  this.addSubtype ( 'rna'     );
  this.addSubtype ( 'dna'     );
  this.xyzmeta = {
    "xyz": [{ "chains": [{"id": "A","type": "Protein"},
                          {"id": "D","type": "RNA"},
                          {"id": "E","type": "RNA"}
                        ],
              "model": 1
            }]
  };
  return this;
}


// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  DataXYZ.prototype.addToInspectData = function ( dsp )  {
    if (('BF_correction' in this) && (this.BF_correction!='none'))  {
      let msg = null;
      switch (this.BF_correction)  {
        case 'alphafold' : msg = 'Alphafold model, B-factors are recalculated'; break;
        case 'rosetta'   : msg = 'Rosetts model, B-factors are recalculated';   break;
        case 'alphafold-suggested' : msg = 'Can be an Alphafold model; check ' +
                                           'recalculation of B-factors where needed'; 
                         break;
        default:
        case 'rosetta-suggested' : msg = 'Can be a Rosetta model, check ' +
                                         'recalculation of B-factors where needed';
      }
      dsp.makeRow ( 'B-factor correction',msg,'Type of B-factors correction' );
      // if (this.BF_correction=='alphafold')  corr_model = 'AlphaFold';
      //                                 else  corr_model = 'Rosetta';
      // dsp.makeRow ( 'B-factor correction','Assuming ' + corr_model + ' model',
      //               'Model for B-factors re-calculation' );
      dsp.trow++;
    }
  }

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
    //          { 'id': 'A', 'file': 'fname_A.pdb', 'type': 'Protein','size': 100 }, // aminoacids
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

    let n   = 1;
    let xyz = this.xyzmeta.xyz;
    if (xyz)
      for (let i=0;i<xyz.length;i++)
        n += xyz[i].chains.length;

    dsp.table.setHeaderText ( 'Contents',dsp.trow,0, 1,1 );
    dsp.table.setVerticalAlignment   ( dsp.trow,0,'top' );
    dsp.table.setHorizontalAlignment ( dsp.trow,0,'left' );

    /*
    let table = dsp.table.setTable ( dsp.trow,1, 1,1 );
    $(table.element).css({'box-shadow':'none','width':'10%'});
    dsp.trow++;

    let trow = 0;
    table.setHeaderText ( 'Model'   ,trow,0, 1,1 );
    table.setHeaderText ( 'Chain'   ,trow,1, 1,1 );
    table.setHeaderText ( 'Type'    ,trow,2, 1,1 );
    table.setHeaderText ( 'Size'    ,trow,3, 1,1 );
    // dsp.table.setLabel      ( ' '       ,dsp.trow,5, n,1 );
    // dsp.table.setCellSize   ( '90%',''  ,dsp.trow,5 );
    trow++;

    if (xyz)
      for (let i=0;i<xyz.length;i++)  {
        let xyzi = xyz[i];
        table.setLabel ( xyzi.model,trow,0,xyzi.chains.length,1 );
        let col  = 0;
        for (let j=0;j<xyzi.chains.length;j++)  {
          if (j>0)
            table.setLabel ( '',trow,col, 1,1 );
          table.setLabel ( xyzi.chains[j].id  ,trow,col+1, 1,1 );
          table.setLabel ( xyzi.chains[j].type,trow,col+2, 1,1 );
          table.setLabel ( xyzi.chains[j].size,trow,col+3, 1,1 );
          // col = 0;
          trow++;
        }
      }
    */
    
    dsp.table.setHeaderText ( 'Contents',dsp.trow,0, n,1 );
    dsp.table.setHorizontalAlignment ( dsp.trow,0,'left' );
    dsp.table.setHeaderText ( 'Model'   ,dsp.trow,1, 1,1 );
    dsp.table.setHeaderText ( 'Chain'   ,dsp.trow,2, 1,1 );
    dsp.table.setHeaderText ( 'Type'    ,dsp.trow,3, 1,1 );
    dsp.table.setHeaderText ( 'Size'    ,dsp.trow,4, 1,1 );
    dsp.table.setLabel      ( ' '       ,dsp.trow,5, n,1 );
    dsp.table.setCellSize   ( '90%',''  ,dsp.trow,5 );
    dsp.trow++;

    if (xyz)
      for (let i=0;i<xyz.length;i++)  {
        let xyzi = xyz[i];
        let col  = 1;
        dsp.table.setLabel ( xyzi.model,dsp.trow,0,xyzi.chains.length,1 );
        for (let j=0;j<xyzi.chains.length;j++)  {
          dsp.table.setLabel ( xyzi.chains[j].id  ,dsp.trow,col  , 1,1 );
          dsp.table.setLabel ( xyzi.chains[j].type,dsp.trow,col+1, 1,1 );
          dsp.table.setLabel ( xyzi.chains[j].size,dsp.trow,col+2, 1,1 );
          col = 0;
          dsp.trow++;
        }
      }

  }

  DataXYZ.prototype.makeDataSummaryPage = function ( task )  {
  let dsp = new DataSummaryPage ( this );
    if (this._type=='DataStructure')  {
      if (this.files.hasOwnProperty(file_key.xyz))
        dsp.makeRow ( 'XYZ file name',this.files[file_key.xyz],'Name of file with XYZ coordinates' );
      else if (this.files.hasOwnProperty(file_key.sub))
        dsp.makeRow ( 'HA-XYZ file',this.files[file_key.sub],'Heavy atom (substructure) file name' );
      if (file_key.mmcif in this.files)
        dsp.makeRow ( 'mmCIF file name',this.files[file_key.mmcif],
                      'Name of file with XYZ coordinates in mmCIF (deposition) format' );
    } else  {
      for (let key in this.files)
        if (this.files.hasOwnProperty(key))
          dsp.makeRow ( 'File name',this.files[key],'Imported file name' );
    }

    if (this.coot_meta)
      dsp.makeRow ( 'Coot state','present','Coot scripts with custom settings or data' );

    this.inspectXYZData   ( dsp  );
    this.addToInspectData ( dsp  );
    dsp .addUglyMolButton ( task );
    
    return dsp;

  }

  const _agents = [
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


  DataXYZ.prototype.getChainList = function()  {
  let xyz  = this.xyzmeta.xyz;
  let list = [];
    if (xyz)
      for (let i=0;i<xyz.length;i++)  {
        let chains = xyz[i].chains;
        for (let j=0;j<chains.length;j++)  {
          let item   = {};
          item.id    = chains[j].id;
          item.model = xyz[i].model;
          item.type  = chains[j].type;
          if (xyz.length>1)
            item.fullId = '/' + xyz[i].model + '/' + chains[j].id;
          else
            item.fullId = chains[j].id;
          item.label = item.fullId + ' (' + chains[j].type.toLowerCase() + ')';
          list.push ( item );
        }
      }
    return list;
  }


  DataXYZ.prototype.__put_BF_correction_sel = function ( customGrid,row )  {
    customGrid.BF_correction = null;
    if (this.BF_correction=='alphafold')
      customGrid.setLabel ( 'This is an Alphafold model (B-factors are recalcuated)',
                            row,0,1,3 ).setFontItalic(true).setNoWrap();
    else if (this.BF_correction=='rosetta')
      customGrid.setLabel ( 'This is a Rosetta model (B-factors are recalcuated)',
                            row,0,1,3 ).setFontItalic(true).setNoWrap();
    else if (this.BF_correction!='pdb')  {
      customGrid.setLabel ( 'Correct B-factors:',row,0,1,1 ).setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,0,'middle' );
      customGrid.BF_correction = new Dropdown();
      // customGrid.BF_correction.setWidth ( '250px' );
      customGrid.BF_correction.addItem ( 'do not correct','','none',
                                         this.BF_correction=='none' );
      customGrid.BF_correction.addItem ( 'assuming Alphafold model','',
                                         'alphafold-suggested',
                                         this.BF_correction=='alphafold-suggested' );
      customGrid.BF_correction.addItem ( 'assuming Rosetta model','',
                                         'rosetta-suggested',
                                         this.BF_correction=='rosetta-suggested' );
      customGrid.setWidget ( customGrid.BF_correction, row,1,1,2 );
      customGrid.BF_correction.make();
    }
  }


  DataXYZ.prototype.layCustomDropdownInput = function ( dropdown )  {

    let customGrid = dropdown.customGrid;

    if (dropdown.layCustom=='cell-info')  {

      customGrid.setLabel ( 'Space group:&nbsp;',0,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( this.getSpaceGroup(),0,1,1,1 ).setNoWrap();
      customGrid.setLabel ( 'Cell&nbsp;(a,b,c,&alpha;,&beta;,&gamma;):&nbsp;',1,0,1,1 )
                .setFontItalic(true);
      customGrid.setLabel ( this.getCellParametersHTML(),1,1,1,2 );
      customGrid.setLabel ( ' ',2,0,1,1 ).setHeight_px ( 8 );

    } else if (dropdown.layCustom=='pisa')  {

      if (this.xyzmeta.ligands.length>0)  {

        if (this.exclLigs.indexOf('(agents)')>=0)  {
          this.exclLigs = [];
          for (let i=0;i<this.xyzmeta.ligands.length;i++)
            if (_agents.indexOf(this.xyzmeta.ligands[i])>=0)
              this.exclLigs.push ( this.xyzmeta.ligands[i] );
        }

        let ncols = 6;
        customGrid.setLabel ( 'Uncheck ligands that are not part of biochemical system:',
                              0,0,1,ncols+1 ).setFontItalic(true).setNoWrap();
        customGrid.cbxs = [];
        let row = 1;
        let col = 0;
        for (let i=0;i<this.xyzmeta.ligands.length;i++)  {
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

    } else if (startsWith(dropdown.layCustom,'chain-sel')) {

      let xyz    = this.xyzmeta.xyz;
      let labels = [];
      let ids    = [];
      if (xyz)
        for (let i=0;i<xyz.length;i++)  {
          let chains = xyz[i].chains;
          for (let j=0;j<chains.length;j++)
            if ((dropdown.layCustom=='chain-sel') ||
                (dropdown.layCustom.startsWith('chain-sel-protein') &&
                 (chains[j].type=='Protein'))     ||
                (((dropdown.layCustom=='chain-sel-MR') ||
                  (dropdown.layCustom=='chain-sel-poly-2')) &&
                 (['Protein','DNA','RNA','NA'].indexOf(chains[j].type)>=0)))  {
              let id = chains[j].id;
              if (xyz.length>1)
                id = '/' + xyz[i].model + '/' + id;
              labels.push ( id + ' (' + chains[j].type.toLowerCase() + ')' );
              ids   .push ( id );
              if (!this.chainSel)
                this.chainSel = id;
            }
        }

      if (dropdown.layCustom=='chain-sel-poly-2')  {

        if (ids.length<1)  {
          customGrid.setLabel ( 'No suitable chains found',0,0,1,1 )
                    .setFontItalic(true).setFontColor('maroon').setNoWrap();
          this.chainSel2 = '';
        } else if (ids.length==1)  {
          customGrid.setLabel ( 'Single-chain structure, unsuitable',0,0,1,1 )
                    .setFontItalic(true).setFontColor('maroon').setNoWrap();
          this.chainSel2 = '';
        } else  {

          if ((!('chainSel2' in this)) || (!this.chainSel2))  {
            this.chainSel2 = '';
            for (let j=0;(j<ids.length) && (!this.chainSel2);j++)
              if (ids[j]!=this.chainSel)
                this.chainSel2 = ids[j];
          }

          customGrid.setLabel ( '1<sup>st</sup> chain:&nbsp;',0,0,1,1 )
                    .setFontItalic(true).setNoWrap();
          customGrid.setVerticalAlignment ( 0,0,'middle' );
          customGrid.setLabel ( '2<sup>nd</sup> chain:&nbsp;',1,0,1,1 )
                    .setFontItalic(true).setNoWrap();
          customGrid.setVerticalAlignment ( 1,0,'middle' );

          customGrid.chainSel  = new Dropdown();
          customGrid.chainSel.setWidth ( '160px' );
          customGrid.chainSel2 = new Dropdown();
          customGrid.chainSel2.setWidth ( '160px' );

          for (let j=0;j<labels.length;j++)  {
            customGrid.chainSel .addItem ( labels[j],'',ids[j],this.chainSel==ids[j]  );
            customGrid.chainSel2.addItem ( labels[j],'',ids[j],this.chainSel2==ids[j] );
          }
          customGrid.setWidget ( customGrid.chainSel, 0,1,1,2 );
          customGrid.chainSel.make();
          customGrid.setWidget ( customGrid.chainSel2,1,1,1,2 );
          customGrid.chainSel2.make();

          let self = this;
          customGrid.chainSel.addOnChangeListener ( function(text,value){
            if (value==self.chainSel2)  {
              customGrid.chainSel.selectItem ( self.chainSel );
              new MessageBox ( 'Duplicate selection',
                '<h2>Duplicate chain selection</h2>Selected chains must be different.',
                'msg_stop'
              );
            } else  
              self.chainSel = value;
          });
          customGrid.chainSel2.addOnChangeListener ( function(text,value){
            if (value==self.chainSel)  {
              customGrid.chainSel2.selectItem ( self.chainSel2 );
              new MessageBox ( 'Duplicate selection',
                '<h2>Duplicate chain selection</h2>Selected chains must be different.',
                'msg_stop'
              );
            } else  
              self.chainSel2 = value;
          });

        }

        customGrid.setLabel ( ' ',2,0,1,2 ).setHeight_px ( 8 );

      } else  {

        if (labels.length<1)  {
          labels.unshift ( 'No suitable chains found' );
          ids   .unshift ( '(none)' );
        }
  
        customGrid.setLabel ( 'Select chain:&nbsp;',0,0,1,1 )
                  .setFontItalic(true).setNoWrap();
        customGrid.setVerticalAlignment ( 0,0,'middle' );

        customGrid.chainSel = new Dropdown();
        // customGrid.chainSel.setWidth ( '250px' );

        for (let j=0;j<labels.length;j++)
          customGrid.chainSel.addItem ( labels[j],'',ids[j],this.chainSel==ids[j] );
        customGrid.setWidget ( customGrid.chainSel, 0,1,1,2 );
        customGrid.chainSel.make();

        if ((dropdown.layCustom=='chain-sel-MR') || 
            (dropdown.layCustom=='chain-sel-protein-MR'))  {
          this.__put_BF_correction_sel ( customGrid,1 );
          customGrid.setLabel ( ' ',2,0,1,2 ).setHeight_px ( 8 );
        } else
          customGrid.setLabel ( ' ',1,0,1,2 ).setHeight_px ( 8 );

      }

    } else if (startsWith(dropdown.layCustom,'BF_correction'))  {

      this.__put_BF_correction_sel ( customGrid,0 );

    } else if (dropdown.layCustom=='texteditor')  {
      // just a place hoilder for keeping row height
      customGrid.setLabel ( '&nbsp;',0,0,1,1 )   
                .setFontItalic(true).setNoWrap().setHeight_px(34);
    }

  }


/*
  DataXYZ.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

        alert ( ' >>> ' );

    if (dropdown.layCustom=='pisa')  {

      this.exclLigs = [];
      for (let i=0;i<this.xyzmeta.ligands.length;i++)
        if (!customGrid.cbxs[i].getValue())
          this.exclLigs.push ( this.xyzmeta.ligands[i] );

    } else if ((startsWith(dropdown.layCustom,'chain-sel') && ('chainSel' in customGrid)) || 
               (dropdown.layCustom=='BF_correction'))  {

      this.chainSel = customGrid.chainSel.getValue();
      let lst = customGrid.chainSel.getText().replace('(','').replace(')','').split(' ');
      if (lst.length>1)
            this.chainSelType = lst[1];
      else  this.chainSelType = '';

      if (((dropdown.layCustom=='chain-sel-MR')         ||
           (dropdown.layCustom=='chain-sel-protein-MR') || 
           (dropdown.layCustom=='BF_correction')) && 
          customGrid.BF_correction)  {
        this.BF_correction = customGrid.BF_correction.getValue();
        alert ( ' >>> ' + this.BF_correction );
      }

      if (dropdown.layCustom=='chain-sel-poly-2')  {
        this.chainSel2 = customGrid.chainSel2.getValue();
        lst = customGrid.chainSel2.getText().replace('(','').replace(')','').split(' ');
        if (lst.length>1)
              this.chainSel2Type = lst[1];
        else  this.chainSel2Type = '';
      }

    }

    return msg;

  }
*/

  DataXYZ.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

    if (dropdown.layCustom=='pisa')  {

      this.exclLigs = [];
      for (let i=0;i<this.xyzmeta.ligands.length;i++)
        if (!customGrid.cbxs[i].getValue())
          this.exclLigs.push ( this.xyzmeta.ligands[i] );

    } else if ((startsWith(dropdown.layCustom,'chain-sel') && ('chainSel' in customGrid)))  {

      this.chainSel = customGrid.chainSel.getValue();
      let lst = customGrid.chainSel.getText().replace('(','').replace(')','').split(' ');
      if (lst.length>1)
            this.chainSelType = lst[1];
      else  this.chainSelType = '';

      if (dropdown.layCustom=='chain-sel-poly-2')  {
        this.chainSel2 = customGrid.chainSel2.getValue();
        lst = customGrid.chainSel2.getText().replace('(','').replace(')','').split(' ');
        if (lst.length>1)
              this.chainSel2Type = lst[1];
        else  this.chainSel2Type = '';
      }

    }

    if (('BF_correction' in customGrid) && customGrid.BF_correction)
      this.BF_correction = customGrid.BF_correction.getValue();

    return msg;

  }


  // subtypeDescription() should return detail description of given subtype
  // in context of specific data object. This description is used in
  // TaskDataDialog. Empty return will suppress description output in
  // task data dialog.
  DataXYZ.prototype.subtypeDescription = function ( subtype )  {
    switch (subtype)  {
      case 'protein' : return 'protein chain(s)';
      case 'rna'     : return 'RNA chain(s)';
      case 'dna'     : return 'DNA chain(s)';
      case 'na'      : return 'DNA/RNA chain(s)';
      case 'lig'     : return 'Ligand chain(s)';
      case xyz_subtype.MMCIF_ONLY :
                       return 'mmCIF only';
      default : ;
    }
    return DataTemplate.prototype.subtypeDescription.call ( this,subtype );
  }

} else  {
  //  for server side
  module.exports.DataXYZ     = DataXYZ;
  module.exports.xyz_subtype = xyz_subtype;

}
