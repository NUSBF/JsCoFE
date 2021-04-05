
/*
 *  ==========================================================================
 *
 *    05.04.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.tree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Generic tree class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  ==========================================================================
 *
 *
 *    Requires: 	jquery.js
 *                style(.min).css  // from jstree distro
 *                jstree(.min).js
 *                gui.widgets.js
 *                js-common/dtypes/common.dtypes.box.js
 *
 *   URL:  https://www.jstree.com
 *
 *  --------------------------------------------------------------------------
 *
 *   class TreeNodeCustomIcon  {
 *      constructor TreeNodeCustomIcon ( uri,width,height,state );
 *   }
 *
 *  --------------------------------------------------------------------------
 *
 *   class TreeNode : Widget  {
 *
 *      constructor TreeNode ( text,icon_uri,treeNodeCustomIcon );
 *
 *      function setSelected();
 *      function copy ( node );
 *      function setCustomIconVisible ( visible_bool );
 *      function setTooltip ( text );
 *
 *   }
 *
 *  --------------------------------------------------------------------------
 *
 *   class Tree {
 *
 *      constructor Tree ( rootName );
 *
 *      function addRootNode        ( text,icon_uri,treeNodeCustomIcon );
 *      function addNode            ( parent_node,text,icon_uri,treeNodeCustomIcon );
 *      function insertNode         ( parent_node,text,icon_uri,treeNodeCustomIcon );
 *      function getNodePosition    ( node );
 *      function moveNodeUp         ( node );
 *      function getChildNodes      ( node );
 *      function setNodes           ( nodes );
 *      function getNumberOfNodes   ();
 *      function selectNode         ( node,single_bool );
 *      function selectNodeById     ( nodeId,single_bool );
 *      function selectSingle       ( node );
 *      function selectMultiple     ( node );
 *      function deselectNode       ( node );
 *      function deselectNodeById   ( nodeId );
 *      function selectSingleById   ( nodeId );
 *      function selectMultipleById ( nodeId );
 *      function forceSingleSelection ();
 *      function setText            ( node,text );
 *      function setIcon            ( node,icon_uri );
 *      function setStyle           ( treeNode,style_str,propagate_int );
 *      function confirmCustomIconsVisibility();
 *      function deleteNode         ( node );
 *      function deleteBranch       ( node );
 *      function createTree         ( onReady_func   ,onContextMenu_func,
 *                                    onDblClick_func,onSelect_func );
 *      function refresh            ();
 *      function calcSelectedNodeIds();
 *      function getSelectedNodeId  ();
 *      function calcSelectedNode   ();
 *      function getSelectedNode    ();
 *      function addNodeToSelected  ( text,icon_uri,treeNodeCustomIcon );
 *      function insertNodeAfterSelected ( text,icon_uri,treeNodeCustomIcon );
 *      function addSiblingToSelected ( text,icon_uri,treeNodeCustomIcon );
 *      function deleteSelectedNode   ();
 *      function moveSelectedNodeUp   ();
 *      function deleteSelectedNodes  ();
 *      function canMakeFolder        ();
 *      function makeFolder           ( text,icon_uri ); // works on current selection
 *      function unfoldFolder         ();                // works on current selection
 *
 *   }
 *
 */


// ===========================================================================
// TreeNodeCustomIcon class

function TreeNodeCustomIcon ( uri,width,height,state )  {
  this.customIcon = uri;
  this.ci_width   = width;
  this.ci_height  = height;
  this.ci_state   = new String(state);
}


// ===========================================================================
// TreeNode class

function __get_tree_node_id()  {
  return 'treenode_' + padDigits(__id_cnt++,5);  // node element id (unstable)
}

function TreeNode ( text,icon_uri,treeNodeCustomIcon )  {
  this.id             = __get_tree_node_id();  // node element id (unstable)
  this.parentId       = null;           // parent node element id (unstable)
  this.folderId       = null;           // encapsulating folder Id
  this.fchildren      = [];             // folder's children
  this.text           = text;           // node text
  this.text0          = text;
  this.highlightId    = 0;
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
  if ('text0' in node)  this.text0 = node.text0;
                  else  this.text0 = node.text;
  if ('highlightId' in node)  this.highlightId = node.hightlightId;
                        else  this.highlightId = 0;
  this.icon            = node.icon;
  this.state           = node.state;
  this.dataId          = node.dataId;
  this.data            = $.extend({},node.data);
  this.data.customIcon = node.data.customIcon;
  this.data.ci_width   = node.data.ci_width;
  this.data.ci_height  = node.data.ci_height;
  this.data.ci_state   = new String(node.data.ci_state);
  this.a_attr          = $.extend({},node.a_attr);
  return this;
}


