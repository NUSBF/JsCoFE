
/*
 *  ========================================================================
 *
 *    05.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.widgets.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common GUI widgets
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ========================================================================
 *
 *  Requires: 	jquery.js
 *
 *  http://usejsdoc.org
 *
 */

'use strict'; // *client*

// -------------------------------------------------------------------------
// Base widget class

var __id_cnt = 0;  // counter used to autogenerate html ids

/** This is a Widget.
  @constructor
  @param {string} type - the widget type
*/
function Widget(type) {
  /** @lends Widget.prototype */
  this.id = type + '_' + __id_cnt++;
  this.type = type;
  this.child = [];
  this.parent = null;
  this.element = document.createElement(type);
  this.element.setAttribute('id', this.id);
  this.element.setAttribute('name', 'name-' + this.id);
  this.element.style.fontSize = '16px';
}

/** Setting HTML id attribute for Widget.
  @param {string}  id - the widget id
  @return {Widget} reference to Widget
*/
Widget.prototype.setId = function (id) {
  this.id = id;
  this.element.setAttribute('id', this.id);
  return this;
}

Widget.prototype.delete = function () {
  $(this.element).empty();
  $(this.element).remove();
  // if (this.parent)
  //   this.parent.removeChild ( this );
  // else if (this.element.parentNode)
  //   this.element.parentNode.removeChild ( this.element );
}

Widget.prototype.setAttribute = function (attr, value) {
  this.element.setAttribute(attr, value);
  return this;
}

Widget.prototype.hasAttribute = function (attr) {
  return this.element.hasAttribute(attr);
}

Widget.prototype.getAttribute = function (attr) {
  return this.element.getAttribute(attr);
}

Widget.prototype.removeAttribute = function (attr) {
  this.element.removeAttribute(attr);
  return this;
}

Widget.prototype.setText = function (text) {
  this.element.innerHTML = text.toString();
  // if (text)  this.element.innerHTML = text;
  //      else  this.element.innerHTML = ' ';  // Safari 14 fix
  return this;
}

Widget.prototype.addClass = function (class_name) {
  this.element.classList.add(class_name);
  return this;
}

Widget.prototype.removeClass = function (class_name) {
  this.element.classList.remove(class_name);
  return this;
}

Widget.prototype.toggleClass = function (class_name) {
  this.element.classList.toggle(class_name);
  return this;
}

Widget.prototype.setCursor = function (cursor) {
  // e.g., cursor='pointer'
  $(this.element).css('cursor', cursor);
  return this;
}

function __set_tooltip(element, text) {
  if (text) {
    element.setAttribute('title', text);
    var delay = 1500;
    var duration = Math.sqrt(text.split(' ').length) * 1500; // dynamic duration
    if (duration > 0) {
      $(element).tooltip({
        show: { effect: 'slideDown', delay: delay },
        track: true,
        content: function (callback) {
          callback($(this).prop('title'));
        },
        open: function (event, ui) {
          setTimeout(function () {
            $(ui.tooltip).hide('explode');
          }, delay + duration);
        }
      });
    }
  }
}

Widget.prototype.setTooltip = function (text) {
  __set_tooltip(this.element, text);
  // if (text)  {
  //   this.element.setAttribute ( 'title',text );
  //   var delay    = 1500;
  //   var duration = Math.sqrt(text.split(' ').length)*1500; // dynamic duration
  //   if (duration>0)  {
  //     $(this.element).tooltip({
  //         show  : { effect : 'slideDown', delay: delay },
  //         track : true,
  //         content: function (callback) {
  //             callback($(this).prop('title'));
  //         },
  //         open  : function (event, ui) {
  //             setTimeout(function() {
  //                 $(ui.tooltip).hide('explode');
  //             },delay+duration);
  //         }
  //     });
  //   }
  // }
  /*
  $(this.element).tooltip({
      content : text,
      show    : { effect: 'slideDown' },
      track   : true,
      open    : function (event, ui) {
          setTimeout(function() {
              $(ui.tooltip).hide('explode');
          },1500);
      }
  });
  */
  return this;
}

Widget.prototype.setTooltip1 = function (text, showType, track_bool, delay_ms) {
  this.element.setAttribute('title', text);
  if (delay_ms <= 0)
    $(this.element).tooltip({
      content: text,
      show: { effect: showType, },
      track: track_bool
    })
  else
    $(this.element).tooltip({
      content: text,
      show: { effect: showType },
      track: track_bool,
      open: function (event, ui) {
        setTimeout(function () {
          $(ui.tooltip).hide('explode');
        }, delay_ms);
      }
    });
  return this;
}

Widget.prototype.redraw = function (width) {
  var disp = this.element.display;
  this.element.display = 'none';
  this.element.offsetHeight; // no need to store this anywhere, the reference is enough
  this.element.display = disp;
}

Widget.prototype.setWidth = function (width) {
  this.element.style.width = width;
  return this;
}

Widget.prototype.setWidth_px = function (width_int) {
  $(this.element).width(width_int);
  return this;
}

Widget.prototype.setHeight = function (height) {
  this.element.style.height = height;
  return this;
}

Widget.prototype.setMaxHeight = function (height_str) {
  this.element.style.maxHeight = height_str;  // e.g., '200px'
  return this;
}

Widget.prototype.setHeight_px = function (height_int) {
  $(this.element).height(height_int);
  return this;
}

Widget.prototype.setSize = function (width, height) {
  if (width.length > 0)
    this.element.style.width = width;
  if (height.length > 0)
    this.element.style.height = height;
  return this;
}

Widget.prototype.setSize_px = function (width_int, height_int) {
  $(this.element).outerWidth(width_int);
  $(this.element).outerHeight(height_int);
  return this;
}

Widget.prototype.width_px = function () {
  return $(this.element).outerWidth();
}

Widget.prototype.height_px = function () {
  return $(this.element).outerHeight();
}


Widget.prototype.getBoundingRect = function () {
  return this.element.getBoundingClientRect();
}

Widget.prototype.setFontSize = function (size) {
  $(this.element).css({ "font-size": size });
  return this;
}

Widget.prototype.setFontBold = function (bold) {
  if (bold) this.element.style.fontWeight = 'bold';
  else this.element.style.fontWeight = 'normal';
  return this;
}

Widget.prototype.setFontWeight = function (weight) {
  this.element.style.fontWeight = weight;  // 400 is normal, 700 is bold
  return this;
}

Widget.prototype.setFontItalic = function (italic) {
  if (italic) this.element.style.fontStyle = 'italic';
  else this.element.style.fontStyle = 'normal';
  return this;
}

Widget.prototype.setBackgroundColor = function (color) {
  this.element.style.backgroundColor = color;
  return this;
}

Widget.prototype.setFontColor = function (color) {
  this.element.style.color = color;
  return this;
}

Widget.prototype.setFontFamily = function (family) {
  this.element.style.fontFamily = family;
  return this;
}

Widget.prototype.setFontLineHeight = function (lineHeight) {
  this.element.style.lineHeight = lineHeight;
  return this;
}

Widget.prototype.setFont = function (family, size, bold, italic) {
  this.element.style.fontFamily = family;
  this.element.style.fontSize = size;
  if (bold) this.element.style.fontWeight = 'bold';
  else this.element.style.fontWeight = 'normal';
  if (italic) this.element.style.fontStyle = 'italic';
  else this.element.style.fontStyle = 'normal';
  return this;
}

