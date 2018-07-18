
/*
 *  =================================================================
 *
 *    06.07.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.hkl.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  HKL Data Class
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

var hkl_subtype = {
  anomalous : 'anomalous'
}

function DataHKL()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type         = 'DataHKL';
  this.wtype         = 'peak'; // 'low-remote', 'peak', 'native', 'high-remote'
  this.f_use_mode    = 'NO';   // 'NO','EDGE','ON','OFF' (Phaser-EP)
  this.f1            = '';     // amplitude shift  (Crank-2, Phaser-EP)
  this.f11           = '';     // phase shift      (Crank-2, Phaser-EP)
  this.res_low       = '';     // low  resolution limit
  this.res_high      = '';     // high resolution limit
  this.res_ref       = '';     // high resolution for refinement (Phaser-MR)
  this.wavelength    = '';     // wavelength (Phaser-EP)
  this.anomAtomType  = '';     // anomalous scattering type
  this.useForPhasing = false;  // flag for native dataset in SAD/MAD (Crank-2)
  this.new_spg       = '';     // new space group for reindexing
  this.spg_alt       = '';     // alternative space groups for Phaser
  this.freeRds       = null;   // reference to freeR dataset meta
  //this.useHKLSet     = 'F';    // if given, forces use of F,I,Fpm,Ipm (Refmac)
  this.useHKLSet     = 'F';    // if given, forces use of F,Fpm,TI,TF (Refmac)

}


if (__template)
      DataHKL.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataHKL.prototype = Object.create ( DataTemplate.prototype );
DataHKL.prototype.constructor = DataHKL;


// ===========================================================================

DataHKL.prototype.title      = function()  { return 'Reflection Data';         }
DataHKL.prototype.icon_small = function()  { return './images/data_20x20.svg'; }
DataHKL.prototype.icon_large = function()  { return './images/data.svg';       }

// change this synchronously with the version in dtype.hkl.py
DataHKL.prototype.currentVersion = function()  { return 2; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataHKL.prototype.getMeta = function ( name,defVal )  {
    var list = name.split('.');
    var v    = this.dataset;
    for (var i=0;i<list.length;i++)
      if (list[i] in v)
           v = v[list[i]];
      else return defVal;
    return v;
  }

  DataHKL.prototype.getSpaceGroup = function()  {
    return this.getMeta('HM','Unspecified');
  }

  DataHKL.prototype.getCellParametersHTML = function()  {
  var v = 'Not specified';
    if (this.dataset.DCELL!='*')
      v = this.dataset.DCELL[0] + '&nbsp;&nbsp;' +
          this.dataset.DCELL[1] + '&nbsp;&nbsp;' +
          this.dataset.DCELL[2] + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
          this.dataset.DCELL[3] + '&nbsp;&nbsp;' +
          this.dataset.DCELL[4] + '&nbsp;&nbsp;' +
          this.dataset.DCELL[5];
    return v;
  }

  DataHKL.prototype.getCellParameters = function()  {
    if (this.dataset.DCELL!='*')
      return this.dataset.DCELL;
    return [0.0,0.0,0.0,0.0,0.0,0.0];
  }

  DataHKL.prototype.getLowResolution = function()  {
    return this.dataset.RESO[0];
  }

  DataHKL.prototype.getHighResolution = function()  {
    return this.dataset.RESO[1];
  }

  DataHKL.prototype.getWavelength = function()  {
    if ('DWAVEL' in this.dataset)
          return this.dataset.DWAVEL;
    else  return null;
  }

  DataHKL.prototype.isImean = function() {
    return this.getMeta('Imean.value','') && this.getMeta('Imean.sigma','');
  }

  DataHKL.prototype.isFmean = function()  {
    return this.getMeta('Fmean.value','') && this.getMeta('Fmean.sigma','');
  }

  DataHKL.prototype.isIpm = function()  {
    return  this.getMeta('Ipm.plus.value' ,'') &&
            this.getMeta('Ipm.plus.sigma' ,'') &&
            this.getMeta('Ipm.minus.value','') &&
            this.getMeta('Ipm.minus.sigma','');
  }

  DataHKL.prototype.isFpm = function()  {
    return  this.getMeta('Fpm.plus.value' ,'') &&
            this.getMeta('Fpm.plus.sigma' ,'') &&
            this.getMeta('Fpm.minus.value','') &&
            this.getMeta('Fpm.minus.sigma','');
  }

  DataHKL.prototype.makeDataSummaryPage = function ( task )  {
  var dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name'            ,this.files[0],'Imported file name'     );
    dsp.makeRow ( 'Original dataset name',this.dataset.PROJECT + '/' +
                                          this.dataset.CRYSTAL + '/' +
                                          this.dataset.DATASET,
                                          'Original dataset name' );
    dsp.makeRow ( 'Wavelength'   ,this.getWavelength(),'Wavelength'           );
    dsp.makeRow ( 'Space group'  ,this.getSpaceGroup(),'Space symmetry group' );

    dsp.makeRow ( 'Cell',this.getCellParametersHTML(),'Unit cell parameters' );

    dsp.makeRow ( 'Resolution low' ,round(this.getLowResolution (),2),'Low resolution limit'  );
    dsp.makeRow ( 'Resolution high',round(this.getHighResolution(),2),'High resolution limit' );

    v = 'Not present';
    if ($.inArray('anomalous',this.subtype)>=0)
      v = 'Present';
    dsp.makeRow ( 'Anomalous scattering',v,'Presence of anomalous data' );

    dsp.makeRow ( 'Columns',
                  this.getMeta ( 'Imean.value'    ,'' ) + ' ' +
                  this.getMeta ( 'Imean.sigma'    ,'' ) + ' ' +
                  this.getMeta ( 'Fmean.value'    ,'' ) + ' ' +
                  this.getMeta ( 'Fmean.sigma'    ,'' ) + ' ' +
                  this.getMeta ( 'Ipm.plus.value' ,'' ) + ' ' +
                  this.getMeta ( 'Ipm.plus.sigma' ,'' ) + ' ' +
                  this.getMeta ( 'Ipm.minus.value','' ) + ' ' +
                  this.getMeta ( 'Ipm.minus.sigma','' ) + ' ' +
                  this.getMeta ( 'Fpm.plus.value' ,'' ) + ' ' +
                  this.getMeta ( 'Fpm.plus.sigma' ,'' ) + ' ' +
                  this.getMeta ( 'Fpm.minus.value','' ) + ' ' +
                  this.getMeta ( 'Fpm.minus.sigma','' ) + ' ' +
                  this.getMeta ( 'FREE'           ,'' ),
                  'Original data columns' );

    v = 'No';
    if (this.dname.indexOf('truncated')>=0)
      v = 'Yes';
    dsp.makeRow ( 'Truncated',v,'Indicated whether the original dataset was ' +
                                'truncated.' );

    dsp.addViewHKLButton ( task );

    return dsp;

  }


  DataHKL.prototype.layCustomDropdownInput = function ( dropdown ) {

    var customGrid = dropdown.customGrid;
    var r          = 0;

    function setLabel ( title,row,col )  {
      var label = customGrid.setLabel ( title,row,col,1,1 )
                            .setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,col,'middle' );
      return label;
    }

    this.setWType = function()  {
      setLabel ( 'type:',0,0 );
      customGrid.wtype = new Dropdown();
      customGrid.wtype.setWidth ( '100%' );
      customGrid.wtype.addItem ( 'low remote' ,'','low-remote' ,this.wtype=='low-remote'  );
      customGrid.wtype.addItem ( 'inflection' ,'','inflection' ,this.wtype=='inflection'  );
      customGrid.wtype.addItem ( 'peak'       ,'','peak'       ,this.wtype=='peak'        );
      customGrid.wtype.addItem ( 'high remote','','high-remote',this.wtype=='high-remote' );
      customGrid.setWidget   ( customGrid.wtype, 0,1,1,1 );
      customGrid.setCellSize ( '160px','',0,1 );
//      customGrid.wtype.setZIndex ( 399-2*dropdown.serialNo );  // prevent widget overlap
//      customGrid.wtype.setWidth_px ( 120 );
      customGrid.wtype.make();
    }

    function makeRealInput ( value,def,tooltip,row,col )  {
      return customGrid.setInputText ( value,row,col,1,1 )
                       .setStyle     ( 'text','real',def,tooltip )
                       .setWidth_px  ( 60 );
    }

    this.anomDataLayout = function()  {
      this.setWType();
      setLabel ( 'f\':',r,2 );
      customGrid.f1 = makeRealInput ( this.f1,'',
          'Real part of scattering factor; leave blank for automatic choice.',
          r,3 );
      setLabel ( 'f":',r,4 );
      customGrid.f11 = makeRealInput ( this.f11,'',
          'Imaginary part of scattering factor; leave blank for automatic ' +
          'choice.',r,5 );
      customGrid.setLabel ( ' ',1,0,1,1 ).setHeight_px ( 8 );
    }

    this.nativeLayout = function()  {
      customGrid.useForPhasing = customGrid.setCheckbox ( 'use for phasing',
                               this.useForPhasing, 0,0,1,1 )
                .setTooltip  ( 'Check if the dataset must be used also for ' +
                               'phasing, in addition to model building and ' +
                               'density modification' );
      customGrid.useForPhasing.addOnClickListener ( function(){
        dropdown.task.inputChanged ( dropdown.grid.inpParamRef,'native',1 );
      });
      customGrid.setVerticalAlignment ( 0,0,'bottom' );
      customGrid.setCellSize ( '','26px',0,0 );
      customGrid.setLabel    ( ' ',1,0,1,1 ).setHeight_px ( 8 );
    }

    this.unmergedRefLayout = function()  {
      setLabel ( 'Space group ' + this.getMeta('HM','Unspecified') +
                 ' will be used for merging',r,0 );
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 1 );
      customGrid.setLabel ( ' ',  r,1,1,1 ).setHeight_px ( 1 );
    }

    this.cellInfoLayout = function()  {
      setLabel ( 'Space group:&nbsp;',r,0 );
      customGrid.setLabel ( this.getSpaceGroup(),r,1,1,1 ).setNoWrap();
      setLabel ( 'Cell&nbsp;(a,b,c,&alpha;,&beta;,&gamma;):&nbsp;',++r,0 );
      customGrid.setLabel ( this.getCellParametersHTML(),r,1,1,2 );
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
    }

    this.reindexLayout = function()  {
      setLabel ( 'Space group:&nbsp;',r,0 );
      customGrid.setLabel ( this.getSpaceGroup(),r,1,1,1 ).setNoWrap();
      setLabel ( 'Cell&nbsp;(a,b,c,&alpha;,&beta;,&gamma;):&nbsp;',++r,0 );
      customGrid.setLabel ( this.getCellParametersHTML(),r,1,1,2 );
      customGrid.setHLine ( 1,++r,0,1,2 );
      setLabel ( 'New space group:&nbsp;',++r,0 );
      var spg_list = get_cons_sg_list ( this.getSpaceGroup() );
      if (spg_list.length>0)  {
        customGrid.new_spg = new Dropdown();
        var nsel = 0;
        if ('new_spg' in this)
          nsel = Math.max ( 0,spg_list.indexOf(this.new_spg) );
        for (var i=0;i<spg_list.length;i++)
          customGrid.new_spg.addItem ( spg_list[i],'',spg_list[i],i==nsel );
        customGrid.setWidget   ( customGrid.new_spg, r,1,1,1 );
        customGrid.new_spg.make();
      } else  {
        customGrid.setLabel ( '<b><i>Space group ' + this.getSpaceGroup() +
                              ' cannot be changed</i></b>',r,1,1,1 );
        dropdown.grid.parent.parent.emitSignal ( cofe_signals.taskReady,'do not run' );
      }
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
    }

    this.spgLayout = function()  {
      setLabel ( 'Try Space Group(s):&nbsp;',++r,0 );
      customGrid.spaceGroup = new Dropdown();
      customGrid.spaceGroup.setWidth ( '125%' );
      var sg0   = this.getSpaceGroup();
      var sgsel = '';
      customGrid.spaceGroup.addItem  ( sg0 + ' (as in the dataset)','',
            sg0.replace(/\s+/g,''),(this.spg_alt==sgsel) || (this.sg_alt==sg0) );
      var sg2 = getEnantiomorphSpG ( sg0 );
      if (sg2)  {
        sgsel = sg0.replace(/\s+/g,'') + ';' + sg2.replace(/\s+/g,'');
        customGrid.spaceGroup.addItem  ( sg0 + ' + ' + sg2 + ' (enantiomorphs)',
              '',sgsel,(this.spg_alt==sgsel) );
      }
      var sg2 = getIndistinguishableSpG ( sg0 );
      if (sg2)  {
        sgsel = sg0.replace(/\s+/g,'') + ';' + sg2.replace(/\s+/g,'');
        customGrid.spaceGroup.addItem  ( sg0 + ' + ' + sg2 + ' (indistinguishable)',
              '',sgsel,(this.spg_alt==sgsel) );
      }
      var sglist = getAllPointSpG ( sg0 );
      if (sglist.length>1) {
        customGrid.spaceGroup.addItem ( 'all compatible point groups','',
                                        'ALL',(this.spg_alt=='ALL') );
        customGrid.spaceGroup.setTooltip ( 'Compatible space groups:<p>' + sglist.join('<br>') );
      }
      customGrid.setWidget ( customGrid.spaceGroup, r,1,1,4 );
      customGrid.spaceGroup.make();
    }

    this.makeResolutionLimits = function()  {
      setLabel ( 'Resolution range (&Aring;):&nbsp;',++r,0 );
      var res_low  = round ( this.getLowResolution (),2 );
      var res_high = round ( this.getHighResolution(),2 );
      customGrid.res_low = makeRealInput ( this.res_low,res_low,
          'Low resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,1 );
      setLabel ( '&nbsp;to&nbsp;',r,2 );
      customGrid.setCellSize ( '40px','',r,2 );
      customGrid.res_high = makeRealInput ( this.res_high,res_high,
          'High resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,3 );
      customGrid.setLabel    ( ' ',r,4,1,1 );
      customGrid.setCellSize ( '90%','',r,4 );
    }

    this.makeWavelengthInput = function()  {
      var wavelength = this.getWavelength();
      if (wavelength==null)
        wavelength = '';
      setLabel ( 'Wavelength (&Aring;):&nbsp;',++r,0 );
      customGrid.wavelength = makeRealInput ( this.wavelength,wavelength,
          'Set wavelength value, or leave blank for automatic choice.',r,1 );
    }

    this.phaserMRLayout = function()  {
      this.makeResolutionLimits();
      var res_high = round ( this.getHighResolution(),2 );
      setLabel ( 'High res-n for final refinement (&Aring;):&nbsp;',++r,0 );
      customGrid.res_ref = makeRealInput ( this.res_ref,res_high,
          'Set a value equal or larger than ' + round(this.getHighResolution(),2) +
          ', or leave blank for automatic choice.',r,1 );
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
    }

    this.phaserEPLayout = function()  {
      this.makeResolutionLimits();
      /*
      setLabel ( 'Resolution range (&Aring;):&nbsp;',r,0 );
      var res_low    = round ( this.getLowResolution (),2 );
      var res_high   = round ( this.getHighResolution(),2 );
      customGrid.res_low = makeRealInput ( this.res_low,res_low,
          'Low resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,1 );
      setLabel ( '&nbsp;to&nbsp;',r,2 );
      customGrid.setCellSize ( '40px','',r,2 );
      customGrid.res_high = makeRealInput ( this.res_high,res_high,
          'High resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,3 );
      customGrid.setLabel    ( ' ',r,4,1,1 );
      customGrid.setCellSize ( '90%','',r,4 );
      */

      this.makeWavelengthInput();
      /*
      var wavelength = this.getWavelength();
      if (wavelength==null)
        wavelength = '';

      setLabel ( 'Wavelength (&Aring;):&nbsp;',++r,0 );
      customGrid.wavelength = makeRealInput ( this.wavelength,wavelength,
          'Set wavelength value, or leave blank for automatic choice.',r,1 );
      */

      setLabel ( 'Fluorescent Scan Data:&nbsp;',++r,0 );
      customGrid.f_use_mode = new Dropdown();
      customGrid.f_use_mode.setWidth ( '120%' );
      customGrid.f_use_mode.addItem ( 'do not use' ,'','NO',
                                      this.f_use_mode=='NO'   );
      customGrid.f_use_mode.addItem ( 'use with f" refinement near edge','','EDGE',
                                      this.f_use_mode=='EDGE' );
      customGrid.f_use_mode.addItem ( 'use with full f" refinement','','ON',
                                      this.f_use_mode=='ON'   );
      customGrid.f_use_mode.addItem ( 'use without f" refinement','','OFF',
                                      this.f_use_mode=='OFF'  );
      customGrid.setWidget   ( customGrid.f_use_mode, r,1,1,7 );
      customGrid.setCellSize ( '460px','',r,1 );
      customGrid.f_use_mode.make();

      setLabel ( 'Atom type:&nbsp;',++r,0 ).setHorizontalAlignment ( 'right' );
      customGrid.anomAtomType = customGrid.setInputText ( this.anomAtomType,r,1,1,1 )
          .setStyle    ( 'text','','','Chemical type of main anomoalous scatterer' )
          .setWidth_px ( 60 );

      setLabel ( '&nbsp;&nbsp;f\':',r,2 );
      customGrid.f1 = makeRealInput ( this.f1,'',
          'Real part of scattering factor; leave blank for automatic choice.',
          r,3 );

      setLabel ( '&nbsp;&nbsp;f":',r,4 );
      customGrid.f11 = makeRealInput ( this.f11,'',
          'Imaginary part of scattering factor; leave blank for automatic ' +
          'choice.',r,5 );

      (function(grid,row){
        grid.f_use_mode.addSignalHandler ( 'state_changed',function(){
          grid.setRowVisible ( row,(grid.f_use_mode.getValue()!='NO') );
        });
      }(customGrid,r))
      customGrid.setRowVisible ( r,(this.f_use_mode!='NO') );

      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );

    }

    this.refmacLayout = function()  {
      this.makeResolutionLimits();
      var is_Imean = this.isImean();
      var is_Fmean = this.isFmean();
      var is_Ipm   = this.isIpm  ();
      var is_Fpm   = this.isFpm  ();
      n = 0;
      if (is_Imean)  n++;
      if (is_Fmean)  n++;
      if (is_Ipm)    n++;
      if (is_Fpm)    n++;
      if (n>0)  {
        setLabel ( 'Refine using:&nbsp;',++r,0 );
        customGrid.useHKLSet = new Dropdown();
        //customGrid.useDataset.setWidth ( '125%' );
        //customGrid.useHKLSet.addItem  ( 'Auto','','auto',this.useHKLSet=='auto' );
        //if (is_Ipm)
        //  customGrid.useHKLSet.addItem  ( 'Anomalous Intensities','','Ipm',this.useHKLSet=='Ipm' );
        if (is_Fpm)
          customGrid.useHKLSet.addItem  ( 'Anomalous Differences','','Fpm',this.useHKLSet=='Fpm' );
        if (is_Fmean)
          customGrid.useHKLSet.addItem  ( 'Mean Amplitudes only','','F',this.useHKLSet=='F' );
        if (is_Imean)
          customGrid.useHKLSet.addItem  ( 'Mean Intensities assuming twinning','','TI',this.useHKLSet=='TI' );
        if (is_Fmean)
          customGrid.useHKLSet.addItem  ( 'Mean Amplitudes assuming twinning','','TF',this.useHKLSet=='TF' );

        customGrid.setWidget   ( customGrid.useHKLSet, r,1,1,4 );
        //customGrid.setCellSize ( '60px','',r,1 );
        customGrid.useHKLSet.make();
      }
      if (is_Fpm)  {
        this.makeWavelengthInput();
        (function(grid,row,useHKLSet){
          grid.useHKLSet.addSignalHandler ( 'state_changed',function(){
            grid.setRowVisible ( row,(grid.useHKLSet.getValue()=='Fpm') );
          });
          customGrid.setRowVisible ( r,(useHKLSet=='Fpm') );
        }(customGrid,r,this.useHKLSet))
      }
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
    }

    switch (dropdown.layCustom)  {
      case 'anomData'        :  this.anomDataLayout   ();  break;
      case 'anomData-Shelx'  :  this.setWType         ();  break;
      case 'native'          :  this.nativeLayout     ();  break;
      case 'unmerged-ref'    :  this.unmergedRefLayout();  break;
      case 'cell-info'       :  this.cellInfoLayout   ();  break;
      case 'reindex'         :  this.reindexLayout    ();  break;
      case 'phaser-mr'       :  this.spgLayout        (); // should be no break here!
      case 'phaser-mr-fixed' :  this.phaserMRLayout   ();  break;
      case 'phaser-ep'       :  this.phaserEPLayout   ();  break;
      case 'refmac'          :  this.refmacLayout     ();  break;
      default : ;
    }

  }


  DataHKL.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

    function readF ( inputWidget,def,allow_blank,errMsg )  {
      var text = inputWidget.getValue().trim();
      if ((text=='') && allow_blank)  {
        return text;
      } else if (isFloat(text))  {
        return text;
      } else  {
        if (msg)
          msg += '<br>';
        msg += errMsg;
        return def;
      }
    }

    this.collectAnom = function()  {
      // get the wavelength type
      this.wtype = customGrid.wtype.getValue();
      this.f1    = readF ( customGrid.f1,this.f1,true,'<b>hkl dataset #' +
                   (dropdown.serialNo+1) + '</b> wrong format of f\'' );
      this.f11   = readF ( customGrid.f11,this.f11,true,'<b>hkl dataset #' +
                   (dropdown.serialNo+1) + '</b> wrong format of f"' );
    }

    this.collectAnomShelx = function()  {
      // get the wavelength type
      this.wtype = customGrid.wtype.getValue();
    }

    this.collectNative = function()  {
      // this checkbox hides in MAD+native case, the corresponding code
      // is in TaskCrank2.inputChanged(); the reason for this is that MIRAS
      // is not currently supported.
      this.useForPhasing = customGrid.useForPhasing.getValue();
    }

    this.collectReindex = function()  {
      if ('new_spg' in customGrid)
        this.new_spg = customGrid.new_spg.getValue().replace ( ' (enantiomorph)','' )
                                                    .replace ( ' (indistinguishable)','' );
      else
        this.new_spg = '';
    }

    this.collectSpG = function()  {
      this.spg_alt = customGrid.spaceGroup.getValue();
    }

    this.collectPhaserMR = function()  {
      this.res_low  = customGrid.res_low .getValue();
      this.res_high = customGrid.res_high.getValue();
      this.res_ref  = customGrid.res_ref .getValue();
      if (this.res_low =='') this.res_low  = round ( this.getLowResolution (),2 );
      if (this.res_high=='') this.res_high = round ( this.getHighResolution(),2 );
      if (this.res_ref =='') this.res_high = round ( this.getHighResolution(),2 );
    }

    this.collectPhaserEP = function()  {
      this.res_low    = customGrid.res_low   .getValue();
      this.res_high   = customGrid.res_high  .getValue();
      this.wavelength = customGrid.wavelength.getValue();

      if (this.res_low   =='') this.res_low  = round ( this.getLowResolution (),2 );
      if (this.res_high  =='') this.res_high = round ( this.getHighResolution(),2 );
      if (this.wavelength=='') this.wavelength = this.getWavelength();

      this.f_use_mode = customGrid.f_use_mode.getValue();
      if (this.f_use_mode!='NO')  {
        this.anomAtomType = customGrid.anomAtomType.getValue();
        if (this.anomAtomType=='')
          msg += '<b>no atom type for anomalous scatterer is given</b>'
        this.f1  = readF ( customGrid.f1,this.f1,false,
                           '<b>wrong format (empty field?) of f\'</b>' );
        this.f11 = readF ( customGrid.f11,this.f11,false,
                           '<b>wrong format (empty field?) of f"</b>' );
      }
    }

    this.collectRefmac = function()  {
      this.res_low  = customGrid.res_low .getValue();
      this.res_high = customGrid.res_high.getValue();
      if ('wavelength' in customGrid)
        this.wavelength = customGrid.wavelength.getValue();
      if (this.res_low   =='') this.res_low  = round ( this.getLowResolution (),2 );
      if (this.res_high  =='') this.res_high = round ( this.getHighResolution(),2 );
      if (this.wavelength=='') this.wavelength = this.getWavelength();
      if ('useHKLSet' in customGrid)
            this.useHKLSet = customGrid.useHKLSet.getValue();
      else  this.useHKLSet = 'auto';
    }

    switch (dropdown.layCustom)  {
      case 'anomData'        : this.collectAnom     ();  break;
      case 'anomData-Shelx'  : this.collectAnomShelx();  break;
      case 'native'          : this.collectNative   ();  break;
      case 'reindex'         : this.collectReindex  ();  break;
      case 'phaser-mr'       : this.collectSpG      (); // should be no break here!
      case 'phaser-mr-fixed' : this.collectPhaserMR ();  break;
      case 'phaser-ep'       : this.collectPhaserEP ();  break;
      case 'refmac'          : this.collectRefmac   ();  break;
      default : ;
    }

    return msg;

  }

} else  {
  //  for server side

  module.exports.DataHKL = DataHKL;

}
