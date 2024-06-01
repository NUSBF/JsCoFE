
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.box.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Data Box
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __cmd  = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __cmd  = require ( '../common.commands' );


// -------------------------------------------------------------------------
// Data container class:
//
//  { _type : 'DataBox',
//    data  : {
//      data_type_1 : [data11,data12,data13,...],
//      data_type_2 : [data21,data22,data23,...],
//      .............................
//    },
//    jobs : [jobN,jobNm1,jobNm2]
//  }
//
//  where dataIJ is one of DataType classes.

function DataBox()  {

  this._type = 'DataBox';
  this.data  = {};
  this.jobs  = [];

}

if (__cmd)
  __cmd.registerClass1 ( 'DataBox',DataBox,null );
else    registerClass1 ( 'DataBox',DataBox,null );


DataBox.prototype.markNotEmpty = function()  {
  if (this.isEmpty())
    this.data['___'] = [1];
}

DataBox.prototype.isEmpty = function()  {
let empty = true;

  for (let dtype in this.data)  {
    if (dtype=='___')
      empty = false;
    else if ((this.data[dtype]!='undefined') && (this.data[dtype].length>0))  {
      let item = this.data[dtype][0];
      if (isObject(item))  {
        if (!item.hasSubtype('proxy'))
          empty = false;
      } else
        empty = false;
    }
    if (!empty)
      break;
  }

  return empty;

}

DataBox.prototype.merge = function ( dBox )  {

  this.mergeIds = function ( name )  {
    if (name in dBox)  {
      if (name in this)  {
        for (let i=0;i<dBox[name].length;i++)
          if (this[name].indexOf(dBox[name][i])<0)
            this[name].push ( dBox[name][i] );
      } else
        this[name] = dBox[name];
    }
  }

  for (let dtype in dBox.data)
    if (dtype in this.data)  {
      let d1 = this.data[dtype];
      let d2 = dBox.data[dtype];
      for (let i=0;i<d2.length;i++)  {
        let found = false;
        for (let j=0;(j<d1.length) && (!found);j++)
          found = (d1[j].dataId==d2[i].dataId);
        if (!found)
          d1.push ( d2[i] );
      }
    } else
      this.data[dtype] = dBox.data[dtype];

  this.mergeIds ( 'jobs'      );
  this.mergeIds ( 'inp_assoc' );

  for (let item in dBox)
    if (!(item in this))
      this[item] = dBox[item];

  return;

}

DataBox.prototype.extendData = function()  {
// Extends all data objects in the box (i.e. deep copies them in-place).
  for (let dtype in this.data)
    for (let i=0;i<this.data[dtype].length;i++)
      if (typeof this.data[dtype][i] === 'object' && this.data[dtype][i] !== null)
        this.data[dtype][i] = this.data[dtype][i].extend();
}


DataBox.prototype._add_assoc_data = function ( task )  {
  let input_data_data  = task.input_data.data;
  if ('inp_assoc' in this)  {
    for (let dtype in input_data_data)  {
      if (!(dtype in this.inp_assoc))
        this.inp_assoc[dtype] = [];
      for (let i=0;i<input_data_data[dtype].length;i++)
        if (this.inp_assoc[dtype].indexOf(input_data_data[dtype][i].dataId)<0)
          this.inp_assoc[dtype].push ( input_data_data[dtype][i].dataId );
    }
  }
}


DataBox.prototype.addTaskData = function ( task,include_used_bool )  {

  let output_data_data = task.output_data.data;
  //let input_data_data  = task.input_data.data;
  if (this.jobs.indexOf(task.id)<0)
    this.jobs.push ( task.id );

  for (let dtype in output_data_data)  {
    if (!(dtype in this.data))
      this.data[dtype] = [];
    if ((this.data[dtype].length<=0) || output_data_data[dtype][0].backtrace)  {
      for (let i=0;i<output_data_data[dtype].length;i++)  {
        let dt    = output_data_data[dtype][i];
        let found = false;
        for (let j=0;(j<this.data[dtype].length) && (!found);j++)
          found = (this.data[dtype][j].dataId==dt.dataId);
        if (!found)
          this.data[dtype].push ( dt );
      }
    }
  }

  if (include_used_bool)
        this.addTaskInputData ( task,false );
  else  this._add_assoc_data  ( task );

}


DataBox.prototype.addTaskInputData = function ( task,addall_bool )  {

  // let output_data_data = task.output_data.data;
  let input_data_data  = task.input_data.data;
  if (this.jobs.indexOf(task.id)<0)
    this.jobs.push ( task.id );

  for (let inpId in input_data_data)
    if (!startsWith(inpId,'void'))  {
      for (let i=0;i<input_data_data[inpId].length;i++)  {
        let dt = input_data_data[inpId][i];
        if ((dt!==null) && (typeof dt === 'object'))  {
          let dtype = dt._type;
          if (!(dtype in this.data))
            this.data[dtype] = [dt];
          else if (addall_bool)
            this.data[dtype].push ( dt );
          else if (dt.backtrace)  {
            let found = false;
            for (let j=0;(j<this.data[dtype].length) && (!found);j++)
              found = (this.data[dtype][j].dataId==dt.dataId);
            if (!found)
              this.data[dtype].push ( dt );
          }
        }
      }
    }

  this._add_assoc_data ( task );

}


