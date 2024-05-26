
/*
 *  ==========================================================================
 *
 *    03.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.jobtree.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Job Tree
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 *   requires:  js-common/dtypes/common.dtypes.box.js
 *
 *   class JobTree : Tree {
 *
 *      constructor JobTree();
 *
 *      function setReplayMode   ();
 *      function setSelectMode   ();
 *      function isProjectMode   ();
 *      function isReplayMode    ();
 *      function isSelectMode    ();
 *      function isShared        ();
 *      function customIcon      ();
 *      function getTaskByNodeId ( nodeId );
 *      function getTask         ( taskId );
 *      function getTaskNodeId   ( taskId );
 *      function countTasks      ();
 *      function getChildTasks   ( node   );
 *      function readProjectData ( page_title,
 *                                 allow_selection,
 *                                 timestamp,
 *                                 onLoaded_func  ,onRightClick_func,
 *                                 onDblClick_func,onSelect_func );
 *      function makeNodeId      ( task_id );
 *      function makeNodeName    ( task );
 *      function setNodeName     ( nodeId,save_bool );
 *      function setNodeIcon     ( nodeId,save_bool );
 *      function resetNodeName   ( nodeId );
 *      function __checkTaskLoop ();
 *      function startTaskLoop   ();
 *      function stopTaskLoop    ();
 *      function getSelectedTask ();
 *      function getSelectedTasks();
 *      function selectTask      ( task );
 *      function selectTasks     ( task_lst );
 *      function saveProjectData ( tasks_add,tasks_del,onDone_func(tree,rdata) );
 *      function hasRunningJobs  ( nodeId );
 *      function selectStackJobs();
 *      function addJob          ( insert_bool,parent_page,onAdd_func );
 *      function moveJobUp       ();
 *      function calcMetrics     ();
 *      function deleteJob       ( silent_bool,onDelete_func );
 *      function closeAllJobDialogs();
 *      function stopJob         ( nodeId,gracefully_bool,callback_func );
 *      function webappFinished  ( nodeId );
 *      function openJob         ( dataBox,parent_page );
 *      function cloneJob        ( parent_page,onAdd_func );
 *      function getTaskDataBox  ( task );
 *      function harvestTaskData ( includeSelected_bool,harvestedTaskIds );
 *      function inspectData     ( jobId,dataType,dataId );
 *      function getAllAncestors ();
 *      function getNonRemarkParent ( task );
 *      function replayTree      ( ref_tree );
 *
 *   }
 *
 */

'use strict';

// ===========================================================================
// JobTree class

function JobTree()  {

  Tree.call ( this,'___' );

  this.projectData  = null;
  this.task_map     = {};    // map[nodeId]==task of all tasks in the tree
  this.run_map      = {};    // map[taskId]==nodeId of all running tasks
  this.dlg_map      = {};    // map[taskId]==dialog of open job dialogs

  this.checkTimeout = null;  // timeout timer Id

  this.mode         = 'project';  //  'replay', 'select'
  this.in_archive   = false;
  this.view_only    = false;
//  this.replay_mode  = false;  // works with the replay project if true

}

JobTree.prototype = Object.create ( Tree.prototype  );
JobTree.prototype.constructor = JobTree;


// ---------------------------------------------------------------------------

JobTree.prototype.setReplayMode = function()  {
  this.mode = 'replay';
}

JobTree.prototype.setSelectMode = function()  {
  this.mode = 'select';
}

JobTree.prototype.isProjectMode = function()  {
  return (this.mode=='project');
}

JobTree.prototype.isRemark = function ( nodeId )  {
  if (nodeId in this.task_map)
    return this.task_map[nodeId].isRemark();
  return false;
}

JobTree.prototype.isReplayMode = function()  {
  return (this.mode=='replay');
}

JobTree.prototype.isSelectMode = function()  {
  return (this.mode=='select');
}

JobTree.prototype.customIcon = function() {
  let ci = new TreeNodeCustomIcon ( activityIcon(),'22px','22px','hidden' );
  return ci;
}


JobTree.prototype.getTaskByNodeId = function ( nodeId )  {
  if (nodeId in this.task_map)
    return this.task_map[nodeId];
  return null;
}


JobTree.prototype.countTasks = function()  {
let nTasks = 0;
  for (let nodeId in this.task_map)
    if (!this.task_map[nodeId].isRemark())
      nTasks++;
  return nTasks;
}


JobTree.prototype.getTask = function ( taskId )  {
// not a very slick function, but it should be used relatively rare
let task = null;
  for (let nodeId in this.task_map)
    if (this.task_map[nodeId].id==taskId)  {
      task = this.task_map[nodeId];
      break;
    }
  return task;
}


JobTree.prototype.getTaskNodeId = function ( taskId )  {
// not a very slick function, but it should be used relatively rare
let nodeId = null;
  for (let nId in this.task_map)
    if (this.task_map[nId].id==taskId)  {
      nodeId = nId;
      break;
    }
  return nodeId;
}


const __deleteStyle     = 'color:#FF0000;text-decoration:line-through;';
const __noDeleteStyle   = 'color:#0000FF;';
const __notViewedStyle  = 'color:#00A000;';
const __remarkStyle     = 'color:#A00000;font-style:italic;';
const __linkStyle       = 'color:#0000FF;font-style:italic;text-decoration:underline;';
const __highlightStyle  = 'background-color:yellow;padding:4px 16px 4px 0px;';
const __highlightStyleL = 'background-color:lime;padding:4px 16px 4px 0px;';

function __projectStyle ( text )  {
  return '<span style="color:blue;"><b>' + text  + '</b></span>';
}


JobTree.prototype.__compare_node = function ( node0,node1 )  {
  if ((node1.dataId!=node2.dataId) ||
      (node1.children.length!=node2.children.length))
    return null;
  let diff = [];
  if (!this.compare(node2))
    diff = [node2.dataId];
  for (let i=0;(i<node1.children.length) && diff;i++)  {
    let df = this.__compare_node ( node1.children[i],node2.children[i] );
    if (df)  diff = diff.concat ( df );
       else  diff = null;
  }
  return diff;
}


JobTree.prototype.compare = function ( job_tree )  {
// Compares 'this' tree and job_tree. Returns null if trees are structurally
// different. If trees compare, the function returns list of job_tree's nodes
// which have different parameters comparing to their matches in 'this' tree,
// such as different node title, colors, icons etc.
let tree0 = this.tree;
let tree1 = job_tree.tree;

  if (tree0.length!=tree1.length)
    return null;

  let diff  = [];

  for (let i=0;(i<tree0.length) && diff;i++)  {
    let df = this.__compare_node ( tree0[i],tree1[i] );
    if (df)  diff = diff.concat ( df );
       else  diff = null;
  }

  return diff;

}


JobTree.prototype.readProjectData = function ( page_title,
                                               allow_selection,
                                               timestamp,
                                               onLoaded_func,
                                               onRightClick_func,
                                               onDblClick_func,
                                               onSelect_func )  {

  // this.task_map = {};  // map[nodeId]==task of all tasks in the tree
  // this.run_map  = {};  // map[taskId]==nodeId of all running tasks
  // this.dlg_map  = {};  // map[taskId]==dialog of open job dialogs

  this.stopTaskLoop();

  // this.checkLoop = false;  // true if job check loop is running

  let tree = this;

  serverRequest ( fe_reqtype.getProjectData,{'mode':tree.mode},
                  page_title,function(data){

    if ('missing' in data)  {

      tree.projectData = null;
      tree.no_access   = true;
      new MessageBox ( 'Missing Project',
        '<div style="width:400px"><h2>Missing Project</h2>' +
        'Project <i>"' + data.project + '"</i> does not exist. ' +
        'If it was shared with you, check whether it was deleted ' +
        'by owner.</div>',
        'msg_error'
      );

    } else if ('message' in data)  {

      MessageDataReadError ( page_title,data['message'] );

    } else if (data.meta.desc.timestamp>timestamp)  {

      tree.task_map = {};  // map[nodeId]==task of all tasks in the tree
      tree.run_map  = {};  // map[taskId]==nodeId of all running tasks
      tree.dlg_map  = {};  // map[taskId]==dialog of open job dialogs

      let startmode = null;
      if (tree.projectData)
        startmode = tree.projectData.desc.startmode;

      tree.projectData = jQuery.extend ( true, new ProjectData(),data.meta );
      tree.projectData.desc.dateLastUsed = getDateString();
      tree.projectData.desc.autorun = false;

      tree.in_archive  = inArchive ( tree.projectData.desc );
      tree.permissions = getProjectPermissions ( __login_id,tree.projectData.desc );
      tree.view_only   = tree.in_archive ||
                          (tree.permissions == share_permissions.view_only);

      if (startmode)
        tree.projectData.desc.startmode = startmode;

      let author = '';
      if (author!=__login_id)
        author = getProjectAuthor ( tree.projectData.desc );
      if (author)  author = '(' + author + '):';
      let archiveID = '';
      let pName     = tree.projectData.desc.name;
      if (tree.in_archive)  {
        archiveID = ' <i>arch.ID:</i> ' + tree.projectData.desc.archive.id;
        pName     = tree.projectData.desc.archive.project_name;
      }
      let root_title = __projectStyle ( author + '[' + pName  + ']' + archiveID );

      if (tree.projectData.tree.length<=0)  {
        tree.addRootNode ( root_title,image_path('project'),tree.customIcon() );

      } else  {

        // enforce title of root node just in case it was renamed
        data.meta.tree[0].text  = root_title;
        data.meta.tree[0].text0 = root_title;

        tree.setNodes ( data.meta.tree,allow_selection );

        let t_map = {};
        for (let i=0;i<data.tasks_add.length;i++)
          t_map[data.tasks_add[i].id] = data.tasks_add[i];
        for (let key in tree.node_map)  {
          let dataId = tree.node_map[key].dataId;  // dataId of tree node's data
          if (dataId in t_map)  {
            let json = JSON.stringify ( t_map[dataId] );
            tree.task_map[key] = getObjectInstance ( json );
            tree.task_map[key].treeItemId = key;
            tree.task_map[key].project    = tree.projectData.desc.name;
            if ((tree.task_map[key].state==job_code.running) ||
                (tree.task_map[key].state==job_code.ending)  ||
                (tree.task_map[key].state==job_code.exiting))  {
              tree.run_map [dataId] = key;
              if (tree.task_map[key].autoRunId)  // workflow working
                tree.projectData.desc.autorun = true;
              tree.setNodeName ( key,false );
              tree.node_map[key].setCustomIconVisible ( true );
            } else  {
              tree.setNodeName ( key,false );
              tree.node_map[key].setCustomIconVisible ( false );
            }
          }
        }
      }

      tree.createTree ( allow_selection,function(){
        for (let key in tree.task_map)  {
          if (tree.task_map[key].isRemark())  {
            tree.setRemarkStyle ( tree.node_map[key],tree.task_map[key] );
          } else if (!tree.task_map[key].job_dialog_data.viewed)
            tree.setStyle ( tree.node_map[key],__notViewedStyle,0 );
        }
        if (!('R_free' in tree.projectData.desc.metrics) ||
            (tree.projectData.desc.metrics.R_free>=1.0))  {
          tree.calcMetrics();
          if (('R_free' in tree.projectData.desc.metrics) &&
              (tree.projectData.desc.metrics.R_free<1.0))
            tree.saveProjectData ( [],[],true, function(tree,rdata){} );
        }
        onLoaded_func();
      },onRightClick_func,onDblClick_func,onSelect_func );

      let rdata = {};
      rdata.pdesc = tree.projectData.desc;
      tree.emitSignal ( cofe_signals.rationUpdated,rdata );

    } else  {

      tree.projectData = null;  // signal 'timestamp mismatch'
      onLoaded_func();

    }

  },function(code,rdata){
    if ('access_denied' in rdata)  {
      tree.projectData = null;
      tree.no_access   = true;
      // tree.emitSignal ( cofe_signals.makeProjectList,{} );
      onLoaded_func();
      // window.setTimeout ( function(){
      //   tree.emitSignal ( cofe_signals.makeProjectList,{} );
      // },100);
    } else  
      tree.startTaskLoop();
  },'persist');

}


