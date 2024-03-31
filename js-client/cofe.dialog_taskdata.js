
/*
 *  =================================================================
 *
 *    31.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_taskdata.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task Data Dialog (shows data availability for given task)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// TaskDataDialog class

function TaskDataDialog ( dataSummary,task,avail_key )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',task.title );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  let drow = 0;

  if (avail_key[0]!='ok')  {

    this.grid.setLabel ( avail_key[2],drow++,0, 1,2 );

  } else if (task.getInputMode()==input_mode.root)  {

    this.grid.setLabel ( 'This task:<h3>' + task.title +
                         '</h3>can be run only on top of Project.<p><hr/>' +
                         '<i>Highlight the top node of the job tree and add ' +
                         'this task from there.</i>',
                         drow++,0, 1,2 );

  } else  {

    // if (avail_key[0]!='ok')
    //   this.grid.setLabel ( avail_key[2],drow++,0, 1,2 );

    /*
    let msg = '';
    switch (avail_key)  {
      case 'client' :
            msg = '<h3>CCP4 Cloud Client is required</h3>';
            if (__any_mobile_device)
              msg += 'This task cannot be used when working with ' + appName() +
                     ' from mobile devices.<br>In order to use the task, ' +
                     'access ' + appName() + ' via CCP4 Cloud Client,<br>' +
                     'found in CCP4 Software Suite.';
            else
              msg += 'This task can be used only if ' + appName() +
                     ' was accessed via CCP4 Cloud Client,<br>found in ' +
                     'CCP4 Software Suite.';
          break;
      case 'client-storage' :
              msg += '<h3>CCP4 Cloud Client is required</h3>' +
                     'This task can be used only if ' + appName() +
                     ' was accessed via CCP4 Cloud Client,<br>found in ' +
                     'CCP4 Software Suite, or if user has access to ' +
                     'Cloud Storage.';
          break;
      case 'client-version' :
              msg += '<h3>Too low version of CCP4 Cloud Client</h3>' +
                     'This task requires a higher version of CCP4 Cloud ' +
                     'Client.<br>Please update CCP4 Software Suite on ' +
                     'your device.';
          break;
      case 'authorisation'   :
              msg += '<h3>Authorisation is required</h3>' +
                     'This task requires authorisation from ' +
                     __auth_software[task.authorisationID()].desc_provider +
                     ',<br>which may be obtained in "My Account" page.';
          break;
      case 'server-excluded' :
              msg = '<h3>Task is not available on server</h3>' +
                    'The task is excluded from configuration on ' + appName() +
                    ' server which you use.<br>This may be due to the ' +
                    'availability of software or resources, which are ' +
                    '<br>required for the task.';
          break;
      case 'windows-excluded' :
              msg = '<h3>Task is not available on MS Windows systems</h3>' +
                    'The task is based on program components that are not ' +
                    'suitable for MS Windows,<br>and, therefore, cannot be run.';
          break;
      case 'environment-server' :
              msg += '<h3>Task software is not installed on server</h3>' +
                     'Software, needed to run the task, is not installed on ' +
                     appName() + ' server which you use.<br>Contact server ' +
                     'maintainer for further details.';
          break;
      case 'environment-client' :
              msg += '<h3>Task software is not installed on your device</h3>' +
                     'The task is run on your device, but needful software is ' +
                     'not installed on it.<br>Consult software documentation ' +
                     'for further details.';
          break;
      default : ;
    }

    if (msg)
      this.grid.setLabel ( msg,drow++,0, 1,2 );
    */

    let dataCount = 0;
    for (let key in dataSummary)
      if (key!='status')
        dataCount++;

    if (dataCount<=0)  {
      this.grid.setLabel ( '<h3>Data summary</h3>' +
                           'This task does not use data from any other task in ' +
                           appName() + '.',drow++,0, 1,2 );
    } else  {

      let dataSummary_lbl = this.grid.setLabel ( '',drow++,0, 1,2 ).setWidth('650px');

      let table = this.grid.setTable ( drow++,0, 1,2 );
      table.setHeaderText ( 'Input Data', 0,0, 1,1 );
      table.setHeaderText ( 'Status'    , 0,1, 1,1 );
      table.setHeaderText ( 'Required'  , 0,2, 1,1 );
      table.setHeaderText ( 'Available' , 0,3, 1,1 );
      for (let c=0;c<4;c++)
        table.setNoWrap ( 0,c );

      let row   = 1;
      let hints = [];
      let dataStatus    = true;
      let n_disallowed  = 0;
      let n_unavailable = 0;
      for (let key in dataSummary)
        if (key!='status')  {
          table.setLabel ( this.getDataDescription(dataSummary[key]),row,0, 1,1 );
          let icon_uri;
          switch (dataSummary[key].status)  {
            default :
            case 0  : icon_uri   = image_path('data_absent');
                      hints      = hints.concat ( dataSummary[key].hints );
                      dataStatus = false;
                  break;
            case 1  : icon_uri = image_path('ok_amber');  break;
            case 2  : icon_uri = image_path('ok');        break;
          }
          table.setImage ( icon_uri,'','20px',row,1, 1,1 );
    //      table.setLabel ( dataSummary[key].note,row,2, 1,1 );
          if (dataSummary[key].n_allowed<=0)  {
            if (dataSummary[key].n_available>0)
              n_disallowed++;
            table.setLabel ( 'not allowed',               row,2, 1,1 );
          } else if (dataSummary[key].n_required<=0)
            table.setLabel ( 'optional',                  row,2, 1,1 );
          else  {
            if (dataSummary[key].n_available<=0)
              n_unavailable++;
            table.setLabel ( dataSummary[key].n_required, row,2, 1,1 );
          }
          if (dataSummary[key].n_available<=0)
                table.setLabel ( 'none',                      row,3, 1,1 );
          else  table.setLabel ( dataSummary[key].n_available,row,3, 1,1 );
          row++;
        }

      let font_family = '"Trebuchet MS", Arial, Helvetica, sans-serif';
      for (let i=0;i<row;i++)  {
        table.setNoWrap              ( i,0 );
        table.setHorizontalAlignment ( i,0,'left'   ).setFontFamily(i,0,font_family);
        table.setHorizontalAlignment ( i,1,'center' );
        table.setHorizontalAlignment ( i,2,'right'  ).setFontFamily(i,2,font_family);
        table.setHorizontalAlignment ( i,3,'right'  ).setFontFamily(i,3,font_family);
        table.setVerticalAlignment   ( i,0,'middle' );
        table.setVerticalAlignment   ( i,1,'middle' );
        table.setVerticalAlignment   ( i,2,'middle' );
        table.setVerticalAlignment   ( i,3,'middle' );
      }

      if (!dataStatus)  {
        let summary_info = '';
        let advise_info  = '';
        if  ((n_disallowed>0) && (n_unavailable<=0))  {
          summary_info = '<h2>Project workflow restrictions</h2>' +
                         'This task cannot be run at this point of the project, ' +
                         'because data type(s), shown below, ' +
                         'are present but not allowed.';
          advise_info  = 'Branch your project by adding this task to a node of ' +
                         'the project tree, where disallowed data do not ' +
                         'exist (before they were created or imported).';
        } else if ((n_disallowed>0) && (n_unavailable>0))  {
          summary_info = '<h2>Missing data and project workflow restrictions</h2>' +
                         'Full set of data, needed to run this task, was not ' +
                         'imported or otherwise generated. In addition, this ' +
                         'task cannot be run at this point of the project, ' +
                         'because data type(s), shown below, ' +
                         'are present but not allowed.';
          advise_info  = 'Use <b><i>Import</i></b> task to import missing data, ' +
                         'or run respective job(s) in order to generate them.' +
                         'Also, branch your project by adding this task to a ' +
                         'node of the project tree, where disallowed data do not ' +
                         'exist (before they were created or imported).';
        } else  {
          summary_info = '<h2>Insufficient data</h2>' +
                         'Full set of data, needed to run this task, ' +
                         'was not imported or otherwise generated.';
          advise_info  = 'Use <b><i>Import</i></b> task to import ' +
                         'missing data, or run respective job(s) in order to ' +
                         'generate them.';
        }
        dataSummary_lbl.setText ( summary_info + '<p><h3>Data summary</h3>' );
        this.grid.setLabel ( '&nbsp;<p>' + advise_info +
                             ' Check data types and respective job summary ' +
                             '<a href="javascript:' +
                                'launchHelpBox1(\'Data Management\',' +
                                '\'' + __task_reference_base_url +
                                  'doc.task.Import.html#ccp4-cloud-data-management\',null,10)"><i>' +
                                String('here').fontcolor('blue') + '</i></a>.',
                             drow++,0, 1,2 ).setWidth('650px');
      } else
        dataSummary_lbl.setText ( '<h3>Data summary</h3>' );

      hints = hints.filter(function(hint) { return hint.trim()!=''; });
      if (hints.length==1)  {
        this.grid.setLabel ( '<b><i>Hint:</i></b>', drow,0, 1,1 );
        this.grid.setLabel ( hints[0], drow,1, 1,1 ).setWidth_px ( 600 );
      } else  {
        for (let i=0;i<hints.length;i++)  {
          this.grid.setLabel ( '<b><i>Hint&nbsp;'+(i+1)+':</i></b>', drow,0, 1,1 );
          this.grid.setLabel ( hints[i], drow++,1, 1,1 ).setWidth_px ( 600 );
        }
      }

    }

  }

  $(this.element).dialog({
    resizable : true,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {
      "Close": function() {
        $( this ).dialog( "close" );
      }
    }
  });

}

