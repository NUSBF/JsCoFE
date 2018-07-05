

/*
 *  ==========================================================================
 *
 *    16.06.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.rsviewer.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Reciprocal Space Viewer
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  ==========================================================================
 *
 */


// ===========================================================================

function rvapi_rsviewer ( jobId,title,rlpFilePath,mapFilePath )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact jsCoFE developer.' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact jsCoFE developer.' );
  } else  {
    var task = __current_page.getJobTree().getTask ( jobId );
    if (task)  {
      startRSViewer ( title,task.getProjectURL(jobId,rlpFilePath),
                            task.getProjectURL(jobId,mapFilePath) );
      //startRSViewer ( title,rlpFilePath,mapFilePath );
    } else  {
      new MessageBox ( 'Task not found','Project Task not found. This is a bug, ' +
                       'please contact jsCoFE developer.' );
    }
  }

}
