
/*
 *  =================================================================
 *
 *    06.12.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.tree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Generic tree class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

/*

  Requires: 	jquery.js
  	          style(.min).css  // from jstree distro
  	          jstree(.min).js
              gui.widgets.js

  URL:  https://www.jstree.com

*/


// -------------------------------------------------------------------------
// TreeNode class

function TreeNodeCustomIcon ( uri,width,height,state )  {
  this.customIcon = uri;
  this.ci_width   = width;
  this.ci_height  = height;
  this.ci_state   = new String(state);
}


function TreeNode ( text,icon_uri,treeNodeCustomIcon )  {
  this.id             = 'treenode_' + padDigits(__id_cnt++,5);  // node element id (unstable)
  this.parentId       = null;           // parent node element id (unstable)
  this.text           = text;           // node text
  this.icon           = icon_uri;       // string for custom icon
  this.data           = treeNodeCustomIcon;
  if (!this.data)
    this.data = new TreeNodeCustomIcon ( '','','','' );
  this.state          = {};
  this.state.opened   = true;           // is the node open
  this.state.disabled = false;          // is the node disabled
  this.state.selected = false;          // is the node selected
  this.children       = [];             // array of strings or objects
  this.li_attr        = {};             // attributes for the generated LI node
  this.a_attr         = {};             // attributes for the generated A
  this.dataId         = '';             // for linking to data objects
}


TreeNode.prototype.setSelected = function()  {
  this.state.selected = true;
  return this;
}


TreeNode.prototype.copy = function ( node )  {
  this.text            = node.text;
  this.icon            = node.icon;
  this.state           = node.state;
  this.dataId          = node.dataId;
  this.data            = $.extend({},node.data);
  this.data.customIcon = node.data.customIcon;
  this.data.ci_width   = node.data.ci_width;
  this.data.ci_height  = node.data.ci_height;
  this.data.ci_state   = new String(node.data.ci_state);
  return this;
}


TreeNode.prototype.setCustomIconVisible = function ( visible_bool )  {
  if (visible_bool)  this.data.ci_state = 'visible';
               else  this.data.ci_state = 'hidden';
  var ci_element = document.getElementById ( this.id + '_pbar' );
  if (ci_element)  {
    (function(elem,state){
      window.setTimeout ( function(){ elem.style.visibility = state; },0 );
    }(ci_element,this.data.ci_state));
    //ci_element.style.visibility = this.data.ci_state;
    /* if used instead of the previous line, this make tree look compact:
    if (visible_bool)  $(ci_element).show();
                 else  $(ci_element).hide();
    */
  }
}


/*
TreeNode.prototype.setCustomIconState = function ( state )  {
var ci_element = document.getElementById(this.id + '_pbar');
  if (ci_element)
    ci_element.style.visibility = state;
}
*/

// -------------------------------------------------------------------------
// Tree class

function Tree ( rootName )  {

  Widget.call ( this,'div' );

  this.addWidget ( new Label(rootName) );
  this.root       = new Widget('div');
  this.addWidget ( this.root );
  this.root_nodes = [];       //
  this.node_map   = {};       // node_map[nodeId] == TreeNode
  this.created    = false;    // true if tree was instantiated
//  this.multiple   = false;    // single node selection
  this.selected_node_id = '';

  this.deleteChildren = function ( node )  {  // private

    for (var i=0;i<node.children.length;i++)  {
      this.deleteChildren ( node.children[i] );
      this.node_map[node.children[i].id] = null;
    }

    node.children = [];

  }


  this.mapNodes = function ( node )  {  // private
    this.node_map[node.id] = node;
    for (var i=0;i<node.children.length;i++)
      this.mapNodes ( node.children[i] );
  }


  this.setNode = function ( parent_node, node_obj )  {
    var node = new TreeNode ( '','',null );
    node.copy ( node_obj );
    node.parentId  = parent_node.id;
    parent_node.children.push ( node );
    this.node_map[node.id] = node;
    for (var i=0;i<node_obj.children.length;i++)
      this.setNode ( node,node_obj.children[i] );
    if (node.state.selected)  {
      this.selected_node_id = node.id;
    }
  }

}


Tree.prototype = Object.create ( Widget.prototype );
Tree.prototype.constructor = Tree;