Widget.prototype.setPaddings = function (left, top, right, bottom) {
  var css = {};
  if (left) css['padding-left'] = left;
  if (top) css['padding-top'] = top;
  if (right) css['padding-right'] = right;
  if (bottom) css['padding-bottom'] = bottom;
  $(this.element).css(css);
  return this;
}

Widget.prototype.setMargins = function (left, top, right, bottom) {
  var css = {};
  if (left) css['margin-left'] = left;
  if (top) css['margin-top'] = top;
  if (right) css['margin-right'] = right;
  if (bottom) css['margin-bottom'] = bottom;
  $(this.element).css(css);
  return this;
}

Widget.prototype.setScrollable = function (onx_value, ony_value) {
  if (onx_value.length > 0)
    $(this.element).css({ 'overflow-x': onx_value });
  if (ony_value.length > 0)
    $(this.element).css({ 'overflow-y': ony_value });
  return this;
}

Widget.prototype.getScrollPosition = function () {
  return [this.element.scrollLeft, this.element.scrollTop];
}

Widget.prototype.setScrollPosition = function (scrollPos) {
  this.element.scrollLeft = scrollPos[0];
  this.element.scrollTop = scrollPos[1];
}

Widget.prototype.setScrollListener = function (callback_func) {
  let self = this;
  $(this.element).scroll(function () {
    callback_func([self.element.scrollLeft, self.element.scrollTop]);
  });
}


Widget.prototype.setHorizontalAlignment = function (alignment) {
  $(this.element).css({ "text-align": alignment });
  return this;
}

Widget.prototype.setVerticalAlignment = function (alignment) {
  $(this.element).css({ "vertical-align": alignment });
  return this;
}

Widget.prototype.setNoWrap = function () {
  $(this.element).css({ 'white-space': 'nowrap' });
  return this;
}

Widget.prototype.addWidget = function (widget) {
  this.child.push(widget);
  this.element.appendChild(widget.element);
  widget.parent = this;
  return this;
}

Widget.prototype.insertWidget = function (widget, pos) {
  this.child.splice(pos, 0, widget);
  this.element.insertBefore(widget.element, this.element.childNodes[pos]);
  widget.parent = this;
  return this;
}

Widget.prototype.removeChild = function (widget) {
  var child = [];
  for (var i = 0; i < this.child.length; i++)
    if (this.child[i].id == widget.id) {
      this.element.removeChild(widget.element);
    } else {
      child.push(this.child[i]);
    }
  this.child = child;
  return this;
}

Widget.prototype.removeAllChildren = function () {
  while (this.element.firstChild)
    this.element.removeChild(this.element.firstChild);
  this.child = [];
  return this;
}

Widget.prototype.empty = function () {
  $(this.element).empty();
  return this;
}

Widget.prototype.hide = function () {
  $(this.element).hide();
  return this;
}

Widget.prototype.show = function () {
  $(this.element).show();
  return this;
}

Widget.prototype.setVisible = function (yn_bool) {
  if (yn_bool) $(this.element).show();
  else $(this.element).hide();
  return this;
}

Widget.prototype.isVisible = function () {
  return $(this.element).is(':visible');
}

Widget.prototype.toggle = function () {
  $(this.element).toggle();
  return this;
}

Widget.prototype.setOpacity = function (opacity) {
  $(this.element).css({ 'opacity': opacity });
  // if (yn_bool)  $(this.element).css({'opacity':1});
  //         else  $(this.element).css({'opacity':0});
  // if (yn_bool)  $(this.element).fadeIn();
  //         else  $(this.element).fadeOut();
  return this;
}

Widget.prototype.fade = function (in_bool) {
  if (in_bool) $(this.element).fadeIn();
  else $(this.element).fadeOut();
}

Widget.prototype.setDisabled = function (disabled_bool) {
  this.element.disabled = disabled_bool;
  return this;
}

Widget.prototype.setEnabled = function (enabled_bool) {
  this.element.disabled = (!enabled_bool);
  return this;
}

Widget.prototype.isEnabled = function () {
  return (!this.element.disabled);
}

Widget.prototype.isDisabled = function () {
  return this.element.disabled;
}

Widget.prototype.setDisabledAll = function (disabled_bool) {
  $(this.element).find(':input').prop('disabled', disabled_bool);
  (function (w) {
    window.setTimeout(function () {
      $(w.element).find(':input').prop('disabled', disabled_bool);
    }, 0);
  }(this))
  return this;
}

Widget.prototype.setEnabledAll = function (enabled_bool) {
  $(this.element).find(':input').prop('disabled', !enabled_bool);
  (function (w) {
    window.setTimeout(function () {
      $(w.element).find(':input').prop('disabled', !enabled_bool);
    }, 0);
  }(this))
  return this;
}

Widget.prototype.addOnClickListener = function (listener_func) {
  this.element.addEventListener('click', function (e) {
    e.preventDefault();
    listener_func(e);
  });
  // $(this.element).on( 'click', function() {
  //   listener_func();
  // });
  // this.element.onclick = function() {
  //   listener_func();
  // };
  return this;
}

Widget.prototype.addOnDblClickListener = function (listener_func) {
  this.element.addEventListener('dblclick', function (e) {
    e.preventDefault();
    listener_func(e);
  });
  return this;
}

Widget.prototype.addOnRightClickListener = function (listener_func) {
  this.element.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    listener_func(e);
    return false;
  }, false);
  return this;
}

Widget.prototype.addOnChangeListener = function (listener_func) {
  this.element.addEventListener('change', listener_func);
  return this;
}

Widget.prototype.addOnInputListener = function (listener_func) {
  this.element.addEventListener('input', listener_func);
  return this;
}

Widget.prototype.emitSignal = function (signal, data) {
  var event = new CustomEvent(signal, {
    'detail': data
  });
  this.element.dispatchEvent(event);
}


Widget.prototype.postSignal = function (signal, data, delay) {
  (function (w) {
    window.setTimeout(function () {
      w.emitSignal(signal, data);
    }, delay);
  }(this))
}

Widget.prototype.addSignalHandler = function (signal, onReceive) {
  this.element.addEventListener(signal, function (e) {
    onReceive(e.detail);
  }, false);
  // false: use the Bubbling mode
  // true:  use Capturing mode
  // The difference is in response to nested widgets: Bubbling mode gives
  // priority to event handlers associated with the innermost widget, while
  // Capturing mode gives priority to the outmost one.
}

Widget.prototype.click = function () {
  this.element.click();
}


// -------------------------------------------------------------------------
// Grid class

function Grid(style) {
  Widget.call(this, 'table');
  if (style != 'None')
    this.element.setAttribute('class', 'grid-layout' + style);
    // $(this.element).addClass ( 'grid-layout' + style );
}

Grid.prototype = Object.create(Widget.prototype);
Grid.prototype.constructor = Grid;

Grid.prototype.clear = function () {
  this.element.innerHTML = ' ';  // Safari 14 fix
}

Grid.prototype.setStyle = function (style ) {
  if (style != 'None')
    this.element.setAttribute('class', 'grid-layout' + style);
}