JobTree.prototype.makeNodeId = function ( task_id )  {
  return '[' + padDigits(task_id,4) + ']';
}


JobTree.prototype.makeNodeName = function ( task )  {

  if (!task)  return 'no task!';

  let node_name = task.autoRunId;
  if (('submitter' in task) && task.submitter)  {
    let author = this.projectData.desc.owner.login;
    if ('author' in this.projectData.desc.owner)
      author = this.projectData.desc.owner.author;

    // put job submitter in the node name if:
    //   submitter is not author
    //   author is not 'tutorials'

    if (author && (author!='tutorials') && 
        (task.submitter!=author))  {  // empty author makes anonymisation
      if (node_name)
        node_name += ':';
      node_name += task.submitter;
    }
  }
  if (node_name)
    node_name = '<b>' + node_name + ':</b>';
  node_name += this.makeNodeId(task.id) + ' ';

  if (task.harvestedTaskIds.length>0)  {
    let ancestors = this.getAllAncestors ( task );
    let anc_ids = [];
    for (let i=0;i<ancestors.length;i++)
      anc_ids.push ( ancestors[i].id );
    let id_list = [];
    for (let i=0;i<task.harvestedTaskIds.length;i++)
      if (anc_ids.indexOf(task.harvestedTaskIds[i])<0)
        id_list.push ( padDigits(task.harvestedTaskIds[i],4) );
    if (id_list.length>0) // below, 'cross-branch' is significant
      node_name += ' <font style="font-size:80%" cross-branch="1"><b><i>+(' +
                   id_list.join(',') + ')</i></b></font> ';
  }

  if (task.uname.length>0)
        node_name += task.uname;
  else  node_name += task.name;

  let resind = task.result_indicator();

  if (resind && (resind!='*none*'))
    node_name += ' <b><i>-- <font style="font-size:80%">' + resind +
                 '</font></i></b>';
  return node_name;

}


JobTree.prototype.setNodeName = function ( nodeId,save_bool )  {
  if (nodeId in this.task_map)  {
    let task = this.task_map[nodeId];
    let node = this.node_map[nodeId];
    let newName = this.makeNodeName ( task );
    if (newName!=node.text)  {  // to enforce managing custom icon visibility
      this.setText ( node,newName );
      this.confirmCustomIconsVisibility();
      if (task.isRemark())  {
        this.setRemarkStyle ( node,task );
        // if (task.isLink())
        //       this.setStyle ( node,__linkStyle,0 );
        // else  this.setStyle ( node,__remarkStyle,0 );
      }
      if (save_bool)
        this.saveProjectData ( [],[],true, function(tree,rdata){} );
    }
  }
}


JobTree.prototype.setNodeIcon = function ( nodeId,save_bool )  {
  let task = this.task_map[nodeId];
  let node = this.node_map[nodeId];
  this.setIcon ( node,image_path(task.icon()) );
  if (save_bool)
    this.saveProjectData ( [],[],true, function(tree,rdata){} );
}


JobTree.prototype.resetNodeName = function ( nodeId )  {
  if (nodeId in this.task_map)  {
    let task = this.task_map[nodeId];
    if (task)  {
      let node = this.node_map[nodeId];
      this.setText ( node,this.makeNodeName(task) );
      if (task.isRemark())  {
        this.setRemarkStyle ( node,task );
        // if (task.isLink())
        //       this.setStyle ( node,__linkStyle,0 );
        // else  this.setStyle ( node,__remarkStyle,0 );
      }
    }
    this.confirmCustomIconsVisibility();
  }
}

/*
JobTree.prototype.__checkTaskLoop = function()  {
// checks on running tasks

  (function(tree){

    tree.checkTimeout = window.setTimeout ( function(){

      let request_data = {};
      request_data.project   = tree.projectData.desc.name;
      request_data.shared    = tree.isShared();
      request_data.timestamp = tree.projectData.desc.timestamp;
      request_data.run_map   = tree.run_map;

      serverRequest ( fe_reqtype.checkJobs,request_data,'Check jobs state',
        function(data){

          if ((!tree.checkTimeout) || (tree.checkTimeout==-1))
            return;

          if (data.reload)  {

            // console.log ( 'reload at check');

            tree.emitSignal ( cofe_signals.reloadTree,data );

          } else  {

            // console.log ( 'process check');

            let completedJobs  = data.completed_map;
            let completed_list = [];

            for (let key in completedJobs)  {

              let json   = JSON.stringify ( completedJobs[key] );
              let task   = getObjectInstance ( json );

              let nodeId = null;
              if (task.id in tree.run_map)  {

                nodeId = tree.run_map[task.id];  // task.id == key

                if (nodeId in tree.task_map)  {
                  task.treeItemId       = nodeId;
                  tree.task_map[nodeId] = task;
                  tree.setNodeName ( nodeId,false );
                  if (task.isRemark())  {
                    tree.setRemarkStyle ( tree.node_map[nodeId],task );
                    // if (task.isLink())
                    //       tree.setStyle ( tree.node_map[nodeId],__linkStyle,0 );
                    // else  tree.setStyle ( tree.node_map[nodeId],__remarkStyle,0 );
                  } else
                    tree.setStyle ( tree.node_map[nodeId],__notViewedStyle,0 );
                  tree.node_map[nodeId].setCustomIconVisible ( false );
                  tree.setNodeIcon    ( nodeId,false );
                  completed_list.push ( task );
                  update_project_metrics ( task,tree.projectData.desc.metrics );
                }

                if (key in tree.dlg_map)  {
                  tree.dlg_map[key].task = task;
                  tree.dlg_map[key].setDlgState();
                  if (task.state==job_code.failed)
                    tree.dlg_map[key].reloadReport();
                    // tree.dlg_map[key].outputPanel.reload();
                  else if (task.nc_type=='client')
                    tree.dlg_map[key].loadReport();
                }

                tree.startChainTask ( task,nodeId );

              }
                // else {
                //   alert ( 'error [89761] -- inform developer' );
                // }

            }

            tree.run_map = mapMaskOut ( tree.run_map,completedJobs );

            if (completed_list.length>0)  {
              tree.emitSignal ( cofe_signals.treeUpdated,{} );
              tree.updateRation ( data );
              tree.saveProjectData ( [],[],false, function(tree,rdata){});
            }

          }

        },function(){  // always check on job and resume the task loop as necessary

          // if (tree.projectData.desc.autorun)  {
          //   tree.projectData.desc.autorun = false;
          //   for (let tid in tree.run_map)
          //     if (tree.run_map[tid].autoRunId.length>0)  {
          //       tree.projectData.desc.autorun = true;
          //       break;
          //     }
          //   if (!tree.projectData.desc.autorun)
          //     tree.saveProjectData ( [],[],true, function(tree,rdata){} );
          // }

          if (tree.checkTimeout!=-1)  { // task loop was not blocked, and
            if (tree.checkTimeout &&  // task loop was not terminated, and
                ((Object.keys(tree.run_map).length>0) ||  // there are jobs to check on
                 (tree.isShared())  // or project is shared
                )
              )  {
              tree.__checkTaskLoop();
            } else  {
              tree.checkTimeout = null;   // otherwise, terminate and mark terminated
            }
          }

        },
        function(){}  // depress ajax failure messages in this particular case!
      );

    },__check_job_interval );

  }(this));

}
*/


