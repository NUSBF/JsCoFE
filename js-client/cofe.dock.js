
/*
 *  ==========================================================================
 *
 *    20.03.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2020-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

// ===========================================================================

function Dock ( parent,onClick_func,onRightClick_func,addTask_func )  {

  this.opened = false;
  this.dock   = new Widget('div');

  $(this.dock.element).css({
    //'width'            : '300px',
    //'height'           : '100px',
    'position'         : 'absolute',
    'right'            : '28px',
    'top'              : '40px',
    'padding-top'      : '4px',
    'padding-left'     : '8px',
    'padding-bottom'   : '4px',
    'padding-right'    : '8px',
    'background-color' : 'rgba(242,242,242,0.67)', // '#F3F3F3',
    //'background-color' : '#F3F3F3',
    //'opacity'          : '0.5',
    'border'           : '1px solid gray',
    'border-radius'    : '8px',
    // 'box-shadow'       : '5px 5px 6px #888888',
    'white-space'      : 'nowrap'
  });

  if (__active_color_mode=='light')
    $(this.dock.element).css({
      'box-shadow'       : '4px 4px 6px 4px rgba(220,220,220,1.0)'
      // 'box-shadow' : '8px 8px 16px 8px rgba(212,212,212,1.0)'
    });

  $(this.dock.element).appendTo(parent.element);

  this.dock.setVisible ( false );  // in order to prevent blinking

  let self = this;
  this.sortable = new Sortable ( 26,24,
    function(itemId,tooltip,icon_uri){
      //alert ( itemId + ' selected' );
      window.setTimeout ( function(){
        onClick_func ( itemId,tooltip,icon_uri );
      },100);
    },
    function(itemId,tooltip,icon_uri){
      //alert ( itemId + ' right clicked' );
      return onRightClick_func ( itemId,tooltip,icon_uri );
      //return 1;  // delete item
    },
    function(event,ui){
      self.saveDockData();
    }
  );

  this.dock.addWidget ( this.sortable );
  this.sortable.setWidth_px ( 286 );

  this.addTask_func = addTask_func;

  // this.loadDockData();

}

Dock.prototype = Object.create ( Widget.prototype );
Dock.prototype.constructor = Dock;


Dock.prototype.loadDockData = function()  {
  let self = this;
  window.setTimeout ( function(){
    serverRequest ( fe_reqtype.getDockData,{},'Task Dock',function(data){
      if (('_type' in data) && (data._type=='DockData'))  {
        self.opened = data.opened;
        for (let i=0;i<data.tasks.length;i++)
          self._add_button ( data.tasks[i].icon,data.tasks[i].title,
                              data.tasks[i].task );
      }
      self.dock.addOnRightClickListener ( function(){
        self.addTask ( self.addTask_func() );
      });
      self.dock.setVisible ( data.opened );
    },function(){
    },'persist');
  },0);
}


Dock.prototype._add_button = function ( icon,title,task )  {
  let button = this.sortable.addItem ( image_path(icon),title,task );
  if (button)  {
    $(button.item.element).addClass ( 'sortable-button' );
    $(button.item.element).css({
      'margin'  : '1px 0px 1px 6px',
      'padding' : '3px',
      'float'   : 'left'
    });
    this.saveDockData();
  }
}

Dock.prototype.inDock = function ( task )  {
  return this.sortable.hasItem ( task._type );
}

Dock.prototype.addTask = function ( taskData )  {
  if (taskData)
    this._add_button ( taskData.icon,taskData.title,taskData.task );
}

Dock.prototype.addTaskClass = function ( task )  {
  if (task)
    this._add_button ( task.icon(),task.title,task._type );
}

Dock.prototype.removeTask = function ( taskId )  {  // taskId == task._type
  this.sortable.removeItem ( taskId );
  this.saveDockData();
}


Dock.prototype.saveDockData = function()  {
  
  if (this.sortable.isInitialised())  {
  
    let items    = this.sortable.getItems();
    let dockData = new DockData();

    dockData.opened = this.opened;

    for (let i=0;i<items.length;i++)
      dockData.tasks.push ({
        task  : items[i][0],  //  task._type
        title : items[i][1],  //  task.title
        icon  : items[i][2].split('\\').pop().split('/').pop()
                          .split('.').slice(0, -1).join('.')
      });

    serverRequest ( fe_reqtype.saveDockData,dockData,'Task Dock',
                    function(rdata){},null,'persist' );
  }

}


Dock.prototype.toggle = function()  {
  this.opened = !this.opened;
  /* -- beautiful but makes browsers hang
  if (this.opened)
        $(this.dock.element).show ( 'slide', { direction: 'up' }, 200 );
  else  $(this.dock.element).hide ( 'slide', { direction: 'up' }, 200 );
  */
  this.dock.setVisible ( this.opened );
//  this.dock.toggle();
  this.saveDockData();
}

Dock.prototype.show = function()  {
  if (!this.opened)
    this.toggle();
}

Dock.prototype.setDisabled = function ( disable_bool )  {
  if (disable_bool)  $(this.sortable.element).css ({opacity:0.5});
               else  $(this.sortable.element).css ({opacity:1.0});
  this.dock.setDisabled ( disable_bool );
}

Dock.prototype.setEnabled = function ( enable_bool )  {
  this.setDisabled ( !enable_bool );
}