Grid.prototype.insertRows = function (rowBefore, nRows) {
  while (this.element.rows.length <= rowBefore)
    this.element.insertRow(-1); // this adds a row
  for (let i = 0; i < nRows; i++)
    this.element.insertRow(rowBefore);
}

Grid.prototype.hideRow = function (row) {
  while (this.element.rows.length <= row) {
    this.element.insertRow(-1); // this adds a row
  }
  $(this.element.rows[row]).hide();
  this.element.rows[row]._was_hidden = true;
}

Grid.prototype.showRow = function (row) {
  while (this.element.rows.length <= row)
    this.element.insertRow(-1); // this adds a row
  $(this.element.rows[row]).show();
  this.element.rows[row]._was_hidden = false;
}

Grid.prototype.wasRowHidden = function (row) {
  if (row >= this.element.rows.length)
    return false;
  if ('_was_hidden' in this.element.rows[row])
    return this.element.rows[row]._was_hidden;
  return false;
}

Grid.prototype.setRowVisible = function (row, visible_bool) {
  if (visible_bool) this.showRow(row);
  else this.hideRow(row);
}

Grid.prototype.getCell = function (row, col) {
  var r = this.element.rows.length;
  while (this.element.rows.length <= row) {
    this.element.insertRow(-1); // this adds a row
    this.element.rows[r].setAttribute('id', this.id + '__' + r);
    r++;
  }
  var gridRow = this.element.rows[row];
  if (col >= 0) {
    while (gridRow.cells.length <= col)
      gridRow.insertCell(-1); // this adds a cell
    return gridRow.cells[col];
  } else {
    return gridRow;
  }
}

Grid.prototype.insertCell = function (row, col) {
  // make sure that cell [row,col] is there
  this.getCell(row, col);
  var gridRow = this.element.rows[row];
  gridRow.insertCell(col);  // this inserts a cell
  return gridRow.cells[col];   // return inserted cell
}

Grid.prototype.getNRows = function () {
  return this.element.rows.length;
}

Grid.prototype.truncateRows = function (row) {
  while (this.element.rows.length > row + 1)
    this.element.deleteRow(-1);  // deletes last row
  return this.element.rows.length;
}

Grid.prototype.deleteRow = function (row) {
  this.element.deleteRow(row);
  return this.element.rows.length;
}

Grid.prototype.getNCols = function () {
  var ncols = 0;
  for (var i = 0; i < this.element.rows.length; i++)
    ncols = Math.max(ncols, this.element.rows[i].cells.length);
  return ncols;
}

Grid.prototype.setWidget = function (widget, row, col, rowSpan, colSpan) {
  var cell = this.getCell(row, col);
  $(cell).empty();
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (widget) {
    cell.appendChild(widget.element);
    widget.parent = this;
  }
  return cell;
}

Grid.prototype.addWidget = function (widget, row, col, rowSpan, colSpan) {
  var cell = this.getCell(row, col);
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (widget) {
    cell.appendChild(widget.element);
    widget.parent = this;
  }
  return cell;
}

Grid.prototype.insertWidget = function (widget, row, col, rowSpan, colSpan) {
  var cell = this.insertCell(row, col);
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  if (widget) {
    cell.appendChild(widget.element);
    widget.parent = this;
  }
  return cell;
}

Grid.prototype.setSpan = function (row, col, rowSpan, colSpan) {
  var cell = this.getCell(row, col);
  cell.rowSpan = rowSpan;
  cell.colSpan = colSpan;
  return cell;
}


Grid.prototype.setPanel = function (row, col, rowSpan, colSpan) {
  var panel = new Widget('div');
  this.setWidget(panel, row, col, rowSpan, colSpan);
  return panel;
}


Grid.prototype.setFieldset = function (title, row, col, rowSpan, colSpan) {
  var fieldset = new Fieldset(title);
  this.setWidget(fieldset, row, col, rowSpan, colSpan);
  return fieldset;
}


Grid.prototype.setGrid = function (style, row, col, rowSpan, colSpan) {
  var grid = new Grid(style);
  this.setWidget(grid, row, col, rowSpan, colSpan);
  return grid;
}

Grid.prototype.setTable = function (row, col, rowSpan, colSpan) {
  var table = new Table();
  this.setWidget(table, row, col, rowSpan, colSpan);
  return table;
}

Grid.prototype.setButton = function (text, icon_uri, row, col, rowSpan, colSpan) {
  var button = new Button(text, icon_uri);
  this.setWidget(button, row, col, rowSpan, colSpan);
  return button;
}

Grid.prototype.addButton = function (text, icon_uri, row, col, rowSpan, colSpan) {
  var button = new Button(text, icon_uri);
  this.addWidget(button, row, col, rowSpan, colSpan);
  return button;
}

Grid.prototype.setRadioSet = function (row, col, rowSpan, colSpan) {
  var radio = new RadioSet();
  this.setWidget(radio, row, col, rowSpan, colSpan);
  this.setNoWrap(row, col);
  return radio;
}

Grid.prototype.setLabel = function (text, row, col, rowSpan, colSpan) {
  var label = new Label(text);
  this.setWidget(label, row, col, rowSpan, colSpan);
  return label;
}

Grid.prototype.addLabel = function (text, row, col, rowSpan, colSpan) {
  var label = new Label(text);
  this.addWidget(label, row, col, rowSpan, colSpan);
  return label;
}

Grid.prototype.setIconLabel = function (text, icon_uri, row, col, rowSpan, colSpan) {
  var label = new IconLabel(text, icon_uri);
  this.setWidget(label, row, col, rowSpan, colSpan);
  return label;
}

Grid.prototype.setInputText = function (text, row, col, rowSpan, colSpan) {
  var input = new InputText(text);
  this.setWidget(input, row, col, rowSpan, colSpan);
  return input;
}

Grid.prototype.addInputText = function (text, row, col, rowSpan, colSpan) {
  var input = new InputText(text);
  this.addWidget(input, row, col, rowSpan, colSpan);
  return input;
}

Grid.prototype.setTextArea = function (text, placeholder, nrows, ncols,
  row, col, rowSpan, colSpan) {
  let textarea = new TextArea(text, placeholder, nrows, ncols);
  this.setWidget(textarea, row, col, rowSpan, colSpan);
  return textarea;
}

Grid.prototype.addTextArea = function (text, placeholder, nrows, ncols,
  row, col, rowSpan, colSpan) {
  let textarea = new TextArea(text, placeholder, nrows, ncols);
  this.addWidget(textarea, row, col, rowSpan, colSpan);
  return textarea;
}

Grid.prototype.setHLine = function (size, row, col, rowSpan, colSpan) {
  let hline = new HLine(size);
  this.setWidget(hline, row, col, rowSpan, colSpan);
  return hline;
}

Grid.prototype.setImageButton = function (icon_uri, width, height, row, col, rowSpan, colSpan) {
  let ibutton = new ImageButton(icon_uri, width, height);
  this.setWidget(ibutton, row, col, rowSpan, colSpan);
  return ibutton;
}

Grid.prototype.setImage = function (icon_uri, width, height, row, col, rowSpan, colSpan) {
  let image = new Image(icon_uri, width, height);
  this.setWidget(image, row, col, rowSpan, colSpan);
  return image;
}

