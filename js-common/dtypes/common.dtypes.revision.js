
/*
 *  ==========================================================================
 *
 *    25.04.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  ==========================================================================
 *
 */

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
  this.ASU.seq        = [];
  this.ASU.ha_type    = '';     // heavy atom type
  this.ASU.ndisulph   = '';     // number of disulphides
  this.ASU.nRes       = 0;
  this.ASU.molWeight  = 0.0;
  this.ASU.solvent    = 0.0;
  this.ASU.matthews   = 0.0;
  this.ASU.prob_matth = 0.0;
  this.Structure      = null;
  this.Ligands        = [];     // can be a few
  this.Options        = {};     // input options used in interfaces
  this.Options.seqNo  = 0;      // selected sequence number (not used?)

  this.backtrace      = false;  // take data only from the latest job

}

if (__template)
      DataRevision.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataRevision.prototype = Object.create ( DataTemplate.prototype );
DataRevision.prototype.constructor = DataRevision;


// ===========================================================================

DataRevision.prototype.title = function()  { return 'Revision';        }
DataRevision.prototype.icon  = function()  { return 'data_xrayimages'; }

// when data class version is changed here, change it also in python
// constructors
DataRevision.prototype.currentVersion = function()  {
  var version = 4;  // advanced on ASUDef
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

    for (var i=0;i<revext.Ligands.length;i++)
      revext.Ligands[i] = this.Ligands[i].extend();

    return revext;

  }


  DataRevision.prototype.makeASUSummaryPage = function ( task )  {

    var dsp = new DataSummaryPage ( this );

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
          dsp.makeRow ( 'HA type',this.ASU.ha_type,'Heavy Atom type' );
    else  dsp.makeRow ( 'HA type','<i>unspecified</i>','Heavy Atom type' );

    return dsp;

  }

  DataRevision.prototype.makeDataSummaryPage = function ( task ) {
    var dsp  = new Grid ( '' );
    dsp.tabs = new Tabs ();

    var tab1 = dsp.tabs.addTab ( 'General',true  );
    tab1.grid.setLabel  ( '<h3>Structure Revision R' + this.dataId + '</h3>',0,0,1,1 );
    tab1.grid.setWidget ( new DataSummaryPage(this), 1,0,1,1 );

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

    dsp.setWidget ( dsp.tabs, 0,0,1,1 );

    return dsp;

  }

  DataRevision.prototype.inspectData = function ( task ) {
    var dsp = this.makeDataSummaryPage ( task );
    var dlg = new DataInspectDialog ( dsp,this.dname,800,700 );

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

    if (this.Structure)  {
      if ((mode=='crank2') && (this.Structure.subtype.indexOf('xyz')>=0))  {
        customGrid.setLabel ( 'Current structure will be used for calculating ' +
                              'initial phases (MR-SAD)',row++,0,1,7 )
                              .setFontBold(true).setFontItalic(true).setNoWrap();
        customGrid.removeNonAnom = customGrid.setCheckbox (
                              'Remove all non-anomalous atoms before rebuilding',
                              this.Structure.removeNonAnom,row++,0,1,5 );
        customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 2 );
      } else if (mode=='shelx-auto')  {
        customGrid.setLabel ( 'Current structure:',row,0,1,2 )
                              .setFontItalic(true).setNoWrap();
        customGrid.setLabel ( this.Structure.dname,row++,1,1,1 ).setNoWrap();
        customGrid.setLabel ( 'will not be used as fixed model (as a feature ' +
                              'of Shelx-Auto pipeline)',row++,0,1,1 )
                              .setFontItalic(true).setNoWrap();
      }
    }

    customGrid.setLabel ( 'heavy atom type:',row,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.ha_type = customGrid.setInputText ( this.ASU.ha_type,row,1,1,1 )
              .setStyle    ( 'text','','','Specify atom type of anomolous ' +
                             'scatterers, or leave blank if uncertain.' )
              .setWidth_px ( 36 ).setMaxInputLength ( 2 );
    customGrid.setVerticalAlignment ( row,0,'middle' );

    customGrid.ndis_lbl = customGrid.setLabel ( 'number of S-S pairs:',row,2,1,3 )
                                    .setFontItalic(true).setNoWrap();
    customGrid.ndisulph = customGrid.setInputText ( this.ASU.ndisulph,row,3,1,1 )
              .setStyle    ( 'text','integer','','Optional number of disulphides ' +
                             'to be treated as S-S pairs. Ignored if left blank (default).' )
              .setWidth_px ( 36 ).setMaxInputLength ( 2 );
    customGrid.setVerticalAlignment ( row,2,'middle' );

    function showNDis()  {
      var showdis = (customGrid.ha_type.getValue().toLowerCase()=='s');
      customGrid.ndis_lbl.setVisible ( showdis );
      customGrid.ndisulph.setVisible ( showdis );
    }

    customGrid.ha_type.addOnInputListener ( showNDis );
    showNDis();

    this.HKL.layCustomDropdownInput ( dropdown );

  }

  DataRevision.prototype._layCDI_Molrep = function ( dropdown )  {

    if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
      var customGrid = dropdown.customGrid;
      customGrid.setLabel ( 'Structure:',0,0,1,1 )
                            .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( this.Structure.dname,0,1,1,1 ).setNoWrap();
      customGrid.setLabel ( 'will be used as fixed model.',1,1,1,2 )
                            .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( ' ',2,0,1,1 ).setHeight_px ( 8 );
    }

  }

  DataRevision.prototype._layCDI_AsuMod = function ( dropdown )  {
    var customGrid = dropdown.customGrid;
    customGrid.setLabel ( 'heavy atom type:',0,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.ha_type = customGrid.setInputText ( this.ASU.ha_type,0,1,1,1 )
              .setStyle    ( 'text','','','Specify atom type of anomolous ' +
                             'scatterers, or leave blank if uncertain.' )
              .setWidth_px ( 36 ).setMaxInputLength ( 2 );
    customGrid.setVerticalAlignment ( 0,0,'middle' );
  }

  DataRevision.prototype._layCDI_PhaserEP = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
    customGrid.setLabel ( 'Heavy atom type:',0,0,1,1 ).setFontItalic(true).setNoWrap();
    customGrid.setLabel ( this.ASU.ha_type  ,0,1,1,1 );
    if (this.Structure)  {
      dropdown.in_revision = true;
      this.Structure.layCustomDropdownInput ( dropdown );
    }
    this.HKL.layCustomDropdownInput ( dropdown );
  }

  DataRevision.prototype._layCDI_PhaserMR = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row = 0;

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

      dropdown.layCustom = 'phaser-mr-fixed';
    } else if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
      customGrid.setLabel ( '<b>Fixed structure</b>:',row,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( '<b>' + this.Structure.dname + '</b>',row++,1,1,4 )
                .setNoWrap();
      customGrid.setLabel ( '<b>Phaser solution metadata:</b>',row,0,1,1 )
                .setFontItalic(true).setNoWrap();
      customGrid.setLabel ( '<b><i>annulled</i></b>',row++,1,1,4 ).setNoWrap();
      dropdown.layCustom = 'phaser-mr-fixed';
    }

    for (var i=0;i<row;i++)  {
      customGrid.setCellSize ( '','12pt',i,0 );
      customGrid.setVerticalAlignment ( i,0,'middle' );
      customGrid.setCellSize ( '','12pt',i,1 );
      customGrid.setVerticalAlignment ( i,1,'middle' );
    }

    this.HKL.layCustomDropdownInput ( dropdown );

  }


  DataRevision.prototype.layCustomDropdownInput = function ( dropdown )  {

    switch (dropdown.layCustom)  {
      case 'asumod'    :
            this._layCDI_AsuMod ( dropdown );
          break;
      case 'phaser-ep' :
            this._layCDI_PhaserEP ( dropdown );
            /*
            if (this.Structure)  {
              dropdown.in_revision = true;
              this.Structure.layCustomDropdownInput ( dropdown );
            }
            this.HKL.layCustomDropdownInput ( dropdown );
            */
          break;
      case 'reindex'    :  case 'refmac'       :  case 'ccp4build' :
            this.HKL.layCustomDropdownInput ( dropdown );
          break;
      case 'parrot'     :  case 'buccaneer-ws' :  case 'acorn'  :
            this.Structure.layCustomDropdownInput ( dropdown );
          break;
      case 'arpwarp'    :
            this.Structure.layCustomDropdownInput ( dropdown );
            dropdown.Structure = this.Structure;  // this will add phase options for refmac
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
      default : ;
    }

  }

  DataRevision.prototype._collectCDI_Crank2 = function ( dropdown )  {
    var msg = '';
    if ('removeNonAnom' in dropdown.customGrid)
      this.Structure.removeNonAnom = dropdown.customGrid.removeNonAnom.getValue();
    if (this.ASU)  {
      this.ASU.ha_type = dropdown.customGrid.ha_type.getValue().trim();
      if (!this.ASU.ha_type)
        msg += '<b><i>Heavy atom type must be given</i></b>';
      if (dropdown.customGrid.hasOwnProperty('ndisulph') &&
          (this.ASU.ha_type.toLowerCase()=='s'))  {
        var ndisulph = dropdown.customGrid.ndisulph.getValue();
        if (ndisulph.trim().length>0)  {
          if (isInteger(ndisulph))  {
            var ndisulph = parseInt(ndisulph);
            if (ndisulph>=0)
              this.ASU.ndisulph = ndisulph;
            else
              msg += '<b><i>Number of disulphides should be positive</i></b>';
          } else
            msg += '<b><i>Wrong format for number of disulphides</i></b>';
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
      case 'asumod'    :
            if (this.ASU)
              this.ASU.ha_type = dropdown.customGrid.ha_type.getValue();
          break;
      case 'reindex'   :  case 'phaser-mr'    :  case 'phaser-mr-fixed' :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;
      case 'phaser-ep' :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
          if (this.Structure)
            msg += this.Structure.collectCustomDropdownInput ( dropdown );
        break;
      case 'refmac'    :  case 'ccp4build'    :
          msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;
      case 'parrot'    :  case 'buccaneer-ws' :  case 'acorn' :
          msg = this.Structure.collectCustomDropdownInput ( dropdown );
        break;
      case 'arpwarp'   :
          dropdown.Structure = this.Structure;  // because it gets lost at copying objects
          msg = this.Structure.collectCustomDropdownInput ( dropdown ) +
                this.HKL.collectCustomDropdownInput       ( dropdown );
        break;
      case 'crank2'  :
          msg = this._collectCDI_Crank2 ( dropdown );
          /*
          if ('removeNonAnom' in dropdown.customGrid)
            this.Structure.removeNonAnom = dropdown.customGrid.removeNonAnom.getValue();
          if (this.ASU)  {
            this.ASU.ha_type = dropdown.customGrid.ha_type.getValue().trim();
            if (!this.ASU.ha_type)
              msg += '<b><i>Heavy atom type must be given</i></b>';
            if (this.ASU.ha_type.toLowerCase()=='s')  {
              var ndisulph = dropdown.customGrid.ndisulph.getValue();
              if (isInteger(ndisulph))  {
                var ndisulph = parseInt(ndisulph);
                if (ndisulph>=0)
                  this.ASU.ndisulph = ndisulph;
                else
                  msg += '<b><i>Number of disulphides should be positive</i></b>';
              } else
                msg += '<b><i>Wrong format for number of disulphides</i></b>';
            }
          }
          msg += this.HKL.collectCustomDropdownInput ( dropdown );
          */
        break;
          //msg = this._collectCDI_Crank2 ( dropdown );  break;
      case 'shelx-auto'   :
      case 'shelx-substr' :
          msg = this._collectCDI_Crank2 ( dropdown );
          //msg = this.HKL.collectCustomDropdownInput ( dropdown );
        break;
      default : ;
    }
    return msg;
  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataRevision.prototype.dataDialogHints = function ( subtype_list ) {
  var hints = 'A suitabe <i>"Structure Revision"</i> is missing ';
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
                                  '\'./html/jscofe_data.html\',' +
                                  'null,10)"><i>' +
                String('here').fontcolor('blue') + '</i></a>.';
    return [hints];  // No help hints by default
  }


} else  {
  //  for server side

  module.exports.DataRevision = DataRevision;

}