Tree.prototype.addRootNode = function ( text,icon_uri,treeNodeCustomIcon )  {
var node = new TreeNode ( text,icon_uri,treeNodeCustomIcon );
  this.root_nodes.push ( node );
  this.node_map[node.id] = node;
  if (this.created)  {
    $(this.root.element).jstree(true).create_node('#',node,'last',false,false);
    this.selectSingle ( node );  // force selection of new nodes if tree is displayed
    this.confirmCustomIconsVisibility();
  }
  return node;
}


Tree.prototype.addNode = function ( parent_node,text,icon_uri,treeNodeCustomIcon )  {
var node = new TreeNode ( text,icon_uri,treeNodeCustomIcon );
  node.parentId  = parent_node.id;
  parent_node.children.push ( node );
  this.node_map[node.id] = node;
  if (this.created)  {
    $(this.root.element).jstree(true).create_node('#'+parent_node.id,node,'last',false,false);
    node.data     = treeNodeCustomIcon;  // this gets lost, duplicate, jstree bug
    node.children = [];                  // this gets lost, duplicate, jstree bug
    this.selectSingle ( node );  // force selection of new nodes if tree is displayed
    this.confirmCustomIconsVisibility();
  }
  return node;
}


Tree.prototype.insertNode = function ( parent_node,text,icon_uri,treeNodeCustomIcon )  {
  var children = parent_node.children;
  if (children.length<=0)
    return this.addNode ( parent_node,text,icon_uri,treeNodeCustomIcon );
  else  {
    var node = new TreeNode ( text,icon_uri,treeNodeCustomIcon );
    node.parentId = parent_node.id;
    parent_node.children = [node];
    for (var i=0;i<children.length;i++)
      children[i].parentId = node.id;
    this.node_map[node.id] = node;
    if (this.created)  {
      $(this.root.element).jstree(true).create_node('#'+parent_node.id,node,'last',false,false);
      $(this.root.element).jstree(true).move_node(children,node,'last',false,false);
      node.data = treeNodeCustomIcon;  // this gets lost, duplicate, jstree bug
      node.children = children;
      this.selectSingle ( node );  // force selection of new nodes if tree is displayed
      $(this.root.element).jstree().refresh();
      this.confirmCustomIconsVisibility();
    } else
      node.children = children;
    return node;
  }
}


Tree.prototype.getNodePosition = function ( node )  {
var parent_node = null;
var parentId    = null;
var clen        = null;
var pos         = -2;

  if (node.parentId)  {
    parent_node = this.node_map[node.parentId];
    if (parent_node)  {
      parentId = parent_node.parentId;

      var parent_children = parent_node.children;
      clen = parent_children.length;

      // find sibling position of given node
      pos = -1;
      for (var i=0;(i<parent_children.length) && (pos<0);i++)
        if (parent_children[i].id==node.id)
          pos = i;
    }
  }

  return [pos,parent_node,parentId,clen];

}


