/*
 *  ========================================================================
 *
 *    04.07.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.knowledge.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Knowledge routines and data
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2018-2019
 *
 *  ========================================================================
 *
 */


// -------------------------------------------------------------------------
// Workflow index for calculating initial task suggestions.
//
//   Key '0' is fixed for root
//   Keys must be either single letters (case-sensitive), or single letters
//   followed by any number of digits from 1 to 9.
//   Examples of valid keys:
//     'A', 'z', 'B1', 'X19', 'c935' etc
//   Examples of keys which will break the system:
//     '0A', 'A0', 'c101', '23d' etc

var _taskIndex = {

  '0' : { type: 'Root'               , after: [] },

  // suggest CCP4go only after Root
  'A' : { type: 'TaskCCP4go'         , after: ['0'] },

  'B' : { type: 'TaskImport'         , after: ['0','B','C','D','E','m'] },
  'C' : { type: 'TaskEnsemblePrepSeq', after: ['B','D','m'] },
  'D' : { type: 'TaskEnsemblePrepXYZ', after: ['B','C','D','m'] },

  // suggest Make Ligand after Import and Model Preparation
  'E' : { type: 'TaskMakeLigand'     , after: ['B','C','D','E','m'] },

  // suggest Aimless, Simbad and ASUDef after Import or Model Preparation in
  // the specified order; do not suggest them after themselves (user should
  // branch/clone instead)
  'F' : { type: 'TaskAimless'        , after: ['B','C','D','E','h','m', 't', 'u'] },
  'G' : { type: 'TaskSimbad'         , after: ['B','C','D','E','F','h','m', 't', 'u'] },
  'H' : { type: 'TaskASUDef'         , after: ['B','C','D','E','F','h','m', 't', 'u'] },

  // suggest Xyz2Revision after Import, Models and Ligands
  'I' : { type: 'TaskXyz2Revision'   , after: ['B','C','D','E','F','h','m', 't', 'u'] },

  // suggest Morda, MrBump, and Balbes after ASUDef; do not suggest them after
  // themselves (user should branch/clone instead)
  'J' : { type: 'TaskMorda'          , after: ['H'] },
  'K' : { type: 'TaskBalbes'         , after: ['H'] },
  'L' : { type: 'TaskMrBump'         , after: ['H'] },

  // suggest Phaser-MR and Molrep after ASUDef; do suggest them after
  // themselves (in case of domain-after domain phasing); do not suggest them
  // after auto-MR
  'M' : { type: 'TaskPhaserMR'       , after: ['H','M'] },
  'N' : { type: 'TaskMolrep'         , after: ['H','N'] },

  // suggest ShelxE-MR after either Phaser-MR or Molrep; do not suggest it
  // after itself
  'O' : { type: 'TaskShelxEMR'       , after: ['M','N'] },

  // suggest Crank-2 and Shelx-AutoEP after ASUDef and MR; do not suggest
  // them after themselves (user should branch/clone instead)
  'P' : { type: 'TaskCrank2'         , after: ['H','J','K','L','M','N'] },
  'Q' : { type: 'TaskShelxAuto'      , after: ['H','J','K','L','M','N'] },

  // suggest ShelxSubstr after ASUDef and MR; do not suggest it after auto-EP or itself
  'R' : { type: 'TaskShelxSubstr'    , after: ['H','J','K','L','M','N'] },

  // suggest Phaser-EP after ShelxSubstr; do not suggest it after itself
  'S' : { type: 'TaskPhaserEP'       , after: ['R'] },

  // suggest Parrot after both MR and Phaser-EP; do not suggest it after itself
  'T' : { type: 'TaskParrot'         , after: ['J','K','L','M','N','O','R','S'] },

  // suggest Buccaneer after Simbad, Parrot, Acorn, MR and EP; do not suggest it after itself
  'U' : { type: 'TaskBuccaneer'      , after: ['J','K','L','M','N','O','S','T','n'] },

  // suggest Refmac after both elementary MR, auto-EP, Buccaneer and itself
  'V' : { type: 'TaskRefmac'         , after: ['M','N','O','P','Q','U','j','r'] },

  // suggest Lorester after Buccaneer and Refmac; not after itself
  'W' : { type: 'TaskLorestr'        , after: ['U','V','r'] },

  // sugget FitLigand after Refmac, Lorestr and after itself
  'X' : { type: 'TaskFitLigand'      , after: ['V','W','X','U','r'] },

  // suggest FitWaters after Refmac, Lorestr and Ligands, but not after itself
  'Y' : { type: 'TaskFitWaters'      , after: ['V','W','X','U','r'] },

  // suggest Zanuda after Refmac and Lorestr
  'Z' : { type: 'TaskZanuda'         , after: ['V','W'] },

  // suggest Gesamt after Buccaneer, Refmac and Lorestr
  'a' : { type: 'TaskGesamt'         , after: ['U','V','W','r'] },

  // suggest PISA after Refmac and Lorestr
  'b' : { type: 'TaskPISA'           , after: ['V','W','X'] },

  // suggest ChangeSpG after dataprocessing tasks
  'c' : { type: 'TaskChangeSpG'      , after: ['h','t','u'] },

  // do not suggest ASUMod
  //'d' : { type: 'TaskASUMod'         , after: [] },
  'd' : { type: 'TaskEditRevision'   , after: [] },
  'e' : { type: 'TaskASUDefStruct'   , after: ['A'] },

  // suggest SeqAlign after Import
  'f' : { type: 'TaskSeqAlign'       , after: ['B','m'] },

  // do not suggest FacilityImport
  'g' : { type: 'TaskFacilityImport' , after: [] },

  // suggest Xia2 after root
  'h' : { type: 'TaskXia2'           , after: ['0'] },

  // suggest Dimple after phasing
  'i' : { type: 'TaskDimple'         , after: ['M','N','O','P','Q','U','r'] },

  // suggest Coot after refinememnt
  'j' : { type: 'TaskCootMB'         , after: ['V','W','i','U','r'] },

  // suggest PDB Deposition after Refmac
  'k' : { type: 'TaskDeposition'     , after: ['V'] },

  // suggest Coot after refinememnt
  'l' : { type: 'TaskCootCE'         , after: ['B','C','D','m'] },

  // do suggest CloudImport alike plain Import
  'm' : { type: 'TaskCloudImport'    , after: ['0','B','C','D','E','m'] },

  // suggest Acorn after both MR and Phaser-EP; do not suggest it after itself
  'n' : { type: 'TaskAcorn'          , after: ['J','K','L','M','N','O','R','S'] },

  // suggest Arp/wArp after Simbad, Parrot, MR and EP; do not suggest it after itself
  'o' : { type: 'TaskArpWarp'        , after: ['J','K','L','M','N','O','S','T','n','T'] },

  // suggest ShelxCD after ASUDef and MR; do not suggest it after auto-EP or itself
  'p' : { type: 'TaskShelxCD'        , after: ['H','J','K','L','M','N'] },

  // do not suggest SymMatch
  'q' : { type: 'TaskSymMatch'       , after: [] },

  // suggest CCP4Build after Simbad, MR and EP; do not suggest it after itself
  'r' : { type: 'TaskCCP4Build'      , after: ['J','K','L','M','N','O','S'] },

  // suggest LsqKab after Buccaneer, Refmac and Lorestr
  's' : { type: 'TaskLsqKab'         , after: ['U','V','W','r'] },

  // suggest iMosflm after root
  't' : { type: 'TaskDUI'            , after: ['0'] },

  // suggest iMosflm after root
  'u' : { type: 'TaskIMosflm'        , after: ['0'] }

};