DataBox.prototype.addData = function ( data )  {
  if (data)  {
    let dtype = data._type;
    if (!(dtype in this.data))
      this.data[dtype] = [];
    this.data[dtype].push ( data );
  }
}

/*
DataBox.prototype.addDefaultData = function()  {
  let unknownSequence = new DataSequence();
  unknownSequence.setUnknown();
  this.addData ( unknownSequence );
}
*/

DataBox.prototype.addCustomData = function ( dataId,data )  {

  if (!(dataId in this.data))
    this.data[dataId] = [];
  this.data[dataId].push ( data );

}


DataBox.prototype.getDataIds = function ( data_type )  {
  let ids = [];
  if (data_type)  {
    if (data_type in this.data)  {
      for (let i=0;i<this.data[data_type].length;i++)
        ids.push ( this.data[data_type][i].dataId );
    }
  } else  {
    for (let dtype in this.data)  {
      for (let i=0;i<this.data[dtype].length;i++)
        ids.push ( this.data[dtype][i].dataId );
    }
  }
  return ids;
}


DataBox.prototype.getData = function ( data_type )  {
  if (data_type in this.data)
    return this.data[data_type];
  return [];
}


DataBox.prototype.compareSubtypes = function ( task_subtypes,data_object )  {
// Returns true if
//  a) task_subtypes is empty [] or
//  b) all enforced items from task_subtypes are found in data_subtypes or
//  c) if no enforced items are found in task_subtypes, then at least one
//     item from task_subtypes is found in data_subtypes _and_ no data subtype
//     is marked with negative sign (~) in list of task subtypes.
// Enforced items in task_subtypes are marked with exclamation mark, e.g.,
// ['!MR','!Protein'] enforces both subtypes 'MR' and 'Protein', so that
// both of them need to be matched. A special case of enforcement is to group
// alternative subtypes. E.g., ['!MR','Protein',['xyz','substructure']] will
// force selection of data where either 'xyz' or 'substructure', in addition to
// 'MR' and 'Protein', are found in subtypes. If subtypes are not enforced, e.g.,
// ['MR','Protein'] then comparison will return true if any of them are found
// in data_subtypes.
let rc = false;
let nt = task_subtypes.length;

  if (nt<=0)  {
    rc = true;
  } else  { //if (data_subtypes.length>0)  {
    let data_subtypes = data_object.subtype;
    let leadKey = -1;
    if ('leadKey' in data_object)
      leadKey = data_object.leadKey;
    for (let i=0;i<nt;i++)
      if (task_subtypes[i].constructor===Array)  {
        rc = false;
        for (let j=0;(j<task_subtypes[i].length) && (!rc);j++)
          rc = (data_subtypes.indexOf(task_subtypes[i][j])>=0) ||
               ((task_subtypes[i][j]=='EP') && (leadKey==2))   ||
               ((task_subtypes[i][j]=='MR') && (leadKey==1));
        if (!rc)
          break;
      } else if (startsWith(task_subtypes[i],'!'))  {
        let stype = task_subtypes[i].substr(1);
        rc = (data_subtypes.indexOf(stype)>=0) ||
             ((stype=='EP') && (leadKey==2))   ||
             ((stype=='MR') && (leadKey==1));
        if (!rc)
          break;
      } else if (startsWith(task_subtypes[i],'~'))  {
        let stype = task_subtypes[i].substr(1);
        rc = (data_subtypes.indexOf(stype)<0) &&
             ((stype!='EP') || (leadKey!=2))  &&
             ((stype!='MR') || (leadKey!=1));
        if (!rc)
          break;
      } else if ((data_subtypes.indexOf(task_subtypes[i])>=0) ||
                 ((task_subtypes[i]=='EP') && (leadKey==2))   ||
                 ((task_subtypes[i]=='MR') && (leadKey==1)))
        rc = true;
  }

  return rc;

}


