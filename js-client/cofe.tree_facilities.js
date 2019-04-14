
/*
 *  =================================================================
 *
 *    21.03.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.jobtree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  FacilityTree
 *       ~~~~~~~~~  StorageTree
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
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


// =========================================================================
// FacilityTree class

function FacilityTree ( treeType,rootPath )  {

  Tree.call ( this,'_____' );

  this.tree_type = treeType;
  this.tree_root = rootPath;

  this.item_map  = {};

}

FacilityTree.prototype = Object.create ( Tree.prototype  );
FacilityTree.prototype.constructor = FacilityTree;


// -------------------------------------------------------------------------

FacilityTree.prototype.customIcon = function() {
  var ci = new TreeNodeCustomIcon ( './images_com/activity.gif','22px','22px','hidden' );
  return ci;
}

FacilityTree.prototype.readFacilitiesData = function ( page_title,
                                                       onLoaded_func,
                                                       onRightClick_func,
                                                       onDblClick_func,
                                                       onSelect_func )  {

  this.item_map = {};  // map[nodeId]==item of all items in the tree

  var meta = {
    'type' : this.tree_type,
    'path' : this.tree_root
  };

  (function(tree){
    serverRequest ( fe_reqtype.getFacilityData,meta,page_title,function(data){

      if ('message' in data)
        MessageDataReadError ( page_title,data['message'] );

      tree.facilityList = jQuery.extend ( true, new FacilityList(),data );

      function addDir ( tree,dnode,dir )  {
        var dnode1 = tree.addNode ( dnode,dir.name,image_path('folder'),
                                    tree.customIcon() );
        tree.item_map[dnode1.id] = dir;
        for (var i=0;i<dir.dirs.length;i++)
          addDir ( tree,dnode1,dir.dirs[i] );
        for (var i=0;i<dir.files.length;i++)  {
          var fitem = dir.files[i];
          var fnode = tree.addNode ( dnode1,fitem.name,image_path('box'),
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
          var unode = tree.addNode ( fclnode,uitem.id,image_path('user'),
                                     tree.customIcon() );
          tree.item_map[unode.id] = uitem;
          for (var k=0;k<uitem.visits.length;k++)  {
            var vitem = uitem.visits[k];
            var vnode = tree.addNode ( unode,vitem.id + '  <i>[' +
                                vitem.date.substring(0,10) + ']</i>',
                                image_path('visit'),tree.customIcon() );
            tree.item_map[vnode.id] = vitem;
            for (var m=0;m<vitem.datasets.length;m++)  {
              var ditem = vitem.datasets[m];
              var dnode = tree.addNode ( vnode,ditem.path,image_path('folder'),
                                         tree.customIcon() );
              tree.item_map[dnode.id] = ditem;
              for (var n=0;n<ditem.dirs.length;n++)
                addDir ( tree,dnode,ditem.dirs[n] );
              for (var n=0;n<ditem.files.length;n++)  {
                var fitem = ditem.files[n];
                var fnode = tree.addNode ( dnode,fitem.name,image_path('box'),
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



// =========================================================================
// StorageTree class

function StorageTree ( treeType,rootPath,imageKey )  {

  Tree.call ( this,'_____' );

  this.tree_type   = treeType;
  this.tree_root   = rootPath;
  this.image_key   = imageKey; // 0: do not show images
                               // 1: show images
                               // 2: show only images

  this.storageList = null;
  this.item_map    = {};

}

StorageTree.prototype = Object.create ( Tree.prototype  );
StorageTree.prototype.constructor = StorageTree;


// -------------------------------------------------------------------------

StorageTree.prototype.customIcon = function() {
  var ci = new TreeNodeCustomIcon ( './images_com/activity.gif','22px','22px','hidden' );
  return ci;
}

StorageTree.prototype.readStorageData = function ( page_title,
                                                   onLoaded_func,
                                                   onRightClick_func,
                                                   onDblClick_func,
                                                   onSelect_func )  {

  this.item_map = {};  // map[nodeId]==item of all items in the tree

  var meta = {
    'type' : this.tree_type,
    'path' : this.tree_root
  };

  (function(tree){
    serverRequest ( fe_reqtype.getFacilityData,meta,page_title,function(data){

      if ('message' in data)
        MessageDataReadError ( page_title,data['message'] );

      tree.storageList = jQuery.extend ( true, new StorageList(),data );

      if ((tree.storageList.path.length<=0) &&
          (tree.storageList.dirs.length<=0) &&
          (tree.storageList.files.length<=0))  {

        tree.storageList = null;
        onLoaded_func();

      } else  {

        var rootLabel = 'Cloud File Storage';
        if (tree.tree_root)
          rootLabel = tree.tree_root;
        tree.root_label.setText ( '<u><i><b>' + rootLabel + '</b></i></u>' );
        tree.root.element.style.paddingTop  = '4px';
        tree.root.element.style.paddingLeft = '40px';

        for (var i=0;i<tree.storageList.dirs.length;i++)  {
          var sdir = tree.storageList.dirs[i];
          var name = sdir.name;
          if (name=='..')
            name += ' (&#8593; <i>upper directory</i>)';
          var icon   = 'folder';
          var nlower = name.toLowerCase();
          if (nlower.indexOf('my computer')>=0) icon = 'folder_mycomputer';
          else if (nlower.indexOf('home')>=0)   icon = 'folder_home';
          else if (nlower.indexOf('ccp4')>=0)   icon = 'folder_ccp4';
          var dnode = tree.addRootNode ( name,image_path(icon),tree.customIcon() );
          tree.item_map[dnode.id] = sdir;
        }

        for (var i=0;i<tree.storageList.files.length;i++)  {
          var sfile = tree.storageList.files[i];
          var name  = sfile.name;
          var base  = sfile.name.split('.');
          var ext   = base.pop().toLowerCase();
          base = base.join('.').toLowerCase();
          var icon  = image_path('file_dummy');
          var show  = (tree.image_key<2);
          if (ext=='mtz')       icon = image_path('file_mtz');
          else if ('h5' in sfile)   {
            if (sfile.h5>0)  icon = image_path('file_hdf');
                       else  name = '(' + Array(name.length).join('....') + ')';
            show = false;
          } else if (ext=='h5')   icon = image_path('file_hdf');
          else if (['pdb','ent','mmcif'].indexOf(ext)>=0)
                                icon = image_path('file_pdb');
          else if (ext=='cif')  {  // use wild heuristics
            if (endsWith(base,'-sf'))
                  icon = image_path('file_mtz');
            else  icon = image_path('file_pdb');
          } else if (['seq','fasta','pir'].indexOf(ext)>=0)
                                icon = image_path('file_seq' );
          else if ('image' in sfile)  {
            if (sfile.image>0)  icon = image_path('file_xray');
                          else  name = '(' + Array(name.length).join('....') + ')';
            show = (tree.image_key>0);
          }
          if (show)  {
            var fnode = tree.addRootNode ( name,icon,tree.customIcon() );
            tree.item_map[fnode.id] = sfile;
          }
        }

        tree.createTree ( onLoaded_func,onRightClick_func,onDblClick_func,onSelect_func );

      }

    },function(){
      //tree.startTaskLoop();
    },'persist');

  }(this));

}


StorageTree.prototype.getSelectedItems = function()  {
  var selNodeId = this.calcSelectedNodeId();
  var items = [];
  for (var i=0;i<selNodeId.length;i++)
    if (selNodeId[i] in this.item_map)  {
      items.push ( this.item_map[selNodeId[i]] );
  }
  return items;

  /*
  if (this.selected_node_id in this.item_map)  {
    return this.item_map[this.selected_node_id];
  } else  {
    return null;
  }
  */

}