TreeNode.prototype.compare = function ( node )  {
  return ((this.text            == node.text           ) &&
          (this.text0           == node.text0          ) &&
          (this.highlightId     == node.hightlightId   ) &&
          (this.icon            == node.icon           ) &&
          (this.state           == node.state          ) &&
          (this.dataId          == node.dataId         ) &&
          (this.data.customIcon == node.data.customIcon) &&
          (this.data.ci_state   == node.data.ci_state  )
        );
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


TreeNode.prototype.setTooltip = function ( text )  {
  if (text)
    this.a_attr.title = text;
  else if ('title' in this.a_attr)
    delete this.a_attr.title;
}


/*
TreeNode.prototype.setCustomIconState = function ( state )  {
var ci_element = document.getElementById(this.id + '_pbar');
  if (ci_element)
    ci_element.style.visibility = state;
}
*/

// ===========================================================================
// Tree class

function Tree ( rootName )  {

  Widget.call ( this,'div' );

  this.root_label = new Label ( rootName );
  this.addWidget ( this.root_label );
  this.root       = new Widget('div');
  this.addWidget ( this.root );
  this.root_nodes = [];       //
  this.node_map   = {};       // node_map[nodeId] == TreeNode
  this.folder_map = {};       // folder_map[nodeId] == [TreeNodes] (nodes in folder)
  this.created    = false;    // true if tree was instantiated
  this.multiple   = false;    // single node selection
  this.selected_node_id = '';

  this.deleteChildren = function ( node )  {  // private

    for (var i=0;i<node.children.length;i++)  {
      for (var j=0;j<node.children[i].fchildren.length;j++)
        this.node_map[node.children[i].fchildren[j].id] = null;
      node.children[i].fchildren = [];
      this.deleteChildren ( node.children[i] );
      this.node_map[node.children[i].id] = null;
    }

    node.children = [];

  }

  /*
  this.mapNodes = function ( node )  {  // private
    this.node_map[node.id] = node;
    for (var i=0;i<node.children.length;i++)
      this.mapNodes ( node.children[i] );
  }
  */

  this.__set_fchildren = function ( node,fchildren )  {
    for (var i=0;i<fchildren.length;i++)  {
      var fnode = new TreeNode ( '','',null );
      if (fchildren[i].fchildren.length>0)
        this.__set_fchildren ( fnode,fchildren[i].fchildren );
      else  {
        fnode.copy ( fchildren[i] );
        node.fchildren.push ( fnode );
        this.node_map[fnode.id] = fnode;
      }
    }
  }

  this.setNode = function ( parent_node, node_obj )  {
    var node = new TreeNode ( '','',null );
    node.copy ( node_obj );
    node.parentId  = parent_node.id;
    parent_node.children.push ( node );
    this.node_map[node.id] = node;
    if ('fchildren' in node_obj)  {
      for (var i=0;i<node_obj.fchildren.length;i++)  {
        var fnode = new TreeNode ( '','',null );
        fnode.copy ( node_obj.fchildren[i] );
        node.fchildren.push ( fnode );
        this.node_map[fnode.id] = fnode;
      }
    }
    //  this.setNode ( node,node_obj.fchildren[i] );
    for (var i=0;i<node_obj.children.length;i++)
      this.setNode ( node,node_obj.children[i] );
    if (node.state.selected)
      this.selected_node_id = node.id;
  }

}


Tree.prototype = Object.create ( Widget.prototype );
Tree.prototype.constructor = Tree;

Tree.prototype.addRootNode = function ( text,icon_uri,treeNodeCustomIcon )  {
var node = new TreeNode ( text,icon_uri,treeNodeCustomIcon );
  this.root_nodes.push ( node );
  this.node_map[node.id] = node;
  if (this.created)  {
    var snode = $.extend ( {},node );
    $(this.root.element).jstree(true).create_node('#',node,'last',false,false);
    // jstree modifies node stricture, therefore extend it with custom fields
    node = $.extend ( node,snode );
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
    var snode = $.extend ( {},node );
    $(this.root.element).jstree(true).create_node('#'+parent_node.id,node,'last',false,false);
    // jstree modifies node stricture, therefore extend it with custom fields
    node = $.extend ( node,snode );
    //node.data     = treeNodeCustomIcon;  // this gets lost, duplicate, jstree bug
    //node.children = [];                  // this gets lost, duplicate, jstree bug
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
      var node_data = node.data;
      $(this.root.element).jstree(true).create_node('#'+parent_node.id,node,'last',false,false);
      $(this.root.element).jstree(true).move_node(children,node,'last',false,false);
      //node.data = treeNodeCustomIcon;  // this gets lost, duplicate, jstree bug
      node.data     = node_data;   // this gets lost, duplicate, jstree bug
      node.children = children;
      //this.refresh();
      //$(this.root.element).jstree().refresh(function(){});
      this.selectSingle ( node );  // force selection of new nodes if tree is displayed
      this.confirmCustomIconsVisibility();
      this.refresh();
    } else
      node.children = children;
    return node;
  }
}