Grid.prototype.setTree = function (rootName, row, col, rowSpan, colSpan) {
  let tree = new Tree(rootName);
  this.setWidget(tree, row, col, rowSpan, colSpan);
  return tree;
}

Grid.prototype.setProgressBar = function (max_value, row, col, rowSpan, colSpan) {
  let pBar = new ProgressBar(max_value);
  this.setWidget(pBar, row, col, rowSpan, colSpan);
  return pBar;
}

Grid.prototype.setSelectFile = function (multiple_bool, accept_str, row, col, rowSpan, colSpan) {
  let sfile = new SelectFile(multiple_bool, accept_str);
  this.setWidget(sfile, row, col, rowSpan, colSpan);
  return sfile;
}

Grid.prototype.setSection = function (title_str, open_bool, row, col, rowSpan, colSpan) {
  let section = new Section(title_str, open_bool);
  this.setWidget(section, row, col, rowSpan, colSpan);
  return section;
}

Grid.prototype.setCombobox = function (row, col, rowSpan, colSpan) {
  let combobox = new Combobox();
  this.setWidget(combobox, row, col, rowSpan, colSpan);
  return combobox;
}

Grid.prototype.setCheckbox = function (label_txt, checked_bool, row, col, rowSpan, colSpan) {
  let checkbox = new Checkbox(label_txt, checked_bool);
  this.setWidget(checkbox, row, col, rowSpan, colSpan);
  return checkbox;
}

Grid.prototype.addCheckbox = function (label_txt, checked_bool, row, col, rowSpan, colSpan) {
  let checkbox = new Checkbox(label_txt, checked_bool);
  this.addWidget(checkbox, row, col, rowSpan, colSpan);
  return checkbox;
}

Grid.prototype.setIFrame = function ( url, row, col, rowSpan, colSpan ) {
  let iframe = new IFrame(url);
  this.setWidget(iframe, row, col, rowSpan, colSpan);
  return iframe;
}

Grid.prototype.addIFrame = function ( url, row, col, rowSpan, colSpan ) {
  let iframe = new IFrame(url);
  this.addWidget(iframe, row, col, rowSpan, colSpan);
  return iframe;
}

Grid.prototype.setSlider = function ( range,value, width_px,height_px, row, col, rowSpan, colSpan ) {
  let slider = new Slider(range);
  this.setWidget ( slider, row, col, rowSpan, colSpan );
  slider.setWidth_px  ( width_px  );
  slider.setHeight_px ( height_px );
  slider.setValue     ( value     );
  return slider;
}

Grid.prototype.setCellSize = function (width, height, row, col) {
  // Sets specified widths to cell in row,col
  let cell = this.getCell(row, col);
  if (width.length >0)  cell.style.width = width;
  if (height.length>0)  cell.style.height = height;
  /*
  if (width .length>0)
    $(cell).css ({"width":width});
  if (height.length>0)
    $(cell).css ({"height":height});
  */
  return this;
}

Grid.prototype.getCellSize = function (row, col) {
  let cell = this.getCell(row, col);
  return [$(cell).outerWidth(), $(cell).outerHeight()];
}

Grid.prototype.setFontFamily = function (row, col, family) {
  let cell = this.getCell(row, col);
  $(cell).css({ "font-family": family });
  return this;
}


Grid.prototype.setNoWrap = function (row, col) {
  let cell = this.getCell(row, col);
  cell.setAttribute('style', 'white-space: nowrap');
  return this;
}

Grid.prototype.setHorizontalAlignment = function (row, col, alignment) {
  let cell = this.getCell(row, col);
  $(cell).css({ "text-align": alignment });
  return this;
}

Grid.prototype.setVerticalAlignment = function (row, col, alignment) {
  var cell = this.getCell(row, col);
  $(cell).css({ "vertical-align": alignment });
  return this;
}

Grid.prototype.setAlignment = function (row, col, valign, halign) {
  var cell = this.getCell(row, col);
  $(cell).css({ "text-align": halign, "vertical-align": valign });
  return this;
}


// -------------------------------------------------------------------------
// Fieldset class

function Fieldset(title) {
  Widget.call(this, 'fieldset');
  this.legend = new Widget('legend');
  this.legend.setText(title);
  // this.legend.element.innerHTML = title;
  this.addWidget(this.legend);
}

Fieldset.prototype = Object.create(Widget.prototype);
Fieldset.prototype.constructor = Fieldset;


// -------------------------------------------------------------------------
// Label class

function Label(text) {
  Widget.call(this, 'div');
  this.setText(text);
  //  this.element.innerHTML = text;
}

Label.prototype = Object.create(Widget.prototype);
Label.prototype.constructor = Label;

// Label.prototype.setText = function ( text )  {
//   this.element.innerHTML = text;
//   return this;
// }

Label.prototype.setDocFromURL = function (url) {
  this.element.innerHTML = '<object type="text/html" data="' + url + '" ></object>';
  return this;
}

Label.prototype.getText = function () {
  return this.element.innerHTML;
}


// -------------------------------------------------------------------------
// IconLabel class

function IconLabel(text, icon_uri) {
  Widget.call(this, 'div');
  this.setIconLabel(text, icon_uri);
}

IconLabel.prototype = Object.create(Widget.prototype);
IconLabel.prototype.constructor = IconLabel;

IconLabel.prototype.setIconLabel = function (text, icon_uri) {
  //  this.setText ( text );
  if (text)
    this.element.innerHTML = text.toString();
  // if (text)  this.element.innerHTML = text;
  //      else  this.element.innerHTML = '&nbsp;';  // Safari 14 fix, ' ' does not work
  if (icon_uri.length > 0) {
    $(this.element).css({
      'text-align': 'center',
      //       'margin-left':'1.2em',
      'background-image': 'url("' + icon_uri + '")',
      'background-repeat': 'no-repeat',
      'background-size': '22px',
      'background-position': 'center'
    });
    if (text)
      $(this.element).css({
        'background-position': '0.5em center'
      });
  }
}

IconLabel.prototype.setBackground = function (icon_uri) {
  if (icon_uri.length > 0)
    $(this.element).css({ 'background-image': 'url("' + icon_uri + '")' });
}


// -------------------------------------------------------------------------
// InputText class

function InputText(text) {
  Widget.call(this, 'input');
  this.element.setAttribute('type', 'text');
  this.element.setAttribute('value', text);
}

InputText.prototype = Object.create(Widget.prototype);
InputText.prototype.constructor = InputText;

InputText.prototype.setStyle = function (type, pattern, placeholder, tooltip) {
  if (placeholder) this.element.setAttribute('placeholder', placeholder);
  if (tooltip) this.setTooltip(tooltip);
  if (type) this.element.setAttribute('type', type);
  if (pattern) {
    if ((pattern == 'integer') || (pattern == 'integer_'))
      this.element.setAttribute('pattern', '^(-?[0-9]+\d*)$|^0$');
    else if ((pattern == 'real') || (pattern == 'real_'))
      this.element.setAttribute('pattern', '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$');
    else
      //this.element.pattern = pattern;
      this.element.setAttribute('pattern', pattern);
  }
  return this;
}

InputText.prototype.setType = function (type) {
  if (type) this.element.setAttribute('type', type);
  return this;
}

InputText.prototype.setReadOnly = function (yn_bool) {
  this.element.readOnly = yn_bool;
  return this;
}

