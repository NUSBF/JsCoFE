/*
 *  ========================================================================
 *
 *    31.07.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2018-2024
 *
 *  ========================================================================
 *
 */

'use strict';

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

  '0'  : { type: 'Root'                   , after: [] },

  // suggest CCP4go only after Root
  'A'  : { type: 'TaskCCP4go'             , after: ['0'] },
  'A1' : { type: 'TaskMigrate'            , after: ['0'] },

  // do not suggest by default:
  'A2' : { type: 'TaskImportReplace'      , after: []    },

  'B'  : { type: 'TaskImport'             , after: ['0','B','B1','C','D','E','m'] },
  'B1' : { type: 'TaskImportSeqCP'        , after: ['0','B','B1','C','D','E','m'] },
  'B2' : { type: 'TaskStructurePrediction', after: ['B','B1','m'] },
  'C'  : { type: 'TaskEnsemblePrepSeq'    , after: ['B','B1','m'] },
  'D'  : { type: 'TaskEnsemblePrepXYZ'    , after: ['B','B1','C','m'] },
  'D1' : { type: 'TaskModelPrepXYZ'       , after: ['B','B1','C','m'] },
  'D2' : { type: 'TaskModelPrepAlgn'      , after: ['B','B1','C','m'] },
  'D3' : { type: 'TaskEnsembler'          , after: ['D1','D2'] },
  'D4' : { type: 'TaskModelPrepMC'        , after: ['B','B1','C','m'] },
  'D5' : { type: 'TaskSlice'              , after: ['B','B1','C','m'] },
  'D6' : { type: 'TaskMrParse'            , after: ['B','B1','m'] },

  // suggest Make Ligand after Import and Model Preparation
  'E'  : { type: 'TaskMakeLigand'         , after: ['B','B1','C','D','E','m'] },
  'E1' : { type: 'TaskCrosSec'            , after: ['B','m'] },
  'E2' : { type: 'TaskWFlowAMR'           , after: ['0','B'] },
  'E3' : { type: 'TaskWFlowAEP'           , after: ['0','B'] },
  'E4' : { type: 'TaskWFlowDPL'           , after: ['0','B'] },
  'E5' : { type: 'TaskWFlowDPLMR'           , after: ['0','B'] },
  'E6' : { type: 'TaskWFlowSMR'           , after: ['0','B'] },
  'E7' : { type: 'TaskWFlowAFMR'          , after: ['0','B'] },

  // suggest Aimless, Simbad and ASUDef after Import or Model Preparation in
  // the specified order; do not suggest them after themselves (user should
  // branch/clone instead)
  'F'  : { type: 'TaskAimless'            , after: ['B','F'] },
  'F1' : { type: 'TaskAuspex'             , after: ['B','F','v','m'] },
  'F2' : { type: 'TaskSRF'                , after: [] },
  'G'  : { type: 'TaskSimbad'             , after: ['B','B1','C','D','E','F','h','m','t','u'] },
  'H'  : { type: 'TaskASUDef'             , after: ['B','B1','C','D','D1','D2','D3','E','F','h','m','t','u'] },

  // suggest Xyz2Revision after Import, Models and Ligands
  'I'  : { type: 'TaskXyz2Revision'       , after: ['B','B1','C','D','E','F','h','m','t','u'] },

  // suggest Morda, MrBump, and Balbes after ASUDef; do not suggest them after
  // themselves (user should branch/clone instead)
  'J'  : { type: 'TaskMorda'              , after: ['H'] },
  'K'  : { type: 'TaskBalbes'             , after: ['H'] },
  'L'  : { type: 'TaskMrBump'             , after: ['H'] },

  // do not suggest CPU-intensive tasks by default
  'L1' : { type: 'TaskAmple'              , after: [] },
  'L2' : { type: 'TaskArcimboldoLite'     , after: [] },
  'L3' : { type: 'TaskArcimboldoBorges'   , after: [] },
  'L4' : { type: 'TaskArcimboldoShredder' , after: [] },

  'L5' : { type: 'TaskSliceNDice'         , after: ['H'] },

  // suggest Phaser-MR and Molrep after ASUDef; do suggest them after
  // themselves (in case of domain-after domain phasing); do not suggest them
  // after auto-MR
  'M'  : { type: 'TaskPhaserMR'           , after: ['H','M'] },
  'N'  : { type: 'TaskMolrep'             , after: ['H','N'] },

  // suggest ShelxE-MR after either Phaser-MR or Molrep; do not suggest it
  // after itself
  'O'  : { type: 'TaskShelxEMR'           , after: ['M','N'] },
  'O1' : { type: 'TaskPhaserRB'           , after: ['M','N'] },
  'O2' : { type: 'TaskSheetbend'          , after: ['M','N'] },

  // suggest Crank-2 and Shelx-AutoEP after ASUDef and MR; do not suggest
  // them after themselves (user should branch/clone instead)
  'P'  : { type: 'TaskCrank2'             , after: ['H','J','K','L','M','N'] },
  'Q'  : { type: 'TaskShelxAuto'          , after: ['H','J','K','L','M','N'] },

  // suggest ShelxSubstr after ASUDef and MR; do not suggest it after auto-EP or itself
  'R'  : { type: 'TaskShelxSubstr'        , after: ['H','J','K','L','M','N'] },

  // suggest Phaser-EP after ShelxSubstr; do not suggest it after itself
  'S'  : { type: 'TaskPhaserEP'           , after: ['R','p'] },

  // suggest Parrot after both MR and Phaser-EP; do not suggest it after itself
  'T'  : { type: 'TaskParrot'             , after: ['J','K','L','M','N','O','R','S'] },

  // suggest Buccaneer after Simbad, Parrot, Acorn, MR and EP; do not suggest it after itself
  'U'  : { type: 'TaskBuccaneer'          , after: ['J','K','L','M','N','O','S','T','n'] },

  // suggest Nautilus after Simbad, Parrot, Acorn, MR and EP; do not suggest it after itself
  'U1' : { type: 'TaskNautilus'           , after: ['J','K','L','M','N','O','S','T','n'] },

  // suggest Modelcraft after Simbad, Parrot, Acorn, MR and EP; do not suggest it after itself
  'U2' : { type: 'TaskModelCraft'         , after: ['J','K','L','M','N','O','S','T','n'] },

  // suggest AWNuce after Simbad, Parrot, Acorn, MR and EP; do not suggest it after itself
  'U3' : { type: 'TaskAWNuce'             , after: ['J','K','L','M','N','O','S','T','n'] },

  // suggest Refmac after both elementary MR, auto-EP, Buccaneer
  'V'  : { type: 'TaskRefmac'             , after: ['M','N','O','P','Q','U','U1','U2','j','r'] },

  // suggest Buster after both elementary MR, auto-EP, Buccaneer
  'V1' : { type: 'TaskBuster'             , after: ['M','N','O','P','Q','U','U1','U2','j','r'] },

  // suggest REL Workflow after both elementary MR, auto-EP, Buccaneer
  'V2' : { type: 'TaskWFlowREL'           , after: ['M','N','O','P','Q','U','U1','U2','j','r'] },

  // suggest Lorester after Buccaneer and Refmac; not after itself
  'W'  : { type: 'TaskLorestr'            , after: ['U','U2','V','r'] },

  // suggest PaiRef after Refmac and Lorestr
  'W1' : { type: 'TaskPaiRef'             , after: ['V','W','X'] },
  'W2' : { type: 'TaskPDBREDO'            , after: ['V','W','X'] },

  // sugget FitLigand after Refmac, Lorestr and after itself
  'X'  : { type: 'TaskFitLigand'          , after: ['V','W','X','U','U1','U2','r'] },

  // suggest FitWaters after Refmac, Lorestr and Ligands, but not after itself
  'Y'  : { type: 'TaskFitWaters'          , after: ['V','W','X','U','U1','U2','r'] },

  // suggest Zanuda after Refmac and Lorestr
  'Z'  : { type: 'TaskZanuda'             , after: ['V','W'] },

  // suggest Gesamt after Buccaneer, Refmac and Lorestr
  'a'  : { type: 'TaskGesamt'             , after: ['U','U1','U2','V','W','r'] },

  // suggest PISA after Refmac and Lorestr
  'b'  : { type: 'TaskPISA'               , after: ['V','W','X'] },
  'b1' : { type: 'TaskContact'            , after: ['V','W','X'] },
  'b2' : { type: 'TaskRotamer'            , after: ['V','W','X'] },
  'b3' : { type: 'TaskAreaimol'           , after: ['V','W','X'] },
  'b4' : { type: 'TaskRampage'            , after: ['V','W','X'] },
  'b5' : { type: 'TaskSC'                 , after: ['V','W','X'] },
  'b6' : { type: 'TaskOmitMap'            , after: ['V','W','X'] },
  'b7' : { type: 'TaskPrivateer'          , after: ['V','W','X'] },

  // suggest ChangeSpG after dataprocessing tasks
  //'c'  : { type: 'TaskChangeSpG'      , after: ['h','t','u'] },
  'c'  : { type: 'TaskChangeSpGHKL'       , after: ['h','t','u'] },
  // suggest ChangeReso after dataprocessing tasks
  'c1' : { type: 'TaskChangeReso'         , after: ['h','t','u'] },
  'c2' : { type: 'TaskChangeSpGASU'       , after: ['H'] },
  // do not suggest FreeRflag
  'c3' : { type: 'TaskFreeRFlag'          , after: [] },
  'c4' : { type: 'TaskOptimiseASU'        , after: ['V','W','X'] },

  // do not suggest ASUMod
  //'d' : { type: 'TaskASUMod'         , after: [] },
  'd'  : { type: 'TaskEditRevisionASU'    , after: [] },
  'd1' : { type: 'TaskEditRevisionStruct' , after: [] },
  'd2' : { type: 'TaskEditRevision'       , after: [] },
  'e'  : { type: 'TaskASUDefStruct'       , after: ['A'] },

  // suggest SeqAlign after Import
  'f'  : { type: 'TaskSeqAlign'           , after: ['B','B1','m'] },

  // suggest FindMySequence after Simbad
  'f1'  : { type: 'TaskFindMySequence'     , after: ['G'] },

  // do not suggest FacilityImport (retired)
  // 'g'  : { type: 'TaskFacilityImport'     , after: [] },

  // suggest Xia2 after root
  'h'  : { type: 'TaskXia2'               , after: ['0'] },
  'h1' : { type: 'TaskXDS'                , after: ['0'] },

  // suggest Dimple after phasing
  'i'  : { type: 'TaskDimple'             , after: ['M','N','O','P','Q','U','U2','r'] },

  // suggest Coot after refinememnt
  'j'  : { type: 'TaskCootMB'             , after: ['V','W','i','U','U2','r'] },

  // suggest CombStructure after refinememnt
  'j1' : { type: 'TaskCombStructure'      , after: ['V','W','i','U','U2','r'] },

  'j2' : { type: 'TaskWebCoot'             , after: ['V','W','i','U','U2','r'] },

  // suggest PDB Deposition after Refmac
  // 'k'  : { type: 'TaskDeposition'         , after: ['V','V1'] },
  'k1' : { type: 'TaskPDBVal'             , after: ['V','V1'] },

  // do not suggest Coot Cooridinate Editing
  'l'  : { type: 'TaskCootCE'             , after: [] },
  'l1' : { type: 'TaskGemmi'              , after: [] },

  // do not suggest XYZ Utils
  'l2'  : { type: 'TaskXyzUtils'          , after: [] },
  'l3'  : { type: 'TaskTextEditor'        , after: [] },

  // suggest CloudImport alike plain Import
  'm'  : { type: 'TaskCloudImport'        , after: ['0','B','B1','C','D','E','m'] },

  // suggest Acorn after both MR and Phaser-EP; do not suggest it after itself
  'n'  : { type: 'TaskAcorn'              , after: ['J','K','L','M','N','O','R','S'] },

  // suggest Arp/wArp after Simbad, Parrot, MR and EP; do not suggest it after itself
  'o'  : { type: 'TaskArpWarp'            , after: ['J','K','L','M','N','O','S','T','n','T'] },

  // suggest ShelxCD after ASUDef and MR; do not suggest it after auto-EP or itself
  'p'  : { type: 'TaskShelxCD'            , after: ['H','J','K','L','M','N'] },

  // do not suggest SymMatch
  'q'  : { type: 'TaskSymMatch'           , after: [] },

  // suggest CCP4Build after Simbad, MR and EP; do not suggest it after itself
  'r'  : { type: 'TaskCCP4Build'          , after: ['J','K','L','M','N','O','S'] },

  // suggest LsqKab after Buccaneer, Refmac and Lorestr
  's'  : { type: 'TaskLsqKab'             , after: ['U','U2','V','W','r'] },

  // suggest iMosflm after root
  't'  : { type: 'TaskDUI'                , after: ['0'] },

  // suggest iMosflm after root
  'u'  : { type: 'TaskIMosflm'            , after: ['0'] },

  // suggest PDBImport alike plain Import
  'v'  : { type: 'TaskImportPDB'          , after: ['0','B','B1','C','D','E','m'] },

  // suggest EnsemblePrepMG alike TaskEnsemblePrepSeq
  'w'  : { type: 'TaskEnsemblePrepMG'     , after: ['B','B1','D','m'] },

  // suggest XDSGUI after root
  'x'  : { type: 'TaskXDSGUI'             , after: ['0'] }

};


