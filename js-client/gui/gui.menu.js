
/*
 *  =================================================================
 *
 *    28.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.menu.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Menu and dropdwon comboboxes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict'; // *client*

// -------------------------------------------------------------------------
// MenuItem class

function MenuItem ( text,icon_uri,spacing=-1 )  {
  Widget.call ( this,'a' );
  this.setNoWrap();
  if (icon_uri.length>0)  {
    $(this.element).css({
      'background-image'    : 'url("' + icon_uri + '")',
      'background-repeat'   : 'no-repeat',
      'background-size'     : '1.5em',
      'background-position' : '0.25em center'
    });
  }
  if (text.length>0)  {
    this.text_div = new Widget ( 'div' );
    this.text_div.element.innerHTML = text.toString();
    $(this.text_div.element).css({
      'text-align'  : 'left',
      'white-space' : 'nowrap'
    });
    if (icon_uri.length>0)
      $(this.text_div.element).css({
        'margin-left' : '1.5em'
      });
    this.addWidget ( this.text_div );
  } else
    this.text_div = null;
  this.menu = null;
  if (spacing>=0)
    this.setPaddings ( spacing,spacing,spacing,spacing );
}

MenuItem.prototype.addMenu = function ( menu )  {
  this.addWidget ( menu );
  this.menu = menu;
}

MenuItem.prototype.setFontItalic = function ( italic )  {
  if (this.text_div)
    this.text_div.setFontItalic ( italic );
  return this;
}


MenuItem.prototype = Object.create ( Widget.prototype );
MenuItem.prototype.constructor = MenuItem;


// -------------------------------------------------------------------------
// Menu closure functions

// Close the dropdown if the user clicks outside of it
var __menu_onclick_ignore_counter = -1;
 
function __close_all_menus()  {
  let dropdowns = document.getElementsByClassName("menu-dropdown-content");
  for (let i=0;i<dropdowns.length;i++) {
    let openDropdown = dropdowns[i];
    if (openDropdown.classList.contains('menu-show')) {
      openDropdown.classList.remove('menu-show');
    }
  }
  __menu_onclick_ignore_counter = -1;  // lock auto-calls
}

// document.onclick = function(event)  {
//   if (__menu_onclick_ignore_counter>0)  __menu_onclick_ignore_counter--;
//                              else  __close_all_menus();
//   return true;
// }

// document.onclick = function(event)  {
//   if (__menu_onclick_ignore_counter>0)
//     __menu_onclick_ignore_counter--;
//   else if (__menu_onclick_ignore_counter==0)  {
//     __close_all_menus();
//     __menu_onclick_ignore_counter = -1;
//   }
//   return true;
// }

document.onclick = function(event)  {
  if (__menu_onclick_ignore_counter>=0)  {
    if (__menu_onclick_ignore_counter==0)  __close_all_menus();
                                else  __menu_onclick_ignore_counter--;
  }
  return true;
}


// -------------------------------------------------------------------------
// Menu class

function Menu ( text,icon_uri,right_click=false,spacing=-1 )  {
  Widget.call ( this,'div' );
  this.addClass ( 'menu-dropdown' );
  this.spacing  = spacing;
  this.disabled = false;
  this.onclick_custom_function = null;
  if ((text!='') || (icon_uri!=''))  {
    this.button = new IconLabel ( '',icon_uri );
    this.button.setNoWrap();
    //this.button.element.setAttribute ( 'class','menu-dropbtn' );
    this.button.addClass ( 'menu-dropbtn' );
    //this.button.setSize ( '32px','32px' );
    if ((text=='') && (icon_uri!=''))  {
      $(this.button.element).css({
        'background-color' : 'transparent',
        'background-size'  : '28px'
      });
    }
    this.addWidget ( this.button );
    (function(menu){
      if (right_click)  {
        menu.button.addOnRightClickListener ( function(e){
          let oic = __menu_onclick_ignore_counter;
          __close_all_menus();
          if ((!menu.disabled) && oic)  {
            if (menu.onclick_custom_function)
              menu.onclick_custom_function();
            // if (__menu_onclick_ignore_counter<0)
            //       __menu_onclick_ignore_counter = 1;
            // else  __menu_onclick_ignore_counter++;
            __menu_onclick_ignore_counter = 1;
            menu.dropdown.toggleClass ( 'menu-show' );
            if (('__active_color_mode' in window) && (__active_color_mode=='dark'))
                  menu.dropdown.element.style.boxShadow = 'none';
            else  menu.dropdown.element.style.boxShadow = menu.dropdown.light_shadow;
          }
        });
      } else  {
        menu.button.addOnClickListener ( function(e){
          let oic = __menu_onclick_ignore_counter;
          __close_all_menus();
          if ((!menu.disabled) && oic)  {
            if (menu.onclick_custom_function)
              menu.onclick_custom_function();
            // if (__menu_onclick_ignore_counter<0)
            //       __menu_onclick_ignore_counter = 1;
            // else  __menu_onclick_ignore_counter++;
            __menu_onclick_ignore_counter = 1;
            menu.dropdown.toggleClass ( 'menu-show' );
            if (('__active_color_mode' in window) && (__active_color_mode=='dark'))
                  menu.dropdown.element.style.boxShadow = 'none';
            else  menu.dropdown.element.style.boxShadow = menu.dropdown.light_shadow;
          }
        });
      }
    }(this));
  } else {
    this.button = null;
  }
  this.dropdown = new Widget ( 'div' );
  this.dropdown.addClass ( 'menu-dropdown-content' );
  this.dropdown.light_shadow = this.dropdown.element.style.boxShadow;
  this.addWidget ( this.dropdown );
  this.n_items = 0;
}

Menu.prototype = Object.create ( Widget.prototype );
Menu.prototype.constructor = Menu;

Menu.prototype.setMenuIcon = function ( icon_uri )  {
  if (this.button)
    this.button.setBackground ( icon_uri );
}

Menu.prototype.setOnClickCustomFunction = function ( onclick_func )  {
  this.onclick_custom_function = onclick_func;
}

Menu.prototype.setMaxHeight = function ( height_str )  {
  this.dropdown.element.style.maxHeight = height_str;
}

Menu.prototype.setMenuSpacing = function ( spacing )  {
  this.spacing = spacing;
}

Menu.prototype.addItem = function ( text,icon_uri )  {
let mi = new MenuItem ( text,icon_uri,this.spacing );
  this.dropdown.addWidget ( mi );
  this.n_items++;
  return mi;
}

Menu.prototype.addSeparator = function ()  {
let mi = new MenuItem ( '<hr/>','',2 );
  this.dropdown.addWidget ( mi );
  this.n_items++;
  return mi;
}

Menu.prototype.setDisabled = function ( disabled_bool )  {
  this.disabled = disabled_bool;
}

Menu.prototype.setEnabled = function ( enabled_bool )  {
  this.disabled = !enabled_bool;
}

Menu.prototype.setZIndex = function ( zindex )  {
  $(this.element).css({'z-index':zindex});
}

Menu.prototype.setWidth = function ( width )  {
  this.element.style.width = width;
  if (this.button)
    this.button.setWidth ( width );
  for (let i=0;i<this.child.length;i++)
    this.child[i].setWidth ( width );
}

Menu.prototype.setWidth_px = function ( width_int )  {
  $(this.element).width ( width_int );
  if (this.button)
    this.button.setWidth_px ( width_int );
  for (let i=0;i<this.child.length;i++)
    this.child[i].setWidth_px ( width_int );
}

Menu.prototype.setHeight_px = function ( height_int )  {
  $(this.dropdown.element).css({
    'max-height' : height_int + 'px'
  });
}


// -------------------------------------------------------------------------
// ContextMenu class

function ContextMenu ( widget,custom_func )  {
  Menu.call ( this,'','' );
  $(this.element).width  ( 1 );
  $(this.element).height ( 1 );
  (function(menu){
    widget.addOnRightClickListener ( function(){
      __close_all_menus();
      if (custom_func)
        custom_func();
      if (!menu.disabled)  {
        __menu_onclick_ignore_counter++;
        if (__menu_onclick_ignore_counter<0)
          __menu_onclick_ignore_counter = 0;
        menu.dropdown.element.classList.toggle ( 'menu-show' );
      }
    });
  }(this));
}

ContextMenu.prototype = Object.create ( Menu.prototype );
ContextMenu.prototype.constructor = ContextMenu;


// -------------------------------------------------------------------------
// Dropdown class -- jQuery-based version

function DropdownItemGroup ( groupName )  {
  Widget.call ( this,'optgroup' );
  if (groupName.length>0)
    this.setAttribute ( 'label',groupName  );
}

DropdownItemGroup.prototype = Object.create ( Widget.prototype );
DropdownItemGroup.prototype.constructor = DropdownItemGroup;

DropdownItemGroup.prototype.addItem = function ( text,icon_uri,itemId,selected_bool )  {
let item = new Widget ( 'option' );
  item.element.setAttribute ( 'value',itemId );
  item.value = itemId;
  if (selected_bool)
    item.element.setAttribute ( 'selected','selected' );
  item.element.innerHTML = text.toString();
  this.addWidget ( item );
  return this;  // for chaining
}


//  -------------------

function Dropdown()  {
  Widget.call ( this,'div' );
  this.select = new Widget ( 'select' );
  this.addWidget ( this.select );
  // now use addItem to stuff Set with buttons,
  // then call make()
  this.width          = 'auto';
  this.selected_value = null;
  this.selected_text  = null;
  this.activated      = false;
  this.onchange       = null;
}


Dropdown.prototype = Object.create ( Widget.prototype );
Dropdown.prototype.constructor = Dropdown;


Dropdown.prototype.reset = function()  {
  $(this.select.element).selectmenu('destroy');
  this.removeChild ( this.select );
  this.select = new Widget ( 'select' );
  this.addWidget ( this.select );
}

Dropdown.prototype.addItem = function ( text,icon_uri,itemId,selected_bool )  {
let item = new Widget ( 'option' );
  item.element.setAttribute ( 'value',itemId );
  item.value = itemId;
  if (selected_bool)  {
    item.element.setAttribute ( 'selected','selected' );
    this.selected_value = itemId;
    this.selected_text  = text;
  }
  item.element.innerHTML = text.toString();
  this.select.addWidget ( item );
  if (this.select.child.length==1)  {
    this.selected_value = itemId;
    this.selected_text  = text;
  }
  return this;  // for chaining
}


Dropdown.prototype.addItemGroup = function ( dropdownItemGroup )  {
  this.select.addWidget ( dropdownItemGroup );
  for (let j=0;j<dropdownItemGroup.child.length;j++)
    if (dropdownItemGroup.child[j].hasAttribute('selected'))  {
      this.selected_value = dropdownItemGroup.child[j].value;
      this.selected_text  = dropdownItemGroup.child[j].element.innerHTML;
      break;
    }
  return this; // for chaining
}


Dropdown.prototype.setWidth = function ( w )  {
  this.width = w;
  return this;
}


Dropdown.prototype.make = function()  {

  (function(ddn){
    window.setTimeout ( function(){

      $(ddn.select.element).selectmenu({

        width  : ddn.width,

        change : function( evnt, data ) {

            let event = new CustomEvent ( 'state_changed',{
              'detail' : {
                'text'      : data.item.label,
                'item'      : data.item.value,
                'prev_text' : ddn.selected_text,
                'prev_item' : ddn.selected_value
              }
            });

            ddn.selected_value = data.item.value;
            ddn.selected_text  = data.item.label;

            ddn.element.dispatchEvent(event);

            if (ddn.onchange)
              ddn.onchange ( ddn.selected_text,ddn.selected_value );

          }
      })
      .selectmenu('menuWidget').addClass('dropdown-overflow');

      ddn.activated = true;

    },0 );
  }(this));

  return this;

}


Dropdown.prototype.addOnChangeListener = function ( listener_func )  {
  this.onchange = listener_func;
  return this;
}


Dropdown.prototype.click = function()  {
  (function(dropdown){
    let event = new CustomEvent ( 'state_changed',{
      'detail' : {
        'text' : dropdown.selected_text,
        'item' : dropdown.selected_value
      }
    });
    dropdown.element.dispatchEvent(event);
  }(this));
}


Dropdown.prototype.setZIndex = function ( zindex )  {}


Dropdown.prototype.getItemByPosition = function ( itemNo )  {
  if ((0<=itemNo) && (itemNo<this.select.child.length))
        return this.select.child[itemNo];
  else  return null;
}


Dropdown.prototype.getItem = function ( itemId )  {

  let item = null;
  function findItem ( ddn,widget )  {
    for (let j=0;(j<widget.child.length) && (!item);j++)
      if (widget.child[j].type=='optgroup')
        findItem ( ddn,widget.child[j] );
      else if (widget.child[j].value==itemId)
        item = widget.child[j];
  }

  findItem ( this,this.select );

  return item;

}


Dropdown.prototype.selectItem = function ( itemId )  {

  function selItem ( ddn,widget )  {
    for (let j=0;j<widget.child.length;j++)
      if (widget.child[j].type=='optgroup')  {
        selItem ( ddn,widget.child[j] );
      } else if (widget.child[j].value==itemId)  {
        widget.child[j].setAttribute ( 'selected','selected' );
        ddn.selected_value = itemId;
        ddn.selected_text  = widget.child[j].element.innerHTML;
      } else {
        widget.child[j].removeAttribute ( 'selected' );
      }
  }

  if (this.activated)  {
    $(this.select.element).val ( itemId );
    $(this.select.element).selectmenu('refresh');
  } else
    selItem ( this,this.select );

  return this.selected_value;

}


Dropdown.prototype.selectItemByPosition = function ( itemNo )  {

  if ((0<=itemNo) && (itemNo<this.select.child.length))  {

    for (let j=0;j<this.select.child.length;j++)
      if (j==itemNo)  {
        this.select.child[j].setAttribute ( 'selected','selected' );
        this.selected_value = this.select.child[j].value;
        this.selected_text  = this.select.child[j].element.innerHTML;
      } else
        this.select.child[j].removeAttribute ( 'selected' );

    if (this.activated)  {
      $(this.select.element).val ( this.selected_value );
      $(this.select.element).selectmenu('refresh');
    }

  }

  return this;  // for chaining

}

Dropdown.prototype.getContent = function()  {
let content = [];

  for (let j=0;j<this.select.child.length;j++)
    content.push ([
      this.select.child[j].element.innerHTML,
      this.select.child[j].value,
      this.select.child[j].hasAttribute ( 'selected' )
    ]);

  return content;

}


Dropdown.prototype.disableItem = function ( itemId,disable_bool )  {

  let n         = -1;
  let wdg       = null;
  let selItem   = null;
  function disItem ( ddn,widget )  {
    for (let j=0;j<widget.child.length;j++)
      if (widget.child[j].type=='optgroup')  {
        disItem ( ddn,widget.child[j] );
      } else if (widget.child[j].value==itemId)  {
        if (widget.child[j].hasAttribute('disabled'))  {
          if (!disable_bool)  {
            widget.child[j].removeAttribute ( 'disabled' );
            n   = j;
            wdg = widget;
          }
        } else if (disable_bool)  {
          widget.child[j].setAttribute ( 'disabled','disabled' );
          n   = j;
          wdg = widget;
        }
      }
  }

  disItem ( this,this.select );

  if (n>=0)  {
    if (this.selected_value==itemId)   {
      if (n<wdg.child.length-1)
        this.selectItem ( wdg.child[n+1].value );
      else if (n>0)
        this.selectItem ( wdg.child[n-1].value );
    } else if (this.activated)
      $(this.select.element).selectmenu('refresh');
  }

  return this;  // for chaining

}


Dropdown.prototype.disableItemByPosition = function ( itemNo,disable_bool )  {

  if ((0<=itemNo) && (itemNo<this.select.child.length))  {

    if (disable_bool)
          this.select.child[itemNo].setAttribute    ( 'disabled','disabled' );
    else  this.select.child[itemNo].removeAttribute ( 'disabled' );

    let refresh = true;
    if (disable_bool && (this.selected_value==this.select.child[itemNo].value)) {
      if (itemNo<this.select.child.length-1)  {
        this.selectItemByPosition ( itemNo+1 );
        refresh = false;
      } else if (itemNo>0)  {
        this.selectItemByPosition ( itemNo-1 );
        refresh = false;
      }
    }

    if (refresh && this.activated)
      $(this.select.element).selectmenu('refresh');

  }

  return this;  // for chaining

}


Dropdown.prototype.setDisabled = function ( disable_bool )  {

  if (disable_bool)
        this.select.setAttribute    ( 'disabled','disabled' );
  else  this.select.removeAttribute ( 'disabled' );

  if (this.activated)
    $(this.select.element).selectmenu('refresh');

  return this;  // for chaining

}


Dropdown.prototype.setEnabled = function ( enable_bool )  {
  this.setDisabled ( !enable_bool );
}


Dropdown.prototype.deleteItem = function ( itemId )  {

  let n       = -1;
  let selItem = null;
  function delItem ( ddn,widget )  {
    for (let j=0;j<widget.child.length;j++)
      if (widget.child[j].type=='optgroup')  {
        disItem ( ddn,widget.child[j] );
      } else if (widget.child[j].value==itemId)  {
        n = j;
        if ((!selItem) && (ddn.selected_value==itemId))  {
          if (n<widget.child.length-1)
            selItem = widget.child[n+1];
          else if (n>0)
            selItem = widget.child[n-1];
        }
        widget.removeChild ( widget.child[j] );
      }
  }

  delItem ( this,this.select );

  if (selItem)
    this.selectItem ( selItem.value );

  return this;  // for chaining

}


Dropdown.prototype.deleteItemByPosition = function ( itemNo )  {

  if ((0<=itemNo) && (itemNo<this.select.child.length))  {
    if (this.selected_value==this.select.child[itemNo].value)  {
      if (itemNo<this.select.child.length-1)
        this.selectItemByPosition ( itemNo+1 );
      else if (itemNo>0)
        this.selectItemByPosition ( itemNo-1 );
    }
    this.select.removeChild ( this.select.child[itemNo] );
    if (this.activated)
      $(this.select.element).selectmenu('refresh');
  }

  return this;  // for chaining

}


Dropdown.prototype.isItemDisabled = function ( itemId )  {

  function isDis ( ddn,widget )  {
    let dis = false;
    for (let j=0;j<widget.child.length;j++)
      if (widget.child[j].type=='optgroup')  {
        dis = isDis ( ddn,widget.child[j] );
      } else if (widget.child[j].value==itemId)  {
        if (widget.child[j].getAttribute('disabled'))
          dis = true;
      }
    return dis;
  }

  return isDis ( this,this.select );

}

Dropdown.prototype.getValue = function()  {
  return this.selected_value;
}

Dropdown.prototype.getText = function()  {
  return this.selected_text;
}


// -------------------------------------------------------------------------
// ComboDropdown class

/*  ComboDropdown creates a line of Dropdown objects, featuring a complex
    choice of options. Conceptually this is identical to a Menu with Submenus.

    The widget works with the following type of structure on input:

      content = {
        "show"   : True,
        "select" : 0,
        "items"  : [
          {
            "label"  : "Auto",
            "value"  : "v1",
            "next"   : {
              "show"   : False,
              "select" : 0,
              "items"  : []
            }
          },
          {
            "label" : "P1",
            "value" : "v2",
            "next"  : {
              "show"  : True,
              "items" : [
                 {},
                 {}
              ]
            }
          },
          {
            "label" : "P2",
            "value" : "v3",
            "next"  : {
              "show"  : True,
              "items" : [
                 {},
                 {}
              ]
            }
          }
        ]
      }

  The final choice of options is returned as a list of corresponding 'values'
  attributed to items as above.

*/


