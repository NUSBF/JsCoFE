
/*
 *  =================================================================
 *
 *    10.04.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.jobtree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Job Tree
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 *    requires:  js-common/dtypes/common.dtypes.box.js
 *
 *   class FacilityTree : Tree {
 *
 *      constructor FacilityTree();
 *
 *   }
 *
 */


// -------------------------------------------------------------------------
// FacilityTree class

function FacilityTree()  {

  Tree.call ( this,'_____' );

  this.item_map  = {};

}

FacilityTree.prototype = Object.create ( Tree.prototype  );
FacilityTree.prototype.constructor = FacilityTree;


// -------------------------------------------------------------------------

FacilityTree.prototype.customIcon = function() {
//  var ci = new TreeNodeCustomIcon ( './images/brass_gears.gif','32px','22px','hidden' );
  var ci = new TreeNodeCustomIcon ( './images/activity.gif','22px','22px','hidden' );
  return ci;
}

FacilityTree.prototype.readFacilitiesData = function ( page_title,
                                                       onLoaded_func,
                                                       onRightClick_func,
                                                       onDblClick_func,
                                                       onSelect_func )  {

  this.item_map = {};  // map[nodeId]==item of all items in the tree

  (function(tree){
    serverRequest ( fe_reqtype.getFacilityData,0,page_title,function(data){

      if ('message' in data)
        MessageDataReadError ( page_title,data['message'] );

      tree.facilityList = jQuery.extend ( true, new FacilityList(),data );

      function addDir ( tree,dnode,dir )  {
        var dnode1 = tree.addNode ( dnode,dir.name,'./images/folder_20x20.svg',
                                    tree.customIcon() );
        tree.item_map[dnode1.id] = dir;
        for (var i=0;i<dir.dirs.length;i++)
          addDir ( tree,dnode1,dir.dirs[i] );
        for (var i=0;i<dir.files.length;i++)  {
          var fitem = dir.files[i];
          var fnode = tree.addNode ( dnode1,fitem.name,'./images/box_20x20.svg',
                                     tree.customIcon() );
          tree.item_map[fnode.id] = fitem;
        }
      }

      for (var i=0;i<tree.facilityList.facilities.length;i++)  {
        var fclitem = tree.facilityList.facilities[i];
        var fclnode = tree.addRootNode ( '<b><i>' + fclitem.title + '</i></b>',
                                         fclitem.icon,tree.customIcon() );
        tree.item_map[fclnode.id] = fclitem;
        for (var j=0;j<fclitem.users.length;j++)  {
          var uitem = fclitem.users[j];
          var unode = tree.addNode ( fclnode,uitem.id,'./images/user_20x20.svg',
                                     tree.customIcon() );
          tree.item_map[unode.id] = uitem;
          for (var k=0;k<uitem.visits.length;k++)  {
            var vitem = uitem.visits[k];
            var vnode = tree.addNode ( unode,vitem.id + '  <i>[' +
                                vitem.date.substring(0,10) + ']</i>',
                                './images/visit_20x20.svg',tree.customIcon() );
            tree.item_map[vnode.id] = vitem;
            for (var m=0;m<vitem.datasets.length;m++)  {
              var ditem = vitem.datasets[m];
              var dnode = tree.addNode ( vnode,ditem.path,'./images/folder_20x20.svg',
                                         tree.customIcon() );
              tree.item_map[dnode.id] = ditem;
              for (var n=0;n<ditem.dirs.length;n++)
                addDir ( tree,dnode,ditem.dirs[n] );
              for (var n=0;n<ditem.files.length;n++)  {
                var fitem = ditem.files[n];
                var fnode = tree.addNode ( dnode,fitem.name,'./images/box_20x20.svg',
                                           tree.customIcon() );
                tree.item_map[fnode.id] = fitem;
              }
            }
          }
        }
      }

      tree.createTree ( onLoaded_func,onRightClick_func,onDblClick_func,onSelect_func );

    },function(){
      //tree.startTaskLoop();
    },'persist');

  }(this));

}