TaskDataDialog.prototype = Object.create ( Widget.prototype );
TaskDataDialog.prototype.constructor = TaskDataDialog;

TaskDataDialog.prototype.getDataDescription = function ( dataSpec )  {

  function _make_list ( items )  {
    if (items.length<=0)  return '';
    if (items.length==1)  return ' ' + items[0];
    let s = '<ul style="margin:0;">';
    for (let k=0;k<items.length;k++)
      s += '<li>' + items[k] + '</li>';
    return s+'</ul>';
  }

  let html = '';
  for (let dtype in dataSpec.dtypes)  {

    let dobj = getObjectInstance ( '{ "_type" : "' + dtype + '" }' );

    if (html.length>0)  {
      if (!endsWith(html,'</ul>'))
        html += '<br>';
      html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b><i>-- or --</i></b><br>';
    }
    html += '<b>' + dobj.title() + '</b>';
    if (dataSpec.desc)
      html += ' (' + dataSpec.desc + ')';
    let items_of = [];  // one of
    let items_cp = [];  // compulsory
    let subtypes = dataSpec.dtypes[dtype];
    if (subtypes.length>1)  {
      for (let i=0;i<subtypes.length;i++)  {
        let stype = dobj.getSubtypeDescription ( subtypes[i] );
        if (stype)  {
          if (stype[0]==0)  items_of.push ( stype.substring(1) );
                      else  items_cp.push ( stype );
        }
      }
    } else if (subtypes.length==1)  {
      let stype = dobj.getSubtypeDescription ( subtypes[0] );
      if (stype)  {
        if (stype[0]==0)  items_of.push ( stype.substring(1) );
                    else  items_cp.push ( stype );
      }
    }// else
    //  html += ' (any)';

    let bridge_word = dobj.ddesc_bridge_word();
    let n = items_cp.length + items_of.length;
    if (n==1)  {
      html += bridge_word;
      if (items_cp.length==1)  html += items_cp[0];
                         else  html += items_of[0];
    } else if (n>1)  {
      html += bridge_word;
      if (items_cp.length==0)
        html += 'at least one of' + _make_list(items_of);
      else  {
        for (let i=0;i<items_of.length;i++)
          items_cp.push ( 'optional ' + items_of[i] );
        html += _make_list(items_cp);
      }
    }

  }

  return html;

}
