
/*
 *  ==========================================================================
 *
 *    13.02.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

// ===========================================================================

function rvapi_rsviewer ( jobId,title,rlpFilePath,mapFilePath )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.', 'msg_error' );
  } else  {
    let task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      startRSViewer ( title,task.getProjectURL(jobId,rlpFilePath),
                            task.getProjectURL(jobId,mapFilePath) );
      //startRSViewer ( title,rlpFilePath,mapFilePath );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.', 'msg_error' );
    }
  }

}


// ===========================================================================

function rvapi_umviewer ( jobId,title,xyzFilePath,mtzFilePath,mapLabels )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.',
                     'msg_error' );
  } else  {
    let task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      let xyz_uri = '';
      let mtz_uri = '';
      if (xyzFilePath)  xyz_uri  = task.getProjectURL ( jobId,xyzFilePath );
      if (mtzFilePath)  mtz_uri  = task.getProjectURL ( jobId,mtzFilePath );
      startUglyMol ( title,xyz_uri,mtz_uri,'','',mapLabels );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.',
                       'msg_error' );
    }
  }

}

function rvapi_umviewer_map ( jobId,title,xyzFilePath,mapFilePath,dmapFilePath )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.',
                     'msg_error' );
  } else  {
    let task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      let xyz_uri = '';
      let map_uri  = '';
      let dmap_uri = '';
      if (xyzFilePath)  xyz_uri  = task.getProjectURL ( jobId,xyzFilePath );
      if (mapFilePath)  map_uri  = task.getProjectURL ( jobId,mapFilePath );
      if (dmapFilePath) dmap_uri = task.getProjectURL ( jobId,dmapFilePath );
      startUglyMol ( title,xyz_uri,'',map_uri,dmap_uri,null );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.',
                       'msg_error' );
    }
  }

}


// ===========================================================================

function checkBrowserForWebCoot()  {
  // if (isSafari()) {
  //   new MessageBox ( 'Unsuitable browser',
  //       '<div style="width:450px"><h2>Unsuitable browser</h2>' +
  //       'At present, WebCoot/Moorhen does not work in Safari browser, which ' +
  //       'you are using.<p>Please use another browser, such as Opera, Chrome, ' +
  //       'or Firefox.</div>','msg_stop'
  //   );
  //   return false;
  // }
  return true;
}

function rvapi_wcviewer ( jobId,title,xyzFilePath,mtzFilePath,legendFilePath,
                          mode,update_interval,options )  {
  if (!checkBrowserForWebCoot())
    return;
  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.',
                     'msg_error' );
  } else  {
    let task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      let xyz_uri    = '';
      let mtz_uri    = '';
      let legend_uri = '';
      if (xyzFilePath)     xyz_uri    = task.getProjectURL ( jobId,xyzFilePath );
      if (mtzFilePath)     mtz_uri    = task.getProjectURL ( jobId,mtzFilePath );
      if (legendFilePath)  legend_uri = task.getProjectURL ( jobId,legendFilePath );
      startWebCoot ( title,xyz_uri,mtz_uri,legend_uri,mode,update_interval,options );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact ' + appName() + ' developer.',
                       'msg_error' );
    }
  }

}