InputText.prototype.setMaxInputLength = function (maxlength_int) {
  this.element.setAttribute('maxlength', maxlength_int);
  return this;
}


InputText.prototype.setDisabled = function (disable_bool) {
  this.element.disabled = disable_bool;
  return this;
}


InputText.prototype.getValue = function () {
  return this.element.value;
}

InputText.prototype.setValue = function (text) {
  return this.element.value = text;
}

/*
InputText.prototype.addOnInputListener = function ( listener_func )  {
  this.element.addEventListener('input',listener_func );
  return this;
}
*/

InputText.prototype.setOnEnterListener = function (socket_function) {
  (function (self) {
    $(self.element).keypress(function (e) {
      if (e.keyCode == 13)
        socket_function(self.getValue());
    });
  }(this))
}


// -------------------------------------------------------------------------
// ACEditor class

function ACEditor(width, height, options) {
  // all optional options:
  //  options = {
  //    'border'     : '1px solid black',
  //    'box-shadow' : '6px 6px lightgray',
  //    'font-size'  : '12px',
  //    'theme'      : 'chrome',
  //    'mode'       : 'python'
  //  }
  //

  Widget.call(this, 'div');

  let css1 = {
    'position': 'relative',
    'width': width,
    'height': height,
    'border': '1px solid gray'
  };
  if ('border' in options)
    css1.border = options.border;
  if ('box-shadow' in options)
    css1['box-shadow'] = options['box-shadow'];

  $(this.element).css(css1);

  this.panel = new Widget('div');
  this.element.appendChild(this.panel.element);

  let css2 = {
    'position': 'absolute',
    'top': 0,
    'right': 0,
    'bottom': 0,
    'left': 0,
    'width': '100%',
    'font-size': '14px'
  };
  if ('font-size' in options)
    css2['font-size'] = options['font-size'];

  $(this.panel.element).css(css2);

  this.editor_theme = 'chrome';
  this.editor_mode = 'python';
  if ('theme' in options)
    this.editor_theme = options.theme;
  if ('mode' in options)
    this.editor_mode = options.mode;
  this.editor = null;

}

ACEditor.prototype = Object.create(Widget.prototype);
ACEditor.prototype.constructor = ACEditor;

ACEditor.prototype.init = function (text, placeholder) {
  if (!this.editor) {
    this.editor = ace.edit(this.panel.element.id);
    // this.editor.setTheme ( 'ace/theme/' + this.editor_theme );
    // this.editor.session.setMode ( 'ace/mode/' + this.editor_mode );
    var options = {
      mode: 'ace/mode/' + this.editor_mode,
      theme: 'ace/theme/' + this.editor_theme
    };
    if (placeholder)
      options.placeholder = placeholder;
    this.editor.setOptions(options);
    if (text)
      this.setText(text);
  }
}

ACEditor.prototype.setSize_px = function (width_int, height_int) {
  if (this.editor) {
    Widget.prototype.setSize_px.call(this, width_int, height_int);
    this.editor.resize();
  }
}

ACEditor.prototype.setReadOnly = function (readonly_bool) {
  if (this.editor)
    this.editor.setReadOnly(readonly_bool);
  return this;
}

ACEditor.prototype.addOnChangeListener = function (listener_func) {
  if (this.editor)
    this.editor.getSession().on('change', listener_func);
  return this;
}

ACEditor.prototype.getCursorPosition = function () {
  if (this.editor)
    return this.editor.getCursorPosition();  // .row,.col
  return { row: 0, col: 0 };
}

ACEditor.prototype.setText = function (text) {
  if (this.editor) {
    this.editor.setValue(text);
    this.editor.clearSelection();
  }
}

ACEditor.prototype.getText = function () {
  if (this.editor) return this.editor.getValue();
  else return '';
}


// -------------------------------------------------------------------------
// TextArea class

function TextArea(text, placeholder, nrows, ncols) {
  Widget.call(this, 'textarea');
  this.element.setAttribute('rows', nrows);
  this.element.setAttribute('cols', ncols);
  this.element.setAttribute('placeholder', placeholder);
  this.element.value = text;
}

TextArea.prototype = Object.create(Widget.prototype);
TextArea.prototype.constructor = TextArea;

TextArea.prototype.getValue = function () {
  return this.element.value;
}


// -------------------------------------------------------------------------
// Horizontal line class

function HLine(size) {
  Widget.call(this, 'hr');
  if (size.length > 0)
    this.element.style.height = size;
}

HLine.prototype = Object.create(Widget.prototype);
HLine.prototype.constructor = HLine;


// -------------------------------------------------------------------------
// Image class

function Image(source, width, height) {
  Widget.call(this, 'img');
  if (source.length > 0) this.element.setAttribute('src', source);
  if (width.length > 0) this.element.setAttribute('width', width);
  if (height.length > 0) this.element.setAttribute('height', height);
}

Image.prototype = Object.create(Widget.prototype);
Image.prototype.constructor = Image;

Image.prototype.setImage = function (image_source) {
  if (image_source.length > 0)
    this.element.setAttribute('src', image_source);
}


// -------------------------------------------------------------------------
// Button class

function Button(text, icon_uri) {
  Widget.call(this, 'button');
  this.element.setAttribute('type', 'button');
  this.div = document.createElement('div');
  this.element.appendChild(this.div);
  this.click_count = 1;
  this._set_button(text, icon_uri);
}

Button.prototype = Object.create(Widget.prototype);
Button.prototype.constructor = Button;

Button.prototype._set_button = function (text, icon_uri) {
  this.div.innerHTML = text.toString();
  // if (text)  this.div.innerHTML = text;
  //      else  this.div.innerHTML = ' ';  // Safari 14 fix
  if (icon_uri.length > 0) {
    $(this.div).css({
      'text-align': 'center',
      //  'vertical-align' : 'middle',
      'margin-left': '1.2em'
    });
    $(this.element).css(
      {
        'background-image': 'url("' + icon_uri + '")',
        'background-repeat': 'no-repeat',
        'background-size': '22px',
        //  'vertical-align'     : 'middle',
        //  'margin' : '0px 0px 0px 0px',
        'background-position': '0.5em center'
      });
  }
  $(this.element).button();
}

Button.prototype.getText = function () {
  return this.div.innerHTML;
}

Button.prototype.setButton = function (text, icon_uri) {
  this._set_button(text, icon_uri);
  return this;
}

Button.prototype.setIndicator = function (indicon_uri, location) {
  // indicator is a small icon overlaying the button and placed
  // in the specified location:
  //     0 : top-left
  //     1 : top-right
  //     2 : bottom-right
  //     3 : bottom-left
  var indicator = new Image(indicon_uri, '16px', '16px');
  var css = { 'position': 'absolute' };
  switch (location) {
    case 0: css.top = '-4px'; css.left = '-8px'; break;
    default:
    case 1: css.top = '-4px'; css.right = '-8px'; break;
    case 2: css.bottom = '-12px'; css.right = '-8px'; break;
    case 3: css.bottom = '-12px'; css.left = '-8px';
  }
  $(indicator.element).css(css);
  //   {'position' : 'absolute',
  //   //  'z-index'  : '1',
  //   'top'       : '-4px',
  //   'right'     : '-8px'
  //   }
  // );
  this.addWidget(indicator);
}