Tree.prototype.moveNodeUp = function ( node )  {

  if (node.parentId)  {

    var parent_node = this.node_map[node.parentId];

    if (parent_node.parentId)  {  // do not move above the root

      var parent_children = parent_node.children;

      // find sibling position of given node
      var pos = -1;
      for (var i=0;(i<parent_children.length) && (pos<0);i++)
        if (parent_children[i].id==node.id)
          pos = i;

      if (pos>0)  {
        // given node is not leading sibling; push it up with all its children

        if (this.created)
          $(this.root.element).jstree(true).move_node(node,parent_node,pos-1,false,false);

        // reflect changes in internal list of children
        var snode = parent_children[pos-1];
        parent_children[pos-1] = parent_children[pos];
        parent_children[pos]   = snode;

      } else if (parent_children.length>1) {
        // given node is the leading sibling; convert other siblings to its children

        var siblings = [];
        for (var i=0;i<parent_children.length;i++)
          if (parent_children[i].id!=node.id)
            siblings.push ( parent_children[i] );

        if (this.created)
          $(this.root.element).jstree(true).move_node(siblings,node,'last',false,false);

        // reflect changes in internal list of children
        for (var i=0;i<siblings.length;i++)
          siblings[i].parentId = node.id;
        node.children = node.children.concat ( siblings );
        parent_node.children = [node];

      } else  {
        // given node is the only child of its parent; make it parent's parent

        var grandpa_node      = this.node_map[parent_node.parentId];
        var node_children     = node.children;
        var grandpa_children  = grandpa_node.children;
        node.children         = [];
        parent_node.children  = [];
        grandpa_node.children = [];

        // node moves up and becomes child of grand_parent_node
        // parent_node becomes child of node and receives all its children
        if (this.created)  {
          $(this.root.element).jstree(true).move_node(parent_node,node,'last',false,false);
          $(this.root.element).jstree(true).move_node(node,grandpa_node,'last',false,false);
          $(this.root.element).jstree(true).move_node(node_children,parent_node,'last',false,false);
        }

        for (var i=0;i<parent_children.length;i++)
          if (parent_children[i].id!=node.id)
            parent_node.children.push ( parent_children[i] );
        parent_node.children = parent_node.children.concat ( node_children );
        for (var i=0;i<parent_node.children.length;i++)
          parent_node.children[i].parentId = parent_node.id;

        node.children = [parent_node];
        parent_node.parentId = node.id;

        // grand parent node loses parent_node as a child but gets node instead
        for (var i=0;i<grandpa_children.length;i++)
          if (grandpa_children[i].id!=parent_node.id)
            grandpa_node.children.push ( grandpa_children[i] );
        grandpa_node.children.push ( node );
        node.parentId = grandpa_node.id;

      }

      // force selection and refresh the tree
      if (this.created)  {
        this.selectSingle ( node );  // force selection of the node if tree is displayed
        $(this.root.element).jstree().refresh();
        this.confirmCustomIconsVisibility();
      }

    }

  }

}


/*  ------  working version 09.03.2018
Tree.prototype.moveNodeUp = function ( node )  {

  if (node.parentId)  {

    var parent_node = this.node_map[node.parentId];

    if (parent_node.parentId)  {  // do not move above the root

      var grandpa_node      = this.node_map[parent_node.parentId];
      var node_children     = node.children;
      var parent_children   = parent_node.children;
      var grandpa_children  = grandpa_node.children;
      node.children         = [];
      parent_node.children  = [];
      grandpa_node.children = [];

      // node moves up and becomes child of grand_parent_node
      // parent_node becomes child of node and receives all its children
      if (this.created)  {
        $(this.root.element).jstree(true).move_node(parent_node,node,'last',false,false);
        $(this.root.element).jstree(true).move_node(node,grandpa_node,'last',false,false);
        $(this.root.element).jstree(true).move_node(node_children,parent_node,'last',false,false);
      }

      for (var i=0;i<parent_children.length;i++)
        if (parent_children[i].id!=node.id)
          parent_node.children.push ( parent_children[i] );
      parent_node.children = parent_node.children.concat ( node_children );
      for (var i=0;i<parent_node.children.length;i++)
        parent_node.children[i].parentId = parent_node.id;

      node.children = [parent_node];
      parent_node.parentId = node.id;

      // grand parent node loses parent_node as a child but gets node instead
      for (var i=0;i<grandpa_children.length;i++)
        if (grandpa_children[i].id!=parent_node.id)
          grandpa_node.children.push ( grandpa_children[i] );
      grandpa_node.children.push ( node );
      node.parentId = grandpa_node.id;

      // force selection and refresh the tree
      if (this.created)  {
        this.selectSingle ( node );  // force selection of the node if tree is displayed
        $(this.root.element).jstree().refresh();
        this.confirmCustomIconsVisibility();
      }

    }
  }
}
*/


