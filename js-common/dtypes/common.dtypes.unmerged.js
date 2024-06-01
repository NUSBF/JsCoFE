
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.unmerged.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Unmerged Data Class
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

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataUnmerged()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type       = 'DataUnmerged';
  this.ha_type     = '';     // heavy atom type
  this.symm_select = [];
  this.runs        = '';
  this.dataset     = null;

}

// if (__template_d)
//       DataUnmerged.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataUnmerged.prototype = Object.create ( DataTemplate.prototype );
// DataUnmerged.prototype.constructor = DataUnmerged;

if (__template_d)
  __cmd.registerClass1 ( 'DataUnmerged',DataUnmerged,__template_d.DataTemplate.prototype );
else    registerClass1 ( 'DataUnmerged',DataUnmerged,DataTemplate.prototype );

// ===========================================================================

DataUnmerged.prototype.title = function()  { return 'Unmerged Data'; }
DataUnmerged.prototype.icon  = function()  { return 'data';          }

// when data class version is changed here, change it also in python
// constructors
DataUnmerged.prototype.currentVersion = function()  {
  let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}

// DataUnmerged.prototype.makeSample = function()  {
// // this function created a fake data object for use in Workflow Creator
//   this.dataset = {
//     runs : [[ "0","1","60"]]
//   };
//   return this;
// }


// export such that it could be used in both node and a browser
if (!__template_d)  {
  //  for client side

  DataUnmerged.prototype.makeDataSummaryPage = function ( task )  {
    let dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name'            ,this.files[file_key.mtz],'Imported file name' );
    dsp.makeRow ( 'Original dataset name',this.dataset.name,'Original dataset name' );
    dsp.makeRow ( 'Resolution (&Aring;)' ,this.dataset.reso,'Dataset resolution'    );
    dsp.makeRow ( 'Wavelength'           ,this.dataset.wlen,'Wavelength'            );
    if ('HM' in this)
          dsp.makeRow ( 'Space group',this.HM      ,'Space symmetry group' );
    else  dsp.makeRow ( 'Space group','Unspecified','Space symmetry group' );

    let cell_spec = 'Not specified';
    if ('cell' in this.dataset)
      cell_spec = this.dataset.cell[0] + "&nbsp;" +
                  this.dataset.cell[1] + "&nbsp;" +
                  this.dataset.cell[2] + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
                  this.dataset.cell[3] + "&nbsp;" +
                  this.dataset.cell[4] + "&nbsp;" +
                  this.dataset.cell[5];

    dsp.makeRow ( 'Cell',cell_spec,'Unit cell parameters' );

    let ranges = '';
    for (let i=0;i<this.dataset.runs.length;i++)
      ranges += '[' + this.dataset.runs[i][1] + ',' + this.dataset.runs[i][2] + ']&nbsp;';
    dsp.makeRow ( 'Batches',ranges,'Batch ranges' );

    return dsp;

  }

  DataUnmerged.prototype.layCustomDropdownInput = function ( dropdown ) {

    if (!this.dataset)
      return;

    let customGrid = dropdown.customGrid;

//    if (dropdown.layCustom.startsWith('unmerged'))  {
    if (startsWith(dropdown.layCustom,'unmerged'))  {

      let row = 0;
      if (dropdown.layCustom=='unmerged-ref')  {
        let symm = $.extend ( true,{},this.dataset.symm );
        customGrid.combosel = new ComboDropdown ( symm,[230,200,180],0 );
        customGrid.setWidget ( customGrid.combosel,row++,0,1,2 );
      } else  {
        customGrid.setLabel ( 'Batches:',row,0,1,1 ).setFontItalic(true).setWidth ( '70px' );
        customGrid.setVerticalAlignment ( row,0,'middle' );
        let range_list = [];
        for (let i=0;i<this.dataset.runs.length;i++)
          range_list.push(this.dataset.runs[i][1] + '-' + this.dataset.runs[i][2]);
        let tooltip = 'Available batches: ' + range_list.join(', ');
        customGrid.runs = customGrid.setInputText ( this.runs,row,1,1,1 )
                                    .setTooltip1 ( tooltip,'slideDown',true,5000 )
                                    .setWidth ( '440px' );
        customGrid.setCellSize ( '50px' ,'',row,0 );
      }

     customGrid.setLabel ( ' ',row+1,0,1,2 ).setHeight_px ( 8 );

    }

  }

  DataUnmerged.prototype.collectCustomDropdownInput = function ( dropdown ) {

    if (!this.dataset)
      return '';

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;
    let regex_runs = /^\s*(\d+\s*(-\s*\d+\s*)?(,\s*\d+\s*(-\s*\d+\s*)?)*)?$/;
    //let regex_runs2 = /^\d+(-\d+)?(,\d+(-\d+)?)*$/;

//    if (dropdown.layCustom.startsWith('unmerged'))  {
    if (startsWith(dropdown.layCustom,'unmerged'))  {
      if (dropdown.layCustom=='unmerged-ref') {
        this.dataset.symm = customGrid.combosel.content;
        this.symm_select  = customGrid.combosel.getValues();
      } else  {
        this.runs = customGrid.runs.getValue().trim();
        let ok    = (this.runs.length==0);
        if (!ok)
        {
          ok = regex_runs.test(this.runs);
          if (ok)
          {
            let orig_list = this.runs.replace(/[, \-]+/g, ',').split(',');
            let sorted_list = orig_list.slice(0);
            sorted_list.sort(function(a, b){return a - b});
            ok = orig_list.toString() == sorted_list.toString();
            if (ok)
            {
              let x0 = '';
              let x1 = orig_list[0];
              for (let i = 1; i < orig_list.length; i++)
              {
                x0 = x1;
                x1 = orig_list[i];
                ok = ok && x0 != x1;
              }
            }
          }
        }
        if (!ok)  {
          msg = '|<b><i>Incorrect batch selection:</i>&nbsp;' + this.runs +
                '</b><br><br>An example of a correct selection:<br>' +
                '1-101, 110, 111, 112, 121-222<br>';
        }
      }
    }
    return msg;
  }
}


else  {
  //  for server side
  module.exports.DataUnmerged = DataUnmerged;
}
