
/*
 *  =================================================================
 *
 *    09.01.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

// -------------------------------------------------------------------------
// MenuItem class

function MenuItem ( text,icon_uri )  {
  Widget.call ( this,'a' );
//  this.element.setAttribute ( 'href','#menuitem_'+this.element.id );
  this.setNoWrap();
  if (icon_uri.length>0)  {
    $(this.element).css(
      {'background-image'   :'url("'+icon_uri+'")',
       'background-repeat'  :'no-repeat',
       'background-size'    :'1.5em',
       'background-position':'0.25em center'});
  }
  if (text.length>0)  {
    this.text_div = new Widget ( 'div' );
    this.text_div.element.innerHTML = text;
    $(this.text_div.element).css({'text-align' :'left',
                                  'white-space':'nowrap'});
    if (icon_uri.length>0)
      $(this.text_div.element).css({'margin-left':'1.5em'});
    this.addWidget ( this.text_div );
  } else
    this.text_div = null;
  this.menu = 0;
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
// Menu class

function Menu ( text,icon_uri )  {
  Widget.call ( this,'div' );
  this.element.setAttribute ( 'class','menu-dropdown' );
  this.disabled = false;
  this.button = new IconLabel ( text,icon_uri );
  this.button.setNoWrap();
  this.button.element.setAttribute ( 'class','menu-dropbtn' );
  if ((text=='') && (icon_uri!=''))  {
    $(this.button.element).css( {'background-color':'transparent',
                                 'background-size' :'28px'} );
  }
  this.dropdown = new Widget ( 'div' );
  this.dropdown.element.setAttribute ( 'class','menu-dropdown-content' );
  this.addWidget ( this.button   );
  this.addWidget ( this.dropdown );
  (function(menu){
    menu.button.addOnClickListener ( function(){
      if (!menu.disabled)
        menu.dropdown.element.classList.toggle ( 'menu-show' );
    });
  }(this));
  this.n_items = 0;
}

Menu.prototype = Object.create ( Widget.prototype );
Menu.prototype.constructor = Menu;

Menu.prototype.setMenuIcon = function ( icon_uri )  {
  this.button.setBackground ( icon_uri );
}

Menu.prototype.addItem = function ( text,icon_uri )  {
var mi = new MenuItem ( text,icon_uri );
  this.dropdown.addWidget ( mi );
  this.n_items++;
  return mi;
}

Menu.prototype.addSeparator = function ()  {
  menuItem = new MenuItem ( '<hr/>','' );
  this.dropdown.addWidget ( menuItem   );
  this.n_items++;
}

Menu.prototype.setDisabled = function ( disabled_bool )  {
  this.disabled = disabled_bool;
//  this.button  .setDisabled ( disabled_bool );
//  this.dropdown.setDisabled ( disabled_bool );
//  Widget.prototype.setDisabled.call ( this,disabled_bool );
}

Menu.prototype.setEnabled = function ( enabled_bool )  {
  this.disabled = !enabled_bool;
//  this.button  .setEnabled ( enabled_bool );
//  this.dropdown.setEnabled ( enabled_bool );
//  Widget.prototype.setEnabled.call ( this,enabled_bool );
}

Menu.prototype.setZIndex = function ( zindex )  {
  $(this.element).css({'z-index':zindex});
}

Menu.prototype.setWidth = function ( width )  {
  this.element.style.width  = width;
  this.button .setWidth ( width );
  for (var i=0;i<this.child.length;i++)
    this.child[i].setWidth ( width );
}

Menu.prototype.setWidth_px = function ( width_int )  {
  $(this.element).width ( width_int );
  this.button .setWidth_px ( width_int );
  for (var i=0;i<this.child.length;i++)
    this.child[i].setWidth_px ( width_int );
}

Menu.prototype.setHeight_px = function ( height_int )  {
  $(this.dropdown.element).css ( 'max-height', height_int + 'px' );
}


// Close the dropdown if the user clicks outside of it
document.onclick = function(event) {

  if (event.target !== undefined)  {
    try {
      if (!event.target.matches('.menu-dropbtn'))  {
        var dropdowns = document.getElementsByClassName("menu-dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('menu-show')) {
            openDropdown.classList.remove('menu-show');
          }
        }
      }
    } catch (e) {}
  }

}



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
var item = new Widget ( 'option' );
  item.element.setAttribute ( 'value',itemId );
  item.value = itemId;
  if (selected_bool)
    item.element.setAttribute ( 'selected','selected' );
  item.element.innerHTML = text;
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


Dropdown.prototype.addItem = function ( text,icon_uri,itemId,selected_bool )  {
var item = new Widget ( 'option' );
  item.element.setAttribute ( 'value',itemId );
  item.value = itemId;
  //item.element.setAttribute ( 'disabled','disabled' );
  if (selected_bool)  {
    item.element.setAttribute ( 'selected','selected' );
    this.selected_value = itemId;
    this.selected_text  = text;
  }
  item.element.innerHTML = text;
  this.select.addWidget ( item );
  if (this.select.child.length==1)  {
    this.selected_value = itemId;
    this.selected_text  = text;
  }
  return this;  // for chaining
}


Dropdown.prototype.addItemGroup = function ( dropdownItemGroup )  {
  this.select.addWidget ( dropdownItemGroup );
  for (var j=0;j<dropdownItemGroup.child.length;j++)
    if (dropdownItemGroup.child[j].hasAttribute('selected'))  {
      this.selected_value = dropdownItemGroup.child[j].value;
      this.selected_text  = dropdownItemGroup.child[j].element.innerHTML;
      break;
    }
  return this; // for chaining
}


Dropdown.prototype.setWidth = function ( w )  {
  this.width = w;
}


Dropdown.prototype.make = function()  {

  (function(ddn){
    window.setTimeout ( function(){

      $(ddn.select.element).selectmenu({

        width  : ddn.width,

        change : function( event, data ) {

            var event = new CustomEvent ( 'state_changed',{
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
    var event = new CustomEvent ( 'state_changed',{
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

  var item = null;
  function findItem ( ddn,widget )  {
    for (var j=0;(j<widget.child.length) && (!item);j++)
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
    for (var j=0;j<widget.child.length;j++)
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

    for (var j=0;j<this.select.child.length;j++)
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


Dropdown.prototype.disableItem = function ( itemId,disable_bool )  {

  var n         = -1;
  var wdg       = null;
  var selItem   = null;
  function disItem ( ddn,widget )  {
    for (var j=0;j<widget.child.length;j++)
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

    var refresh = true;
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

//  $("#" + this.select.element.id + " option[value='" + itemId + "']").remove();

  var n       = -1;
  var selItem = null;
  function delItem ( ddn,widget )  {
    for (var j=0;j<widget.child.length;j++)
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
    var dis = false;
    for (var j=0;j<widget.child.length;j++)
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

    var data = this.content;
    var i    = 0;
    while (data)  {

      var dropdown = new Dropdown();
      dropdown.setTooltip1 ( data.tooltip,'slideDown',true,7000 );
      this.dropdowns.push  ( dropdown     );
      this.headers.push    ( data.title   );

      this.dropdowns[i].content = data;
      this.dropdowns[i].setWidth ( width_list[i] );
      for (var j=0;j<data.items.length;j++)
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
            var event = new CustomEvent ( 'state_changed',{
              'detail' : {
                'values' : comboddn.getValues()
              }
            });
            comboddn.element.dispatchEvent(event);
          },false );
      }(this,this.dropdowns[i]));

      var item = data.items[this.dropdowns[i].getValue()];
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
  var values = [];
  for (var i=0;i<this.headers.length;i++)
    if (this.dropdowns[i].isVisible())
          values.push ( this.dropdowns[i].content
                            .items[this.dropdowns[i].getValue()].value );
    else  values.push ( "" );
  return values;
}


/*
// -------------------------------------------------------------------------
// MenuItem class

function MenuItem ( text,icon_uri )  {
  Widget.call ( this,'li' );
//  this.element.setAttribute ( 'href','#menuitem_'+this.element.id );
  this.setNoWrap();
  if (icon_uri.length>0)  {
    $(this.element).css(
      {'background-image'   :'url("'+icon_uri+'")',
       'background-repeat'  :'no-repeat',
       'background-size'    :'1.25em',
       'background-position':'0.25em center'});
  }
  if (text.length>0)  {
    this.text_div = new Widget ( 'div' );
    this.text_div.element.innerHTML = text;
    $(this.text_div.element).css({'text-align' :'left',
                                  'white-space':'nowrap'});
    if (icon_uri.length>0)
      $(this.text_div.element).css({'margin-left':'1.5em'});
    this.addWidget ( this.text_div );
  } else
    this.text_div = null;
  this.menu = 0;
}

MenuItem.prototype = Object.create ( Widget.prototype );
MenuItem.prototype.constructor = MenuItem;


MenuItem.prototype.addMenu = function ( menu )  {
  this.addWidget ( menu );
  this.menu = menu;
}

MenuItem.prototype.setFontItalic = function ( italic )  {
  if (this.text_div)
    this.text_div.setFontItalic ( italic );
  return this;
}



// -------------------------------------------------------------------------
// Menu class

function Menu ( text,icon_uri )  {
  Widget.call ( this,'div' );
  this.element.setAttribute ( 'class','menu-dropdown' );
  this.disabled = false;
  this.button = new IconLabel ( text,icon_uri );
  this.button.setNoWrap();
  this.button.element.setAttribute ( 'class','menu-dropbtn' );
  if ((text=='') && (icon_uri!=''))  {
    $(this.button.element).css( {'background-color':'transparent',
                                 'background-size' :'28px'} );
  }
  this.dropdown = new Widget ( 'ul' );
//  this.dropdown.element.setAttribute ( 'class','menu-dropdown-content' );
  this.addWidget ( this.button   );
  this.addWidget ( this.dropdown );
  (function(menu){
    menu.button.addOnClickListener ( function(){
      if (!menu.disabled)
        menu.dropdown.toggle();
//        menu.dropdown.element.classList.toggle ( 'menu-show' );
    });
  }(this));

$(this.dropdown.element).menu();

}

Menu.prototype = Object.create ( Widget.prototype );
Menu.prototype.constructor = Menu;

Menu.prototype.addItem = function ( text,icon_uri )  {
var mi = new MenuItem ( text,icon_uri );
  this.dropdown.addWidget ( mi );
  return mi;
}

Menu.prototype.addSeparator = function ()  {
  menuItem = new MenuItem ( '<hr/>','' );
  this.dropdown.addWidget ( menuItem   );
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
  this.element.style.width  = width;
  this.button .setWidth ( width );
  for (var i=0;i<this.child.length;i++)
    this.child[i].setWidth ( width );
}

Menu.prototype.setWidth_px = function ( width_int )  {
  $(this.element).width ( width_int );
  this.button .setWidth_px ( width_int );
  for (var i=0;i<this.child.length;i++)
    this.child[i].setWidth_px ( width_int );
}

Menu.prototype.setHeight_px = function ( height_int )  {
  $(this.dropdown.element).css ( 'max-height', height_int + 'px' );
}
*/


