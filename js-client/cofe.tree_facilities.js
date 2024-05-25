
/*
 *  =================================================================
 *
 *    25.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.jobtree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  StorageTree
 *       ~~~~~~~~~  
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *    requires:  js-common/dtypes/common.dtypes.box.js
 *
 */

'use strict';

// =========================================================================
// StorageTree class

function StorageTree ( treeType,rootPath,topPath,fileKey,dirDesc_lbl )  {

  Tree.call ( this,'_____' );

  this.tree_type = treeType;
  this.tree_root = rootPath;
  this.tree_top  = topPath;
  this.file_key  = fileKey;    // 0: do not show images
                               // 1: show images
                               // 2: show only images
                               // 3: browse directories, show all files
                               // 4: show only importable files
  this.dirdesc_lbl = dirDesc_lbl;  // label to receive directory descriptions
                                   // from __jscofe__.meta files, or null

  this.storageList = null;
  this.item_map    = {};

}

StorageTree.prototype = Object.create ( Tree.prototype  );
StorageTree.prototype.constructor = StorageTree;


// -------------------------------------------------------------------------

StorageTree.prototype.customIcon = function() {
  let ci = new TreeNodeCustomIcon ( activityIcon(),'22px','22px','hidden' );
  return ci;
}

/*
},
"cloud_mounts"     : {
  "My Computer"    : "/",
  "Home"           : ["$HOME","$USERPROFILE"],
  "CCP4 examples"  : "$CCP4/share/ccp4i2/demo_data",
  "Demo projects"  : "./demo-projects"
*/

let icon_ext = {
  'mtz'       : 'file_mtz',
  'sca'       : 'file_mtz',
  'h5'        : 'file_hdf',
  'ccp4_demo' : 'file_ccp4demo',
  'ccp4cloud' : 'file_ccp4demo',
  'pdb'       : 'file_pdb',
  'ent'       : 'file_pdb',
  'mmcif'     : 'file_pdb',
  'jpg'       : 'file_image',
  'jpeg'      : 'file_image',
  'png'       : 'file_image',
  'gif'       : 'file_image',
  'html'      : 'file_doc',
  'txt'       : 'file_doc',
  'pdf'       : 'file_doc',
  'seq'       : 'file_seq',
  'fasta'     : 'file_seq',
  'pir'       : 'file_seq',
  'hhr'       : 'file_hhpred',
  'borges'    : 'file_borges',
  'wscript'   : 'file_wscript'
};

let importable_ext = [
  'mtz', 'pdb', 'ent', 'mmcif', 'jpg', 'jpeg', 'png', 'gif', 'html',
  'txt', 'pdf', 'seq', 'fasta', 'pir', 'hhr' , 'sca', 'cif', 'lib',
  'borges'
];



