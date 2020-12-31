
/*
 *  ==========================================================================
 *
 *    31.12.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dock.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Dock panel
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

function Dock ( parent )  {
  this.dock = new Widget('div');
  $(this.dock.element).css({
    'width'      : '300px',
    'height' : '100px',
//    'border'     : '1px solid black'
    'position'         : 'absolute',
    'right'            : '16px',
    'top'              : '46px',
    'padding-top'      : '4px',
    'padding-left'     : '20px',
    'padding-bottom'   : '4px',
    'padding-right'    : '20px',
    'background-color' : '#F3F3F3',
    'opacity'          : '0.5',
    'border'           : '1px solid gray',
    'border-radius'    : '8px',
    'box-shadow'       : '5px 5px 6px #888888',
    'white-space'      : 'nowrap'
  });
  $(this.dock.element).appendTo(parent.element);
}

Dock.prototype = Object.create ( Widget.prototype );
Dock.prototype.constructor = Dock;

Dock.prototype.toggle = function()  {
  this.dock.toggle();
}