function getTasksFromTaskIndex ( ckey )  {
var tasks = [];

  for (var key in _taskIndex)
    if (_taskIndex[key].after.indexOf(ckey)>=0)
      tasks.push ( _taskIndex[key].type );

  return tasks;

}


// -------------------------------------------------------------------------

var _revTaskIndex = null; // Reverse _taskIndex: _revTaskIndex[task_type] = key
                          // Initially null, but gets compiled from _taskIndex
                          // at first use.

function getTaskKeyFromType ( task_type )  {
  if (!_revTaskIndex)  {
    _revTaskIndex = {};
    for (var key in _taskIndex)
      _revTaskIndex[_taskIndex[key].type] = key;
  }
  if (task_type in _revTaskIndex)
    return _revTaskIndex[task_type];
  else
    return '0';
}

function getTaskKey ( task )  {
  if (task)
    return getTaskKeyFromType(task._type);
  return '0';
}


// -------------------------------------------------------------------------

// function to be called on both client and server each time a new job is
// started
function addWfKnowledgeByTypes ( wfKnowledge, new_task_type, task_type_list )  {

  // calculate wfkey -- note reverse order of keys in task_type_list:
  //   task_type_list[0] == key3
  //   task_type_list[1] == key2
  //   task_type_list[2] == key1

  var wfkey = '';
  for (var i=0;i<3;i++)
    if (i<task_type_list.length)
          wfkey = getTaskKeyFromType(task_type_list[i]) + wfkey;
    else  wfkey = getTaskKeyFromType('Root') + wfkey;

  // set or advance the counter

  var tkey = getTaskKeyFromType(new_task_type);
  var knowledge = null;

  if (wfkey in wfKnowledge)  {
    knowledge = wfKnowledge[wfkey];
    if (tkey in knowledge)  knowledge[tkey]++;
                      else  knowledge[tkey] = 1;
  } else  {
    knowledge = {};
    knowledge[tkey] = 1;
    wfKnowledge[wfkey] = knowledge;
  }

}