/*
// -------------------------------------------------------------------------
// Dropdown class -- self made

function Dropdown()  {
  Menu.call ( this,'','' );
  this.selected_text = '';  // will receive text of the selected item
  this.selected_item = '';  // will receive itemID of the selected item
  $(this.element).css({'padding':'2px'});
  $(this.button.element).css({'padding'   :'4px',
                              'text-align':'left'});
  this.setHeight_px ( 160 );
}

Dropdown.prototype = Object.create ( Menu.prototype );
Dropdown.prototype.constructor = Dropdown;

Dropdown.prototype.addItem = function ( text,icon_uri,itemId,selected_bool )  {
var mi = new MenuItem ( text,icon_uri );
  mi.text     = text;
  mi.icon_uri = icon_uri;
  mi.itemId   = itemId;
  $(mi.element).css({'padding':'2px'});
  this.dropdown.addWidget ( mi );
  if (selected_bool)  {
    this.selected_text = text;
    this.selected_item = itemId;
    this.button.setIconLabel ( text,icon_uri );
  }
  (function(dropdown){
    mi.addOnClickListener ( function(){
      dropdown.selected_text = text;
      dropdown.selected_item = itemId;
      dropdown.button.setIconLabel ( text,icon_uri );
      var event = new CustomEvent ( 'state_changed',{
        'detail' : {
          'text' : dropdown.selected_text,
          'item' : dropdown.selected_item
        }
      });
      dropdown.element.dispatchEvent(event);
    });
  }(this));
  return mi;
}

Dropdown.prototype.make = function() {}

Dropdown.prototype.click = function()  {
  (function(dropdown){
    var event = new CustomEvent ( 'state_changed',{
      'detail' : {
        'text' : dropdown.selected_text,
        'item' : dropdown.selected_item
      }
    });
    dropdown.element.dispatchEvent(event);
  }(this));
}

Dropdown.prototype.selectItem = function ( itemId )  {

  for (var i=0;i<this.dropdown.child.length;i++)  {
    var mi = this.dropdown.child[i];
    if (mi.itemId==itemId)  {
      this.selected_text = mi.text;
      this.selected_item = mi.itemId;
      this.button.setIconLabel ( mi.text,mi.icon_uri );
      break;
    }
  }

  return this.selected_item;

}

Dropdown.prototype.getValue = function()  {
  return this.selected_item;
}

Dropdown.prototype.getText = function()  {
  return this.selected_text;
}
*/



/*
<!DOCTYPE html>
<html>
<head>
<style>

.dropbtn {
    background-color: #4CAF50;
    color: white;
    padding: 16px;
    font-size: 16px;
    border: none;
    cursor: pointer;
}

.dropbtn:hover, .dropbtn:focus {
    background-color: #3e8e41;
}

.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 160px;
    overflow: auto;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
}

.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
}

.dropdown a:hover {background-color: #f1f1f1}

.show {display:block;}
</style>
</head>
<body>

<h2>Clickable Dropdown</h2>
<p>Click on the button to open the dropdown menu.</p>

<div class="dropdown">
<button onclick="myFunction()" class="dropbtn">Dropdown</button>
  <div id="myDropdown" class="dropdown-content">
    <a href="#home" onclick='alert("p1");'>Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </div>
</div>

<script>
// When the user clicks on the button,
//toggle between hiding and showing the dropdown content
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
</script>

</body>
</html>
*/