Button.prototype.setText = function (text) {
  this._set_button(text, '');
  return this;
}

Button.prototype.setIcon = function (icon_uri) {
  $(this.element).css({ 'background-image': 'url("' + icon_uri + '")' });
}

Button.prototype.setDisabled = function (disabled_bool) {
  try {
    $(this.element).button("option", "disabled", disabled_bool);
  } catch (e) { }
  return this;
}

Button.prototype.setEnabled = function (enabled_bool) {
  try {
    $(this.element).button("option", "disabled", (!enabled_bool));
  } catch (e) { }
  return this;
}

Button.prototype.isDisabled = function () {
  try {
    return $(this.element).button('option', 'disabled');
  } catch (e) { }
}

Button.prototype.setSize = function (width, height) {
  var w = parseInt(width);
  var h = parseInt(height);
  var icon_size = Math.min(w, h);
  var margin = Math.max(1, Math.floor(icon_size / 8));
  icon_size -= 2 * margin;
  var lm = (w - icon_size) / 2.25;
  if (this.div.innerHTML.length > 0)
    lm = Math.min((h - icon_size) / 2, lm);
  $(this.element).css({
    'background-size': icon_size + 'px',
    'background-position': lm + 'px'
  });
  return Widget.prototype.setSize.call(this, width, height);
}


Button.prototype.setSize_px = function (width, height) {
  $(this.element).css({ 'background-size': (height - 4) + 'px' });
  this.element.style.width = width + 'px';
  this.element.style.height = height + 'px';
  return this;
}


Button.prototype.addOnClickListener = function (listener_func) {
  (function (button) {
    button.element.addEventListener('click', function () {
      if (button.click_count > 0) {
        button.click_count = 0;
        listener_func();
        window.setTimeout(function () {
          button.click_count = 1;
        }, 1000);
      }
    });
  }(this))
  return this;
}


// -------------------------------------------------------------------------
// Image Button class

function ImageButton(icon_uri, width, height) {
  Label.call(this, ' ');
  this.image = new Image(icon_uri, width, height);
  this.addWidget(this.image);
  this.setWidth(width);
  this.setHeight(height);
}

ImageButton.prototype = Object.create(Label.prototype);
ImageButton.prototype.constructor = ImageButton;

ImageButton.prototype.setImage = function (icon_uri) {
  this.image.setImage(icon_uri);
}

function setDefaultButton(button, context_widget) {
  button.element.style.fontWeight = 'bold';
  $(context_widget.element).keydown(function (e) {
    if (e.keyCode == 13) {
      //if (e.which == 13) {
      // handle click logic here
      button.click();
      //e.preventDefault();
      //return true;
    }
  });
}

function unsetDefaultButton(button, context_widget) {
  button.element.style.fontWeight = 'normal';
  $(context_widget.element).keydown();
}


// -------------------------------------------------------------------------
// RadioSet class


function RadioSet() {
  Widget.call(this, 'div');
  this.name = 'radio_' + this.element.id;
  // now use addButton to stuff Set with buttons,
  // then call make()
  this.selected = '';
}

RadioSet.prototype = Object.create(Widget.prototype);
RadioSet.prototype.constructor = RadioSet;

RadioSet.prototype.addButton = function (text, btnId, tooltip, checked_bool) {

  var _id = this.element.id + '_' + btnId;

  var label = new Widget('label');
  label.element.setAttribute('for', _id);
  label.element.innerHTML = text.toString();
  // if (text)  label.element.innerHTML = text;
  //      else  label.element.innerHTML = ' ';  // Safari 14 fix
  this.addWidget(label);
  if (tooltip)
    label.setTooltip(tooltip);

  var button = new Widget('input');
  button.element.setAttribute('type', 'radio');
  button.setId(_id);
  button.radioID = btnId;
  button.element.setAttribute('name', this.name);
  if (checked_bool) {
    button.element.setAttribute('checked', 'checked');
    this.selected = btnId;
  }
  this.addWidget(button);

  return this;  // for chaining

}

RadioSet.prototype.make = function (onClick_func) {

  (function (rs) {
    function onClick() {
      for (var i = 0; i < rs.child.length; i++)
        if (rs.child[i].type == 'input') {
          if (rs.child[i].element.checked) {
            rs.selected = rs.child[i].element.id.substr(rs.element.id.length + 1);
            if (onClick_func)
              onClick_func(rs.selected);
          }
        }
    }
    for (var i = 0; i < rs.child.length; i++)
      if (rs.child[i].type == 'input')
        rs.child[i].element.addEventListener('click', function (e) {
          onClick();
        });
  }(this));

  //  $( 'input[name="' + this.name + '"]' ).checkboxradio();
  //$(this.element).buttonset();
  $(this.element).controlgroup();
  //$(this.element).checkboxradio();

  //this.addOnClickListener ( function(){
  //   alert ('click');
  //  } );

  /*
    for (var i=0;i<this.child.length;i++)
      if (this.child[i].type=='input')  {
        (function(btn){
          btn.addOnClickListener ( function(){
            $(btn.element).click();
  //                  onClick_func ( btn.radioID );
          });
        }(this.child[i]))
      }
  */

  return this;

}

RadioSet.prototype.selectButton = function (btnId) {
  var _id = this.element.id + '_' + btnId;
  for (var i = 0; i < this.child.length; i++)
    if (this.child[i].element.id == _id)
      $(this.child[i].element).click();
  return this;
}

RadioSet.prototype.setDisabled = function (disabled_bool) {
  try {
    $(this.element).controlgroup('option', 'disabled', disabled_bool);
  } catch (e) { }
  return this;
}

RadioSet.prototype.setEnabled = function (enabled_bool) {
  try {
    $(this.element).controlgroup('option', 'disabled', !enabled_bool);
  } catch (e) { }
  return this;
}

RadioSet.prototype.isDisabled = function () {
  try {
    return $(this.element).controlgroup('option', 'disabled');
  } catch (e) {
    return true;
  }
}

RadioSet.prototype.getValue = function () {
  return this.selected;
}


// -------------------------------------------------------------------------
// ProgressBar class

function ProgressBar(max_value) {
  Widget.call(this, 'div');
  if (max_value > 0) {
    $(this.element).progressbar({
      max: max_value,
      value: 0
    });
  } else {
    $(this.element).progressbar({
      value: false
    });
  }
}

ProgressBar.prototype = Object.create(Widget.prototype);
ProgressBar.prototype.constructor = ProgressBar;

ProgressBar.prototype.setMaxValue = function (max_value) {
  try {
    $(this.element).progressbar("option", "max", max_value);
  } catch (e) { }
}

ProgressBar.prototype.getMaxValue = function () {
  try {
    return $(this.element).progressbar("option", "max");
  } catch (e) { }
}

ProgressBar.prototype.setValue = function (value) {
  try {
    $(this.element).progressbar('value', value);
  } catch (e) { }
}

ProgressBar.prototype.getValue = function () {
  return $(this.element).progressbar('value');
}


// -------------------------------------------------------------------------
// SelectFile class

function SelectFile(multiple_bool, accept_str) {
  Widget.call(this, 'input');
  this.element.setAttribute('type', 'file');
  this.element.setAttribute('name', 'uploads[]');
  if (multiple_bool)
    this.element.setAttribute('multiple', 'multiple');
  if (accept_str)
    this.element.setAttribute('accept', accept_str);
}