if ((typeof module === 'undefined') || (typeof module.exports === 'undefined'))  {
  // clent side

  /*
    _wfKnowledge is the following structure:

      { 'k1k2k3' : { 'm1' : c1, 'm2' : c2, ... },
        ............
      }

      where k1, k2, k3 are task keys (obtainable from getTaskKey(...))
      that define a sequence of 3 tasks. m1, m2 etc are keys of tasks that
      appear after 'k1k2k3' workflow sequence with counts c1, c2 etc.,
      respectively.

    _wfKnowledge is initially null, gets loaded from server at user login.
    _wfKnowledge is initially null on server, but gets computed from _taskIndex
    as first approximation, per concrete query.
   */

  var _wfKnowledge = {};

  function getWfKnowledgeFromTypes ( task_type1, task_type2, task_type3 )  {
  // returns structure:
  //  { tasks: [name1,name2,...],  counts: [c1,c2,...] }


    var k1  =  getTaskKeyFromType ( task_type1 );
    var k2  =  getTaskKeyFromType ( task_type2 );
    var k3  =  getTaskKeyFromType ( task_type3 );
    var wfkey = k1 + k2 + k3;

    var knowledge   = { counts: [] };
    knowledge.tasks = getTasksFromTaskIndex ( k3 );
    for (var i=0;i<knowledge.tasks.length;i++)
      knowledge.counts.push ( 1 );

    if (wfkey in _wfKnowledge)  {
      var w = _wfKnowledge[wfkey];
      for (var taskkey in w) {
        var t = _taskIndex[taskkey].type;
        if (t!='Root')  {
          var k = knowledge.tasks.indexOf ( t );
          if (k>=0)
            knowledge.counts[k] += w[taskkey];
          else  {
            knowledge.tasks .push ( t );
            knowledge.counts.push ( w[taskkey] );
          }
        }
      }
    }

    return knowledge;

  }

  function getWfKnowledge ( task1, task2, task3 )  {
  var type1 = '0';
  var type2 = '0';
  var type3 = '0';
    if (task1)  type1 = task1._type;
    if (task2)  type2 = task2._type;
    if (task3)  type3 = task3._type;
    return getWfKnowledgeFromTypes ( type1,type2,type3 );
  }

  // function to be called once upon user login
  function loadKnowledge ( page_title )  {
    serverRequest ( fe_reqtype.getUserKnowledge,0,page_title,
      function(data){
        _wfKnowledge = data;
      },function(){
      },'persist');
  }

  function addWfKnowledge ( new_task, task_list )  {
  var task_type_list = [];
    for (var i=0;i<task_list.length;i++)
      task_type_list.push ( task_list[i]._type );
    addWfKnowledgeByTypes ( _wfKnowledge, new_task._type, task_type_list );
  }


} else  {
  // server side

  module.exports.addWfKnowledgeByTypes = addWfKnowledgeByTypes;

}