JobTree.prototype.__checkTaskLoop = function()  {
// checks on running tasks
  
  let tree = this;
  let request_data = {};
  request_data.project   = tree.projectData.desc.name;
  request_data.shared    = tree.isShared();
  request_data.timestamp = tree.projectData.desc.timestamp;
  request_data.run_map   = tree.run_map;

  serverRequest ( fe_reqtype.checkJobs,request_data,'Check jobs state',
    function(data){

      if ((!tree.checkTimeout) || (tree.checkTimeout==-1))
        return;

      if (data.reload)  {

        // console.log ( 'reload at check');

        tree.emitSignal ( cofe_signals.reloadTree,data );

      } else  {

        // console.log ( 'process check');

        let completedJobs  = data.completed_map;
        let completed_list = [];

        for (let key in completedJobs)  {

          let json   = JSON.stringify ( completedJobs[key] );
          let task   = getObjectInstance ( json );

          let nodeId = null;
          if (task.id in tree.run_map)  {

            nodeId = tree.run_map[task.id];  // task.id == key

            if (nodeId in tree.task_map)  {
              task.treeItemId       = nodeId;
              tree.task_map[nodeId] = task;
              tree.setNodeName ( nodeId,false );
              if (task.isRemark())  {
                tree.setRemarkStyle ( tree.node_map[nodeId],task );
                // if (task.isLink())
                //       tree.setStyle ( tree.node_map[nodeId],__linkStyle,0 );
                // else  tree.setStyle ( tree.node_map[nodeId],__remarkStyle,0 );
              } else
                tree.setStyle ( tree.node_map[nodeId],__notViewedStyle,0 );
              tree.node_map[nodeId].setCustomIconVisible ( false );
              tree.setNodeIcon    ( nodeId,false );
              completed_list.push ( task );
              update_project_metrics ( task,tree.projectData.desc.metrics );
            }

            if (key in tree.dlg_map)  {
              tree.dlg_map[key].task = task;
              tree.dlg_map[key].setDlgState();
              if (task.state==job_code.failed)
                tree.dlg_map[key].reloadReport();
                // tree.dlg_map[key].outputPanel.reload();
              else if (task.nc_type=='client')
                tree.dlg_map[key].loadReport();
            }

            tree.startChainTask ( task,nodeId );

          }

        }

        tree.run_map = mapMaskOut ( tree.run_map,completedJobs );

        if (completed_list.length>0)  {
          tree.emitSignal ( cofe_signals.treeUpdated,{} );
          tree.updateRation ( data );
          tree.saveProjectData ( [],[],false, function(tree,rdata){});
        }

      }

    },function(){  // always check on job and resume the task loop as necessary

      if (tree.checkTimeout!=-1)  { // task loop was not blocked, and
        if (tree.checkTimeout &&  // task loop was not terminated, and
            ((Object.keys(tree.run_map).length>0) ||  // there are jobs to check on
              (tree.isShared())  // or project is shared
            )
          )  {
          tree.checkTimeout = window.setTimeout ( function(){
            tree.__checkTaskLoop();
          },__check_job_interval );
        } else  {
          tree.checkTimeout = null;   // otherwise, terminate and mark terminated
        }
      }

    },
    function(){}  // depress ajax failure messages in this particular case!
  );

}


JobTree.prototype.startTaskLoop = function()  {
// starts timeout loop for checking on running jobs

  if ((!this.checkTimeout) &&   // otherwise the loop is running already or forbidden
      this.projectData     &&   // works in case of shared projects
      ((Object.keys(this.run_map).length>0) ||  // there are jobs to check on
       (this.isShared())        // or project is shared
      )
    )  {
    this.checkTimeout = 1;
    this.__checkTaskLoop();
  }

}

JobTree.prototype.stopTaskLoop = function()  {
// stops timeout loop for checking on running jobs

  if (this.checkTimeout && (this.checkTimeout!=-1) && (this.checkTimeout!=1))  {
    window.clearTimeout ( this.checkTimeout );
    this.checkTimeout = null;  // mark as not running
  }

}


JobTree.prototype.getSelectedTask = function()  {
  if (this.selected_node_id in this.task_map)  {
    return this.task_map[this.selected_node_id];
  } else  {
    return null;
  }
}


JobTree.prototype.getSelectedTasks = function()  {
// returns tasks in reversed order
let sel_lst   = this.calcSelectedNodeIds()
let sel_tasks = [];
  // if ((sel_lst.length<=0) && (this.selected_node_id in this.node_map))
  //   sel_lst = [this.selected_node_id];
  for (let i=0;i<sel_lst.length;i++)
    if (sel_lst[i] in this.task_map)
      sel_tasks.push ( this.task_map[sel_lst[i]] );
    else if ((sel_lst[i] in this.node_map) && (!this.node_map[sel_lst[i]].parentId))
      sel_tasks.push ( {id:-1} );  // root selected
  if (sel_tasks.length<=0)  {
    let task = this.getSelectedTask();
    if (task)
      sel_tasks.push ( task );
  }
  // for (let i=0;i<sel_tasks.length;i++)
  //   console.log ( ' >>>> selected taskId['+i+']=' + sel_tasks[i].id );
  return sel_tasks;
}


JobTree.prototype.selectTask = function ( task )  {
let nodeId = this.getTaskNodeId ( task.id );
  if (nodeId)
    this.selectSingleById ( nodeId );
}

JobTree.prototype.selectTasks = function ( task_lst )  {

  let nselected = 0;

  if (task_lst.length>0)  {
    for (let i=task_lst.length-1;i>=0;i--)  {
      if (task_lst[i].id>=0)  {
        let nodeId = this.getTaskNodeId ( task_lst[i].id );
        if (nodeId && this.selectNodeById(nodeId,(nselected<=0)))
          nselected++;
      } else if (this.selectNodeById(this.root_nodes[0].id,(nselected<=0)))
        nselected++;
    }
  }

  if (nselected>0)
    nselected = $(this.root.element).jstree('get_selected').length;

  if (nselected<=0)  {
    for (let nodeId in this.node_map)
      if (this.node_map[nodeId].state.selected)  {
        if (this.selectNodeById(nodeId,(nselected<=0)))  {
          nselected++;
        }
      }
    nselected = $(this.root.element).jstree('get_selected').length;
    if ((nselected<=0) && this.selectNodeById(this.root_nodes[0].id,true))
      nselected++;
  }

  return nselected;

}


JobTree.prototype.updateRation = function ( data )  {
  if ('pdesc' in data)  {
    this.projectData.desc.disk_space = data.pdesc.disk_space;
    this.projectData.desc.cpu_time   = data.pdesc.cpu_time;
    this.projectData.desc.njobs      = data.pdesc.njobs;
    this.emitSignal ( cofe_signals.rationUpdated,data );
  }
}

JobTree.prototype.checkReload = function ( rdata,details )  {
  if (rdata.reload>1)  {
    let msg =
      '<div style="width:400px;"><h2>Project Update Required</h2>' +
      'Requested operation cannot be performed because the Project was ' +
      'just updated ';
    let is_shared = (Object.keys(this.projectData.desc.share).length>0);
    if (is_shared && (this.projectData.desc.autorun))
      msg += 'by either a user, with whom this Project is shared, or automatic ' +
             'workflow running, or both.';
    else if (is_shared)
      msg += 'by user, with whom this Project is shared.';
    else
      msg += 'by automatic workflow running.';
    let self = this;
    new MessageBoxF ( 'Project update required',
        msg + '<p>Click "Update" button and try to ' + details + ' again.</div>',
        'Update',function(){
          rdata.force_reload = true;
          self.emitSignal ( cofe_signals.reloadTree,rdata );
        },true );
    return false;  // do not proceed
  }
  return true;  // proceed
}

JobTree.prototype.missingProject = function ( code )  {
let msg = '<div style="width:400px"><h2>Project not found on server</h2>' +
          'Project "' + this.projectData.desc.name + 
          '" was not found on server. ';
  if (code==-11111)
    msg += 'If this project was shared with you, please check whether it ' +
           'was deleted by project owner.</div>';
  else if (code==-11112)
    msg += 'It is likely that this project was shared with you by somebody, ' +
           'who has their ' + appName() + ' account deleted.</div>';
  new MessageBoxF ( 'Project not found',msg,'Ok',function(){ 
    this.emitSignal ( cofe_signals.makeProjectList,{} );  
  },false,'msg_error' );
}

// JobTree.prototype.advanceJobCounter = function ( onDone_func )  {
//   if (this.projectData)  {
//     let data  = {};
//     data.meta = this.projectData.desc;
//     (function(tree){
//       serverRequest ( fe_reqtype.advanceJobCounter,data,'Project',
//         function(rdata){
//           if (rdata.project_missing)  {
//             tree.missingProject();
//           } else if (tree.checkReload(tree,rdata,'add the job'))  {
//             tree.projectData.desc.timestamp = rdata.pdesc.timestamp;
//             tree.projectData.desc.jobCount  = rdata.pdesc.jobCount;
//             if (onDone_func)
//               onDone_func(tree,rdata);
//           }
//         },null,'persist' );
//     }(this))
//   }
// }


JobTree.prototype.saveProjectData = function ( tasks_add,tasks_del,update_bool,
                                               callback_func )  {
  if (this.view_only)  {
    if (callback_func)
      callback_func ( this,{ reload : 0 } );
  } else if (this.projectData)  {
    this.projectData.desc.dateLastUsed = getDateString();
    this.projectData.tree = this.root_nodes;
    let data       = {};
    data.meta      = this.projectData;
    data.tasks_add = tasks_add;   // array
    data.tasks_del = tasks_del;   // array
    data.update    = update_bool; // forces update of shared projects
// printProjectTree ( ' >>>saveProjectData',this.projectData );
    (function(tree){
      serverRequest ( fe_reqtype.saveProjectData,data,'Project',
        function(rdata){
          if ((rdata.reload==-11111) || (rdata.reload==-11112))  {
            tree.missingProject ( rdata.reload );
          } else if (rdata.reload>0)  {
            if (callback_func)
                  callback_func ( tree,rdata );
            else  tree.emitSignal ( cofe_signals.reloadTree,rdata );
          } else  {
            tree.updateRation ( rdata );
            tree.projectData.desc.timestamp = rdata.pdesc.timestamp;
            if (callback_func)
              callback_func ( tree,rdata );
          }
        },null,'persist' );
    }(this))
  }
}


JobTree.prototype.hasRunningJobs = function ( nodeId )  {

  if (!nodeId)
    return (Object.keys(this.run_map).length>0);

  function hrj ( tree,node_id )  {
    let areRunningJobs = false;
    if (node_id in tree.task_map)  {
      areRunningJobs = (tree.task_map[node_id].state == job_code.running);
      let children = tree.node_map[node_id].children;
      for (let i=0;(i<children.length) && (!areRunningJobs);i++)
        areRunningJobs = hrj ( tree,children[i].id);
    }
    return areRunningJobs;
  }

  return hrj ( this,nodeId );

}

