
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
// DataSummaryPage class

function DataSummaryPage ( data )  {

  Widget.call ( this,'div' );

  this.view_btn_grid = null;
  this.view_btn_pos  = 0;

  this.data = data;

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  this.trow  = 0;
  this.table = this.grid.setTable ( 1,0, 1,1 );

  this.makeRow ( 'Producing job number',data.jobId,'Id of job produced this dataset' );
  this.makeRow ( 'Version'     ,data.version.toString(),'Data object version number' );

  var type = data.title();
  if (data.subtype.length>0)
    type += ' (' + data.subtype.join(',') + ')';

  this.makeRow ( 'Type (subtypes)',type,'Data type and assigned subtypes' );
  this.makeRow ( 'Assigned name'  ,data.dname,'Assigned dataset name' );

}

DataSummaryPage.prototype = Object.create ( Widget.prototype );
DataSummaryPage.prototype.constructor = DataSummaryPage;

DataSummaryPage.prototype.getTitle = function()  {
  return this.data.dname;
}

DataSummaryPage.prototype.makeRow = function ( header,text,tooltip )  {
  this.table.setHeaderText ( header, this.trow,0, 1,1 )
            .setTooltip ( tooltip ).setNoWrap();
  if (text)
    this.table.setLabel ( text, this.trow,1, 1,10 );
  this.table.setHorizontalAlignment ( this.trow,0,'left'   );
  this.table.setHorizontalAlignment ( this.trow,1,'left'   );
  this.table.setCellSize  ( '10%','', this.trow,0 );
  this.table.setCellSize  ( '90%','', this.trow,1 );
  this.trow++;
}


DataSummaryPage.prototype._getPath = function ( task,data,fileKey )  {
  if (data.files.hasOwnProperty(fileKey))
    return task.getProjectURL(data.jobId,'output/'+data.files[fileKey]);
  return '';
}


DataSummaryPage.prototype.addUglyMolButton = function ( task )  {

  if (!this.view_btn_grid)  {
    this.grid.setLabel ( '&nbsp;', 2,0,1,1 );
    this.view_btn_grid = this.grid.setGrid ( '-compact', 3,0,1,1 );
  }
  var uglymol_btn = this.view_btn_grid.setButton ( 'UglyMol',
                          image_path('display'), 3,this.view_btn_pos++,1,1 );

  (function(t){
    uglymol_btn.addOnClickListener ( function(){
      var coors = t._getPath(task,t.data,file_key.xyz);
      if (!coors)
        coors = t._getPath(task,t.data,file_key.sub);
      startUglyMol ( t.data.dname,coors,
                     t._getPath(task,t.data,file_key.map),
                     t._getPath(task,t.data,file_key.dmap) );
    });
  }(this))

}


DataSummaryPage.prototype.addViewHKLButton = function ( task )  {

  /*
  var fileNo;
  if (this.data.files.length==1)  fileNo = 0;
                            else  fileNo = 1;
  */

  if (this.data.files[file_key.mtz])  {

    if (!this.view_btn_grid)  {
      this.grid.setLabel ( '&nbsp;', 2,0,1,1 );
      this.view_btn_grid = this.grid.setGrid ( '-compact', 3,0,1,1 );
    }
    var viewhkl_btn = this.view_btn_grid.setButton ( 'ViewHKL',
                          image_path('display'), 3,this.view_btn_pos++,1,1 );

    (function(t){
      viewhkl_btn.addOnClickListener ( function(){
        startViewHKL ( t.data.dname,t._getPath(task,t.data,file_key.mtz) );
      });
    }(this))

  }

}


// -------------------------------------------------------------------------
// DataInspectDialog class

function DataInspectDialog ( dataSummaryPage,title,width,height )  {

  Dialog.call ( this,title );

  this._options.width     = width;
  this._options.maxHeight = height;
  this._options.modal     = false;
  this._options.resizable = true;

  this.addWidget ( dataSummaryPage );

}

DataInspectDialog.prototype = Object.create ( Dialog.prototype );
DataInspectDialog.prototype.constructor = DataInspectDialog;


function rvapi_inspectData ( jobId,dataType,dataId )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.' );
  } else  {
    __current_page.getJobTree().inspectData ( jobId,dataType,dataId );
  }

}