function ComboDropdown ( content,width_list,direction )  {

  Grid.call ( this,'-compact' );

  this.content = content;

  this.makeDropdowns = function()  {

    this.headers   = [];
    this.dropdowns = [];

    let data = this.content;
    let i    = 0;
    while (data)  {

      let dropdown = new Dropdown();
      dropdown.setTooltip1 ( data.tooltip,'slideDown',true,7000 );
      this.dropdowns.push  ( dropdown     );
      this.headers.push    ( data.title   );

      this.dropdowns[i].content = data;
      this.dropdowns[i].setWidth ( width_list[i] );
      for (let j=0;j<data.items.length;j++)
        this.dropdowns[i].addItem ( data.items[j].label,'',j,j==data.select );
      this.dropdowns[i].make();

      this.setLabel  ( this.headers  [i],0,i,1,1 )
                     .setFontSize   ( '80%' )
                     .setFontItalic ( true  )
                     .setVisible    ( data.show );
      this.setWidget ( this.dropdowns[i],1,i,1,1 );
      this.dropdowns[i].setVisible ( data.show );

      (function(comboddn,ddn){
        ddn.element.addEventListener('state_changed',
          function(e){
            ddn.content.select = e.detail.item;
            comboddn.makeDropdowns();
            let event = new CustomEvent ( 'state_changed',{
              'detail' : {
                'values' : comboddn.getValues()
              }
            });
            comboddn.element.dispatchEvent(event);
          },false );
      }(this,this.dropdowns[i]));

      let item = data.items[this.dropdowns[i].getValue()];
      if ('next' in item)
            data = item.next;
      else  data = null;
      i++;

    }

  }

  this.makeDropdowns();

}

ComboDropdown.prototype = Object.create ( Grid.prototype );
ComboDropdown.prototype.constructor = ComboDropdown;


ComboDropdown.prototype.getValues = function()  {
  let values = [];
  for (let i=0;i<this.headers.length;i++)
    if (this.dropdowns[i].isVisible())
          values.push ( this.dropdowns[i].content
                            .items[this.dropdowns[i].getValue()].value );
    else  values.push ( "" );
  return values;
}