JobTree.prototype.selectStackJobs = function()  {
// return:
//   [0,[],[]]       - no jobs can be stacked or unstacked
//   [1,[...],[...]] - only jobs with given node ids in two alternative lists
//                     (archive up or down) can be stacked; any of the lists
//                     can be empty
//   [2,[.][]]       - selected job is archive (node id returned in 1st list),
//                     which can be unstacked
let sel_lst = this.calcSelectedNodeIds();
  if (sel_lst.length>1)  {  // multiple selection
    let ok = true;
    for (let i=0;(i<sel_lst.length) && ok;i++)
      ok = (this.node_map[sel_lst[i]].text.indexOf('cross-branch="1"')<0);
    if (ok)  {
      sel_lst = this.canMakeFolder1 ( sel_lst );
      if (sel_lst.length>1)
      return [1,sel_lst,[]];
    }
  } else if ((sel_lst.length>0) && (sel_lst[0] in this.node_map))  {
    if (this.node_map[sel_lst[0]].fchildren.length>0)  { // selected archive
      return [2,sel_lst,[]];
    } else  {  // check if archive may be made up or/and down the branch
      let lst1   = [];
      let lst2   = [];
      let nodeId = sel_lst[0];
      let node = this.node_map[nodeId];
      if (('children' in node) && (node.children.length==1) && this.isRemark(node.children[0].id))
        nodeId = node.parentId;
      while (nodeId)  {
        node = this.node_map[nodeId];
        if (node.parentId && (node.fchildren.length==0) && ('children' in node ) &&
                             (node.children.length==1)  &&
                             (node.text.indexOf('cross-branch="1"')<0))  {
          lst1.push ( nodeId );
          nodeId = node.parentId;
        } else  {
          if ((lst1.length>0) && (!node.parentId))
            lst1.pop();
          nodeId = null;
        }
      }
      nodeId = sel_lst[0];
      while (nodeId)  {
        node = this.node_map[nodeId];
        if (node.parentId && (node.fchildren.length==0) && ('children' in node ) &&
                             (node.children.length==1) &&
                             (node.text.indexOf('cross-branch="1"')<0))  {
          lst2.push ( nodeId );
          nodeId = node.children[0].id;
        } else  {
          if ((lst2.length>0) && this.isRemark(nodeId))
            lst2.pop();
          nodeId = null;
        }
      }
      if (lst1.length<2)  lst1 = [];
      if (lst2.length<2)  lst2 = [];
      if ((lst1.length>1) || (lst2.length>1))
        return [1,lst1,lst2];
    }
  }
  return [0,[],[]];
}


JobTree.prototype._add_job = function ( insert_bool,task,dataBox,
                                        parent_page,onAdd_func )  {
  if (this.selected_node_id)  {

    // identify parent task for making parentId below; note that selection changes
    // after adding new node to the tree, therefore, parent should be identified
    // now
    let ptask = this.getSelectedTask();
    let node;

    if (ptask && ('archive_version' in ptask) && (ptask.archive_version>0))  {
      node = this.addNodeToSelected ( 
        __projectStyle('revision #'+this.projectData.desc.archive.version),
        image_path('project'),this.customIcon() 
      );
      this.selectNode ( node,true );
    }

    // prepare task metadata
    task.project          = this.projectData.desc.name;
    task.id               = this.projectData.desc.jobCount + 1;
    task.harvestedTaskIds = dataBox.harvestedTaskIds;
    task.submitter        = __login_id;

    // make tree node
    // do not give node name at this stage, because, in case of data merging
    // across branches, calculation of node name includes tree searches,
    // which are not possible before node is placed in the tree
    if (insert_bool)
          node = this.insertNodeAfterSelected ( '',
                              image_path(task.icon()),this.customIcon() );
    else  node = this.addNodeToSelected ( '',
                              image_path(task.icon()),this.customIcon() );

    this.task_map[node.id] = task;
    task.treeItemId        = node.id;
    node.dataId            = task.id;
    // now set the new node name
    this.setText ( node,this.makeNodeName(task) );

    if (task.isRemark())
      this.setRemarkStyle ( node,task );

    if (ptask)  {
      task.parentId = ptask.id;
      let ix = task.harvestedTaskIds.indexOf(task.parentId); 
      if (ix>=0)  // remove parent from harvested
        task.harvestedTaskIds.splice(ix,1);
    }

    this.saveProjectData ( [task],[],true, function(tree,rdata){
      if (tree.checkReload(rdata,'add the job'))  {
        task.id     = rdata.jobIds[0];
        node.dataId = task.id;
        tree.projectData.desc.jobCount = task.id;
        if (onAdd_func)  {
          onAdd_func ( Math.min(node.children.length,1),null,null );
          // if (insert_bool)  onAdd_func ( 1 );
          //             else  onAdd_func ( 0 );
        }
        tree.openJob ( dataBox,parent_page );
        // if (insert_bool)
        //   window.setTimeout ( function(){
        //     tree.emitSignal ( cofe_signals.reloadTree,rdata );
        //   },1000 );
        // if (insert_bool)
        //   window.setTimeout ( function(){
        //     for (let key in tree.node_map)  {
        //       let tnode = tree.node_map[key];
        //       if (tnode)
        //         tree.resetNodeName ( tnode.id );
        //     }
        //   },100 );
      }
    });

  } else  {
    console.log ( 'no selection in the tree:_add_job' );
    if (onAdd_func)
      onAdd_func ( -1,null,null );
    // alert ( ' no selection in the tree! ' );
  }
}

JobTree.prototype._copy_task_parameters = function ( task,branch_task_list )  {
let reftask = null;  // reference task
let refkeys = null;  // reference keywords
  for (let i=0;(i<branch_task_list.length) && (!reftask) && (!refkeys);i++)  {
    if (task._type==branch_task_list[i]._type)
      reftask = branch_task_list[i];
    else if ('data' in branch_task_list[i].output_data)  {
      let data = branch_task_list[i].output_data.data;
      for (let item_key in data)  {
        let item_list = data[item_key];
        if (Array.isArray(item_list))  {
          for (let j=0;j<item_list.length;j++)  {
            let item = item_list[j];
            if (('refkeys' in item) && (task._type in item.refkeys))
              refkeys = item.refkeys[task._type];
          }
        }
      }
    }
  }
  if (reftask)  {
    if (reftask.version<task.currentVersion())
      return -1;  // version clash, stop
    task.parameters = jQuery.extend ( true,{},reftask.parameters );
    return 1;  // reference task found and parameters copied, Ok
  } else if (refkeys)
    return task.set_refkeys_parameters ( refkeys );
  return 0;  // reference task or keys not found, Ok
}


JobTree.prototype._copy_task_cloud_path = function ( task,branch_task_list )  {
  if ('currentCloudPath' in task)  {
    let reftask = null;
    for (let i=0;(i<branch_task_list.length) && (!reftask);i++)
      if ('currentCloudPath' in branch_task_list[i])
        reftask = branch_task_list[i];
    if (reftask)
      task.currentCloudPath = reftask.currentCloudPath;
  }
}


JobTree.prototype.addJob = function ( insert_bool,copy_params,parent_page,onAdd_func )  {
  if (this.projectData)  {
    (function(tree){
      let dataBox = tree.harvestTaskData ( 1,[] );
      let branch_task_list = tree.getAllAncestors ( tree.getSelectedTask() );
      new TaskListDialog ( dataBox,branch_task_list,tree,
          function(task,tasklistmode){
            if (tasklistmode)
              tree.projectData.desc.tasklistmode = tasklistmode;
            if (task)  {  // task chosen
              if (copy_params)  {
                if (tree._copy_task_parameters(task,branch_task_list)<0)  {
                  new MessageBox ( 'Cannot copy job parameters',
                    '<div style="width:500px;"</div>' +
                    '<h2>Cannot copy parameters from previous job.</h2>' +
                    'The previous job was created with a lower version of ' +
                    appName() + ' and its parameters cannot be copied into ' +
                    'the new one.<p>Please add the job with default parameters, ' +
                    'using "<i>Add Job</i>" button from the control bar, and set ' +
                    'parameters manually.</div>',
                    'msg_stop' );
                  if (onAdd_func)
                    onAdd_func ( -5,null,null );
                  return;
                }
              }
              tree._copy_task_cloud_path ( task,branch_task_list );
              tree._add_job ( insert_bool,task,dataBox, parent_page,onAdd_func );
            } else if (onAdd_func)  { // "Cancel" was pressed
              onAdd_func ( -2,null,null );
            }
          });
    }(this));
  } else if (onAdd_func)
    onAdd_func ( -3,null,null );
}


JobTree.prototype.addTask = function ( task,insert_bool,copy_params,parent_page,onAdd_func )  {
let dataBox = this.harvestTaskData ( 1,[] );

  // if (dataBox.isEmpty())
  //   task.inputMode = input_mode.root;

  let avail_key   = task.isTaskAvailable();
  let dataSummary = dataBox.getDataSummary ( task );

  if (task.state==job_code.retired)
    dataSummary.status = -2;
  else if (avail_key[0]!='ok')
    dataSummary.status = -1;


  if (dataSummary.status>0)  {
    let branch_task_list = this.getAllAncestors ( this.getSelectedTask() );
    if (copy_params)
      this._copy_task_parameters ( task,branch_task_list );
    this._copy_task_cloud_path ( task,branch_task_list );
    this._add_job ( insert_bool,task,dataBox,parent_page, function(key,ak,dsum){
      onAdd_func(key,avail_key,dataSummary);
    });
  } else if (onAdd_func)
    onAdd_func ( -4,avail_key,dataSummary );

  return [avail_key,dataSummary];

}


JobTree.prototype.startChainTask = function ( task,nodeId )  {

  if (!task.hasOwnProperty('task_chain'))
    return;

  if (task.task_chain.length<=0)  {
    delete task.task_chain;
    return;
  }

  if ((task.state!=job_code.finished) && (task.task_chain[0]!='delete_job'))
    return;

  let nid = nodeId;
  if (!nid)  {
    nid = this.getTaskNodeId ( task.id );
    if (!nid)
      return;
  }

  this.selectSingleById ( nid );

  if (task.task_chain[0]=='delete_job')  {

    (function(tree){
      tree.deleteJob ( true,function(was_deleted_bool){
        if (was_deleted_bool)
          tree.emitSignal ( cofe_signals.treeUpdated,{} );
      });
    }(this))

  } else  {

    let newtask = eval ( 'new ' + task.task_chain[0] + '()' );
    if (task.task_chain.length>1)  {
      newtask.task_chain = [];
      for (let i=1;i<task.task_chain.length;i++)
        newtask.task_chain.push ( task.task_chain[i] );
    }
    newtask.onJobDialogStart = function ( job_dialog )  {
      function __check_and_start()  {
        if (newtask.interface_ready())
              job_dialog.run_btn.click();  // start automatically
        else  window.setTimeout ( __check_and_start,100 );
      }
      __check_and_start();
      // job_dialog.run_btn.click();  // start automatically
    };

    (function(tree){
      tree.addTask ( newtask,false,true,__current_page,function(){
        if (task.id in tree.dlg_map)
          tree.dlg_map[task.id].close();
      });
    }(this))

  }

}


JobTree.prototype.clearHighlights = function()  {
  for (let nid in this.node_map)  {
    let node = this.node_map[nid];
    if (node.highlightId)  {
      if ((nid in this.task_map) && (!this.task_map[nid].job_dialog_data.viewed))
            this.setStyle ( node,__notViewedStyle,0 );
      else  this.setStyle ( node,'',0 );
      node.highlightId = 0;
    }
  }
}


