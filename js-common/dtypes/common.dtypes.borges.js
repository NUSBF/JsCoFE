
/*
 *  =================================================================
 *
 *    04.05.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.alignment.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Borges Library Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
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

function DataBorges()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type = 'DataBorges';

}

if (__template)
      DataBorges.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataBorges.prototype = Object.create ( DataTemplate.prototype );
DataBorges.prototype.constructor = DataBorges;


// ===========================================================================

DataBorges.prototype.title = function()  { return 'Borges library'; }
DataBorges.prototype.icon  = function()  { return 'data';           }

// when data class version is changed here, change it also in python
// constructors
DataBorges.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataBorges.prototype.makeDataSummaryPage = function ( task )  {
    var dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name',this.files[file_key.borges],'Imported file name' );

    return dsp;

  }

/*
  DataBorges.prototype.layCustomDropdownInput = function ( dropdown )  {
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


  DataBorges.prototype.collectCustomDropdownInput = function ( dropdown ) {

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
      msg  = '<b><i>Incorrect hit selection:</i>&nbsp;' + this.hitlist + '</b><br>';
      msg += '<br>An example of a correct selection:<br>';
      msg += '1-101, 110, 111, 112, 121-222<br>';
    }

    return msg;

  }
*/

} else  {
  //  for server side

  module.exports.DataBorges = DataBorges;

}