FacilityTree.prototype.getSelectedItem = function()  {
  if (this.selected_node_id in this.item_map)  {
    return this.item_map[this.selected_node_id];
  } else  {
    return null;
  }
}



FacilityTree.prototype.getItem = function ( type,nodeId )  {
// returns first item of given type found from one corresponding to given tree
// node and higher along the tree branch
var item = null;
var nid  = this.selected_node_id;
  while ((!item) && nid)  {
    var itm = this.item_map[nid];
    if (itm._type==type)
      item = itm;
    else
      nid = this.node_map[nid].parentId;
  }
  return item;
}


FacilityTree.prototype.getFacility = function()  {
// returns facility item corresponding to currently selected item
  return shallowCopy ( this.getItem ( 'Facility',this.selected_node_id ) );
}


FacilityTree.prototype.getUser = function()  {
// returns user item corresponding to currently selected item
  return shallowCopy ( this.getItem ( 'FacilityUser',this.selected_node_id ) );
}


FacilityTree.prototype.getVisit = function()  {
// returns visit item corresponding to currently selected item
  return shallowCopy ( this.getItem ( 'FacilityVisit',this.selected_node_id ) );
}

FacilityTree.prototype.getFile = function()  {
// returns visit item corresponding to currently selected item
  return shallowCopy ( this.getItem ( 'FacilityFile',this.selected_node_id ) );
}

FacilityTree.prototype.getDirPath = function ( nodeid )  {
var path = '';
var nid  = nodeid;
  while (nid)  {
    var item = this.item_map[nid];
    if ((item._type=='Facility') || (item._type=='FacilityDir'))
      path = item.name + '/' + path;
    else if ((item._type=='FacilityUser') || (item._type=='FacilityVisit'))
      path = item.id + '/' + path;
    else if (item._type=='FacilityDataset')
      path = item.path + '/' + path;
    nid = this.node_map[nid].parentId;
  }
  return path;
}


FacilityTree.prototype.getFacilityName1 = function ( nodeId )  {
// returns facility name corresponding to given tree node
var item = this.getItem ( 'Facility',nodeId );
  if (item)  return item.name;
  return '';
}

FacilityTree.prototype.getFacilityName = function()  {
// returns facility name corresponding to currently selected tree node
var item = this.getItem ( 'Facility',this.selected_node_id );
  if (item)  return item.name;
  return '';
}

FacilityTree.prototype.getUserID1 = function ( nodeId )  {
// returns user Id corresponding to given tree node
var item = this.getItem ( 'FacilityUser',nodeId );
  if (item)  return item.id;
  return '';
}

FacilityTree.prototype.getUserID = function()  {
// returns user Id corresponding to currently selected tree node
var item = this.getItem ( 'FacilityUser',this.selected_node_id );
  if (item)  return item.id;
  return '';
}

FacilityTree.prototype.getVisitID1 = function ( nodeId )  {
// returns visit Id corresponding to given tree node
var item = this.getItem ( 'FacilityVisit',nodeId );
  if (item)  return item.id;
  return '';
}

FacilityTree.prototype.getVisitID = function()  {
// returns visit Id corresponding to currently selected tree node
// returns user Id corresponding to currently selected tree node
var item = this.getItem ( 'FacilityVisit',this.selected_node_id );
  if (item)  return item.id;
  return '';
}

FacilityTree.prototype.getDatasetID1 = function ( nodeId )  {
// returns dataset Id corresponding to given tree node
var item = this.getItem ( 'FacilityDataset',nodeId );
  if (item)  return item.id;
  return '';
}

FacilityTree.prototype.getDatasetID = function()  {
// returns visit Id corresponding to currently selected tree node
var item = this.getItem ( 'FacilityDataset',this.selected_node_id );
  if (item)  return item.id;
  return '';
}