StorageTree.prototype.readStorageData = function ( page_title,
                                                   extFilter,
                                                   onLoaded_func,
                                                   onRightClick_func,
                                                   onDblClick_func,
                                                   onSelect_func )  {

  this.item_map = {};  // map[nodeId]==item of all items in the tree
  if (extFilter && (extFilter.length>0))  {
    this.ext_filter = [];
    for (let i=0;i<extFilter.length;i++)  {
      let ext = extFilter[i].toLowerCase().replace(/^./,'');
      if (importable_ext.indexOf(ext)>=0)
        this.ext_filter.push(ext);
    }
  } else
    this.ext_filter = importable_ext;

  let meta = {
    'type' : this.tree_type,
    'path' : this.tree_root,
    'root' : this.tree_top
  };

  (function(tree){
    serverRequest ( fe_reqtype.getCloudFileTree,meta,page_title,function(data){

      if (data.message && (data.code=='unconfigured'))  {
        MessageDataReadError ( page_title,data['message'] );
        tree.storageList = null;
        onLoaded_func();
      } else  {

        tree.dirdesc_lbl.setText ( '' );

        tree.storageList = jQuery.extend ( true, new StorageList(),data );

        if ((tree.storageList.path.length<=0) &&
            (tree.storageList.dirs.length<=0) &&
            (tree.storageList.files.length<=0))  {

          tree.storageList.size = -1;
          onLoaded_func();

        } else  {

          let rootLabel  = 'Cloud File Storage';
          tree.tree_root = tree.storageList.path;
          if (tree.tree_root)
            rootLabel = tree.tree_root;
          tree.root_label.setText ( '<u><i><b>' + rootLabel + '</b></i></u>' );
          tree.root.element.style.paddingTop  = '4px';
          tree.root.element.style.paddingLeft = '40px';

          for (let i=0;i<tree.storageList.dirs.length;i++)  {
            let sdir = tree.storageList.dirs[i];
            let name = sdir.name;
            if (name=='**top**')  {
              if (sdir.hasOwnProperty('fullDesc'))
                tree.dirdesc_lbl.setText ( sdir.fullDesc + '<hr/>&nbsp;<br>' );
            } else  {
              if (name=='..')  {
                name += ' (&#8593; <i>upper directory</i>)';
                if (sdir.hasOwnProperty('fullDesc'))
                  tree.dirdesc_lbl.setText ( sdir.fullDesc + '<hr/>&nbsp;<br>' );
              }
              let icon   = 'folder';
              let nlower = name.toLowerCase();
              if (nlower.indexOf('my computer'  )>=0) icon = 'folder_mycomputer';
              else if (nlower.indexOf('home'    )>=0) icon = 'folder_home';
              else if (nlower.indexOf('ccp4'    )>=0) icon = 'folder_ccp4';
              else if (nlower.indexOf('demo'    )>=0) icon = 'folder_ccp4';
              else if (nlower.indexOf('tutorial')>=0) icon = 'folder_tutorials';
              else if (nlower.indexOf('workshop')>=0) icon = 'folder_workshops';
              if ((nlower.indexOf('howto')>=0) || (nlower.indexOf('how ')>=0) ||
                  (nlower.indexOf('?')>=0))  icon = 'folder_howto';
              let dnode = tree.addRootNode ( name,image_path(icon),tree.customIcon() );
              if ((name!='..') && sdir.hasOwnProperty('shortDesc'))
                dnode.setTooltip ( sdir.shortDesc );
              tree.item_map[dnode.id] = sdir;
            }
          }

          for (let i=0;i<tree.storageList.files.length;i++)  {

            let sfile = tree.storageList.files[i];
            let name  = sfile.name;

            if ((name!='..') && (!startsWith(name,'.')))  {  // remove hiden files

              let base  = sfile.name.split('.');
              let ext   = base.pop().toLowerCase();
              if (ext=='gz')  {
                ext = base.pop().toLowerCase();
                if (importable_ext.indexOf(ext)<0)
                  ext = 'gz';  // do not consider for import
              }

              base = base.join('.').toLowerCase();
              let show = (tree.file_key!=2);
              if (tree.file_key==4)
                show = (tree.ext_filter.indexOf(ext)>=0);
                //show = (importable_ext.indexOf(ext)>=0);
              else if (tree.file_key==5)  {
                show = (ext=='ccp4_demo') || (ext=='ccp4cloud');
                if (show)
                  name = name.substring ( 0, name.lastIndexOf('.') );
              }

              let icon  = 'file_dummy';
              if (ext in icon_ext)  {
                icon = icon_ext[ext];
              } else if ('h5' in sfile)   {
                if (sfile.h5>0)  icon = 'file_hdf';
                           else  name = '(' + Array(name.length).join('....') + ')';
                show = false;
              } else if (ext=='cif')  {  // use wild heuristics
                if (endsWith(base,'-sf'))  icon = 'file_mtz';
                                     else  icon = 'file_pdb';
              } else if ('image' in sfile)  {
                if (sfile.image>0)  icon = 'file_xray';
                              else  name = '(' + Array(name.length).join('....') + ')';
                show = (tree.file_key==1) || (tree.file_key==2);
              }
              if (show)  {
                let fnode = tree.addRootNode ( name,image_path(icon),tree.customIcon() );
                tree.item_map[fnode.id] = sfile;
              } else  {
                let fnode = tree.addRootNode ( '<span style="color:gray">' + name + '</span>',image_path(icon),tree.customIcon() );
                //tree.item_map[fnode.id] = sfile;
              }

            }

          }

          tree.createTree ( true,onLoaded_func,onRightClick_func,onDblClick_func,onSelect_func );

        }

      }

    },function(){
      //tree.startTaskLoop();
    },'persist');

  }(this));

}


StorageTree.prototype.getSelectedItems = function()  {
  let selNodeId = this.calcSelectedNodeIds();
  let items = [];
  for (let i=0;i<selNodeId.length;i++)
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