SelectFile.prototype = Object.create(Widget.prototype);
SelectFile.prototype.constructor = SelectFile;

SelectFile.prototype.getFiles = function () {
  return this.element.files;
}


// -------------------------------------------------------------------------
// ToolBar class

function ToolBar() {
  Grid.call(this, '');
  this.element.setAttribute('class', 'toolbar ui-widget-header ui-corner-all');
}

ToolBar.prototype = Object.create(Grid.prototype);
ToolBar.prototype.constructor = ToolBar;


// -------------------------------------------------------------------------
// IFrame class

function IFrame(uri) {
  Widget.call(this, 'iframe');
  if (uri.length > 0)
    this.element.setAttribute('src', uri);
  //this.element.setAttribute ( 'sandbox','allow-same-origin' );
  $(this.element).css({ 'border': 'none' });
  //var body = this.element.contentWindow.document.querySelector('body');
  //body.style.fontSize = '16px';
  /*
  (function(iframe){
    iframe.element.onload = function(){
      var body = iframe.element.contentWindow.document.querySelector('body');
      body.style.fontSize = '16px';
      window.setTimeout ( function(){
        iframe.setVisible ( true );
      },100 );
    };
  }(this))
  */
  //this.setOnLoadListener ( null );
}

IFrame.prototype = Object.create(Widget.prototype);
IFrame.prototype.constructor = IFrame;

IFrame.prototype.setFramePosition = function (left, top, width, height) {
  this.setAttribute('style', 'border:none;position:absolute;top:' + top +
    ';left:' + left + ';width:' + width +
    ';height:' + height + ';');
  return this;
}

IFrame.prototype.setOnLoadListener = function (onload_func) {
  // this does not wait until ready
  this.element.addEventListener('load', function () {
    onload_func();
  });
  /*
  (function(iframe){
    iframe.element.onload = function(){
      var body = iframe.element.contentWindow.document.querySelector('body');
      body.style.fontSize = '16px';
      window.setTimeout ( function(){
        iframe.setVisible ( true );
      },150 );
      if (onload_func)
        onload_func();
    };
  }(this))
  */
}

IFrame.prototype.loadPage = function (uri) {
  this.element.src = uri;
  return this;
}


IFrame.prototype.setText = function (html) {
  this.element.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
  // this.element.src = 'data:text/html;charset=utf-8,' + html;
  // this.element.srcdoc = html;
  return this;
}

IFrame.prototype.setHTML = function (html) {
  // this.element.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
  // this.element.src = 'data:text/html;charset=utf-8,' + html;
  this.element.srcdoc = html;
  return this;
}

IFrame.prototype.getURL = function () {
  return this.element.src;
}

IFrame.prototype.clear = function () {
  this.element.src = 'about:blank';
  return this;
}

IFrame.prototype.reload = function () {
  this.element.src = this.element.src;
  return this;
}

IFrame.prototype.getDocument = function () {
  return this.element.contentWindow || this.element.contentDocument;
  // return this.element.contentDocument || this.element.contentWindow;
  //return this.element.contentWindow || this.element.contentDocument.document ||
  //       this.element.contentDocument;
}

IFrame.prototype.getWindow = function () {
  return this.element.contentWindow;
}


// -------------------------------------------------------------------------
// Section class

function Section(title_str, open_bool) {
  Widget.call(this, 'div');
  this._type = 'Section';
  this.header = new Widget('h3');
  this.titleId = this.id + '_title';
  this.header.element.innerHTML = '<span id="' + this.titleId + '">' + title_str + '</span>';
  this.addWidget(this.header);
  this.body = new Widget('div');
  this.addWidget(this.body);
  this.grid = new Grid('');
  this.body.addWidget(this.grid);
  this.title = title_str;
  let options = {
    collapsible: true,
    heightStyle: "content"
  };
  if (open_bool) options.active = 0;
  else options.active = false;
  $(this.element).accordion(options);
}


Section.prototype = Object.create(Widget.prototype);
Section.prototype.constructor = Section;

Section.prototype.isOpen = function() {
  try {
    let active = $(this.element).accordion("option", "active");
    if (active === 0) return true;
  } catch (e) { }
  return false;
}

Section.prototype.open = function() {
  try {
    $(this.element).accordion("option", "active", 0);
  } catch (e) { }
}

Section.prototype.close = function() {
  try {
    $(this.element).accordion("option", "active", false);
  } catch (e) { }
}

Section.prototype.setOpenState = function ( open_bool )  {
  if (open_bool)  this.open();
            else  this.close();
}

Section.prototype.setActivateListener = function ( open_func,close_func )  {
  $(this.element).on( "accordionactivate",function(event,ui){
    if (ui.newHeader.length)  open_func ();
                        else  close_func();
  });
}

Section.prototype.setBeforeActivateListener = function ( open_func,close_func )  {
  $(this.element).on( "accordionbeforeactivate",function(event,ui){
    if (ui.newHeader.length)  open_func ();
                        else  close_func();
  });
}

Section.prototype.setTitle = function ( title_str ) {
  this.title = title_str;
  $('#' + this.titleId).html(title_str);
}

/*
Section.prototype.setVisible = function ( yn_bool )  {
  alert ( 'cs ' + yn_bool + ' ' + this.header.element.innerHTML );
}
*/

// -------------------------------------------------------------------------
// Combobox class

function Combobox() {
  Widget.call(this, 'select');
  //  this.element.setAttribute ( 'name',this.id );
  // now use addItem to stuff Set with buttons,
  // then call make()
  this.selected_value = null;
  this.selected_text = null;
  this.onchange = null;
  this.width = 'auto';
}

Combobox.prototype = Object.create(Widget.prototype);
Combobox.prototype.constructor = Combobox;

Combobox.prototype.addItem = function (text, itemId, selected_bool) {
  let item = new Widget('option');
  item.element.setAttribute('value', itemId);
  item.element.setAttribute('name', itemId);

  if (selected_bool) {
    item.element.setAttribute('selected', 'selected');
    this.selected_value = itemId;
    this.selected_text = text;
  }

  item.element.innerHTML = text.toString();  
  // if (text)  item.element.innerHTML = text;
  //      else  item.element.innerHTML = ' ';  // Safari 14 fix

  this.addWidget(item);
  return this;  // for chaining
}


Combobox.prototype.setWidth = function (w) {
  this.width = w;
  return this;
}


Combobox.prototype.make = function () {

  $(this.element).selectmenu({
    width: this.width
  })
    .addClass("combobox-overflow");
  (function (combobox) {
    $(combobox.element).on('selectmenuchange', function () {
      combobox.selected_value = combobox.element.value;
      combobox.selected_text =
        combobox.element.options[combobox.element.selectedIndex].text;
      if (combobox.onchange)
        combobox.onchange(combobox.selected_value, combobox.selected_text);
    });
  }(this));

  return this;

}

Combobox.prototype.addOnChangeListener = function (listener_func) {
  this.onchange = listener_func;
  return this;
}


Combobox.prototype.getValue = function () {
  return this.selected_value;
}

Combobox.prototype.getText = function () {
  return this.selected_text;
}


// -------------------------------------------------------------------------
// Checkbox class

