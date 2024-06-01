
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

const hkl_subtype = {
  regular   : 'regular',
  anomalous : 'anomalous'
}

function DataHKL()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type         = 'DataHKL';
  this.wtype         = 'choose-one'; // 'low-remote', 'peak', 'native', 'high-remote'
  this.dataset       = null;
  this.ha_type       = '';     // heavy atom type
  this.f_use_mode    = 'NO';   // 'NO','EDGE','ON','OFF' (Phaser-EP)
  this.f1            = '';     // amplitude shift  (Crank-2, Phaser-EP)
  this.f11           = '';     // phase shift      (Crank-2, Phaser-EP)
  this.res_low       = '';     // low  resolution limit
  this.res_high      = '';     // high resolution limit
  this.res_ref       = '';     // high resolution for refinement (Phaser-MR)
  this.wavelength    = '';     // wavelength (Phaser-EP)
  this.useForPhasing = false;  // flag for native dataset in SAD/MAD (Crank-2)
  this.new_spg       = '';     // new space group for reindexing
  this.spg_alt       = 'ALL';  // alternative space groups for Phaser
  this.freeRds       = null;   // reference to freeR dataset meta
  this.useHKLSet     = 'F';    // if given, forces use of F,Fpm,TI,TF (Refmac)
  this.detwin        = false;  // used by modelcraft
  this.dataStats     = null;   // if not null, contains dictionary with info for Table 1
  this.aimless_meta  = {
    'jobId'    : 0,
    'file_xml' : null,   // reference to aimless xml file
    'file_unm' : null    // reference to aimless unmerged file
  };

}


// if (__template_d)
//       DataHKL.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataHKL.prototype = Object.create ( DataTemplate.prototype );
// DataHKL.prototype.constructor = DataHKL;

if (__template_d)
  __cmd.registerClass1 ( 'DataHKL',DataHKL,__template_d.DataTemplate.prototype );
else    registerClass1 ( 'DataHKL',DataHKL,DataTemplate.prototype );

// ===========================================================================

DataHKL.prototype.title = function()  { return 'Reflection Data'; }
DataHKL.prototype.icon  = function()  { return 'data';            }

