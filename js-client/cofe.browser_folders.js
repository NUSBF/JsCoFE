
/*
 *  ===========================================================================
 *
 *    08.05.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ---------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.browser_folders.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  FoldersBrowser
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022
 *
 *  ===========================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


 // ===========================================================================
// Folders dialog class

function FoldersBrowser ( title,folders,onReturn_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  var grid = new Grid('-compact');
  this.addWidget ( grid );

  grid.setLabel ( 'Placeholder', 0,0,1,1 );

  $(this.element).dialog({
    resizable : true,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : [
      { text  : 'Make new',
        click : function(){}
      },
      { text  : 'Select',
        click : function(){}
      },
      { text  : 'Cancel',
        click : function() {
          $(this).dialog( "close" );
          window.setTimeout ( function(){
            onReturn_fnc ( '','' );
          },0 );
        }
      }
    ]
  });


}

FoldersBrowser.prototype = Object.create ( Widget.prototype );
FoldersBrowser.prototype.constructor = FoldersBrowser;