/*
Tree.prototype.moveNodeUp = function ( node )  {

  if (node.parentId)  {

    var parent_node = this.node_map[node.parentId];

    if (parent_node.parentId)  {  // do not move above the root

      var grandpa_node      = this.node_map[parent_node.parentId];
      var node_children     = node.children;
      var parent_children   = parent_node.children;
      var grandpa_children  = grandpa_node.children;
      node.children         = [];
      parent_node.children  = [];
      grandpa_node.children = [];

      // node moves up and becomes child of grand_parent_node
      // parent_node becomes child of node and receives all its children
      // node receives all children of the grand_parent_nodex
      if (this.created)  {
        //$(this.root.element).jstree(true).move_node(parent_node,node,'last',false,false);
        $(this.root.element).jstree(true).move_node(grandpa_children,node,'last',false,false);
        $(this.root.element).jstree(true).move_node(node,grandpa_node,'last',false,false);
        $(this.root.element).jstree(true).move_node(node_children,parent_node,'last',false,false);
      }

      for (var i=0;i<parent_children.length;i++)
        if (parent_children[i].id!=node.id)
          parent_node.children.push ( parent_children[i] );
      parent_node.children = parent_node.children.concat ( node_children );
      for (var i=0;i<parent_node.children.length;i++)
        parent_node.children[i].parentId = parent_node.id;

      //node.children = [parent_node];
      //parent_node.parentId = node.id;
      node.children = grandpa_children;
      for (var i=0;i<node.children.length;i++)
        node.children[i].parentId = node.id;

      // grand parent node loses all children but gets node instead
      //for (var i=0;i<grandpa_children.length;i++)
      //  if (grandpa_children[i].id!=parent_node.id)
      //    grandpa_node.children.push ( grandpa_children[i] );
      //grandpa_node.children.push ( node );
      grandpa_node.children = [node];
      node.parentId = grandpa_node.id;

      // force selection and refresh the tree
      if (this.created)  {
        this.selectSingle ( node );  // force selection of the node if tree is displayed
        $(this.root.element).jstree().refresh();
        this.confirmCustomIconsVisibility();
      }

    }
  }
}
*/


Tree.prototype.setNodes = function ( nodes )  {
// Recreation from stringifying this.root_nodes, should be applied only to new
// tree. The argument is array of root nodes JSON.parsed from storage string.

  for (var i=0;i<nodes.length;i++)  {
    var node = new TreeNode ( '','',null );
    node.copy ( nodes[i] );
    this.root_nodes.push ( node );
    this.node_map[node.id] = node;
    for (var j=0;j<nodes[i].children.length;j++)
      this.setNode ( node,nodes[i].children[j] );
  }

}


Tree.prototype.getNumberOfNodes = function()  {
var count = 0;
  for (var key in this.node_map)
    if (this.node_map.hasOwnProperty(key))
      count++;
  return count;
}

/*
var ref_treeview = $("#treeView").jstree(true);
sel = ref_treeview.get_selected();
if (!sel.length) {
    return false;
}
sel = sel[0];
sel = ref_treeview.create_node(sel, "childNode", "last", CreateNode,true);
*/

Tree.prototype.selectSingle = function ( node )  {
// This function will select given node and deselect all others

  if (this.selected_node_id in this.node_map)
    this.node_map[this.selected_node_id].state.selected = false;

  if (this.created)  {
    $(this.root.element).jstree('deselect_all');
    $(this.root.element).jstree(true).select_node('#'+node.id);
  }

  node.state.selected   = true;
  this.selected_node_id = node.id;

}

Tree.prototype.deselectNode = function ( node )  {
  if (this.created)
    $(this.root.element).jstree(true).deselect_node('#'+node.id);
}

Tree.prototype.deselectNodeById = function ( nodeId )  {
  if (this.created)
    $(this.root.element).jstree(true).deselect_node('#'+nodeId);
}


Tree.prototype.selectSingleById = function ( nodeId )  {
  if (nodeId in this.node_map)
    this.selectSingle ( this.node_map[nodeId] );
}


Tree.prototype.forceSingleSelection = function()  {
// in case of multiple selection, this function will leave selected only node
// with id given by this.selected_node_id
  if (this.created)  {
    $(this.root.element).jstree('deselect_all');
    $(this.root.element).jstree(true).select_node('#'+this.selected_node_id);
  }
}


Tree.prototype.setText = function ( node,text )  {
  node.text = text;
  if (this.created)
    $(this.root.element).jstree(true).rename_node('#'+node.id,text);
}

/*
Tree.prototype.setTextColor = function ( node,color_str )  {
  if (this.created)
    $(this.root.element).jstree(true).rename_node('#'+node.id,
       '<span style="color:' + color_str + '">' + node.text + '</span>');
}


Tree.prototype.setBackgroundColor = function ( node,color_str )  {
  if (this.created)
    $(this.root.element).jstree(true).rename_node('#'+node.id,
       '<span style="background-color:' + color_str + '">' + node.text + '</span>');
}
*/

