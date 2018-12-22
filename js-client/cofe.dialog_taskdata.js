
/*
 *  =================================================================
 *
 *    12.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// TaskListDialog class

function TaskDataDialog ( dataSummary,task )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',task.title );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  if ((task.input_dtypes.length==1) && (task.input_dtypes[0]==1))  {

    this.grid.setLabel ( 'This task:<h3>' + task.title +
                         '</h3>can be run only on top of Project.<p><hr/>' +
                         '<i>Highlight the top node of the job tree and add ' +
                         'this task from there.</i>',
                         0,0, 1,2 );

  } else  {

    this.grid.setLabel ( 'Full set of data, needed to run this task, ' +
                         'was not imported or otherwise generated.<p>' +
                         '<b><i>Data summary</i></b>',
                         0,0, 1,2 );

    var table = this.grid.setTable ( 1,0, 1,2 );
    table.setHeaderText ( 'Input Data', 0,0, 1,1 );
    table.setHeaderText ( 'Status'    , 0,1, 1,1 );
    table.setHeaderText ( 'Required'  , 0,2, 1,1 );
    table.setHeaderText ( 'Available' , 0,3, 1,1 );
    for (var c=0;c<4;c++)
      table.setNoWrap ( 0,c );

    var row   = 1;
    var hints = [];
    for (var key in dataSummary)
      if (key!='status')  {
        table.setLabel ( key,row,0, 1,1 );
        var icon_uri;
        switch (dataSummary[key].status)  {
          default :
          case 0  : icon_uri = image_path('data_absent');
                    hints    = hints.concat ( dataSummary[key].hints );
                break;
          case 1  : icon_uri = image_path('ok_amber');  break;
          case 2  : icon_uri = image_path('ok');        break;
        }
        table.setImage ( icon_uri,'','20px',row,1, 1,1 );
  //      table.setLabel ( dataSummary[key].note,row,2, 1,1 );
        if (dataSummary[key].required<=0)
              table.setLabel ( 'optional',                row,2, 1,1 );
        else  table.setLabel ( dataSummary[key].required, row,2, 1,1 );
        if (dataSummary[key].available<=0)
              table.setLabel ( 'none',                    row,3, 1,1 );
        else  table.setLabel ( dataSummary[key].available,row,3, 1,1 );
        row++;
      }

    for (var i=0;i<row;i++)  {
      table.setNoWrap              ( i,0 );
      table.setHorizontalAlignment ( i,0,'left'   );
      table.setHorizontalAlignment ( i,1,'center' );
      table.setHorizontalAlignment ( i,2,'right'  );
      table.setHorizontalAlignment ( i,3,'right'  );
      table.setVerticalAlignment   ( i,0,'middle' );
      table.setVerticalAlignment   ( i,1,'middle' );
      table.setVerticalAlignment   ( i,2,'middle' );
      table.setVerticalAlignment   ( i,3,'middle' );
    }

    this.grid.setLabel ( '&nbsp;<p>Use <b><i>Import</i></b> task to import ' +
                         'missing data, or run respective job(s) in order to ' +
                         'generate them.<br>' +
                         'Check data types and respective job summary ' +
                         '<a href="javascript:' +
                            'launchHelpBox(\'Data Management\',' +
                            '\'./html/jscofe_data.html#summary\',null,10)"><i>' +
                            String('here').fontcolor('blue') + '</i></a>.',
                         2,0, 1,2 );

    if (hints.length==1)  {
      this.grid.setLabel ( '<b><i>Hint:</i></b>', 3,0, 1,1 );
      this.grid.setLabel ( hints[0], 3,1, 1,1 ).setWidth_px ( 600 );
    } else
      for (var i=1;i<=hints.length;i++)  {
        this.grid.setLabel ( '<b><i>Hint&nbsp;'+i+':</i></b>', 2+i,0, 1,1 );
        this.grid.setLabel ( hints[i-1], 2+i,1, 1,1 ).setWidth_px ( 600 );
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
