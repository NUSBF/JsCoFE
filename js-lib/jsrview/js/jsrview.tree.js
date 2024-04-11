//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.tree.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's tree module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function makeTreeLeaf ( treeId,taskUri )  {

  processFile ( taskUri,"post",true,
    function(data)  {
      removeElement ( treeId );
      let div = element ( "div","id",treeId,"" );
      setGridItem ( treeId+"_outer",div,0,1,1,1 ).width = "100%";
      addGrid ( treeId );
      let cmdNo = 0;
      processCommands ( data,cmdNo );
    },
    function() {},
    function() {
      // maybe to comment out
      alert ( "Data transmission error in makeTreeLeaf" );
    }
  );

}


function checkOpenMode ( node,tree )  {

  if (node==null)  {

    let root = tree.tree('getTree');
    for (let i=0;i<root.children.length;i++)
      checkOpenMode ( root.children[i],tree );

  } else  {

    if (node.openMode=='open')        tree.tree ( 'openNode',node,false );
    if (node.openMode=='always_open') tree.tree ( 'openNode',node,false );
    if (node.openMode=='closed')      tree.tree ( 'closeNode',node,false );

    for (let i=0;i<node.children.length;i++)
      checkOpenMode ( node.children[i],tree );

  }

}


function addTreeWidget ( treeId, title, holderId, treeData,
                         row,col,rowSpan,colSpan )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  if (treeData[0]!='[')  {

    $("body").css("cursor","progress");

//###    processFile ( treeData,"post",false,
    processFile ( treeData,"post",true,
      function(data)  {
        let dataArray = eval ( "(" + data + ")" );
        _add_tree_widget ( treeId, title, holderId, dataArray,
                           row,col,rowSpan,colSpan );
      },
      function() {},
      function() {
        // maybe to comment out
        alert ( "Data transmission error in addTreeWidget" );
      }
    );
    $("body").css("cursor", "default");

  } else  {
    let dataArray = eval ( "(" + treeData + ")" );
    _add_tree_widget ( treeId, title, holderId, dataArray,
                               row,col,rowSpan,colSpan );
  }

}

function _add_tree_widget ( treeId, title, holderId, dataArray,
                            row,col,rowSpan,colSpan )  {
let cell         = getGridCell ( holderId,row,col );
let selNodeId    = "";
let openNodesIds = new Array();
let tree;
let node;

  if (cell)  {

    if (document.getElementById(treeId+"_outer-grid")==null)  {
      // make new tree widget

      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      cell.style.height = "100%";

      $( "<table id='" +treeId + "_outer-grid' " +
         "class='grid-layout' style='height: 100%;'>" +
         "</table>" )
       .appendTo ( cell );

      let table = element ( "table","class","treewidget-table","" );
      table.setAttribute ( "id",treeId+"_panel-grid" );
      $( "<tr><th>" + title + "</th></tr>" ).appendTo ( table );
      $( "<tr><td style='height: 100%;'><div id='"+treeId+"-tree'></div></td></tr>" )
        .appendTo ( table );
      setGridItem ( treeId+"_outer",table,0,0,1,1 );

      getGridCell ( treeId+"_outer",0,0 ).setAttribute ( "style",
                              "text-align: right; margin-top: 0px;" );

    } else  {
      // modify existing tree widget with new tree and/or leafs

      tree = $("#"+treeId+"-tree");
      selNodeId = tree.tree('getSelectedNode').id;

      getOpenNodeIds ( tree.tree('getTree'),openNodesIds );

      tree.tree('destroy');

      /* -- old version with removeElement possibly memory leaks
      removeElement ( treeId+"-tree" );
      $( "<div id='"+treeId+"-tree'></div>" )
        .appendTo ( getGridCell(treeId+"_panel",1,0) );
      */

    }

    let div = document.getElementById ( treeId+"-tree" );
    div.setAttribute ( "class","treewidget-box" );

    tree = $("#"+treeId+"-tree");
    tree.tree({
        data: dataArray
//        ,onCanSelectNode: function(node) {
//          return (node.children.length == 0); // can select if true
//        }
    });

    checkOpenMode ( null,tree );

    tree.bind (
      'tree.click',
      function(event) {
        let node = event.node; // the clicked node
        if ($(this).tree('isNodeSelected',node))
          event.preventDefault();
    });
    tree.bind(
      'tree.select',
      function(event) {
        if (event.node)
          makeTreeLeaf ( treeId,event.node.task );
    });
    tree.bind(
      'tree.close',
      function(event) {
        if (event.node.openMode=="always_open") {
          tree.tree ( 'openNode',event.node,false );
//          alert ( " try to prevent" );
//          event.preventDefault();
        }
    });

    if (selNodeId.length<=0)  {
      // the tree is newly created, select first node

      node = tree.tree('getTree');
      while (node!=null)
        if (node.task!=null)  {
          tree.tree( 'selectNode',node );
          node = null;
        } else if (node.children.length>0)
          node = node.children[0];
        else
          node = null;

    } else  {
      // the tree was modified, set old state

//      setTimeout(function(){
        // this time-out construct is equivalent to flush(), which is
        // nececssary in this particular case

        for (let i=0;i<openNodesIds.length;i++)  {
          node = tree.tree ( 'getNodeById',openNodesIds[i] );
          if (node!=null)
            tree.tree ( 'openNode',node,false );
        }

        tree.tree ( 'selectNode',tree.tree('getNodeById',selNodeId) );

//      }, 0);

    }

  }

}
