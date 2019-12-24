
/*
 *  =================================================================
 *
 *    18.12.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */



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

DataBox.prototype.markNotEmpty = function()  {
  if (this.isEmpty())
    this.data['___'] = [1];
}

DataBox.prototype.isEmpty = function()  {
var empty = true;

  for (var dtype in this.data)
    if (this.data[dtype].length>0)  {
      empty = false;
      break;
    }

  return empty;

}

DataBox.prototype.merge = function ( dBox )  {

  this.mergeIds = function ( name )  {
    if (name in dBox)  {
      if (name in this)  {
        for (var i=0;i<dBox[name].length;i++)
          if (this[name].indexOf(dBox[name][i])<0)
            this[name].push ( dBox[name][i] );
      } else
        this[name] = dBox[name];
    }
  }

  for (var dtype in dBox.data)
    if (dtype in this.data)  {
      var d1 = this.data[dtype];
      var d2 = dBox.data[dtype];
      for (var i=0;i<d2.length;i++)  {
        var found = false;
        for (var j=0;(j<d1.length) && (!found);j++)
          found = (d1[j].dataId==d2[i].dataId);
        if (!found)
          d1.push ( d2[i] );
      }
    } else
      this.data[dtype] = dBox.data[dtype];

  this.mergeIds ( 'jobs'      );
  this.mergeIds ( 'inp_assoc' );

  for (var item in dBox)
    if (!(item in this))
      this[item] = dBox[item];

  return;

}

DataBox.prototype.extendData = function()  {
// Extends all data objects in the box (i.e. deep copies them in-place).
  for (var dtype in this.data)
    for (var i=0;i<this.data[dtype].length;i++)
      if (typeof this.data[dtype][i] === 'object' && this.data[dtype][i] !== null)
        this.data[dtype][i] = this.data[dtype][i].extend();
}


DataBox.prototype._add_assoc_data = function ( task )  {
  var input_data_data  = task.input_data.data;
  if ('inp_assoc' in this)  {
    for (var dtype in input_data_data)  {
      if (!(dtype in this.inp_assoc))
        this.inp_assoc[dtype] = [];
      for (var i=0;i<input_data_data[dtype].length;i++)
        if (this.inp_assoc[dtype].indexOf(input_data_data[dtype][i].dataId)<0)
          this.inp_assoc[dtype].push ( input_data_data[dtype][i].dataId );
    }
  }
}


DataBox.prototype.addTaskData = function ( task,include_used_bool )  {

  var output_data_data = task.output_data.data;
  //var input_data_data  = task.input_data.data;
  if (this.jobs.indexOf(task.id)<0)
    this.jobs.push ( task.id );

  for (var dtype in output_data_data)  {
    if (!(dtype in this.data))
      this.data[dtype] = [];
    if ((this.data[dtype].length<=0) || output_data_data[dtype][0].backtrace)  {
      for (var i=0;i<output_data_data[dtype].length;i++)  {
        var dt    = output_data_data[dtype][i];
        var found = false;
        for (var j=0;(j<this.data[dtype].length) && (!found);j++)
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

  var output_data_data = task.output_data.data;
  var input_data_data  = task.input_data.data;
  if (this.jobs.indexOf(task.id)<0)
    this.jobs.push ( task.id );

  for (var inpId in input_data_data)
    if (!startsWith(inpId,'void'))  {
      for (var i=0;i<input_data_data[inpId].length;i++)  {
        var dt    = input_data_data[inpId][i];
        var dtype = dt._type;
        if (!(dtype in this.data))
          this.data[dtype] = [dt];
        else if (addall_bool)
          this.data[dtype].push ( dt );
        else if (dt.backtrace)  {
          var found = false;
          for (var j=0;(j<this.data[dtype].length) && (!found);j++)
            found = (this.data[dtype][j].dataId==dt.dataId);
          if (!found)
            this.data[dtype].push ( dt );
        }
      }
    }

  this._add_assoc_data ( task );

}


DataBox.prototype.addData = function ( data )  {

  var dtype = data._type;
  if (!(dtype in this.data))
    this.data[dtype] = [];
  this.data[dtype].push ( data );

}

/*
DataBox.prototype.addDefaultData = function()  {
  var unknownSequence = new DataSequence();
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
  var ids = [];
  if (data_type)  {
    if (data_type in this.data)  {
      for (var i=0;i<this.data[data_type].length;i++)
        ids.push ( this.data[data_type][i].dataId );
    }
  } else  {
    for (dtype in this.data)  {
      for (var i=0;i<this.data[dtype].length;i++)
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


DataBox.prototype.compareSubtypes = function ( task_subtypes,data_subtypes )  {
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
var rc = false;
var nt = task_subtypes.length;

  if (nt<=0)  {
    rc = true;
  } else  { //if (data_subtypes.length>0)  {
    for (var i=0;i<nt;i++)
//      if (task_subtypes[i].startsWith('!'))  {
      if (task_subtypes[i].constructor===Array)  {
        rc = false;
        for (var j=0;(j<task_subtypes[i].length) && (!rc);j++)
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


DataBox.prototype.getDataSummary = function ( task )  {

  var summary = { status : 2 };

  if ((task.input_dtypes.length==1) && (task.input_dtypes[0]==1))  {
    var ndata = 0;
    for (var dtype in this.data)
      if (dtype!='undefined')
        ndata += this.data[dtype].length;
    if (ndata>0)
      summary.status = 0;
    return summary;
  }

  for (var i=0;i<task.input_dtypes.length;i++)  {

    var nDTypes  = 0;
    var inp_item = task.input_dtypes[i];
    var inp_data = inp_item.data_type;
    var title    = '';
    var desc     = '';
    if (inp_item.hasOwnProperty('desc'))
      desc = inp_item.desc;
    var hints    = [];
    //var mustHaveTypes    = [];
    //var mustNotHaveTypes = [];
    var data_types = {};  // will contain n_required data types with subtypes

    for (var dtype in inp_data)  {

      data_types[dtype] = inp_data[dtype];

      if (dtype in this.data)  {
        var idata = inp_data[dtype];   // input data specs
        var tdata = this.data[dtype];  // list of data available to task
        if (idata.length<=0)  {  // all subtypes are good
          nDTypes += tdata.length;
        } else  {  // count datasets with suitable subtypes
          for (var j=0;j<tdata.length;j++)  {
            if (this.compareSubtypes(idata,tdata[j].subtype))
              nDTypes++;
          }
        }
      }

      var dobj = getObjectInstance ( '{ "_type" : "' + dtype + '" }' );
      if (title) title += ' <i>or</i><br>';
      if (dobj)  title += dobj.title();
           else  title += dtype;

      if (inp_data[dtype].length>0)  {
        title += ' (';
        for (var j=0;j<inp_data[dtype].length;j++)  {
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

    var n_required = inp_item.min;
    var n_allowed  = inp_item.max;
    if (title in summary)  {
      n_required = Math.max ( n_required,summary[title].n_required );
      n_allowed  = Math.min ( n_allowed ,summary[title].n_allowed  );
    }

    var rc = 2;
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

  for (t in summary)
    if (t!='status')
      summary.status = Math.min ( summary.status,summary[t].status );

  return summary;

}


// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {

  module.exports.DataBox = DataBox;

}