function Checkbox(label_txt, checked_bool) {

  Widget.call(this, 'label');
  let _id = 'cbx-' + this.id;

  this.element.htmlFor = _id;
  this.element.innerHTML = label_txt.toString();
  // if (label_txt)
  //       this.element.innerHTML = label_txt;
  // else  this.element.innerHTML = ' ';
  $(this.element).css({ 'white-space': 'nowrap', 'text-align': 'left' });

  this.checkbox = document.createElement('input');
  this.checkbox.setAttribute('type', 'checkbox');
  this.checkbox.setAttribute('id', _id);
  this.checkbox.setAttribute('name', _id);
  //  $(this.element).css ({"text-align":"left"});

  this.element.appendChild(this.checkbox);
  this.checkbox.checked = checked_bool;
  $(this.checkbox).checkboxradio();

}

Checkbox.prototype = Object.create(Widget.prototype);
Checkbox.prototype.constructor = Checkbox;

Checkbox.prototype.addOnClickListener = function (listener_func) {
  this.checkbox.addEventListener('click', listener_func);
  return this;
}

Checkbox.prototype.getValue = function () {
  return this.checkbox.checked;
}

Checkbox.prototype.setValue = function (checked_bool) {
  this.checkbox.checked = checked_bool;
  $(this.checkbox).checkboxradio("refresh");
}

Checkbox.prototype.setDisabled = function (disabled_bool) {
  if (disabled_bool)
    $(this.checkbox).checkboxradio("disable");
  else $(this.checkbox).checkboxradio("enable");
  return this;
}



// -------------------------------------------------------------------------
// RadioButton class

function RadioButton(label_txt, checked_bool) {

  Widget.call(this, 'label');
  var _id = 'cbx-' + this.id;

  this.element.htmlFor = _id;
  this.element.innerHTML = label_txt.toString();
  // if (label_txt)  this.element.innerHTML = label_txt;
  //           else  this.element.innerHTML = ' ';  // Safari 14 fix
  $(this.element).css({ 'white-space': 'nowrap' });

  this.radio = document.createElement('input');
  this.radio.setAttribute('type', 'radio');
  this.radio.setAttribute('id', _id);
  this.radio.setAttribute('name', _id);
  $(this.element).css({ "text-align": "left" });

  this.element.appendChild(this.radio);
  this.radio.checked = checked_bool;
  $(this.radio).checkboxradio();

}

RadioButton.prototype = Object.create(Widget.prototype);
RadioButton.prototype.constructor = RadioButton;


RadioButton.prototype.getValue = function () {
  return this.radio.checked;
}

RadioButton.prototype.setValue = function (checked_bool) {
  this.radio.checked = checked_bool;
  $(this.radio).checkboxradio('refresh');
}

RadioButton.prototype.setDisabled = function (disabled_bool) {
  if (disabled_bool)
    $(this.radio).checkboxradio("disable");
  else $(this.radio).checkboxradio("enable");
}


// -------------------------------------------------------------------------
// Slider class

function Slider(range) {

  Widget.call(this, 'div');

  $(this.element).slider({
    range: "max",
    min: 0,
    max: range,
    value: 0
  });

}

Slider.prototype = Object.create(Widget.prototype);
Slider.prototype.constructor = Slider;


Slider.prototype.setListener = function ( socket_function ) {
  $(this.element).on("slide", function (event, ui) {
    socket_function(ui.value);
  });
}

Slider.prototype.setValue = function ( value ) {
  $(this.element).slider('value', value);
}

Slider.prototype.getValue = function () {
  return $(this.element).slider('value');
}


// -------------------------------------------------------------------------
// Spinner class

function Spinner(minV, maxV, stepV, pageV) {
  Widget.call(this, 'div');
  this.spinner = new Widget('input');
  this.addWidget(this.spinner);
  this.minV = minV;
  this.maxV = maxV;
  this.steps = [];
  this._lastV = 0;
  $(this.spinner.element).spinner({
    min: minV,
    max: maxV,
    step: stepV,
    page: pageV
  });
}

Spinner.prototype = Object.create(Widget.prototype);
Spinner.prototype.constructor = Spinner;


Spinner.prototype.setWidth_px = function (width_px) {
  this.spinner.setWidth_px(width_px);
}

Spinner.prototype.setCustomSteps = function (step_list, stepNo) {
  // step_list[] should contain step values in order of increasing
  // stepNo is the initial step to set in the spinner
  this.setMinValue(step_list[0]);
  this.setMaxValue(step_list[step_list.length - 1]);
  this.steps = [];
  for (var i = 0; i < step_list.length; i++)
    this.steps.push(step_list[i]);
  this.setValue(this.steps[stepNo]);
}


Spinner.prototype.setListener = function (socket_function) {

  (function (self) {

    $(self.spinner.element).on("spin", function (event, ui) {
      var v = ui.value;
      if (self.steps.length > 0) {
        if (v > self._lastV) {
          var i = 0;
          while ((v > self.steps[i]) && (i < self.steps.length - 1))
            i++;
          v = self.steps[i];
        } else {
          var i = self.steps.length - 1;
          while ((v < self.steps[i]) && (i > 0))
            i--;
          v = self.steps[i];
        }
        window.setTimeout(function () {
          self.setValue(v);
        }, 0);
      } else {
        self._lastV = v;
        socket_function(v);
      }
    });

    function call_socket() {
      var v = self.getValue();
      var v1 = Math.max(self.minV, Math.min(self.maxV, v));
      if (v != v1)
        self.setValue(v1);
      self._lastV = v;
      socket_function(v1);
    }

    $(self.spinner.element).on("spinchange", function (event, ui) {
      call_socket();
    });

    $(self.spinner.element).keypress(function (e) {
      if (e.keyCode == 13)
        call_socket();
    });

  }(this))

}

/*
Spinner.prototype.setChangeListener = function ( socket_function )  {
  (function(self){

    function call_socket()  {
      var v  = self.getValue();
      var v1 = Math.max(self.minV,Math.min(self.maxV,v));
      if (v!=v1)
        self.setValue ( v1 );
      socket_function ( v1 );
    }

    $(self.spinner.element).on ( "spinchange",function(event,ui){
      call_socket();
    });

    $(self.spinner.element).keypress ( function(e){
      if (e.keyCode == 13)
        call_socket();
    });

  }(this))
}
*/

Spinner.prototype.setMaxValue = function (value) {
  this.maxV = value;
  try {
    $(this.spinner.element).spinner('option', 'max', value);
  } catch (e) { }
}

Spinner.prototype.getMaxValue = function () {
  try {
    return $(this.spinner.element).spinner('option', 'max');
  } catch (e) {
    return this.maxV;
  }
}

Spinner.prototype.setMinValue = function (value) {
  this.minV = value;
  try {
    $(this.spinner.element).spinner('option', 'min', value);
  } catch (e) { }
}

Spinner.prototype.getMinValue = function () {
  try {
    return $(this.spinner.element).spinner('option', 'min');
  } catch (e) {
    return this.minV;
  }
}

Spinner.prototype.setValue = function (value) {
  this._lastV = Math.max(this.minV, Math.min(this.maxV, value));
  $(this.spinner.element).spinner('value', this._lastV);
}

Spinner.prototype.getValue = function () {
  return $(this.spinner.element).spinner('value');
}
