//
//  =================================================================
//
//    01.01.21   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  gui.sortable.js  <interface>
//       ~~~~~~~~~
//  **** Project :  Object-Oriented HTML5 GUI Toolkit
//       ~~~~~~~~~
//  **** Content :  Sortable module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2021
//
//  =================================================================
//


function Sortable ( cellwidth_px,cellheight_px,
                    onclick_func, onrightclick_func,
                    onupdate_func )  {

  Widget.call ( this,'ul' );

  //this.setWidth_px ( width_px );
  this.cellwidth  = cellwidth_px  + 'px';
  this.cellheight = cellheight_px + 'px';

  $(this.element).css({
    'list-style-type' : 'none',
    //'max-width'       : width_px + 'px',
    'min-height'      : (cellheight_px+4) + 'px',
    'margin'          : '0px',
    'padding'         : '0px'
  });

  this.onclick      = onclick_func;
  this.onrightclick = onrightclick_func;

  $(this.element).sortable({
    update : function(event,ui) {
               onupdate_func ( event,ui );
             }
  });
  $(this.element).disableSelection();

}

Sortable.prototype = Object.create ( Widget.prototype );
Sortable.prototype.constructor = Sortable;


Sortable.prototype.addItem = function ( icon_uri,tooltip,itemId )  {

  for (var i=0;i<this.child.length;i++)
    if (this.child[i].itemId==itemId)
      return null;

  var button = new ImageButton ( icon_uri,this.cellwidth,this.cellheight );
  var item   = new Widget ( 'li' );

  item.addWidget  ( button  );
  item.setTooltip ( tooltip );
  //item.addClass   ( 'ui-state-default' );
  item.setSize_px ( this.cellwidth,this.cellheight );
  $(item.element).css({
    'margin'  : '3px 4px 3px 4px',
    'padding' : '1px',
    'float'   : 'left'
  });

  this.addWidget ( item );

  (function(self){
    button.addOnClickListener ( function(e){
      self.onclick ( itemId,tooltip,icon_uri );
      e.stopPropagation();
    });
    button.addOnRightClickListener ( function(e){
      if (self.onrightclick(itemId,tooltip,icon_uri)==1)
        self.removeItem ( itemId );
      e.stopPropagation();
    });
  }(this))

  item.itemId   = itemId;
  item.tooltip  = tooltip;
  item.icon_uri = icon_uri;

  return button;

}


Sortable.prototype.removeItem = function ( itemId )  {
var item = null;
  for (var i=0;(i<this.child.length) && (!item);i++)
    if ((this.child[i].type=='li') && (this.child[i].itemId==itemId))
      item = this.child[i];
  if (item)
    this.removeChild ( item );
}


/*
Sortable.prototype.make = function()  {
  $(this.element).sortable();
  $(this.element).disableSelection();
}
*/

Sortable.prototype.getNItems = function()  {
  return this.child.length;
}


Sortable.prototype.getItems = function()  {
  var sortedIDs = $(this.element).sortable ( 'toArray' );
  var items     = [];
  for (var j=0;j<sortedIDs.length;j++)
    for (var i=0;i<this.child.length;i++)
      if (this.child[i].id==sortedIDs[j])
        items.push ([
          this.child[i].itemId,
          this.child[i].tooltip,
          this.child[i].icon_uri
        ]);
  return items;
}