Tree.prototype.getLastNode = function ( node )  {
// Returns last node in the branch with maximum task Id descending from given node
  let node0   = node;
  let taskNo0 = -1;
  if (node.id in this.task_map)
    taskNo0 = this.task_map[node.id].id;
  let taskNo = -1;
  for (let i=0;i<node.children.length;i++)  {
    let ln = this.getLastNode ( node.children[i] );
    if ((ln[0].id in this.task_map) && (ln[1]>=taskNo))  {
      taskNo = ln[1];
      node0  = ln[0];
    }
  }
  return [node0,Math.max(taskNo,taskNo0)];
}


Tree.prototype.getLastHighlightedNode = function()  {
// Returns last highleghted (green) node in the tree, or null
let node = null;
  for (let nid in this.node_map)
    if (this.node_map[nid].highlightId==2)  {
      node = this.node_map[nid];
      break;
    }
  return node;
}


JobTree.prototype._highlight_to_root = function ( node,final_bool )  {
  if (final_bool)  {
    this.setStyle ( node,__highlightStyleL,0 );
    node.highlightId = 2;
  } else  {
    this.setStyle ( node,__highlightStyle,0 );
    node.highlightId = 1;
  }
  let harvestedTaskIds = [];
  let task = this.task_map[node.id];
  if (task)
    for (let i=0;i<task.harvestedTaskIds.length;i++)
      harvestedTaskIds.push ( task.harvestedTaskIds[i] );
  while (node.parentId)  {
    node = this.node_map[node.parentId];
    this.setStyle ( node,__highlightStyle,0 );
    node.highlightId = 1;
    task = this.task_map[node.id];
    if (task)
      for (let i=0;i<task.harvestedTaskIds.length;i++)
        if (harvestedTaskIds.indexOf(task.harvestedTaskIds[i])<0)
          harvestedTaskIds.push ( task.harvestedTaskIds[i] );
  }
  for (let i=0;i<harvestedTaskIds.length;i++)  {
    let nid = this.getTaskNodeId ( harvestedTaskIds[i] );
    if (nid in this.node_map)
      this._highlight_to_root ( this.node_map[nid],false );
  }
}


JobTree.prototype.toggleBranchHighlight = function()  {
  // remove all highlights first
  let node = this.getSelectedNode();
  if (!node.highlightId)  {
    this.clearHighlights();
    this._highlight_to_root ( this.getLastNode(node)[0],true );
  } else
    this.clearHighlights();
}


JobTree.prototype.moveJobUp = function ( onMoveUp_func )  {
  if (this.selected_node_id)  {
    this.moveSelectedNodeUp();
    // (function(tree,node0){
      this.saveProjectData ( [],[],true, function(tree,rdata){
        if (tree.checkReload(rdata,'move the job up'))  {
          tree.projectData.desc.timestamp = rdata.pdesc.timestamp;
          tree.projectData.desc.jobCount  = rdata.pdesc.jobCount;
          let node0 = tree.getLastHighlightedNode();
          if (node0)  {
            window.setTimeout ( function(){
              tree._highlight_to_root ( node0,true );
              onMoveUp_func();
            },100);
          } else
            onMoveUp_func();
        } else
          onMoveUp_func();
      });
    // }(this,this.getLastHighlightedNode()))
  } else  {
    console.log ( 'no selection in the tree:moveJobUp' );
    onMoveUp_func();
    // alert ( ' no selection in the tree! ' );
  }
}


JobTree.prototype.calcMetrics = function() {
  this.projectData.desc.metrics = {};
  for (let key in this.task_map)
    update_project_metrics ( this.task_map[key],this.projectData.desc.metrics );
}


JobTree.prototype.deleteJob = function ( silent_bool,onDelete_func )  {

  if (this.selected_node_id)  {

//    this.forceSingleSelection();

    (function(tree){

      // calculate lead nodes of branches to delete
      let delNodeId = tree.calcSelectedNodeIds();
      if (delNodeId.length<=0)
        delNodeId.push ( tree.getSelectedNodeId() );
      let delTaskId = [];
      let ignBranch = [];
      for (let i=0;i<delNodeId.length;i++)  {
        let delTask = tree.task_map[delNodeId[i]];
        if (delTask)  {
          delTaskId.push ( delTask.id );
          if (delTask.isRemark())
            ignBranch.push ( delTask.id );
        }
      }

      // add all children and harvested links
      let len0 = 0;
      while (len0<delNodeId.length) {
        len0 = delNodeId.length;
        for (let nodeId in tree.task_map)  {  // go all over the whole tree
          let task = tree.task_map[nodeId];   // get task corrsponsing to tree node
          if (delTaskId.indexOf(task.id)<0)  {  // check that task is not in the delete list
            let add_node = false;   // should task be deleted?
            let node     = tree.node_map[nodeId];  // check if parent is in the delete list
            let ignore   = false;
            if (node.parentId && (delNodeId.indexOf(node.parentId)>=0))  {
              let ptask = tree.task_map[node.parentId];
              if (ptask)  {
                ignore    = (ignBranch.indexOf(ptask.id)>=0);
                add_node  = (!ptask.isRemark()) || (!ignore);
              }
            }
            if (!ignore)
              for (let i=0;(!add_node) && (i<task.harvestedTaskIds.length);i++)
                add_node = (delTaskId.indexOf(task.harvestedTaskIds[i])>=0);
            if (add_node)  {
              delNodeId.push ( nodeId  );
              delTaskId.push ( task.id );
            }
          }
        }
      }

      // sort node ids in descending order in order to avoid clashes in case
      // of nodes selected in same branch
      delNodeId.sort ( function(a,b){return b-a;} );

      // indicate deleted jobs in the tree and identify running jobs
      //let isRunning = false;
      let delBranch = [];
      let nDel      = 0;
      let nRem      = 0;
      let canDelete = true;
      for (let i=0;i<delNodeId.length;i++)  {
        let deletable = (tree.permissions!=share_permissions.view_only);
        let task = tree.task_map[delNodeId[i]];
        let propagate = 1;
        if (task)  {
          if (task.isRemark())  {
            propagate = 0;
            nRem++;
          }
          if (deletable && (tree.permissions!=share_permissions.full))
            deletable = ('submitter' in task) && task.submitter && 
                        (task.submitter==__login_id);
        }
        if (deletable)
          tree.setStyle ( tree.node_map[delNodeId[i]],__deleteStyle  ,0 );
        else  {
          tree.setStyle ( tree.node_map[delNodeId[i]],__noDeleteStyle,0 );
          canDelete = false;
        }
        nDel++;
        if (propagate)  {
          // if (tree.hasRunningJobs(delNodeId[i]))
          //   isRunning = true;
          nDel += tree.node_map[delNodeId[i]].children.length;
        }
        delBranch.push ( propagate );
      }

      if (!canDelete)  {
        new MessageBoxF ( 'Insufficient privileges',
          '<div style="width:380px;"><h2>Insufficient privileges</h2>' +
          'You cannot delete selected jobs because some of them were added ' +
          'by other members of project work team.<p><i>Your sharing ' +
          'privileges let you delete only your own jobs; this may be ' +
          'changed only by project owner.</i></div>',
          'Close',function(){
            for (let i=0;i<delNodeId.length;i++)
              if (tree.isRemark(delNodeId[i]))
                    tree.setRemarkStyle ( tree.node_map[delNodeId[i]],
                                          tree.task_map[delNodeId[i]] );
              else  tree.setStyle ( tree.node_map[delNodeId[i]],'',1 );
            if (onDelete_func)
              onDelete_func(false);
          },true,'msg_stop' );
        return;
      }

      let message = '';
      let title   = 'Delete Node';
      if (nDel==1)  {
        let jobId = 'Selected node';
        if (tree.selected_node_id in tree.task_map)  {
          jobId = tree.makeNodeId ( tree.task_map[tree.selected_node_id].id );
          if (tree.task_map[tree.selected_node_id].isRemark())  {
            message = 'Selected remark ';
            title   = 'Delete Remark';
          } else  {
            message = 'Selected job ';
            title   = 'Delete Job';
          }
        }
        message += jobId + ' will be deleted.<br>Are you sure?';
      } else  {
        if (nRem==nDel)   {
          message = 'Selected remarks';
          title   = 'Delete Remarks';
        } else if (nRem>0)  {
          message = 'Selected job(s) and remark(s)';
          title   = 'Delete Jobs and Remarks';
        } else  {
          message = 'Selected jobs';
          title   = 'Delete Jobs';
        }
        message += ', indicated in the job tree, will be deleted.<br>Are you sure?';
      }

      function yes_delete()  {

        for (let i=0;i<delNodeId.length;i++)
          if (delBranch[i]==1)
                tree.deleteBranch ( tree.node_map[delNodeId[i]] );
          else  tree.deleteNode   ( tree.node_map[delNodeId[i]] );

        // find deleted tasks and trim the task map
        let tasks_del = [];
        let task_map  = {};  // new task map
        let run_map   = {};

        for (let key in tree.task_map)  {  // key === nodeId
          if (key in tree.node_map)  {
            // node for the task was not deleted
            task_map[key] = tree.task_map[key];
          } else  {
            // node for the task was deleted, delete the task now
            let delId = tree.task_map[key].id;
            // store only ids and storage sizes here! -- for server request
            let dsize = 0;
            if ('disk_space' in tree.task_map[key])  // backward compatibility on 05.06.2018
              dsize = tree.task_map[key].disk_space;
            tasks_del.push ( [delId,dsize] );
            if (delId in tree.dlg_map)  {
              tree.dlg_map[delId].close();
              tree.dlg_map = mapExcludeKey ( tree.dlg_map,delId );
            }
          }
        }
        tree.task_map = task_map;

        for (let key in tree.run_map)
          if (tree.run_map[key] in tree.node_map)  // running task was deleted
            run_map[key] = tree.run_map[key];
        tree.run_map = run_map;

        tree.calcMetrics();

        tree.saveProjectData ( [],tasks_del,true, function(tree1,rdata){
          if (tree1.checkReload(rdata,'delete the job(s)<br>'))  {
            if (onDelete_func)
              onDelete_func(true);
          }
        });

      }

      if (silent_bool)
        yes_delete();
      else  {
        new QuestionBox ( title,message,[
          { name    : 'Yes',
            onclick : yes_delete
          },{
            name    : 'No',
            onclick : function(){
                        for (let i=0;i<delNodeId.length;i++)
                          if (tree.isRemark(delNodeId[i]))  {
                            tree.setRemarkStyle ( tree.node_map[delNodeId[i]],tree.task_map[delNodeId[i]] );
                            // tree.setStyle ( tree.node_map[delNodeId[i]],__remarkStyle,0 );
                          } else
                            tree.setStyle ( tree.node_map[delNodeId[i]],'',1 );
                        if (onDelete_func)
                          onDelete_func(false);
                      }
          }],'msg_confirm' );
      }

    }(this));

  } else {
    console.log ( 'no selection in the tree:deleteJob' );
    // alert ( ' no selection in the tree! ' );
  }

}