Tree.prototype.setStyle = function ( treeNode,style_str,propagate_int )  {
//  treeNode       starting tree node
//  style_str      html style string, e.g., 'color:red;background-color:yellow'
//  propagate_int  propagation key:
//                    0:  do not propagate (apply only to treeNode)
//                    1:  apply to all descending nodes (down tree branch)
//                   -1:  apply to all ascending nodes (up tree branch)

  if (this.created && treeNode)  {

    if (style_str.length>0)
      $(this.root.element).jstree(true).rename_node('#' + treeNode.id,
         '<span style="' + style_str + '">' + treeNode.text + '</span>');
    else  // reset style
      $(this.root.element).jstree(true).rename_node('#'+treeNode.id,treeNode.text );

    if (propagate_int<0)
      this.setStyle ( treeNode.parentId,style_str,propagate_int );
    else if (propagate_int>0)  {
      for (var i=0;i<treeNode.children.length;i++)
        this.setStyle ( treeNode.children[i],style_str,propagate_int );
    }

  }

}


Tree.prototype.confirmCustomIconsVisibility = function()  {
  for (var key in this.node_map)  {
    var node = this.node_map[key];
    if (node)
      node.setCustomIconVisible ( node.data.ci_state=='visible' );
  }
}


Tree.prototype.deleteNode = function ( node )  {
// does not delete root node(s)

  if (!node)
    return;

  if (!node.parentId)
    return;

  if (!(node.id in this.node_map))
    return;

  this.deleteChildren ( node );

  var pnode    = this.node_map[node.parentId];
  var children = [];
  var selNo    = -1;
  for (var i=0;i<pnode.children.length;i++)  {
    if (pnode.children[i].id==node.id) {
      selNo = i;
    } else  {
      children.push ( pnode.children[i] );
    }
  }
  this.node_map[node.id] = null;

  pnode.children = children;
  var node_map = {};
  for (var key in this.node_map)
    if (this.node_map[key])
      node_map[key] = this.node_map[key];
  this.node_map = node_map;

  if (this.selected_node_id==node.id)  {
    if (selNo>=children.length)
      selNo--;
    if (selNo>=0)  {
      this.selectSingle ( pnode.children[selNo] );
    } else {
      this.selectSingle ( pnode );
    }
  }

  $(this.root.element).jstree(true).delete_node('#'+node.id);

  this.confirmCustomIconsVisibility();

}


// custom HTLM plugin, which adds HTML found in node.data.addHTML
$.jstree.plugins.addHTML = function ( options,parent ) {
  this.redraw_node = function ( obj, deep, callback, force_draw ) {
    obj = parent.redraw_node.call ( this, obj, deep, callback, force_draw );
    if (obj) {
      var node = this.get_node(jQuery(obj).attr('id'));
      if (node.data.customIcon.length>0)  {
        var ci_element = document.createElement ( 'img' );
        ci_element.setAttribute ( 'src',node.data.customIcon );
        ci_element.setAttribute ( 'id',node.id + '_pbar' );
        if (node.data.ci_width.length>0)
          ci_element.setAttribute ( 'width' ,node.data.ci_width );
        if (node.data.ci_height.length>0)
          ci_element.setAttribute ( 'height',node.data.ci_height );
        ci_element.style.visibility = node.data.ci_state;
        /* if used instead of previous line, this makes tree look compact:
        if (node.data.ci_state=='visible')  $(ci_element).show();
                                      else  $(ci_element).hide();
        */
        obj.insertBefore ( ci_element, obj.childNodes[2]);
      }
    }
    return obj;
  };
};

$.jstree.defaults.addHTML = {};


