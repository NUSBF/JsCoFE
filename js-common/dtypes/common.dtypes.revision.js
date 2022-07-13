
/*
 *  ==========================================================================
 *
 *    02.01.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.revision.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Structure Revision Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  ==========================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.template' );

// ===========================================================================

var revision_subtype = {
  asu          : 'asu',
  hkl          : 'hkl',
  seq          : 'seq',
  anomalous    : 'anomalous',
  xyz          : 'xyz',
  substructure : 'substructure',
  phases       : 'phases',
  ligands      : 'ligands',
  waters       : 'waters'
}

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataRevision()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type          = 'DataRevision';
  this.leadKey        = 0;      // data lead key: 0: undefined, 1: coordinates, 2: phases
  this.HKL            = null;
  this.ASU            = {};     // Asymmetric Unit Data
  this.ASU.jobNo      = 0;      // producing job number
  this.ASU.seq        = [];
  this.ASU.ha_type    = '';     // heavy atom type
  this.ASU.ndisulph   = '';     // number of disulphides
  this.ASU.nRes       = 0;
  this.ASU.molWeight  = 0.0;
  this.ASU.solvent    = 0.0;
  this.ASU.matthews   = 0.0;
  this.ASU.prob_matth = 0.0;
  this.Structure      = null;
  this.Substructure   = null;
  this.Ligands        = [];     // can be a few
  this.Options        = {       // input options used in interfaces
    'leading_structure' : '',   // substructure or structure
    'phasing_sel'       : 'substructure', // for phaser-ep
    'structure_sel'     : 'fixed-model',  // for mr-phases
    //'fixedmodel_cbx'    : true,           // for mr-phases
    //'fitindensity_cbx'  : false,          // for mr-phases
    'ncsmodel_sel'      : 'do-not-use',   // for parrot
    'seqNo'             : 0,              // selected sequence number (not used?)
    'load_all'          : false,          // for Coot-MB
    'useSubstruct'      : false           // used by modelcraft
  };

  this.backtrace      = false;  // take data only from the latest job

}

if (__template)
      DataRevision.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataRevision.prototype = Object.create ( DataTemplate.prototype );
DataRevision.prototype.constructor = DataRevision;


// ===========================================================================

DataRevision.prototype.title = function()  { return 'Structure Revision'; }
DataRevision.prototype.icon  = function()  { return 'data_xrayimages';    }

// when data class version is changed here, change it also in python
// constructors
DataRevision.prototype.currentVersion = function()  {
  var version = 5;  // advanced on Substructure inclusion
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side


  DataRevision.prototype.extend = function() {

    var revext = $.extend ( true,{},this );

    if (this.HKL)
      revext.HKL = this.HKL.extend();

    for (var i=0;i<revext.ASU.seq.length;i++)
      revext.ASU.seq[i] = this.ASU.seq[i].extend();

    if (this.Structure)
      revext.Structure = this.Structure.extend();

    if (this.Substructure)
      revext.Substructure = this.Substructure.extend();

    for (var i=0;i<revext.Ligands.length;i++)
      revext.Ligands[i] = this.Ligands[i].extend();

    return revext;

  }


  DataRevision.prototype.makeASUSummaryPage = function ( task )  {

    var dsp = new DataSummaryPage ( this );

    if (('jobNo' in this.ASU) && (this.ASU.jobNo>0))  {
      dsp.trow = 0;
      dsp.makeRow ( 'Producing job number',this.ASU.jobNo.toString(),'Id of job produced this dataset' );
    } else
      dsp.trow = 1;
    dsp.makeRow ( 'Total residues',this.ASU.nRes.toString(),'Total number of residues' );
    dsp.makeRow ( 'Total weight'  ,round(this.ASU.molWeight,0).toString(),'Total macromolecular weight' );
    dsp.makeRow ( 'Solvent %%'    ,round(this.ASU.solvent,1).toString(),'Solvent content' );
    dsp.makeRow ( 'Matthews coefficient',round(this.ASU.matthews,2).toString(),'Matthews coefficient' );
    dsp.makeRow ( 'P<sub>matthews</sub>',round(this.ASU.prob_matth,2).toString(),'Matthews probability' );

    var n = this.ASU.seq.length + 1;
    dsp.table.setHeaderText ( 'Contents',dsp.trow,0, n,1 );
    dsp.table.setHorizontalAlignment ( dsp.trow,0,'left' );
    dsp.table.setHeaderText ( '##'                ,dsp.trow,1, 1,1 );
    dsp.table.setHeaderText ( 'Sequence'          ,dsp.trow,2, 1,1 );
    dsp.table.setHeaderText ( 'N<sub>copies</sub>',dsp.trow,3, 1,1 );
    dsp.table.setHeaderText ( 'N<sub>res</sub>'   ,dsp.trow,4, 1,1 );
    dsp.table.setHeaderText ( 'Weight'            ,dsp.trow,5, 1,1 );
    dsp.table.setLabel      ( ' '                 ,dsp.trow,6, n,1 );
    dsp.table.setCellSize   ( '90%',''            ,dsp.trow,6 );
    dsp.trow++;

    for (var i=0;i<this.ASU.seq.length;i++)  {
      var seqi = this.ASU.seq[i];
      dsp.table.setLabel ( (i+1).toString()       ,dsp.trow,0, 1,1 ).setNoWrap();
      dsp.table.setLabel ( seqi.dname             ,dsp.trow,1, 1,1 ).setNoWrap();
      dsp.table.setLabel ( seqi.ncopies.toString(),dsp.trow,2, 1,1 );
      dsp.table.setLabel ( seqi.size.toString()   ,dsp.trow,3, 1,1 );
      dsp.table.setLabel ( round(seqi.weight,1).toString(),dsp.trow,4, 1,1 );
      dsp.trow++;
    }

    if (this.ASU.ha_type)
          dsp.makeRow ( 'HA type',this.ASU.ha_type,'Main anomalous scatterer' );
    else  dsp.makeRow ( 'HA type','<i>unspecified</i>','Main anomalous scatterer' );

    return dsp;

  }

  DataRevision.prototype.makeDataSummaryPage = function ( task ) {
    var dsp  = new Grid ( '' );
    dsp.tabs = new Tabs ();

    var tab1 = dsp.tabs.addTab ( 'General',true  );
    tab1.grid.setLabel  ( '<h3>Structure Revision R' + this.dataId + '</h3>',0,0,1,1 );
    var dataSummaryPage = new DataSummaryPage(this);
    var phases_source = 'unknown (possible bug)';
    var phases_type   = 'Not phased';
    if (this.Options.leading_structure=='structure')  {
      phases_source = 'Structure';
      phases_type   = this.Structure.phaseType();
    } else if (this.Options.leading_structure=='substructure')  {
      phases_source = 'Substructure';
      phases_type   = this.Substructure.phaseType();
    }
    if (this.Structure && this.Substructure)
      dataSummaryPage.makeRow ( 'Revision\'s phases from',phases_source,
                     'Dataset containing phases for using in subsequent tasks' );
    if (this.Structure || this.Substructure)
      dataSummaryPage.makeRow ( 'Phases\' type',phases_type,
                     'Type of phasing method used to calculate revision\'s phases' );
    tab1.grid.setWidget ( dataSummaryPage, 1,0,1,1 );

    if (this.HKL)  {
      var tab2 = dsp.tabs.addTab ( 'HKL',false );
      tab2.grid.setWidget ( this.HKL.makeDataSummaryPage(task), 0,0,1,1 );
    }

    var tab3 = dsp.tabs.addTab ( 'ASU',false );
    tab3.grid.setWidget ( this.makeASUSummaryPage(task), 0,0,1,1 );

    if (this.Structure)  {
      var tab4 = dsp.tabs.addTab ( 'Structure',false );
      tab4.grid.setWidget ( this.Structure.makeDataSummaryPage(task), 0,0,1,1 );
    }

    if (this.Substructure)  {
      var tab5 = dsp.tabs.addTab ( 'Substructure',false );
      tab5.grid.setWidget ( this.Substructure.makeDataSummaryPage(task), 0,0,1,1 );
    }

    dsp.setWidget ( dsp.tabs, 0,0,1,1 );

    return dsp;

  }

  DataRevision.prototype.inspectData = function ( task ) {
    var dsp = this.makeDataSummaryPage ( task );
    var dlg = new DataInspectDialog ( dsp,this.dname,'800px','700px' );

    function dsp_resize()  {
      dsp.setHeight_px ( $(dlg.element).dialog( "option", "height" )-128 );
      dsp.tabs.refresh();
    }

    dlg._options.height = 620;
    dlg._options.resize = function ( event, ui ) {
      window.setTimeout ( dsp_resize,0 );
    };

    dlg.launch();
    dsp_resize();

  }


  DataRevision.prototype._layCDI_Crank2 = function ( dropdown,mode )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();

    customGrid.phasing_sel = null;
    if ((mode=='crank2') && (this.Structure || this.Substructure))  {
      customGrid.setLabel ( 'phase using:',row,0,1,1 ).setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,0,'middle' );
      customGrid.phasing_sel = new Dropdown();
      if (this.Substructure)
        customGrid.phasing_sel.addItem (
                  'heavy-atom substructure (' + this.ASU.ha_type + ')',
                  '','substructure',this.Options.phasing_sel=='substructure' );
      if (this.Structure)  {
        customGrid.phasing_sel.addItem ( 'protein model',
                  '','model',this.Options.phasing_sel=='model' );
        this.Structure.layCustomDropdownInput ( dropdown );
      }
      if (this.Structure && this.Substructure)  {
        customGrid.phasing_sel.addItem (
                  'protein model and heavy-atom substructure (' + this.ASU.ha_type + ')',
                  '','model-and-substr',this.Options.phasing_sel=='model-and-substr' );
        this.Structure.layCustomDropdownInput ( dropdown );
      }
      customGrid.setWidget ( customGrid.phasing_sel, row++,1,1,7 );
      /*
      (function(rowNo){
        customGrid.phasing_sel.addOnChangeListener ( function(text,value){
          customGrid.setRowVisible ( rowNo,value!='substructure' );
        });
      }(row))
      */
      customGrid.phasing_sel.make();
      //if (this.Structure)
      //  customGrid.setRowVisible ( row,this.Options.phasing_sel!='substructure' );
      row++;
    }

    customGrid.sctNRow = row;
    customGrid.setLabel ( 'main anomalous scatterer:',row,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.ha_type = customGrid.setInputText ( this.ASU.ha_type,row,1,1,1 )
              .setStyle    ( 'text','','','Specify the atom type of dominant anomolous ' +
                             'scatterer (e.g., S, SE etc.)' )
              .setWidth_px ( 40 ).setMaxInputLength ( 2 );
    customGrid.ha_lbl  = customGrid.setLabel (
                  '<font color="maroon">(must be chosen)</font>&nbsp;&nbsp;&nbsp;' +
                  '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',row,2,1,1 )
              .setFontSize('80%').setNoWrap();
    customGrid.setVerticalAlignment ( row,0,'middle' );
    customGrid.setVerticalAlignment ( row,2,'middle' );
    customGrid.setCellSize ( '80%','',row,2 );

    customGrid.ndis_lbl = customGrid.setLabel ( 'number of S-S pairs:',row,3,1,3 )
                                    .setFontItalic(true).setNoWrap();
    customGrid.ndisulph = customGrid.setInputText ( this.ASU.ndisulph,row,4,1,1 )
              .setStyle    ( 'text','integer','','Optional number of disulphides ' +
                             'to be treated as S-S pairs. Ignored if left blank (default).' )
              .setWidth_px ( 36 ).setMaxInputLength ( 2 );
    customGrid.setVerticalAlignment ( row,3,'middle' );

    function showNDis()  {
      var ha_type = customGrid.ha_type.getValue().trim();
      var showdis = (ha_type.toLowerCase()=='s');
      customGrid.ndis_lbl.setVisible ( showdis );
      customGrid.ndisulph.setVisible ( showdis );
      customGrid.ha_lbl  .setVisible ( (ha_type.length<=0) );
    }

    function showHA()  {
      if (customGrid.phasing_sel)  {
        customGrid.setRowVisible ( customGrid.sctNRow,
                                   customGrid.phasing_sel.getValue()=='model' );
        if ('inpParamRef' in dropdown.grid)
          dropdown.task.inputChanged ( dropdown.grid.inpParamRef,'revision',1 );
      }
      showNDis();
    }

    customGrid.ha_type.addOnInputListener ( showNDis );
    if (customGrid.phasing_sel)
      customGrid.phasing_sel.addOnChangeListener ( showHA );
    //showNDis();
    showHA();

    this.HKL.layCustomDropdownInput ( dropdown );

  }

  DataRevision.prototype._layMROptions = function ( dropdown,row,sep_bool )  {
  var struct_sel_list = null;
  var customGrid = dropdown.customGrid;

    if (this.Options.leading_structure=='structure')  {

      struct_sel_list = [
        ['as fixed model'                       ,'fixed-model'      ],
        ['for fit in density and as fixed model','edfit-fixed-model'],
        ['only for fit in density'              ,'edfit'            ]
      ];

    } else if (this.Options.leading_structure=='substructure')  {

      customGrid.setLabel ( 'MR model will be fit in electron density of ' +
                            'heavy atom substructure',row++,0,1,4 )
                .setFontItalic(true).setNoWrap();

      if (this.Structure)
        struct_sel_list = [
          ['as fixed model'    ,'fixed-model' ],
          ['ignore and replace','ignore'      ]
        ];
      else if (sep_bool)
        customGrid.setLabel ( ' ',row,0,1,1 ).setHeight_px ( 8 );

    }

    if (struct_sel_list)  {
      customGrid.setLabel ( 'Use current structure:',row,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,0,'middle' );
      customGrid.structure_sel = new Dropdown();
      customGrid.setWidget ( customGrid.structure_sel,row,1,1,4 );
      for (var i=0;i<struct_sel_list.length;i++)
        customGrid.structure_sel.addItem (
                            struct_sel_list[i][0],'',struct_sel_list[i][1],
                            this.Options.structure_sel==struct_sel_list[i][1] );
      customGrid.structure_sel.make();
      customGrid.setCellSize ( '5%' ,'',row,0 );
      customGrid.setCellSize ( '95%','',row,1 );
      if (sep_bool)
        customGrid.setLabel ( ' ',++row,0,1,1 ).setHeight_px ( 8 );
    }

  }


  DataRevision.prototype._layCDI_Molrep = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();
    this._layMROptions ( dropdown,row,true );
  }

  DataRevision.prototype._layCDI_AsuMod = function ( dropdown )  {
    if (this.HKL.hasAnomalousSignal())  {
      var customGrid = dropdown.customGrid;
      customGrid.setLabel ( 'main anomalous scatterer:',0,0,1,1 ).setFontItalic(true).setNoWrap();
      customGrid.ha_type = customGrid.setInputText ( this.ASU.ha_type,0,1,1,1 )
                .setStyle    ( 'text','','','Specify atom type of anomolous ' +
                               'scatterers, or leave blank if uncertain.' )
                .setWidth_px ( 40 ).setMaxInputLength ( 2 );
      customGrid.setVerticalAlignment ( 0,0,'middle' );
    }
  }

  DataRevision.prototype._layCDI_PhaserEP = function ( dropdown )  {
  var customGrid = dropdown.customGrid;

    customGrid.setLabel ( 'Phase using:',0,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.setVerticalAlignment ( 0,0,'middle' );
    customGrid.phasing_sel = new Dropdown();
    if (this.Substructure)
      customGrid.phasing_sel.addItem (
                'heavy-atom substructure (' + this.ASU.ha_type + ')',
                '','substructure' ,this.Options.phasing_sel=='substructure' );
    if (this.Structure)  {
      customGrid.phasing_sel.addItem ( 'macromolecular model',
                '','model' ,this.Options.phasing_sel!='substructure' ); // != is correct!
      this.Structure.layCustomDropdownInput ( dropdown );
    }
    customGrid.setWidget ( customGrid.phasing_sel, 0,1,1,5 );
    customGrid.phasing_sel.addOnChangeListener ( function(text,value){
      customGrid.setRowVisible ( 1,value=='model' );
    });

    customGrid.phasing_sel.make();
    if (this.Structure)
      customGrid.setRowVisible ( 1,this.Options.phasing_sel!='substructure' );
    this.HKL.layCustomDropdownInput ( dropdown );

  }

  DataRevision.prototype._layCDI_PhaserMR = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();
  var row0       = row;
  var struct_sel_list = null;

    if (this.hasOwnProperty('phaser_meta'))  {

      customGrid.setLabel ( '<b>Prefitted models</b>:',row++,0,1,1 )
                .setFontItalic(true).setNoWrap();
      for (var ensname in this.phaser_meta['ensembles'])  {
        customGrid.setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                   this.phaser_meta['ensembles'][ensname]['ncopies'] +
                   'x ' + ensname + ' :',row,0,1,1 )
                  .setFontItalic(true).setNoWrap();
        customGrid.setLabel ( this.phaser_meta['ensembles'][ensname]['data'].files[file_key.xyz],
                              row++,1,1,4 ).setNoWrap();
      }

      customGrid.setLabel ( '<b>Phaser solution metadata:</b>',row,0,1,1 )
                .setFontItalic(true).setNoWrap();
      if (this.phaser_meta['sol'].files.hasOwnProperty(file_key.sol))
        customGrid.setLabel ( this.phaser_meta['sol'].files[file_key.sol],row++,1,1,4 )
                  .setNoWrap();
      else
        customGrid.setLabel ( '<b>absent (can be in error)</b>',row++,1,1,4 )
                  .setFontItalic(true).setNoWrap();
    }

    for (var i=row0;i<row;i++)  {
      customGrid.setCellSize ( '','12pt',i,0 );
      customGrid.setVerticalAlignment ( i,0,'middle' );
      customGrid.setCellSize ( '','12pt',i,1 );
      customGrid.setVerticalAlignment ( i,1,'middle' );
    }

    this._layMROptions ( dropdown,row,false );

    if (this.Structure || this.Substructure)
      dropdown.layCustom = 'phaser-mr-fixed';

    this.HKL.layCustomDropdownInput ( dropdown );

  }

  DataRevision.prototype._layCDI_Parrot = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();

    if (this.Structure && this.Substructure)  {
      var text = 'Will use phases from ';
      if (this.Options.leading_structure=='substructure')
            text += 'heavy-atom substructure (' + this.ASU.ha_type + ')';
      else  text += 'macromolecular model';
      customGrid.setLabel ( text,row++,0,1,7 )
                .setFontBold(true).setFontItalic(true).setNoWrap();
    }

    customGrid.setLabel ( 'Model for NCS detection:',row,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.setVerticalAlignment ( row,0,'middle' );
    customGrid.ncsmodel_sel = new Dropdown();
    customGrid.ncsmodel_sel.addItem ( 'do not use',
              '','do-not-use' ,this.Options.ncsmodel_sel=='do-not-use' );
    if (this.Substructure)
      customGrid.ncsmodel_sel.addItem (
                'heavy-atom substructure (' + this.ASU.ha_type + ')',
                '','substructure' ,this.Options.ncsmodel_sel=='substructure' );
    if (this.Structure)
      customGrid.ncsmodel_sel.addItem ( 'macromolecular model',
                '','model' ,this.Options.ncsmodel_sel=='model' );

    customGrid.setWidget ( customGrid.ncsmodel_sel, row,1,1,5 );
    customGrid.ncsmodel_sel.make();

  }

  DataRevision.prototype._layCDI_Structure = function ( dropdown,key )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();

    if (this.Structure && this.Substructure)  {
      var text = 'Will use phases from ';
      if (this.Options.leading_structure=='substructure')
            text += 'heavy-atom substructure (' + this.ASU.ha_type + ')';
      else  text += 'macromolecular model';
      customGrid.setLabel ( text,row++,0,1,7 )
                .setFontBold(true).setFontItalic(true).setNoWrap();
    }

    var structure = null;
    if (key>0)  {
      if (this.Options.leading_structure=='substructure')
            structure = this.Substructure;
      else  structure = this.Structure;
      structure.layCustomDropdownInput ( dropdown );
      if ((key==2) && this.Structure &&
          (this.Options.leading_structure=='substructure'))
        this.Structure.layCustomDropdownInput ( dropdown );
    }

    return structure;

  }


  DataRevision.prototype._layCDI_CootMB = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();
    if (this.Structure && this.Substructure)  {
      if (!('load_all' in this.Options))
        this.Options.load_all = false;
      var label = 'Load HA substructure';
      if (this.Options.leading_structure=='substructure')
        label = 'Load structure';
      customGrid.load_all_cbx = customGrid.setCheckbox ( label,
                                            this.Options.load_all,row,0, 1,1 );
      customGrid.setLabel ( ' ',++row,0,1,1 ).setHeight_px ( 8 );
    }
  }


  DataRevision.prototype._layCDI_ModelCraft = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = customGrid.getNRows();
    if (!('useSubstruct' in this.Options))
      this.Options.useSubstruct = false;
    if (this.Substructure)
      customGrid.use_substruct_cbx = customGrid.setCheckbox (
                        'Use substructure',this.Options.useSubstruct,row,0, 1,1 )
                .setTooltip ( 'Check if substructure atoms should be taken into ' +
                              'account as fixed model.' );
  }


  DataRevision.prototype.layCustomDropdownInput = function ( dropdown )  {

    switch (dropdown.layCustom)  {
      case 'asumod'     :
            this._layCDI_AsuMod ( dropdown );
          break;
      case 'phaser-ep'  :
            this._layCDI_PhaserEP ( dropdown );
          break;
      case 'reindex'    :  case 'refmac'     :  case 'ccp4build'  :
      case 'cell-info'  :  case 'changereso' :
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'modelcraft' :
            this._layCDI_ModelCraft ( dropdown );
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'parrot'     :
            this._layCDI_Parrot ( dropdown );
          break;
      case 'simbad'     :
            if (this.HKL)
              this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'shelxe'     :
            this._layCDI_Structure ( dropdown,0 );
          break;
      case 'acorn'      :
            this._layCDI_Structure ( dropdown,1 );
          break;
      case 'buccaneer-ws':
            this._layCDI_Structure ( dropdown,2 );
          break;
      case 'nautilus':
            this._layCDI_Structure ( dropdown,2 );
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'buster':
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'arpwarp'    :
            dropdown.Structure = this._layCDI_Structure ( dropdown,1 );
            //this.Structure.layCustomDropdownInput ( dropdown );
            //dropdown.Structure = this.Structure;  // this will add phase options for refmac
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'molrep'     :
            this._layCDI_Molrep ( dropdown );
          break;
      case 'phaser-mr'  :   case 'phaser-mr-fixed' :
            this._layCDI_PhaserMR ( dropdown );
          break;
      case 'crank2'     :
            this._layCDI_Crank2 ( dropdown,'crank2' );
          break;
      case 'shelx-auto' :
            this._layCDI_Crank2 ( dropdown,'shelx-auto' );
          break;
      case 'shelx-substr'  :
            this._layCDI_Crank2 ( dropdown,'shelx-substr' );
          break;
      case 'map-sel'    :
            if (this.Structure)
              this.Structure.layCustomDropdownInput ( dropdown );
            else if (this.Substructure)
                this.Substructure.layCustomDropdownInput ( dropdown );
          break;
      case 'coot-mb'    :
            this._layCDI_CootMB ( dropdown );
          break;
      default : ;
    }

  }

  DataRevision.prototype._collectCDI_Crank2 = function ( dropdown )  {
    var customGrid = dropdown.customGrid;
    var msg = '';
    if ('removeNonAnom' in customGrid)
      this.Structure.removeNonAnom = customGrid.removeNonAnom.getValue();
    if (customGrid.phasing_sel)
      this.Options.phasing_sel = customGrid.phasing_sel.getValue();
    if (this.ASU)  {
      this.ASU.ha_type = customGrid.ha_type.getValue().trim();
      if (!this.ASU.ha_type)
        msg += '|<b><i>Main anomalous scatterer must be given</i></b>';
      if (customGrid.hasOwnProperty('ndisulph') &&
          (this.ASU.ha_type.toLowerCase()=='s'))  {
        var ndisulph = customGrid.ndisulph.getValue();
        if (ndisulph.trim().length>0)  {
          if (isInteger(ndisulph))  {
            var ndisulph = parseInt(ndisulph);
            if (ndisulph>=0)
              this.ASU.ndisulph = ndisulph;
            else
              msg += '|<b><i>Number of disulphides should be positive</i></b>';
          } else
            msg += '|<b><i>Wrong format for number of disulphides</i></b>';
        } else
          this.ASU.ndisulph = '';
      }
    }
    msg += this.HKL.collectCustomDropdownInput ( dropdown );
    return msg;
  }

  DataRevision.prototype.collectCustomDropdownInput = function ( dropdown ) {
  var msg = '';

    switch (dropdown.layCustom)  {

      case 'asumod'     :
            if (this.ASU && this.HKL.hasAnomalousSignal())
              this.ASU.ha_type = dropdown.customGrid.ha_type.getValue();
          break;

      case 'reindex'    :  case 'refmac'     :  case 'ccp4build' :
      case 'changereso' :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'modelcraft' :
          if (this.Substructure)
            this.Options.useSubstruct = dropdown.customGrid.use_substruct_cbx.getValue();
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'phaser-mr'  :  case 'phaser-mr-fixed' :
          if ('structure_sel' in dropdown.customGrid)
            this.Options.structure_sel = dropdown.customGrid.structure_sel.getValue();
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'phaser-ep'  :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
          this.Options.phasing_sel = dropdown.customGrid.phasing_sel.getValue();
          if (this.Structure && (this.Options.phasing_sel=='model'))
            msg += this.Structure.collectCustomDropdownInput ( dropdown );
        break;

      case 'parrot'     :
          this.Options.ncsmodel_sel = dropdown.customGrid.ncsmodel_sel.getValue();
        break;

      case 'acorn'      :
          if (this.Options.leading_structure=='substructure')
                msg = this.Substructure.collectCustomDropdownInput ( dropdown );
          else  msg = this.Structure   .collectCustomDropdownInput ( dropdown );
        break;

      case 'buccaneer-ws' :
          if (this.Options.leading_structure=='substructure')  {
            msg = this.Substructure.collectCustomDropdownInput ( dropdown );
            if (this.Structure)
              msg = this.Structure.collectCustomDropdownInput ( dropdown );
          } else
            msg = this.Structure.collectCustomDropdownInput ( dropdown );
        break;

      case 'nautilus' :
          if (this.Options.leading_structure=='substructure')  {
            msg = this.Substructure.collectCustomDropdownInput ( dropdown );
            if (this.Structure)
              msg = this.Structure.collectCustomDropdownInput ( dropdown );
          } else
            msg = this.Structure.collectCustomDropdownInput ( dropdown );
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'buster' :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'arpwarp'    :
          if (this.Options.leading_structure=='substructure')
                dropdown.Structure = this.Substructure;  // because it gets lost at copying objects
          else  dropdown.Structure = this.Structure;     // because it gets lost at copying objects
          msg = dropdown.Structure.collectCustomDropdownInput ( dropdown ) +
                this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'molrep'     :
          if ('structure_sel' in dropdown.customGrid)
            this.Options.structure_sel = dropdown.customGrid.structure_sel.getValue();
          break;

      case 'crank2'     :
          msg = this._collectCDI_Crank2 ( dropdown );
        break;

      case 'simbad'     :
          if (this.HKL)
            msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;

      case 'shelx-auto'   :
      case 'shelx-substr' :
          msg = this._collectCDI_Crank2 ( dropdown );
        break;

      case 'map-sel' :
          if (this.Structure)
            this.Structure.collectCustomDropdownInput ( dropdown );
          else if (this.Substructure)
            this.Substructure.collectCustomDropdownInput ( dropdown );
        break;

      case 'coot-mb' :
          if ('load_all_cbx' in dropdown.customGrid)
            this.Options.load_all = dropdown.customGrid.load_all_cbx.getValue();
        break;

      case 'cell-info' :
      default          : ;

    }

    return msg;

  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataRevision.prototype.dataDialogHints = function ( subtype_list,n_allowed ) {
  var hints = '';
    if (n_allowed>0)  {
      hints = 'A suitabe <i>"Structure Revision"</i> is missing ';
      if ((subtype_list.indexOf('xyz')>=0) || (subtype_list.indexOf('phases')>=0))
        hints += '-- perform phasing first.';
      else if (subtype_list.indexOf('substructure')>=0)
        hints += '-- perform substructure search first.';
      else
        hints += '-- run the <i>"Asymmetric Unit Content"</i> task to ' +
                 'create a new revision.';
      if (subtype_list.indexOf('anomalous')>=0)
        hints += ' Make sure to use revision with reflection dataset having ' +
                 'anomalous signal.';
      hints += ' See full description <a href="javascript:' +
                      'launchHelpBox(\'Structure Revision\',' +
                                    '\'' + __user_guide_base_url +
                                      '/jscofe_qna.structure_revision.html\',' +
                                    'null,10)"><i>' +
                  String('here').fontcolor('blue') + '</i></a>.';
    }
    return [hints];  // No help hints by default
  }


} else  {
  //  for server side

  module.exports.DataRevision = DataRevision;

}