JobTree.prototype.getNofJobDialogs = function ( ignore_completed )  {
let c = 0;
  for (let p in this.dlg_map)
    if (this.dlg_map.hasOwnProperty(p))  {
      let job_state = this.dlg_map[p].task.state;
      if ((!ignore_completed) ||
          ((job_state==job_code.new) || 
           (this.dlg_map[p].task.nc_type.startsWith('browser') && (job_state==job_code.runnings))
          ))
        c++;
    }
  return c;
}

JobTree.prototype.closeAllJobDialogs = function()  {
  for (let delId in this.dlg_map)
    this.dlg_map[delId].delete();
    // this.dlg_map[delId].close();
  this.dlg_map = {};
}

JobTree.prototype.getJobDialogTaskParameters = function()  {
  let taskParameters = [];
  for (let delId in this.dlg_map)  {
    let dlg = this.dlg_map[delId];
    taskParameters.push ({
      'id'              : dlg.task.id,
      'job_dialog_data' : dlg.task.job_dialog_data
    });
  }
  return taskParameters;
}

JobTree.prototype.openJobs = function ( taskParameters,parent_page )  {
  if (taskParameters.length>0)  {
    let crSel = this.getSelectedNodeId();
    for (let i=0;i<taskParameters.length;i++)  {
      this.selectSingleById ( this.getTaskNodeId(taskParameters[i].id) );
      let task = this.task_map[this.getSelectedNodeId()];
      if (task && (task.id==taskParameters[i].id))  {
        task.job_dialog_data = taskParameters[i].job_dialog_data;
        this.openJob ( null,parent_page );
      }
    }
    this.selectSingleById ( crSel );
  }
}

JobTree.prototype.relinkJobDialogs = function ( dlg_map,parent_page )  {
  let crSel = this.getSelectedNodeId();
  for (let taskId in dlg_map)  {
    let nodeId = this.getTaskNodeId ( taskId );
    let dlg    = dlg_map[taskId];
    if (nodeId)  {  // task found
      if (this.task_map[nodeId].state!=dlg.task.state)  {
        // task state changed, reload the dialog
        this.selectSingleById ( nodeId );
        dlg.close();
        this.task_map[nodeId].job_dialog_data = dlg.task.job_dialog_data;
        this.openJob ( null,parent_page );
      } else  {
        // simply relink the dialog to 'this' tree
        dlg.tree              = this;
        dlg.nodeId            = nodeId;
        this.task_map[nodeId] = dlg.task;
        dlg.parent_page       = parent_page;
        this.dlg_map[taskId]  = dlg;
      }
    } else  {
      // task not found -- close the dialog
      dlg.close();
    }
  }
  this.selectSingleById ( crSel );
}


/*
JobTree.prototype.detachJobDialogs = function()  {
  let dlg_map  = this.dlg_map;
  this.dlg_map = {};
  return dlg_map;
}

JobTree.prototype.attachJobDialogs = function ( dlg_map,parent_page )  {
  if (dlg_map)  {
    this.dlg_map = dlg_map;
    for (let delId in this.dlg_map)  {
      let dlg  = this.dlg_map[delId];
      //let task = this.getTask ( dlg.task.id );
      let nodeId = getTaskNodeId ( dlg.task.id );
      if (nodeId)  {
        this.selectSingleById ( nodeId );
        this.openJob ( null,parent_page );
      }
      dlg.close();

    }
  }
}
*/

JobTree.prototype.stopJob = function ( nodeId,gracefully_bool,callback_func )  {

  this.forceSingleSelection();

  let jobId   = this.makeNodeId ( this.task_map[this.selected_node_id].id );

  let data    = {};
  let word    = '';
  let node_id = nodeId;
  if (nodeId)  {
    //data.meta = this.task_map[nodeId];
    word    = 'this';
  } else  {
    //data.meta = this.task_map[this.selected_node_id];
    node_id = this.selected_node_id;
    word    = 'selected';
  }
  data.meta       = this.task_map[node_id];
  data.job_token  = data.meta.job_dialog_data.job_token;
  data.gracefully = gracefully_bool;

  let msg = [];
  if (gracefully_bool)
    msg = [ 'End Job',
            'End ' + word + ' job ' + jobId +
            '? Ending job may take a while,<br>but already obtained results ' +
            '(if any) will be made<br>available for subsequent jobs.<p>' +
            'Once a job is ended, it cannot be resumed.',
            'End',
            'Job ' + jobId + ' is being ended' ];
  else
    msg = [ 'Stop Job',
            'Stop ' + word + ' job ' + jobId +
            '? Once a job is stopped, it cannot be resumed,<br>' +
            'and no output data (even already obtained) can be<br>' +
            'passed on subsequent jobs.',
            'Stop',
            'Job ' + jobId + ' is being stopped' ];

  if ((data.meta.state==job_code.running) ||
      ((data.meta.state==job_code.ending) && (!gracefully_bool)))  {

    // new QuestionBox ( msg[0],msg[1],msg[2],function(){
    //
    //   // Raise the exiting state here, which will prevent requesting FE with
    //   // task update if the job dialog is currently opened and gets closed
    //   // before job actually terminates (see the close_btn listener in JobDialog).
    //   // This is necessary to enoforce, or this request may overwrite data
    //   // FE receives back from NC upon job termination.
    //
    //   if (gracefully_bool)  data.meta.state = job_code.ending;
    //                   else  data.meta.state = job_code.exiting;
    //
    //   if (data.meta.nc_type=='client')
    //        localCommand  ( nc_command.stopJob,data,data.meta.title,null );
    //   else serverRequest ( fe_reqtype.stopJob,data,data.meta.title,null,null,null );
    //
    //   setTimeout ( function(){
    //     new MessageBox ( msg[3],msg[3] + ', please wait a while.' );
    //   },100 );
    //
    //   if (callback_func)
    //     callback_func ( 1 );
    //
    // },'Cancel',null,'msg_confirm' );

    new QuestionBox ( msg[0],msg[1],[
      { name    : msg[2],
        onclick : function(){

                    // Raise the exiting state here, which will prevent requesting FE with
                    // task update if the job dialog is currently opened and gets closed
                    // before job actually terminates (see the close_btn listener in JobDialog).
                    // This is necessary to enoforce, or this request may overwrite data
                    // FE receives back from NC upon job termination.

                    if (gracefully_bool)  data.meta.state = job_code.ending;
                                    else  data.meta.state = job_code.exiting;

                    if (data.meta.nc_type=='client')
                         localCommand  ( nc_command.stopJob,data,data.meta.title,null );
                    else serverRequest ( fe_reqtype.stopJob,data,data.meta.title,null,null,null );

                    setTimeout ( function(){
                      new MessageBox ( msg[3],msg[3] + ', please wait a while.',
                                       'msg_information' );
                    },100 );

                    if (callback_func)
                      callback_func ( 1 );

                  }
      },{
        name    : 'Cancel',
        onclick : null
      }],'msg_confirm' );

    if (callback_func)
      callback_func ( 0 );

  } else  {

    if (data.meta.state==job_code.exiting)
      new MessageBox ( msg[0],'The job ' + jobId +
                              ' is in exit state -- please wait.',
                              'msg_information' );
    else if (data.meta.state==job_code.ending)
      new MessageBox ( msg[0],'The job ' + jobId +
                              ' is ending -- please wait.',
                              'msg_information' );
    else
      new MessageBox ( msg[0],'The job ' + jobId +
                              ' is not running -- nothing to do.',
                              'msg_information' );

    if (node_id in this.node_map)
      this.node_map[node_id].setCustomIconVisible ( false );

    if (data.meta.nc_type=='client')
         localCommand  ( nc_command.stopJob,data,data.meta.title,null );
    else serverRequest ( fe_reqtype.stopJob,data,data.meta.title,null,null,null );

    if (callback_func)
      callback_func ( 2 );

  }

}


// JobTree.prototype.webappFinished = function ( nodeId )  {
//   this.forceSingleSelection();
//   let data    = {};
//   let node_id = nodeId;
//   if (!nodeId)
//     node_id = this.selected_node_id;
//   data.meta      = this.task_map[node_id];
//   data.job_token = data.meta.job_dialog_data.job_token;
//   serverRequest ( fe_reqtype.webappFinished,data,data.meta.title,null,null,null );
// }