Tree.prototype.getChildNodes = function ( node )  {
  if (node)  return node.children;
       else  return [];
}


Tree.prototype.getNodePosition = function ( node )  {
var parent_node = null;
var parentId    = null;
var clen        = 0;
var pos         = -2;

  if (node.parentId)  {
    parent_node = this.node_map[node.parentId];
    if (parent_node)  {
      parentId = parent_node.parentId;

      var parent_children = parent_node.children;
      clen = parent_children.length;

      // find sibling position of given node
      pos = -1;
      for (var i=0;(i<clen) && (pos<0);i++)
        if (parent_children[i].id==node.id)
          pos = i;

    }
  }

  return [pos,parent_node,parentId,clen];

}


Tree.prototype.moveNodeUp = function ( node )  {

  if (node.parentId)  {

    var parent_node     = this.node_map[node.parentId];
    var parent_children = parent_node.children;

    // find sibling position of given node
    var pos = -1;
    for (var i=0;(i<parent_children.length) && (pos<0);i++)
      if (parent_children[i].id==node.id)
        pos = i;

    if (pos>0)  {
      // given node is not the leading sibling; push it up with all its children

      if (this.created)
        $(this.root.element).jstree(true).move_node(node,parent_node,pos-1,false,false);

      // reflect changes in internal list of children
      var snode = parent_children[pos-1];
      parent_children[pos-1] = parent_children[pos];
      parent_children[pos]   = snode;

    } else if (parent_children.length>1) {
      // given node is the leading sibling; convert other siblings to its children

      var siblings = [];  // will be all siblings of given node
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

    } else if (parent_node.parentId)  {  // do not move above the root
      // given node is the only child of its parent; make it parent's parent

      var grandpa_node      = this.node_map[parent_node.parentId];
      var node_children     = node.children;
      var grandpa_children  = grandpa_node.children;

      // find sibling position of parent node
      var parent_pos = -1;
      for (var i=0;(i<grandpa_children.length) && (parent_pos<0);i++)
        if (grandpa_children[i].id==parent_node.id)
          parent_pos = i;

      node.children         = [];
      parent_node.children  = [];
      grandpa_node.children = [];

      // node moves up and becomes child of grand_parent_node
      // parent_node becomes child of node and receives all its children
      if (this.created)  {
        $(this.root.element).jstree(true).move_node(parent_node,node,'last',false,false);
        $(this.root.element).jstree(true).move_node(node,grandpa_node,parent_pos,false,false);
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
        else  grandpa_node.children.push ( node );
      node.parentId = grandpa_node.id;

    }

    // force selection and refresh the tree
    if (this.created)  {
      this.selectSingle ( node );  // force selection of the node if tree is displayed
      this.refresh();
      this.confirmCustomIconsVisibility();
    }

  }

}


Tree.prototype.setNodes = function ( nodes )  {
// Recreation from stringifying this.root_nodes, should be applied only to new
// tree. The argument is array of root nodes JSON.parsed from storage string.

  this.root_nodes = [];       //
  this.node_map   = {};       // node_map[nodeId] == TreeNode

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


Tree.prototype.selectNode = function ( node,single_bool )  {
// This function will select given node and deselect all others

  if (single_bool && (this.selected_node_id in this.node_map))
    this.node_map[this.selected_node_id].state.selected = false;

  if (this.created)  {
    if (single_bool)
      $(this.root.element).jstree('deselect_all');
    $(this.root.element).jstree(true).select_node('#'+node.id);
  }

  node.state.selected   = true;
  this.selected_node_id = node.id;

}

Tree.prototype.selectNodeById = function ( nodeId,single_bool )  {
  if (nodeId in this.node_map)  {
    this.selectNode ( this.node_map[nodeId],single_bool );
    return true;
  }
  return false;
}


Tree.prototype.selectSingle = function ( node )  {
// This function will select given node and deselect all others
  this.selectNode ( node,true );
}


Tree.prototype.selectMultiple = function ( node )  {
// This function will select given node
  this.selectNode ( node,false );
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
  if (nodeId in this.node_map)  {
    this.selectSingle ( this.node_map[nodeId] );
    return true;
  }
  return false;
}

Tree.prototype.selectMultipleById = function ( nodeId )  {
  if (nodeId in this.node_map)  {
    this.selectMultiple ( this.node_map[nodeId] );
    return true;
  }
  return false;
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
  node.text  = text;
  node.text0 = text;
  if (this.created)
    $(this.root.element).jstree(true).rename_node('#'+node.id,text);
}


Tree.prototype.setIcon = function ( node,icon_uri )  {
  node.icon = icon_uri;
  if (this.created)
    $(this.root.element).jstree(true).set_icon('#'+node.id,icon_uri);
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

    if (style_str.length>0)  {
      if (!('text0' in treeNode))
        treeNode.text0 = treeNode.text;
      treeNode.text = '<span style="' + style_str + '">' + treeNode.text0 + '</span>';
      //treeNode.text = '<span style="' + style_str + '">' + treeNode.text0.replace(' ','</span> ');
      $(this.root.element).jstree(true).rename_node('#'+treeNode.id,treeNode.text );
    } else if ('text0' in treeNode)  {  // empty string removes any custom style
      treeNode.text = treeNode.text0;
      $(this.root.element).jstree(true).rename_node('#'+treeNode.id,treeNode.text );
    }

    if (propagate_int<0)
      this.setStyle ( this.node_map[treeNode.parentId],style_str,propagate_int );
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


Tree.prototype.clear = function()  {
  // clears all the tree including root nodes; works only on created trees

  for (var i=0;i<this.root_nodes.length;i++)  {
    this.deleteChildren ( this.root_nodes[i] );
//    $(this.root.element).jstree(true).delete_node('#'+this.root_nodes[i].id);
    $(this.root.element).jstree(true).delete_node([this.root_nodes[i]]);
  }

  this.root_nodes = [];       //
  this.node_map   = {};       // node_map[nodeId] == TreeNode
  this.selected_node_id = '';

}


Tree.prototype.deleteNode = function ( node )  {
// does not delete root node(s)

  if (!node)
    return;

  if ((!node.parentId)              ||
      (!(node.id in this.node_map)) ||
      (!(node.parentId in this.node_map)))
    return;

  //  remove node from children list of its parent
  var pnode     = this.node_map[node.parentId];  // parent node
  var pchildren = [];  // new parent children
  var selNo     = -1;
  for (var i=0;i<pnode.children.length;i++)  {
    if (pnode.children[i].id==node.id) {
      selNo = i;
      // copy node's children to parent children list
      for (var j=0;j<node.children.length;j++)  {
        pchildren.push ( node.children[j] );
        node.children[j].parentId = pnode.id;
      }
    } else  {
      pchildren.push ( pnode.children[i] );
    }
  }
  pnode.children = pchildren;

  // remove node from general tree index
  this.node_map[node.id] = null;
  var node_map = {};  // new node map
  for (var key in this.node_map)
    if (this.node_map[key])
      node_map[key] = this.node_map[key];
  this.node_map = node_map;

  if (this.created)  {
//    $(this.root.element).jstree(true).move_node(node.children,pnode,'last',false,false);
    $(this.root.element).jstree(true).move_node(node.children,pnode,selNo,false,false);
    // remove node from tree
    //$(this.root.element).jstree(true).delete_node('#'+node.id);
    $(this.root.element).jstree(true).delete_node([node]);
    this.confirmCustomIconsVisibility();
    if (pnode.children.length>0)
          this.selectSingle ( pnode.children[0] );
    else  this.selectSingle ( pnode );
  }

}


Tree.prototype.deleteBranch = function ( node )  {
// does not delete root node(s)

  if (!node)
    return;

  if ((!node.parentId)              ||
      (!(node.id in this.node_map)) ||
      (!(node.parentId in this.node_map)))
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

  //$(this.root.element).jstree(true).delete_node('#'+node.id);
  $(this.root.element).jstree(true).delete_node([node.id]);

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

      var selId = tree.calcSelectedNodeIds();
      if ((selId.length<=0) && (tree.root_nodes.length>0))  {
        // situation abnormal, force initial selection
        tree.selectSingle ( tree.root_nodes[0] );
        tree.selected_node_id = tree.root_nodes[0].id;
      } else  {
        // always note the first selected one!
        //tree.selected_node_id = selId[0];
        tree.selectSingleById ( selId[0] );
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
          themes  : {
              responsive : false,
          }
      },
      grid: { hoverable: true, clickable: true }
    };

    if (onContextMenu_func)  {
      options['plugins'].push('contextmenu');
      options['contextmenu'] = { items : onContextMenu_func };
    }

    if (onDblClick_func)
      options['core']['dblclick_toggle'] = false;

    if (tree.multiple)  {
      options['plugins'].push('checkbox');
      options['checkbox'] = {
         three_state : false,
         visible     : false
      };
    }

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

    $(tree.root.element).on("deselect_node.jstree",
      function(evt,data) {
        var snode = tree.calcSelectedNode();
        if (snode)  {
          if (tree.selected_node_id in tree.node_map)
            tree.node_map[tree.selected_node_id].state.selected = false;
          tree.selected_node_id = snode.id;
          tree.node_map[tree.selected_node_id].state.selected = true;
          if (onSelect_func)
            onSelect_func();
        } else
          tree.selectSingleById ( tree.selected_node_id );
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
  $(this.root.element).jstree().refresh(function(){});
}

/*
Tree.prototype.setSingleSelection = function ( single_bool )  {
  if (single_bool)  {

    $(this.root.element).jstree({
      plugins  : ['addHTML'],
      checkbox : {
         three_state : false,
         visible     : false
      }
    }).refresh(function(){});

  } else  {

console.log ( '  multi');
    $(this.root.element).jstree({
      plugins  : ['addHTML','checkbox'],
      checkbox : {
         three_state : false,
         visible     : false
      }
    }).refresh(function(){});

  }
}
*/


Tree.prototype.calcSelectedNodeIds = function()  {
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
var selId = this.calcSelectedNodeIds();
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
    this.deleteBranch ( snode );
}


Tree.prototype.moveSelectedNodeUp = function()  {
var snode = this.getSelectedNode();
  if (snode)
    this.moveNodeUp ( snode );
  return snode;
}


Tree.prototype.deleteSelectedNodes = function()  {
var selId = this.calcSelectedNodeIds();
  for (var i=0;i<selId.length;i++)  {
    var snode = this.node_map[selId[i]];
    if (snode)
      this.deleteBranch ( snode );
  }
}


Tree.prototype.canMakeFolder = function()  {
  return this.canMakeFolder1 ( this.calcSelectedNodeIds() );
}


Tree.prototype.__connectivity_sort = function ( sel_list )  {
  var parentId = [];
  for (var i=0;i<sel_list.length;i++)
    parentId.push ( this.node_map[sel_list[i]].parentId );
  // find head node, whose parent is not in the list
  var index = [];
  for (var i=0;i<sel_list.length;i++)
    if (sel_list.indexOf(parentId[i])<0)  {
      index       = [i];
      parentId[i] = '-'+i;  // knock out for further searches
      break;
    }
  // find all the chain by parentIds
  for (var i=1;i<sel_list.length;i++)  {
    var j = parentId.indexOf ( sel_list[index[i-1]] );
    if (j>=0)  {
      index.push ( j );
      parentId[j] = '-'+j;  // knock out for further searches
    } else  {
      index = [];
      break;
    }
  }
  var sel_lst = [];
  for (var i=0;i<index.length;i++)
    sel_lst.push ( sel_list[index[i]] );
  return sel_lst;
}


Tree.prototype.canMakeFolder1 = function ( sel_list )  {
// returns true if more than one job is selected on a linear branch
  var sel_lst = this.__connectivity_sort ( sel_list );
  if (sel_lst.length>1)  {
    //sel_lst.sort();
    if (this.node_map[sel_lst[0]].parentId)  {
      sel_lst.reverse();
      var can_make = true;
      for (var i=0;(i<sel_lst.length) && can_make;i++)
        can_make = (this.node_map[sel_lst[i]].children.length==1);
      if (!can_make)
        sel_lst = [];
      /*
      for (var i=1;(i<sel_lst.length) && can_make;i++)  {
        var node = this.node_map[sel_lst[i-1]];
        can_make = (node.children.length==1) && (node.parentId==sel_lst[i]);
      }
      return can_make && (this.node_map[sel_lst[sel_lst.length-1]].children.length==1);
      */
    }
  }
  return sel_lst;
}


Tree.prototype.makeFolder = function ( text,icon_uri )  {
  return this.makeFolder1 ( this.calcSelectedNodeIds(),text,icon_uri );
}


Tree.prototype.makeFolder1 = function ( sel_node_list,text,icon_uri )  {
// make a folder node and places currently selected nodes in it; current selction
// must be validated with canMakeFolder() before using this function
  var sel_list = this.__connectivity_sort ( sel_node_list );
  if (sel_list.length>1)  {
    //$(this.root.element).jstree('deselect_all');
    //sel_list.sort();
    // make sure that there are no repeat ids!
    var sel_lst = [sel_list[0]];
    var njobs   = Math.max ( 1,this.node_map[sel_lst[0]].fchildren.length );
    for (var i=1;i<sel_list.length;i++)
      if (sel_list[i]!=sel_list[i-1])  {
        sel_lst.push ( sel_list[i] );
        njobs += Math.max ( 1,this.node_map[sel_lst[i]].fchildren.length );
      }
    var node = this.node_map[sel_lst[0]];
    var name = text;
    if (name)
      name += ' ';
    name += njobs + ' jobs archived';
    var folder_node = new TreeNode ( name,icon_uri,null );
    var pnode = this.node_map[node.parentId];
    for (var i=0;i<pnode.children.length;i++)
      if (pnode.children[i].id==node.id)  {
        pnode.children[i] = folder_node;
        break;
      }
    folder_node.parentId = pnode.id;
    for (var i=0;i<sel_lst.length;i++)  {
      node = this.node_map[sel_lst[i]];
      if (node.fchildren.length>0)  {  // NO ENCLOSED FOLDERS ASSUMED HERE!!!
        for (var j=0;j<node.fchildren.length;j++)  {
          node.fchildren[j].folderId = folder_node.id;
          node.fchildren[j].state.selected = false;
          folder_node.fchildren.push ( node.fchildren[j] );
        }
        node.fchildren = [];
      } else  {
        node.folderId = folder_node.id;
        node.state.selected = false;
        folder_node.fchildren.push ( node );
      }
      $(this.root.element).jstree(true).delete_node([node]);
    }
    this.node_map[folder_node.id] = folder_node;
    node = this.node_map[sel_lst[sel_lst.length-1]].children[0];
    folder_node.children = [node];
    node.parentId = folder_node.id;
    this.confirmCustomIconsVisibility();
    this.refresh();
    for (var key in this.node_map)
      this.node_map[key].state.selected = false;
    this.selectSingle ( folder_node );
    this.refresh();
    /*
    (function(tree,fnode){
      window.setTimeout ( function(){
        tree.selectSingle ( fnode );
        tree.refresh();
      },0);
    }(this,folder_node));
    */
  }
}

Tree.prototype.unfoldFolder = function()  {
var snode = this.getSelectedNode();
  var fchildren = snode.fchildren;
  if (fchildren.length>0)  {
    var pnode = this.node_map[snode.parentId];
    var cnode = snode.children[0];
    for (var i=0;i<fchildren.length;i++)  {
      var node = new TreeNode ( '','',null );
      node.copy ( fchildren[i] );
      node.id = fchildren[i].id;
      node.parentId  = pnode.id;
      node.folderId  = null;
      node.state.selected = false;
      this.node_map[node.id] = node;  // because new node instance was obtained
      if (i>0)
        pnode.children = [node];
      else  {
        for (var j=0;j<pnode.children.length;j++)
          if (pnode.children[j].id==snode.id)  {
            pnode.children[j] = node;
            break;
          }
      }
      pnode = node;
    }
    cnode.parentId = pnode.id;
    pnode.children = [cnode];
    $(this.root.element).jstree(true).delete_node([snode]);
    this.confirmCustomIconsVisibility();
    this.refresh();
    for (var key in this.node_map)
      this.node_map[key].state.selected = false;
    for (var i=0;i<fchildren.length;i++)
      this.selectNode ( this.node_map[fchildren[i].id],(i<=0) );
    this.refresh();
    /*
    (function(tree,fch){
      window.setTimeout ( function(){
        for (var key in tree.node_map)
          tree.node_map[key].state.selected = false;
        for (var i=0;i<fch.length;i++)
          tree.selectNode ( tree.node_map[fch[i].id],(i<=0) );
        tree.refresh();
      },0);
    }(this,fchildren));
    */
  }
}
