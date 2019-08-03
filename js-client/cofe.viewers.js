
/*
 *  ==========================================================================
 *
 *    30.06.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.viewers.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Reciprocal Space Viewer
 *       ~~~~~~~~~  UglyMol XYZ+Maps Viewer
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

function rvapi_rsviewer ( jobId,title,rlpFilePath,mapFilePath )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.' );
  } else  {
    var task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      startRSViewer ( title,task.getProjectURL(jobId,rlpFilePath),
                            task.getProjectURL(jobId,mapFilePath) );
      //startRSViewer ( title,rlpFilePath,mapFilePath );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.' );
    }
  }

}


// ===========================================================================

function rvapi_umviewer ( jobId,title,xyzFilePath,mapFilePath,dmapFilePath )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.' );
  } else  {
    var task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      var xyz_uri = '';
      if (xyzFilePath)
        xyz_uri = task.getProjectURL ( jobId,xyzFilePath );
      var map_uri = '';
      if (mapFilePath)
        map_uri = task.getProjectURL ( jobId,mapFilePath );
      var dmap_uri = '';
      if (dmapFilePath)
        dmap_uri = task.getProjectURL ( jobId,dmapFilePath );
      startUglyMol ( title,xyz_uri,map_uri,dmap_uri );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.' );
    }
  }

}