JobTree.prototype.openJob = function ( dataBox,parent_page )  {

  if (this.selected_node_id)  {

    this.forceSingleSelection();

    if (this.selected_node_id in this.task_map)  {

      let nodeId = this.selected_node_id;
      let task   = this.task_map[nodeId];

      if (task.id in this.dlg_map)  {

        $(this.dlg_map[task.id].element).dialog('open');

      } else  {

        let dBox = dataBox;
        if (!dBox)  {
          if (task.isComplete())  {
            // For completed task, compose dataBox from task's own fields,
            // because tasks may be moved up the tree, in which case
            // the composition of dataBox may also change.
            // This also removes the [do not use] items.
            dBox = this.getTaskDataBox ( task );
          } else
            dBox = this.harvestTaskData ( 2,task.harvestedTaskIds );
        }

        let params       = {};
        params.tree      = this;
        params.nodeId    = nodeId;
        params.dataBox   = dBox;
        params.ancestors = this.getAllAncestors ( task );

        // save dialog reference in the hash of opened job dialogs
        this.dlg_map[task.id] = new JobDialog ( params,parent_page,

          function(dlg){
            // trigerred when job is launched

            dlg.tree.run_map [dlg.task.id] = dlg.nodeId;
            dlg.tree.node_map[dlg.nodeId ].setCustomIconVisible ( true );
            dlg.tree.setNodeName ( dlg.nodeId,false );
            // set button state in project page
            dlg.tree.emitSignal ( cofe_signals.jobStarted,{
              'nodeId' : dlg.nodeId,
              'taskId' : dlg.task.id
            });
            dlg.tree.startTaskLoop();

          },function(dlg){
            // trigerred when job dialog is closed; remove dialog from the
            // hash of opened job dialogs

            dlg.tree.dlg_map = mapExcludeKey ( dlg.tree.dlg_map,dlg.task.id );

          },function(dlg,reason,options){
            // trigerred on custom events

            switch (reason)  {
              case job_dialog_reason.rename_node :
                        dlg.job_edited = true;
                        dlg.tree.setNodeName ( dlg.nodeId,false );
                      break;
              case job_dialog_reason.set_node_icon :
                        dlg.job_edited = true;
                        dlg.tree.setNodeIcon ( dlg.nodeId,true );
                      break;
              case job_dialog_reason.reset_node :
                        dlg.tree.node_map[dlg.nodeId].setCustomIconVisible ( false );
                        dlg.tree.resetNodeName ( dlg.nodeId );
                      break;
              case job_dialog_reason.select_node :
                        dlg.tree.selectSingle ( dlg.tree.node_map[dlg.nodeId] );
                      break;
              case job_dialog_reason.stop_job :
                        dlg.tree.stopJob ( dlg.nodeId,false,function(key){
                          if (key)  {
                            if (dlg.end_btn)
                              dlg.end_btn.setDisabled ( true );
                            dlg.stop_btn.setDisabled ( true );
                          }
                        });
                      break;
              case job_dialog_reason.end_job :
                        dlg.tree.stopJob ( dlg.nodeId,true,function(key){
                          // if (key)  // disables "End gracefully" button in job dialog
                          //   dlg.end_btn.setDisabled ( true );
                        });
                      break;
              // case job_dialog_reason.webapp_finished :
              //           dlg.tree.webappFinished ( dlg.nodeId );
              //         break;
              case job_dialog_reason.tree_updated :
                        dlg.tree.emitSignal ( cofe_signals.treeUpdated,{} );
                      break;
              case job_dialog_reason.add_job :
                        dlg.tree.selectSingle ( dlg.tree.node_map[dlg.nodeId] );
                        // dlg.tree.addJob ( false,false,dlg.parent_page,function(key){
                        dlg.tree.addJob ( false,true,dlg.parent_page,function(key){
                          dlg.close();
                        });
                      break;
              case job_dialog_reason.clone_job :
                        dlg.tree.selectSingle ( dlg.tree.node_map[dlg.nodeId] );
                        dlg.tree.cloneJob ( 'clone',dlg.parent_page,function(){
                          dlg.close();
                        });
                      break;
              case job_dialog_reason.run_job :
                        // here, options==task class
                        dlg.tree.selectSingle ( dlg.tree.node_map[dlg.nodeId] );
                        let dataBox          = dlg.tree.harvestTaskData ( 1,[] );
                        let branch_task_list = dlg.tree.getAllAncestors ( dlg.tree.getSelectedTask() );
                        dlg.tree._copy_task_cloud_path ( options,branch_task_list );
                        dlg.tree._copy_task_parameters ( options,branch_task_list );
                        if (!options.prevent_autostart)  {
                          let dataSummary = dataBox.getDataSummary ( options );
                          if ((dataSummary.status==2) ||
                              (('DataRevision' in dataBox.data) &&
                              (dataBox.data.DataRevision.length==1))) {
                            // unambiguous data -- just start the job
                            options.onJobDialogStart = function ( job_dialog )  {
                              job_dialog.run_btn.click();  // start automatically
                            };
                          }
                        }
                        dlg.tree._add_job ( false,options,dataBox,dlg.parent_page,
                          function(key){
                            dlg.close();
                          });
                      break;
              default : ;
            }

          });

        this.emitSignal ( cofe_signals.jobDialogOpened,{
          'nodeId' : nodeId,
          'taskId' : task.id
        });

      }

    }

  } else {
    console.log ( 'no selection in the tree:openJob' );
    // alert ( ' no selection in the tree! ' );
  }

}


JobTree.prototype.isShared = function()  {
  if (this.projectData)
    return (Object.keys(this.projectData.desc.share).length>0) ||
            this.projectData.desc.autorun;  // autorun framework uses sharing
                                            // mechanism for tree updates
  return false;
}

JobTree.prototype.copyJobToClipboard = function() {
let crTask = this.getSelectedTask();
  if (crTask)  {
    let reftask = eval ( 'new ' + crTask._type + '()' );
    if (crTask.version<reftask.currentVersion())  {
      new MessageBox ( 'Cannot copy',
        '<h2>This job cannot be copied.</h2>' +
        'The job was created with a lower version of ' + appName() + 
        '<br>and cannot be copied to clipboard.<p>Please create the job ' +
        'as a new one, using "<i>Add Job</i>"<br>button from the control ' +
        'bar.','msg_stop' );
    } else
      __clipboard.task = crTask;
  } else
    new MessageBox ( 'No task copied',
      '<div style="width:300px;"><h2>No task copied</h2>' +
      'Task could not be copied to Clipboard.',
      'msg_error' );
}

JobTree.prototype.pasteJobFromClipboard = function ( callback_func ) {
  if (__clipboard.task)  {
    let task = eval ( 'new ' + __clipboard.task._type + '()' );
    task.uname      = __clipboard.task.uname;
    task.uoname     = __clipboard.task.uoname;
    task.parameters = $.extend ( true,{},__clipboard.task.parameters );
    callback_func ( task );
  } else
    new MessageBox ( 'Empty clipboard',
      '<div style="width:300px;"><h2>Empty Clipboard</h2>' +
      'No task found in Clipboard.',
      'msg_error' );
}

JobTree.prototype.cloneJob = function ( cloneMode,parent_page,onAdd_func )  {

  if (this.view_only)
    return;

  if (this.selected_node_id)  {

    this.forceSingleSelection();

    let nodeId = this.selected_node_id;
    let task0  = this.task_map[nodeId];

    // create an instance of selected task with default parameters
    let task   = eval ( 'new ' + task0._type + '()' );

    if (task0.version<task.currentVersion())  {

      new MessageBox ( 'Cannot clone',
        '<h2>This job cannot be cloned.</h2>' +
        'The job was created with a lower version of ' + appName() + 
        '<br>and cannot be cloned.<p>Please create the job as ' +
        'a new one, using "<i>Add Job</i>"<br>button from the ' +
        'control bar.</div>','msg_stop' );
      if (onAdd_func)
        onAdd_func(-5);

    } else  {

      task.uname       = task0.uname;
      task.uoname      = task0.uoname;
      task.cloned_id   = task0.id;
      task.autoRunId   = task0.autoRunId;
      if ('autoRunId0' in task0)
        task.autoRunId0 = task0.autoRunId0;
      else if (task.autoRunId.length>0)
        task.autoRunId0 = task0.autoRunId;
      task.autoRunName = task0.autoRunName;
      if (task.autoRunName.startsWith('@'))  {
        task.script         = task0.script;
        task.script_pointer = task0.script_pointer;
      }
      task.inputMode   = task0.inputMode;
      task.nc_type     = task0.nc_type;

      task.file_select = [];
      for (let i=0;i<task0.file_select.length;i++)
        task.file_select.push ( $.extend(true,{},task0.file_select[i]) );

      task.input_ligands = [];
      for (let i=0;i<task0.input_ligands.length;i++)
        task.input_ligands.push ( $.extend(true,{},task0.input_ligands[i]) );

      task.input_data = $.extend ( true,{},task0.input_data  );
      task.parameters = $.extend ( true,{},task0.parameters  );

      for (let i=0;i<task0.harvestedTaskIds.length;i++)
        task.harvestedTaskIds.push ( task0.harvestedTaskIds[i] );

      if ('file_system' in task0)  {
        task.file_system      = task0.file_system;
        task.currentCloudPath = task0.currentCloudPath;
        if (('file_mod' in task0) && (task.file_system=='cloud'))
          task.file_mod = task0.file_mod;
      }

      task.customDataClone ( cloneMode,task0 );
      task.project    = this.projectData.desc.name;
      task.id         = this.projectData.desc.jobCount + 1;
      task.parentId   = task0.parentId;
      task.submitter  = __login_id;

      let node;
      if (('archive_version' in task0) && (task0.archive_version>0))  {
        // cloning from archived task, put a marker
        node = this.addSiblingToSelected ( 
          __projectStyle('revision #'+this.projectData.desc.archive.version),
          image_path('project'),this.customIcon() 
        );
        this.selectNode ( node,true );
        node = this.addNodeToSelected ( '',image_path(task.icon()),this.customIcon() );
      } else
        node = this.addSiblingToSelected ( '',image_path(task.icon()),
                                              this.customIcon() );

      if (task.isRemark())
        this.setRemarkStyle ( node,task );

      this.task_map[node.id] = task;
      task.treeItemId        = node.id;
      node.dataId            = task.id;
      // now set the new node name
      this.setText ( node,this.makeNodeName(task) );

      this.saveProjectData ( [task],[],true, function(tree,rdata){
        if (tree.checkReload(rdata,'clone job'))  {
          task.id     = rdata.jobIds[0];
          node.dataId = task.id;
          tree.projectData.desc.jobCount = task.id;
          tree.setText ( node,tree.makeNodeName(task) );
          if (onAdd_func)
            onAdd_func(0);
          tree.openJob ( null,parent_page );
          if (task.isRemark())
            tree.setRemarkStyle ( node,task );
        }
      });

    }

  } else  {
    console.log ( 'no selection in the tree:cloneJob' );
    if (onAdd_func)
      onAdd_func(-6);
    // alert ( ' no selection in the tree! ' );
  }

}

JobTree.prototype.setRemarkStyle = function ( node,task )  {
  if (task.isLink())  this.setStyle ( node,__linkStyle  ,0 );
                else  this.setStyle ( node,__remarkStyle,0 );
}