// change this synchronously with the version in dtype.hkl.py
DataHKL.prototype.currentVersion = function()  {
  let version = 1;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


DataHKL.prototype.makeSample = function()  {
// this function created a fake data object for use in Workflow Creator
  this.setSubtype ( hkl_subtype.anomalous );
  this.dataset = {
    RESO : [100.0,1.0]
  };
  return this;
}

// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  DataHKL.prototype.getMeta = function ( name,defVal )  {
    if (this.dataset)  {
      let list = name.split('.');
      let v    = this.dataset;
      for (let i=0;i<list.length;i++)
        if (list[i] in v)
            v = v[list[i]];
        else return defVal;
      return v;
    } else
      return defVal;
  }

  DataHKL.prototype.getSpaceGroup = function()  {
    return this.getMeta('HM','Unspecified');
  }

  DataHKL.prototype.getCellParametersHTML = function()  {
  let v = 'Not specified';
    if (this.dataset && (this.dataset.DCELL!='*'))
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

  DataHKL.prototype.hasAnomalousSignal = function()  {
    return ($.inArray('anomalous',this.subtype)>=0);
  }

  DataHKL.prototype.makeDataSummaryPage = function ( task )  {
  let dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name'            ,this.files[file_key.mtz],'Imported file name'     );
    dsp.makeRow ( 'Original dataset name',this.dataset.PROJECT + '/' +
                                          this.dataset.CRYSTAL + '/' +
                                          this.dataset.DATASET,
                                          'Original dataset name' );
    dsp.makeRow ( 'Wavelength'   ,this.getWavelength(),'Wavelength'           );
    dsp.makeRow ( 'Space group'  ,this.getSpaceGroup(),'Space symmetry group' );

    dsp.makeRow ( 'Cell',this.getCellParametersHTML(),'Unit cell parameters' );

    dsp.makeRow ( 'Resolution low' ,round(this.getLowResolution (),2),'Low resolution limit'  );
    dsp.makeRow ( 'Resolution high',round(this.getHighResolution(),2),'High resolution limit' );

    let v = 'Not present';
    if (this.hasAnomalousSignal())  {
      v = 'Present';
      if (this.ha_type)
        v += ' (' + this.ha_type + ')';
    }
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


  DataHKL.prototype.layCustomDropdownInput = function ( dropdown )  {

    let customGrid = dropdown.customGrid;
    let r          = customGrid.getNRows();

    function setLabel ( title,row,col )  {
      let label = customGrid.setLabel ( title,row,col,1,1 )
                            .setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,col,'middle' );
      return label;
    }

    this.setWType = function()  {
      customGrid.wtype_lbl = setLabel ( 'wavelength type:',r,0 );
      customGrid.wtype = new Dropdown();
      customGrid.wtype.setWidth ( '180px' );
      customGrid.wtype.addItem ( '[must be chosen]' ,'','choose-one',this.wtype=='choose-one' );
      customGrid.wtype.addItem ( 'low remote' ,'','low-remote' ,this.wtype=='low-remote'  );
      customGrid.wtype.addItem ( 'inflection' ,'','inflection' ,this.wtype=='inflection'  );
      customGrid.wtype.addItem ( 'peak'       ,'','peak'       ,this.wtype=='peak'        );
      customGrid.wtype.addItem ( 'high remote','','high-remote',this.wtype=='high-remote' );
      customGrid.setWidget   ( customGrid.wtype, r,1,1,2 );
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
      this.setWType ();
      setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;f\':',r,2 );
      customGrid.f1 = makeRealInput ( this.f1,'',
          'Real part of scattering factor; leave blank for automatic choice.',
          r,3 );
      setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;f":',r,4 );
      customGrid.f11 = makeRealInput ( this.f11,'',
          'Imaginary part of scattering factor; leave blank for automatic ' +
          'choice.',r,5 );
      customGrid.setCellSize ( '20%','',r,6 );
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
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
      let spg_list = get_cons_sg_list ( this.getSpaceGroup() );
      if (spg_list.length>0)  {
        customGrid.new_spg = new Dropdown();
        let nsel = 0;
        if ('new_spg' in this)
          nsel = Math.max ( 0,spg_list.indexOf(this.new_spg) );
        for (let i=0;i<spg_list.length;i++)
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

      setLabel ( 'Try space group(s):&nbsp;',++r,0 );
      customGrid.spaceGroup = new Dropdown();
      //customGrid.spaceGroup.setWidth ( '125%' );
      customGrid.spaceGroup.setWidth ( '300px' );

      let sg0         = this.getSpaceGroup();
      let sg_enant    = getEnantiomorphSpG ( sg0 );
      let sg_ind      = getIndistinguishableSpG ( sg0 );
      let sglist      = getAllPointSpG ( sg0 );

      let sg0_id      = sg0.replace(/\s+/g,'');
      let sg_enant_id = '';
      let sg_ind_id   = '';
      let sgsel       = this.spg_alt;

      if (sg_enant)
        sg_enant_id = sg0_id + ';' + sg_enant.replace(/\s+/g,'');
      if (sg_ind)
        sg_ind_id   = sg0_id + ';' + sg_ind.replace(/\s+/g,'');

      if (!sgsel)  {
        if (sglist.length>1)  sgsel = 'ALL';
        else if (sg_enant)    sgsel = sg_enant_id;  // perhaps silly :)
        else if (sg_ind)      sgsel = sg_ind_id;
                    else      sgsel = sg0_id;
      }

      customGrid.spaceGroup.addItem  ( sg0 + ' (as in the dataset)','',
                                       sg0_id,(sgsel==sg0_id) );
      if (sg_enant)
        customGrid.spaceGroup.addItem  ( sg0 + ' + ' + sg_enant + ' (enantiomorphs)',
                                         '',sg_enant_id,(sgsel==sg_enant_id) );
      if (sg_ind)
        customGrid.spaceGroup.addItem  ( sg0 + ' + ' + sg_ind + ' (indistinguishable)',
                                         '',sg_ind_id,(sgsel==sg_ind_id) );

      if (sglist.length>1)  {
        customGrid.spaceGroup.addItem ( 'all compatible space groups','',
                                        'ALL',(sgsel=='ALL') );
        customGrid.spaceGroup.getItem ( 'ALL' )
                             .setTooltip1 ( 'Compatible space groups:<p>' +
                                            sglist.join('<br>'),'slideDown',
                                            true,5000 );
      }

      customGrid.setWidget ( customGrid.spaceGroup, r,1,1,4 );
      customGrid.spaceGroup.make();

    }

    this.makeHighResolutionLimit = function()  {
      setLabel ( 'High resolution limit (&Aring;):&nbsp;',++r,0 );
      let res_low  = round ( this.getLowResolution (),2 );
      let res_high = round ( this.getHighResolution(),2 );
      customGrid.res_high = makeRealInput ( this.res_high,'auto',
          'High resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,1 );
      customGrid.setLabel    ( ' ',r,2,1,1 );
      customGrid.setCellSize ( '4%' ,'',r,0 );
      customGrid.setCellSize ( '4%' ,'',r,1 );
      customGrid.setCellSize ( '92%','',r,2 );
    }

    this.makeResolutionLimits = function ( blank_key )  {
      setLabel ( 'Resolution range (&Aring;):&nbsp;',++r,0 );
      let res_low  = round ( this.getLowResolution (),2 );
      let res_high = round ( this.getHighResolution(),2 );
      let def_low  = res_low;
      let def_high = res_high;
      if (blank_key=='auto')  {
        def_low  = 'auto';
        def_high = 'auto';
      }
      customGrid.res_low = makeRealInput ( this.res_low,def_low,
          'Low resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,1 );
      setLabel ( '&nbsp;to&nbsp;',r,2 );
      customGrid.setCellSize ( '40px','',r,2 );
      customGrid.res_high = makeRealInput ( this.res_high,def_high,
          'High resolution limit. Set a value between ' + res_high + ' and ' +
          res_low + ', or leave blank for automatic choice.',r,3 );
      customGrid.setLabel    ( ' ',r,4,1,1 );
      customGrid.setCellSize ( '4%' ,'',r,0 );
      customGrid.setCellSize ( '4%' ,'',r,1 );
      customGrid.setCellSize ( '4%' ,'',r,2 );
      customGrid.setCellSize ( '4%' ,'',r,3 );
      customGrid.setCellSize ( '84%','',r,4 );
    }

    this.makeWavelengthInput = function()  {
      let wavelength = this.getWavelength();
      if (wavelength==null)
        wavelength = '';
      setLabel ( 'Wavelength (&Aring;):&nbsp;',++r,0 );
      customGrid.wavelength = makeRealInput ( this.wavelength,wavelength,
          'Set wavelength value, or leave blank for automatic choice.',r,1 );
    }

    this.simbadLayout = function()  {
      this.spgLayout     ();
      r++;
      this.cellInfoLayout();
    }

    this.phaserMRLayout = function()  {
      //r++;
      this.makeResolutionLimits ( 'auto' );
      let res_high = round ( this.getHighResolution(),2 );
      setLabel ( 'High res-n for final refinement (&Aring;):&nbsp;',++r,0 );
      customGrid.res_ref = makeRealInput ( this.res_ref,'auto',
          'Set a value equal or larger than ' + round(this.getHighResolution(),2) +
          ', or leave blank for automatic choice.',r,1 );
      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );
    }

    this.phaserEPLayout = function()  {

      this.makeResolutionLimits ( 'auto' );
      this.makeWavelengthInput  ();

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
      customGrid.setWidget   ( customGrid.f_use_mode, r,1,1,5 );
      customGrid.setCellSize ( '460px','',r,1 );
      customGrid.f_use_mode.make();

      setLabel ( '&nbsp;&nbsp;f\':',++r,1 ).setHorizontalAlignment('right').setWidth_px(60);
      customGrid.f1 = makeRealInput ( this.f1,'',
          'Real part of scattering factor; leave blank for automatic choice.',
          r,2 );

      setLabel ( '&nbsp;&nbsp;f":',r,3 ).setHorizontalAlignment('right').setWidth_px(60);
      customGrid.f11 = makeRealInput ( this.f11,'',
          'Imaginary part of scattering factor; leave blank for automatic ' +
          'choice.',r,4 );

      (function(grid,row){
        grid.f_use_mode.addSignalHandler ( 'state_changed',function(){
          grid.setRowVisible ( row,(grid.f_use_mode.getValue()!='NO') );
        });
      }(customGrid,r))
      customGrid.setRowVisible ( r,(this.f_use_mode!='NO') );

      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );

    }

    this.refmacLayout = function()  {
      if (dropdown.layCustom=='refmac')
        this.makeResolutionLimits ( '' );
      let is_Imean = this.isImean();
      let is_Fmean = this.isFmean();
      let is_Ipm   = this.isIpm  ();
      let is_Fpm   = this.isFpm  ();
      let n        = 0;
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
        if (is_Fmean)
          customGrid.useHKLSet.addItem  ( 'Mean Amplitudes only','','F',this.useHKLSet=='F' );

        if (dropdown.hasOwnProperty('Structure'))  {
          if (dropdown.Structure.PHI)
            customGrid.useHKLSet.addItem  ( 'Phases as PHI/FOM','','PF',this.useHKLSet=='PF' );
          if (dropdown.Structure.HLA)
            customGrid.useHKLSet.addItem  ( 'Phases as HL coefficients','','HL',this.useHKLSet=='HL' );
        }

        if (is_Fpm)
          customGrid.useHKLSet.addItem  ( 'Anomalous Differences','','Fpm',this.useHKLSet=='Fpm' );

        if (is_Imean && (dropdown.layCustom=='refmac'))
          customGrid.useHKLSet.addItem  ( 'Mean Intensities assuming twinning','','TI',this.useHKLSet=='TI' );
        if (is_Fmean)
          customGrid.useHKLSet.addItem  ( 'Mean Amplitudes assuming twinning','','TF',this.useHKLSet=='TF' );

        customGrid.setWidget   ( customGrid.useHKLSet, r,1,1,4 );
        //customGrid.setCellSize ( '60px','',r,1 );
        customGrid.useHKLSet.make();

      }

      let phaseBlurRow = -1;
      if ((dropdown.layCustom=='arpwarp') && dropdown.hasOwnProperty('Structure'))  {
        setLabel ( 'Phase blurring factor:&nbsp;',++r,0 );
        customGrid.phaseBlur = makeRealInput ( dropdown.Structure.phaseBlur,'1.0',
            'Set blurring factor for phase restraints',r,1 );
        phaseBlurRow = r;
      }

      let wlRow = -1;
      if (is_Fpm)  {
        this.makeWavelengthInput();
        wlRow = r;
      }

      if ((wlRow>0) || (phaseBlurRow>0))  {
        (function(grid,pbrow,wlrow,useHKLSet){
          grid.useHKLSet.addSignalHandler ( 'state_changed',function(){
            if (pbrow>0)
              grid.setRowVisible ( pbrow,(['PF','HL'].indexOf(grid.useHKLSet.getValue())>=0) );
            if (wlrow>0)
              grid.setRowVisible ( wlrow,(grid.useHKLSet.getValue()=='Fpm') );
          });
          if (pbrow>0)
            grid.setRowVisible ( pbrow,(['PF','HL'].indexOf(useHKLSet)>=0) );
          if (wlrow>0)
            grid.setRowVisible ( wlrow,(useHKLSet=='Fpm') );
        }(customGrid,phaseBlurRow,wlRow,this.useHKLSet))
      }

      customGrid.setLabel ( ' ',++r,0,1,1 ).setHeight_px ( 8 );

    }

    this.ccp4buildLayout = function()  {
      this.makeResolutionLimits ( 'auto' );
    }

    this.modelcraftLayout = function()  {
      if (!('detwin' in this))
        this.detwin = false;
      // let col = 0;
      // if (customGrid.getNRows()>0)
      //   col = 1;
      // customGrid.detwin = customGrid.setCheckbox ( 'Use twinned refinement',
      //                                              this.detwin, r,col,1,1 )
      //           .setTooltip ( 'Check for twinned refinement. Only use this ' +
      //                         'option if you are sure your crystal is twinned.' );
      customGrid.detwin = customGrid.setCheckbox ( 'Use twinned refinement',
                                                   this.detwin, r,0,1,3 )
                .setTooltip ( 'Check for twinned refinement. Only use this ' +
                              'option if you are sure your crystal is twinned.' );
    }

    switch (dropdown.layCustom)  {
      case 'crank2'           :
      case 'anomData'         :  this.anomDataLayout   ();  break;
      case 'shelx-auto'       :
      case 'shelx-substr'     :
      case 'anomData-Shelx'   :  this.setWType         ();  break;
      case 'native'           :  this.nativeLayout     ();  break;
      case 'unmerged-ref'     :  this.unmergedRefLayout();  break;
      case 'simbad'           :  this.simbadLayout     ();  break;
      case 'cell-info'        :  this.cellInfoLayout   ();  break;
      case 'reindex'          :  this.reindexLayout    ();  break;
      case 'changereso'       :  this.makeResolutionLimits ( '' );     break;
      case 'nautilus'         :  this.makeHighResolutionLimit();       break;
      case 'buster'           :  this.makeResolutionLimits ( 'auto' ); break;
      case 'phaser-mr'        :
      case 'phaser-mr1'       :  this.spgLayout        (); // should be no break here!
      case 'phaser-mr-fixed'  :
      case 'phaser-mr-fixed1' :  this.phaserMRLayout   ();  break;
      case 'phaser-ep'        :  this.phaserEPLayout   ();  break;
      case 'arpwarp'          :
      case 'refmac'           :  this.refmacLayout     ();  break;
      case 'ccp4build'        :  this.ccp4buildLayout  ();  break;
      case 'modelcraft'       :  this.modelcraftLayout ();  break;
      default : ;
    }

  }


  DataHKL.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

    function readF ( inputWidget,def,allow_blank,errMsg )  {
      let text = inputWidget.getValue().trim();
      if ((text=='') && allow_blank)  {
        return text;
      } else if (isFloat(text))  {
        return text;
      } else  {
        msg += '|' + errMsg;
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
      if (isFloat(this.f11) && (parseFloat(this.f11)<0.0))
        msg += '|<b><i>f" must be positive</i></b>';
      if (this.wtype=='choose-one')
        msg += '|<b><i>Wavelength type must be chosen</i></b>';
    }

    this.collectAnomShelx = function()  {
      // get the wavelength type
      if (customGrid.wtype.isVisible())  {
        this.wtype = customGrid.wtype.getValue();
        if (this.wtype=='choose-one')
          msg += '|<b><i>Wavelength type must be chosen</i></b>';
      }
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
      //if (this.res_low =='') this.res_low  = round ( this.getLowResolution (),2 );
      //if (this.res_high=='') this.res_high = round ( this.getHighResolution(),2 );
      //if (this.res_ref =='') this.res_high = round ( this.getHighResolution(),2 );
    }

    this.collectPhaserEP = function()  {
      this.res_low    = customGrid.res_low   .getValue();
      this.res_high   = customGrid.res_high  .getValue();
      this.wavelength = customGrid.wavelength.getValue();

      if (this.wavelength=='') this.wavelength = this.getWavelength();

      this.f_use_mode = customGrid.f_use_mode.getValue();
      if (this.f_use_mode!='NO')  {
        this.f1  = readF ( customGrid.f1,this.f1,false,
                           '<b>wrong format (empty field?) of f\'</b>' );
        this.f11 = readF ( customGrid.f11,this.f11,false,
                           '<b>wrong format (empty field?) of f"</b>' );
        if (isFloat(this.f11) && (parseFloat(this.f11)<0.0))
          msg += '|<b><i>f" must be positive</i></b>';
      }
    }

    this.collectRefmac = function()  {
      if (dropdown.layCustom=='refmac')  {
        this.res_low  = customGrid.res_low .getValue();
        this.res_high = customGrid.res_high.getValue();
      }
      if ('wavelength' in customGrid)
        this.wavelength = customGrid.wavelength.getValue();
      if (this.res_low   =='') this.res_low  = round ( this.getLowResolution (),2 );
      if (this.res_high  =='') this.res_high = round ( this.getHighResolution(),2 );
      if (this.wavelength=='') this.wavelength = this.getWavelength();
      if ('useHKLSet' in customGrid)
            this.useHKLSet = customGrid.useHKLSet.getValue();
      else  this.useHKLSet = 'auto';
      if ('phaseBlur' in customGrid)
        dropdown.Structure.phaseBlur = customGrid.phaseBlur.getValue();
    }

    this.collectResoLimits = function()  {
      if ('res_low' in customGrid)
        this.res_low  = customGrid.res_low .getValue();
      if ('res_high' in customGrid)
        this.res_high = customGrid.res_high.getValue();
    }

    this.collectCCP4build = function()  {
      this.collectResoLimits();
    }

    this.collectModelcraft = function()  {
      this.detwin = customGrid.detwin.getValue();
    }

    this.collectChangeReso = function()  {
      this.collectResoLimits();
      if ((this.res_high=='') && (this.res_low==''))
        msg += '|<b><i>At least one resolution limit must be specified</i></b>';
      else  {
        let res_low0  = round ( this.getLowResolution (),2 );
        let res_high0 = round ( this.getHighResolution(),2 );
        if (this.res_high!='')  {
          if ((this.res_high<res_high0) || (this.res_high>res_low0))
            msg += '|<b><i>High resolution limit must be within ' + res_high0 + ' - ' +
                   res_low0 + '</i></b>';
        }
        if (this.res_low!='')  {
          if ((this.res_low<res_high0)  || (this.res_low>res_low0))
            msg += '|<b><i>Resolution limits must be within ' + res_high0 + ' - ' +
                   res_low0 + '</i></b>';
        }
        if ((this.res_high!='') && (this.res_low!=''))  {
          if (this.res_low<this.res_high)
            msg += '|<b><i>High resolution limit must be lower than low resolution limit</i></b>';
        }
      }
    }

    switch (dropdown.layCustom)  {
      case 'crank2'           :
      case 'anomData'         : this.collectAnom      ();  break;
      case 'shelx-auto'       :
      case 'shelx-substr'     :
      case 'anomData-Shelx'   : this.collectAnomShelx ();  break;
      case 'native'           : this.collectNative    ();  break;
      case 'reindex'          : this.collectReindex   ();  break;
      case 'changereso'       : this.collectChangeReso();  break;
      case 'nautilus'         : this.collectResoLimits();  break;
      case 'buster'           : this.collectResoLimits();  break;
      case 'simbad'           : this.collectSpG       ();  break;
      case 'phasser-mr'       :
      case 'phaser-mr1'       : this.collectSpG       (); // should be no break here!
      case 'phaser-mr-fixed'  :
      case 'phaser-mr-fixed1' : this.collectPhaserMR  ();  break;
      case 'phaser-ep'        : this.collectPhaserEP  ();  break;
      case 'arpwarp'          :
      case 'refmac'           : this.collectRefmac    ();  break;
      case 'ccp4build'        : this.collectCCP4build ();  break;
      case 'modelcraft'       : this.collectModelcraft();  break;
      default : ;
    }

    return msg;

  }

} else  {
  //  for server side

  module.exports.DataHKL = DataHKL;

}