function getTasksFromTaskIndex ( ckey )  {
let tasks = [];

  for (let key in _taskIndex)
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
    for (let key in _taskIndex)
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

  let wfkey = '';
  for (let i=0;i<3;i++)
    if (i<task_type_list.length)
          wfkey = getTaskKeyFromType(task_type_list[i]) + wfkey;
    else  wfkey = getTaskKeyFromType('Root') + wfkey;

  // set or advance the counter

  let tkey = getTaskKeyFromType(new_task_type);
  let knowledge = null;

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

// if ((typeof module === 'undefined') || (typeof module.exports === 'undefined'))  {
//   // clent side

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


    let k1  =  getTaskKeyFromType ( task_type1 );
    let k2  =  getTaskKeyFromType ( task_type2 );
    let k3  =  getTaskKeyFromType ( task_type3 );
    let wfkey = k1 + k2 + k3;

    let knowledge   = { counts: [] };
    knowledge.tasks = getTasksFromTaskIndex ( k3 );
    for (let i=0;i<knowledge.tasks.length;i++)
      knowledge.counts.push ( 1 );

    if (wfkey in _wfKnowledge)  {
      let w = _wfKnowledge[wfkey];
      for (let taskkey in w) {
        if (taskkey in _taskIndex)  {
          let t = _taskIndex[taskkey].type;
          if (t!='Root')  {
            let k = knowledge.tasks.indexOf ( t );
            if (k>=0)
              knowledge.counts[k] += w[taskkey];
            else  {
              knowledge.tasks .push ( t );
              knowledge.counts.push ( w[taskkey] );
            }
          }
        }
      }
    }

    return knowledge;

  }

  function getWfKnowledge ( task1, task2, task3 )  {
  let type1 = '0';
  let type2 = '0';
  let type3 = '0';
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
  let task_type_list = [];
    for (let i=0;i<task_list.length;i++)
      task_type_list.push ( task_list[i]._type );
    addWfKnowledgeByTypes ( _wfKnowledge, new_task._type, task_type_list );
  }


// } else  {
//   // server side

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

  module.exports.addWfKnowledgeByTypes = addWfKnowledgeByTypes;

}