JobTree.prototype.harvestTaskData = function ( includeSelected_key,
                                               harvestedTaskIds )  {
// Searches (actual) output data records of all tasks up the job tree brunch
// starting with (and including) current node, and returns them as the DataBox
// object. Within the Box, data objects are sorted reversely on jobIds, so
// that the latest data appear in leading positions.
//
// includeSelected_key
//  == 0:  do not include output data from currently selected task
//  == 1:  include output data from currently selected task
//  == 2:  include full input data from currently selected task

  let dataBox = new DataBox();

  dataBox.inp_assoc = {};  // created for future use in
                           //         TaskTemplate.setInputDataFields()

  dataBox.harvestedTaskIds = [];  // will keep ids of multiply selected tasks,
                           // which are used when Job Dialog is repeatedly created

  if (harvestedTaskIds.length>0)  {
    // harvest data from specified tasks (typically for a repeat action)

    let dBox = null;
    if (includeSelected_key==2)  {
      let selId = this.calcSelectedNodeIds();
      if (selId.length<=1)  {
        dBox = new DataBox();
        dBox.addTaskInputData ( this.task_map[this.selected_node_id],true );
      }
    }

    for (let i=0;i<harvestedTaskIds.length;i++)
      for (let nodeId in this.task_map)  {
        let task = this.task_map[nodeId];
        if (task.id==harvestedTaskIds[i])  {
          dataBox.addTaskData ( task,false );
          dataBox.harvestedTaskIds.push ( task.id );
          break;
        }
      }

    dataBox.data_n0 = {};
    for (let dt in dataBox.data)
      dataBox.data_n0[dt] = dataBox.data[dt].length;

    if (dBox)  {
      dBox.merge ( dataBox );
      dataBox = dBox;
    }

  } else  {
    // harvest data from task(s) currently selected in the tree

    let selId = this.calcSelectedNodeIds();

    if (selId.length<=1)  {
      // single node selected -- collect data all up the tree branch

      let refNodeId = this.selected_node_id;
      let nodeId    = refNodeId;
      let dBox      = null;

      switch (includeSelected_key)  {
        case 2: dBox = new DataBox();
                dBox.addTaskInputData ( this.task_map[nodeId],true );
                refNodeId = this.node_map[nodeId].parentId;
        case 0: nodeId    = this.node_map[nodeId].parentId;
        default: ;
      }

      let fstack = [];  // folder stack
      while (nodeId)  {
        let cnode = this.node_map[nodeId];
        if (cnode.fchildren.length>0)  {
          fstack.push ( [cnode,cnode.fchildren.length] )
        } else if (nodeId in this.task_map)  {
          dataBox.addTaskData ( this.task_map[nodeId],
                      (nodeId!=refNodeId) || (includeSelected_key>0) );
          if (!('data_n0' in dataBox))  {
            dataBox.data_n0 = {};
            for (let dt in dataBox.data)
              dataBox.data_n0[dt] = dataBox.data[dt].length;
          }
        }
        let n = fstack.length-1;
        if (n<0)
          nodeId = cnode.parentId;
        else {
          fstack[n][1]--;
          if (fstack[n][1]>=0)
            nodeId = fstack[n][0].fchildren[fstack[n][1]].id;
          else  {
            nodeId = fstack[n][0].parentId;
            fstack.pop();
          }
        }
      }

      /*
      while (nodeId)  {
        if (nodeId in this.task_map)  {
          dataBox.addTaskData ( this.task_map[nodeId],
                      (nodeId!=refNodeId) || (includeSelected_key>0) );
          if (!('data_n0' in dataBox))  {
            dataBox.data_n0 = {};
            for (let dt in dataBox.data)
              dataBox.data_n0[dt] = dataBox.data[dt].length;
          }
        }
        nodeId = this.node_map[nodeId].parentId;
      }
      */

      if (dBox)  {
        dBox.merge ( dataBox );
        dataBox = dBox;
      }

      //dataBox.addDefaultData();

    } else  {
      // multiply selected nodes -- collect data only from them

      // reshuffle such that data from chosen parent goes first -- this is
      // useful if a revision (no backtrace) is involved
      for (let i=1;i<selId.length;i++)
        if (selId[i]==this.selected_node_id)  {
          selId[i] = selId[0];
          selId[0] = this.selected_node_id;
        }

      for (let i=0;i<selId.length;i++)
        if (selId[i] in this.task_map)  {
          dataBox.addTaskData ( this.task_map[selId[i]],false );
          dataBox.harvestedTaskIds.push ( this.task_map[selId[i]].id );
        }

      dataBox.data_n0 = {};
      for (let dt in dataBox.data)
        dataBox.data_n0[dt] = dataBox.data[dt].length;

    }

  }

  return dataBox;

}


JobTree.prototype.getTaskDataBox = function ( task )  {

  let dataBox = new DataBox();
  dataBox.inp_assoc = {};  // created for future use in
                           //         TaskTemplate.setInputDataFields()
  dataBox.harvestedTaskIds = task.harvestedTaskIds;  // will keep ids of multiply selected tasks,
                          // which are used when Job Dialog is repeatedly created

  dataBox.addTaskInputData ( task,true );

  dataBox.data_n0 = {};
  for (let dt in dataBox.data)
    dataBox.data_n0[dt] = dataBox.data[dt].length;

  return dataBox;

}


JobTree.prototype.inspectData = function ( jobId,dataType,dataId )  {
let task = this.getTask ( jobId );

  if (!task)  {
    new MessageBox ( 'Job ' + jobId + ' not found',
              'Job ' + jobId + ' not found. This may be a bug, please ' +
              'contact ' + appName() + ' developer.','msg_error' );
  } else  {

    let td  = task.output_data.data;
    let td0 = null;
    for (let dtype in td)
      if (dtype==dataType)  {
        let tdr = td[dtype];
        for (let i=0;(i<tdr.length) && (!td0);i++)
          if (tdr[i].dataId==dataId)
            td0 = tdr[i];
        if (td0)
          break;
      }

    if (!td0)  {

      new MessageBox ( 'Data ' + dataType.substr(4) + ' [' + dataId + '] not found',
                '<div style="width:400px"><h3><i>Data ' + dataType.substr(4) +
                    ' [' + dataId + '] not found in job ' + jobId +
                '</i></h3><p>If job is still running, wait until it finishes ' +
                'and try again.','msg_excl_yellow'  );

    } else  {

      td0 = $.extend ( true,eval('new ' + dataType + '()'),td0 );
      td0.inspectData ( task );

    }

  }

}


JobTree.prototype.getAllAncestors = function ( task )  {

  if (!task)
    return [];

  let tasks  = [task];
  let nodeId = this.getTaskNodeId ( task.id );

  nodeId = this.node_map[nodeId].parentId;
  while (nodeId)  {
    if (nodeId in this.task_map)
      tasks.push ( this.task_map[nodeId] );
    nodeId = this.node_map[nodeId].parentId;
  }

  return tasks;

}


JobTree.prototype.getNonRemarkParent = function ( task )  {

  if (!task)
    return [];

  let nodeId = this.getTaskNodeId ( task.id );
  nodeId     = this.node_map[nodeId].parentId;
  let nrtask = null;
  while (nodeId && (!nrtask))  {
    if (nodeId in this.task_map)  {
      nrtask = this.task_map[nodeId];
      if (nrtask.isRemark())
        nrtask = null;
    }
    nodeId = this.node_map[nodeId].parentId;
  }

  return nrtask;

}


JobTree.prototype.getChildTasks = function ( node )  {
  let tasks = [];
  if (node)  {
    let child_nodes = this.getChildNodes ( node );
    for (let i=0;i<child_nodes.length;i++)  {
      let task = this.getTaskByNodeId ( child_nodes[i].id );
      if (task)
        tasks.push ( task );
    }
  }
  return tasks;
}


JobTree.prototype.addReplayTasks = function ( replay_node_list,ref_node_list )  {

  this.stopTaskLoop();

  let newJobs = false;
  for (let i=0;i<replay_node_list.length;i++)  {

    // check if replay task was a root or finished with success
    let retcode  = job_code.finished;
    if (replay_node_list[i].parentId)  {
      let task = this.getTaskByNodeId ( replay_node_list[i].id );
      if (task)  retcode = task.state;
           else  retcode = job_code.failed;
    }

    if (retcode==job_code.finished)  {
      // append and start all children jobs

      let children = ref_node_list[i].children;

      for (let j=0;j<children.length;j++)  {

        let ref_node = children[j];
        let ref_task = this.ref_tree.getTaskByNodeId ( ref_node.id );

        this.projectData.desc.jobCount = Math.max (
                                  this.projectData.desc.jobCount,ref_task.id );

        let replay_task     = $.extend ( eval('new '+ref_task._type+'()'),ref_task );
        replay_task.state   = job_code.new;
        replay_task.project = this.projectData.desc.name;
        let replay_node     = this.addNode ( replay_node_list[i],ref_node.text,
                                             ref_node.icon,this.customIcon() );

        this.task_map[replay_node.id] = replay_task;
        replay_task.treeItemId        = replay_node.id;
        replay_node.dataId            = replay_task.id;

        // make harvest data links
        //for (let i=0;i<task.harvestedTaskIds.length;i++)  {
        //  let taski = tree.getTask ( task.harvestedTaskIds[i] );
        //  if (taski)
        //    taski.addHarvestLink ( task.id )
        //}

        //if (onAdd_func)
        //  onAdd_func();

        this.saveProjectData ( [replay_task],[],true, function(tree,rdata){
          if (rdata.reload<=0)  {
            replay_task.state = job_code.running;
            let data  = {};
            data.meta = replay_task;
            data.ancestors = [];  // used only for knowledge framework, ignored here
            serverRequest ( fe_reqtype.replayJob,data,replay_task.title,
              function(rdata){},  //callback_ok
              null,null
            );
          }
        });

      }

    }

  }

  if (newJobs)
    this.startTaskLoop();

}



JobTree.prototype.replayTree = function ( ref_tree )  {
//  replays jobs found in reference tree; should be called on new tree

  this.ref_tree = ref_tree;

  this.stopTaskLoop();

  // this.checkLoop = false;  // true if job check loop is running

  let task_del_list = [];
  for (let nodeId in this.task_map)
    task_del_list.push ( [this.task_map[nodeId].id,this.task_map[nodeId].disk_space] );
  this.task_map = {};  // map[nodeId]==task of all tasks in the tree
  this.run_map  = {};  // map[taskId]==nodeId of all running tasks
  this.dlg_map  = {};  // map[taskId]==dialog of open job dialogs
  this.clear();  // this removes also all root nodes
  this.projectData.desc.jobCount = 0;
  // (function(tree){
    tree.saveProjectData ( [],task_del_list,true, function(tree,rdata){
      if (rdata.reload<=0)  {
        let replay_node_list = [];
        for (let i=0;i<ref_tree.root_nodes.length;i++)  {
          let ref_node    = ref_tree.root_nodes[i];
          replay_node_list.push ( tree.addRootNode(ref_node.text.replace(']',':replay]'),
                                                   ref_node.icon,tree.customIcon()) );
        }
        tree.addReplayTasks ( replay_node_list,ref_tree.root_nodes );
      }
    });
  // }(this))

}