Tree.prototype.createTree = function ( onReady_func,
                                       onContextMenu_func,
                                       onDblClick_func,
                                       onSelect_func )  {

  (function(tree){

    $(tree.root.element).bind('ready.jstree', function(e, data) {

      tree.created = true;

      var selId = tree.calcSelectedNodeId();
      if ((selId.length<=0) && (tree.root_nodes.length>0))  {
        // situation abnormal, force initial selection
        tree.selectSingle ( tree.root_nodes[0] );
        tree.selected_node_id = tree.root_nodes[0].id;
      } else  {
        // always note the first selected one!
        tree.selected_node_id = selId[0];
      }

      if (onReady_func)
        onReady_func();

    });

    $(tree.root.element).on('contextmenu', '.jstree-anchor', function (e) {
      // note selected node at right mouse clicks
      var node = $(tree.root.element).jstree(true).get_node(e.target);
      if (node)
        tree.selected_node_id = node.id;
    });

    tree.created = false;

    var options = {
      plugins : ['addHTML'],
      core    : {
          check_callback : true,
//          "rtl": true,
//          "animation": 0,
          data           : tree.root_nodes,
          themes: {
              responsive : false,
          }
      },
      grid: { hoverable: true, clickable: true }
    };

    if (onContextMenu_func)  {
      options['plugins'].push('contextmenu');
      options['contextmenu'] = {'items':onContextMenu_func};
    }

    if (onDblClick_func)
      options['core']['dblclick_toggle'] = false;

    $(tree.root.element).jstree(options);

/*
    $("#jstree").jstree({
        plugins: ["addHTML"],
        core : {
            'data' : data,
            themes: {
                responsive: false,
            }
        }
    });
*/

    $(tree.root.element).on("select_node.jstree",
      function(evt,data) {
        if (tree.selected_node_id in tree.node_map)
          tree.node_map[tree.selected_node_id].state.selected = false;
        tree.selected_node_id = data.node.id;
        tree.node_map[tree.selected_node_id].state.selected = true;
        if (onSelect_func)
          onSelect_func();
      });

    $(tree.root.element).on('open_node.jstree',function(evt,data){
      tree.node_map[data.node.id].state.opened = true;
    });

    $(tree.root.element).on('close_node.jstree',function(evt,data){
      tree.node_map[data.node.id].state.opened = false;
    });

    if (onDblClick_func)  {
      $(tree.root.element).bind("dblclick.jstree", function(evt) {
        onDblClick_func();
      });
    }

  }(this));

}


Tree.prototype.refresh = function()  {
  $(this.root.element).jstree().refresh();
}


Tree.prototype.calcSelectedNodeId = function()  {
// returns empty list if no node is selected
  var node_lst = $(this.root.element).jstree('get_selected');
  var sel_lst  = [];  // sort reversely so that last selected is first
  for (var i=node_lst.length-1;i>=0;i--)
    sel_lst.push ( node_lst[i] );
  return sel_lst;
}


Tree.prototype.getSelectedNodeId = function()  {
  return this.selected_node_id;
}


Tree.prototype.calcSelectedNode = function()  {
var selId = this.calcSelectedNodeId();
  if (selId.length>0)  {
    return this.node_map[selId[0]];
  } else  {
    return null;
  }
}


Tree.prototype.getSelectedNode = function()  {
  if (this.selected_node_id!='')  {
    return this.node_map[this.selected_node_id];
  } else  {
    return null;
  }
}


Tree.prototype.addNodeToSelected = function ( text,icon_uri,treeNodeCustomIcon )  {
var snode = this.getSelectedNode();
  if (snode)  {
    return this.addNode ( snode,text,icon_uri,treeNodeCustomIcon );
  } else  {
    return null;
  }
}


Tree.prototype.insertNodeAfterSelected = function ( text,icon_uri,treeNodeCustomIcon )  {
var snode = this.getSelectedNode();
  if (snode)  {
    return this.insertNode ( snode,text,icon_uri,treeNodeCustomIcon );
  } else  {
    return null;
  }
}


Tree.prototype.addSiblingToSelected = function ( text,icon_uri,treeNodeCustomIcon )  {
var snode = this.getSelectedNode();
  if (snode)  {
    if (snode.parentId)  {
      var pnode = this.node_map[snode.parentId];
      return this.addNode ( pnode,text,icon_uri,treeNodeCustomIcon );
    }
  }
  return null;
}


Tree.prototype.deleteSelectedNode = function()  {
var snode = this.getSelectedNode();
  if (snode)
    this.deleteNode ( snode );
}


Tree.prototype.moveSelectedNodeUp = function()  {
var snode = this.getSelectedNode();
  if (snode)
    this.moveNodeUp ( snode );
}


Tree.prototype.deleteSelectedNodes = function()  {
var selId = this.calcSelectedNodeId();
  for (var i=0;i<selId.length;i++)  {
    var snode = this.node_map[selId[i]];
    if (snode)
      this.deleteNode ( snode );
  }
}
