
/*
 *  =================================================================
 *
 *    11.12.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.alignment.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Alignment Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.template' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataAlignment()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type = 'DataAlignment';

  this.alignment_type = '';   // currently only 'hhpred'
  this.align_meta = {
    "type" : "unknown",
    "msg"  : "Not parsed",
    "hits" : []
  };
  this.hitlist = '';  // list of hits selected

}

if (__template)
      DataAlignment.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataAlignment.prototype = Object.create ( DataTemplate.prototype );
DataAlignment.prototype.constructor = DataAlignment;


// ===========================================================================

DataAlignment.prototype.title = function()  { return 'Alignment data'; }
DataAlignment.prototype.icon  = function()  { return 'data_alignment';          }

// when data class version is changed here, change it also in python
// constructors
DataAlignment.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataAlignment.prototype.makeDataSummaryPage = function ( task )  {
    var dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name'     ,this.files[file_key.hhr],'Imported file name' );
    dsp.makeRow ( 'Alignment type',this.alignment_type,'Aligment type or source' );
    dsp.makeRow ( 'Hits'          ,this.align_meta.hits.length,'Number of hits' );

    return dsp;

  }

  DataAlignment.prototype.layCustomDropdownInput = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = 0;

    customGrid.setLabel ( 'Hits:',row,0,1,1 ).setFontItalic(true).setWidth ( '50px' );
    customGrid.setVerticalAlignment ( row,0,'middle' );
    tooltip = 'Available hits: 1-' + this.align_meta.hits.length;
    customGrid.hitlist = customGrid.setInputText ( this.hitlist,row,1,1,1 )
                                   .setTooltip1 ( tooltip,'slideDown',true,5000 )
                                   .setWidth ( '440px' );
    customGrid.setCellSize ( '50px' ,'',row,0 );

    customGrid.setLabel ( ' ',row+1,0,1,2 ).setHeight_px ( 8 );

  }


  DataAlignment.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg         = '';   // Ok by default
    var customGrid  = dropdown.customGrid;
    var regex_hlist = /^\s*(\d+\s*(-\s*\d+\s*)?(,\s*\d+\s*(-\s*\d+\s*)?)*)?$/;

    this.hitlist = customGrid.hitlist.getValue().trim();
    var ok = (this.hitlist.length == 0);

    if (!ok)  {
      ok = regex_hlist.test ( this.hitlist );
      if (ok)  {
        var orig_list   = this.hitlist.replace(/[, \-]+/g, ',').split(',');
        var sorted_list = orig_list.slice(0);
        sorted_list.sort ( function(a,b){ return a - b });
        ok = (orig_list.toString() == sorted_list.toString());
        if (ok)  {
          var x0 = '';
          var x1 = orig_list[0];
          for (var i=1;i<orig_list.length;i++)  {
            x0 = x1;
            x1 = orig_list[i];
            ok = ok && (x0!=x1);
          }
        }
      }
    }

    if (!ok)  {
      msg  = '|<b><i>Incorrect hit selection:</i>&nbsp;' + this.hitlist +
             '</b><br><br>An example of a correct selection:<br>' +
             '1-101, 110, 111, 112, 121-222<br>';
    }

    return msg;

  }


} else  {
  //  for server side

  module.exports.DataAlignment = DataAlignment;

}
