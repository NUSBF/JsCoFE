
/*
 *  =================================================================
 *
 *    11.08.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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

DataBox.prototype.isEmpty = function()  {
var empty = true;

  for (var dtype in this.data)
    if (this.data[dtype].length>0)  {
      empty = false;
      break;
    }
  return empty;
}

DataBox.prototype.extendData = function()  {
// Extends all data objects in the box (i.e. deep copies them in-place).
  for (var dtype in this.data)
    for (var i=0;i<this.data[dtype].length;i++)
      this.data[dtype][i] = this.data[dtype][i].extend();
}

DataBox.prototype.addTaskData = function ( task,include_used_bool )  {

  var td = task.output_data.data;
  this.jobs.push ( task.id );

  for (var dtype in td)
    if (!(dtype in this.data))
      this.data[dtype] = td[dtype];
    else if (td[dtype][0].backtrace)  {
      for (var i=0;i<td[dtype].length;i++)  {
        var dt    = td[dtype][i];
        var found = false;
        for (var j=0;(j<this.data[dtype].length) && (!found);j++)
          found = (this.data[dtype][j].dataId==dt.dataId);
        if (!found)
          this.data[dtype].push ( dt );
      }
    }

  if (include_used_bool)  {

    td = task.input_data.data;
    for (var inpId in td)
//      if (!inpId.startsWith('void'))  {
      if (!startsWith(inpId,'void'))  {
        for (var i=0;i<td[inpId].length;i++)  {
          var dt    = td[inpId][i];
          var dtype = dt._type;
          if (!(dtype in this.data))
            this.data[dtype] = [dt];
          else if (dt.backtrace)  {
            var found = false;
            for (var j=0;(j<this.data[dtype].length) && (!found);j++)
              found = (this.data[dtype][j].dataId==dt.dataId);
            if (!found)
              this.data[dtype].push ( dt );
          }
        }
      }

  }

  if ('inp_assoc' in this)  {
    var td = task.input_data.data;
    for (var dtype in td)  {
      if (!(dtype in this.inp_assoc))
        this.inp_assoc[dtype] = [];
      for (var i=0;i<td[dtype].length;i++)
        if (this.inp_assoc[dtype].indexOf(td[dtype][i].dataId)<0)
          this.inp_assoc[dtype].push ( td[dtype][i].dataId );
    }
  }

}


DataBox.prototype.addData = function ( data )  {

  var dtype = data._type;
  if (!(dtype in this.data))
    this.data[dtype] = [];
  this.data[dtype].push ( data );

}


DataBox.prototype.addCustomData = function ( dataId,data )  {

  if (!(dataId in this.data))
    this.data[dataId] = [];
  this.data[dataId].push ( data );

}


DataBox.prototype.getDataIds = function ( data_type )  {
  var ids = [];
  if (data_type in this.data)  {
    for (var i=0;i<this.data[data_type].length;i++)
      ids.push ( this.data[data_type][i].dataId );
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
// both of them need to be matched. If subtypes are not enforced, e.g.,
// ['MR','Protein'] then comparison will return true if any of them are found
// in data_subtypes.
var rc = false;
var nt = task_subtypes.length;

  if (nt<=0)  {
    rc = true;
  } else  { //if (data_subtypes.length>0)  {
    for (var i=0;i<nt;i++)
//      if (task_subtypes[i].startsWith('!'))  {
      if (startsWith(task_subtypes[i],'!'))  {
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
    var hints    = [];

    for (var dtype in inp_data)  {

      if (dtype in this.data)  {
        var idata = inp_data[dtype];
        var tdata = this.data[dtype];
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

      if (inp_data[dtype].length>0)
        title += ' (' + inp_data[dtype].join() +')';

      hints = hints.concat ( dobj.dataDialogHints(inp_data[dtype]) );

    }

    var required = inp_item.min;
    if (title in summary)
      required = Math.max ( required,summary[title].required );

    var rc = 2;
    if (nDTypes<required)  // no match (red)
      rc = 0;
    else if (nDTypes>required)
      rc = 1;  // ok, but umbiguous (amber)

    summary[title] = {
      status    : rc,
      available : nDTypes,
      required  : required,
      hints     : hints
    }

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