/*
// DataBox.prototype.compareSubtypes = function ( task_subtypes,data_subtypes )  {
// Returns true if
//  a) task_subtypes is empty [] or
//  b) all enforced items from task_subtypes are found in data_subtypes or
//  c) if no enforced items are found in task_subtypes, then at least one
//     item from task_subtypes is found in data_subtypes _and_ no data subtype
//     is marked with negative sign (~) in list of task subtypes.
// Enforced items in task_subtypes are marked with exclamation mark, e.g.,
// ['!MR','!Protein'] enforces both subtypes 'MR' and 'Protein', so that
// both of them need to be matched. A special case of enforcement is to group
// alternative subtypes. E.g., ['!MR','Protein',['xyz','substructure']] will
// force selection of data where either 'xyz' or 'substructure', in addition to
// 'MR' and 'Protein', are found in subtypes. If subtypes are not enforced, e.g.,
// ['MR','Protein'] then comparison will return true if any of them are found
// in data_subtypes.
let rc = false;
let nt = task_subtypes.length;

  if (nt<=0)  {
    rc = true;
  } else  { //if (data_subtypes.length>0)  {
    for (let i=0;i<nt;i++)
//      if (task_subtypes[i].startsWith('!'))  {
      if (task_subtypes[i].constructor===Array)  {
        rc = false;
        for (let j=0;(j<task_subtypes[i].length) && (!rc);j++)
          rc = (data_subtypes.indexOf(task_subtypes[i][j])>=0);
        if (!rc)
          break;
      } else if (startsWith(task_subtypes[i],'!'))  {
        rc = (data_subtypes.indexOf(task_subtypes[i].substr(1))>=0);
        if (!rc)
          break;
//      } else if (task_subtypes[i].startsWith('~'))  {
      } else if (startsWith(task_subtypes[i],'~'))  {
        rc = (data_subtypes.indexOf(task_subtypes[i].substr(1))<0);
        if (!rc)
          break;
      } else if (data_subtypes.indexOf(task_subtypes[i])>=0)
        rc = true;
  }

  return rc;

}
*/


DataBox.prototype.getDataSummary = function ( task )  {

  let summary = { status : 2 };   //  2: green, all data is just right
                                  //  1: amber, ambiguous data, needs choice
                                  //  0: some or all data missing

  // if ((task.input_dtypes.length==1) && (task.input_dtypes[0]==1))  {
  if (task.getInputMode()==input_mode.root)  {
    let ndata = 0;
    for (let dtype in this.data)
      if (dtype!='undefined')
        ndata += this.data[dtype].length;
    if (ndata>0)
      summary.status = 0;
    // for (let i=0;(i<task.input_dtypes.length) && (summary.status>0);i++)
    //   if (task.input_dtypes[i].min>0)
    //     summary.status = 0;
    return summary;
  }

  for (let i=0;i<task.input_dtypes.length;i++)  {

    let nDTypes  = 0;
    let inp_item = task.input_dtypes[i];
    let inp_data = inp_item.data_type;
    let title    = '';
    let desc     = '';
    if (inp_item.hasOwnProperty('desc'))
      desc = inp_item.desc;
    let hints    = [];
    //let mustHaveTypes    = [];
    //let mustNotHaveTypes = [];
    let data_types = {};  // will contain n_required data types with subtypes

    for (let dtype in inp_data)  {

      data_types[dtype] = inp_data[dtype];

      if (dtype in this.data)  {
        let idata = inp_data[dtype];   // input data specs
        let tdata = this.data[dtype];  // list of data available to task
        if (idata.length<=0)  {  // all subtypes are good
          nDTypes += tdata.length;
        } else  {  // count datasets with suitable subtypes
          for (let j=0;j<tdata.length;j++)  {
            // if (this.compareSubtypes(idata,tdata[j].subtype))
            if (this.compareSubtypes(idata,tdata[j]))
              nDTypes++;
          }
        }
      }

      let dobj = getObjectInstance ( '{ "_type" : "' + dtype + '" }' );
      if (title) title += ' <i>or</i><br>';
      if (dobj)  title += dobj.title();
           else  title += dtype;

      if (inp_data[dtype].length>0)  {
        title += ' (';
        for (let j=0;j<inp_data[dtype].length;j++)  {
          if (j>0)
            title += ',';
          if (inp_data[dtype][j].constructor==Array)
                title += inp_data[dtype][j].join('|');
          else  title += inp_data[dtype][j];
        }
        title += ')';
      }

      hints = hints.concat ( dobj.dataDialogHints(inp_data[dtype],inp_item.max) );

    }

    let n_required = inp_item.min;
    let n_allowed  = inp_item.max;
    if (title in summary)  {
      n_required = Math.max ( n_required,summary[title].n_required );
      n_allowed  = Math.min ( n_allowed ,summary[title].n_allowed  );
    }

    let rc = 2;
    if ((nDTypes<n_required) || ((inp_item.max<=0) && (nDTypes>0)))  // no match (red)
      rc = 0;
    else if (nDTypes>n_required)
      rc = 1;  // ok, but umbiguous (amber)

    /*
    summary[title] = {
      status      : rc,
      n_available : nDTypes,
      n_required  : n_required,
      n_allowed   : n_allowed,
      hints       : hints,
      dtypes      : data_types,
      desc        : desc
    }
    */

    summary[title] = task.addDataDialogHints ( inp_item,{
      status      : rc,
      n_available : nDTypes,
      n_required  : n_required,
      n_allowed   : n_allowed,
      hints       : hints,
      dtypes      : data_types,
      desc        : desc
    });

  }

  for (let t in summary)
    if (t!='status')
      summary.status = Math.min ( summary.status,summary[t].status );

  return summary;

}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

  module.exports.DataBox = DataBox;

}
