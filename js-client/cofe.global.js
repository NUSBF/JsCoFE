
/*
 *  ==========================================================================
 *
 *    21.09.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.global.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Global variables
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

// ===========================================================================
// maintainer's e-mail

var __maintainerEmail = 'ccp4@ccp4.ac.uk';

// ===========================================================================
// session identification

var __login_token     = '';
var __login_id        = '';   // login name 
var __login_user      = '';   // user name
var __user_settings   = {
  color_modes : {
    preferred_mode : 'light',  // light|dark|system; make 'system' in final version
    light_mode :  {
      invert     : 0.0,   // 0 - 1
      sepia      : 0.0,   // 0 - 1
      hue        : 0,     // integer deg +/- 180
      saturate   : 1.0,   // >0
      contrast   : 1.0,   // >0
      brightness : 1.0,   // > 0
      grayscale  : 0.0    // 0 -1
    },
    dark_mode :  {
      invert     : 0.9,  // 0 - 1
      sepia      : 0.1,   // 0 - 1
      hue        : 180,   // integer deg +/-180
      saturate   : 1.0,   // >0
      contrast   : 0.89,  // >0
      brightness : 0.93,  // > 0
      grayscale  : 0.0    // 0 -1
    }
  }
};
var __user_role       = role_code.user;
var __user_licence    = '';
var __globus_id       = '';
var __dormant         = 0;
var __ccp4_version    = '';     // undefined

var __current_page    = null;
var __current_project = null;
var __current_folder  = {
  name      : 'My Projects',
  path      : 'My Projects',
  nprojects : 0,
  type      : folder_type.user,
  folders   : []
};
var __local_setup     = 0;
var __title_page      = true;   // whether to show title page in local/desktop mode
var __is_archive      = false;
var __offline_message = 'off';  // true for showing "working offline" once at the beginning
var __cloud_storage   = false;  // true if user has cloud storage allocated
var __demo_projects   = false;  // true if demo projects are configured
var __url_parameters  = null;   // decoded ?p1=v1&p2=v2 from url at session begining
var __jobs_safe       = false;  // true if FE supports failed jobs safe
var __has_datalink    = false;  // true if datalink server is configured
var __strict_dormancy = false;  // true if dormancy includes deactivation of user account
var __treat_private   = ['none']; // list of data not to be sent out
var __fe_url          =         // front-end url as returned by the server (not proxy)
                        document.location.protocol + '//' +  // just the initial value
                        document.location.host     +
                        document.location.pathname;

var __auth_software   = null;   // software authorisation data
var __user_authorisation = null;  // user authorisation data
var __environ_server  = [];     // list of key environmental variables on NCs
var __environ_client  = [];     // list of key environmental variables on Client
var __my_workflows    = [];     // user defined workflows

var __clipboard       = { task: null };     // clipboard for copy-pasting jobs

var __tips            = null;   // tips loaded from FE (optional), used in login page

var __mobile_device   = (/Android|webOS|BlackBerry/i.test(navigator.userAgent) );
var __iOS_device      = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ) ||
                        (navigator.maxTouchPoints && (navigator.maxTouchPoints > 2) &&
                         /MacIntel/.test(navigator.platform));
var __any_mobile_device = __mobile_device || __iOS_device;

const __regexp_login     = '^[a-zA-Z][a-zA-Z0-9._\\-]+$';
const __regexp_uname     = "^[a-zA-Z]{2,}([-'\\s][a-zA-Z]+)*$";
const __regexp_globus_id = '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';

// variable gets raised in jscofe-browser after loading the page
// alert ( ' isQt=' + isQtWebEngine() );

/*  ==================== unfinished userAgentData version -- for future

var __mobile_device     = false;  // not iOS
var __iOS_device        = false;

if (navigator.userAgentData) {
  // use new hints
  __mobile_device = navigator.userAgentData.mobile;
  alert ( navigator.userAgentData.platform );
} else {
  // fall back to user-agent string parsing
  __mobile_device = (/Android|webOS|BlackBerry/i.test(navigator.userAgent) );
  __iOS_device    = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ) ||
                      (navigator.maxTouchPoints && (navigator.maxTouchPoints > 2) &&
                       /MacIntel/.test(navigator.platform));
  alert ( 'no userAgentData' );
}

var __any_mobile_device = __mobile_device || __iOS_device;
======================= */


var __browser_checked = false;

function isSafari()  {
  if (window.safari!==undefined)
    return true;
  return  navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
          navigator.userAgent &&
          navigator.userAgent.indexOf('CriOS') == -1 &&
          navigator.userAgent.indexOf('FxiOS') == -1;
}

function isQtWebEngine() {
  return /QtWebEngine/i.test(navigator.userAgent) ||
          typeof navigator.qt !== "undefined";
          // (typeof window.isQtWebEngine !== "undefined" && window.isQtWebEngine === true);
}

function checkBrowser()  {
  // if ((navigator.userAgent.indexOf('Version/14')>=0) &&
  //     (navigator.userAgent.indexOf('Safari')>=0) && (!__iOS_device))
  //   new MessageBox ( 'Unsuitable browser',
  //       '<div style="width:450px">You are using Mac OSX Safari Version 14, ' +
  //       'which is known not to work well with ' + appName() +
  //       '. Please use another browser, such as Opera, Chrome, Firefox.</div>'
  //   );
  __browser_checked = true;
  return;
}

function isProtectedConnection()  {
  let fe_url = __fe_url.toLowerCase();
  return fe_url.startsWith('https://') ||
         fe_url.startsWith('http://localhost') ||
         (fe_url.indexOf('127.0.0.1') >= 0);
}

// ===========================================================================

$(window).resize ( function(){
  if (__current_page)
    __current_page.onResize ( window.innerWidth,window.innerHeight );
});


function report_problem ( subject,message,label )  {

  let body = encodeURIComponent (
    'CCP4 Cloud Report\n' +
    'Login ID   : ' + __login_id    + '\n' +
    'Login Name : ' + __login_user  + '\n' +
    'Local setup: ' + __local_setup + '\n' +
    'Page       : ' + __current_page._type + '\n' +
    '----------------------------------------------------------------\n' +
    message
  );

  let text = label;
  if (!text)
    text = appName() + ' maintainer';

  return '<a href="mailto:' + __maintainerEmail +
         '?subject=' + encodeURIComponent(subject) + '&body=' + body + 
         '"><span style="color:blue">' + text + '</span></a>';

}


function isFullScreen() {
  if (typeof document.fullscreen!=='undefined')
    return document.fullscreen;
  if (typeof document.mozFullScreen!=='undefined')
    return document.mozFullScreen;
  if (typeof document.webkitIsFullScreen!=='undefined')
    return document.webkitIsFullScreen;
  if (typeof document.msFullscreenElement!=='undefined')
    return document.msFullscreenElement;
  return -1;
}


function setFullScreen() {
  if (!isFullScreen())  {
    let docElm = document.documentElement;
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    }
    else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    }
    else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    }
    else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    }
  }
};


function quitFullScreen() {
  let ifs = isFullScreen();
  if ((ifs!=-1) && ifs)  {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
    else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}


function toggleFullScreen() {
let ifs = isFullScreen();
  if (ifs==-1)  {
    alert ( 'Full Screen Mode is not supported' );
    return;
  } else if (ifs)  quitFullScreen();
             else  setFullScreen ();
}

/*
function toggleDarkMode() {
  if (__dark_mode)
    $(document.body).css({
      'filter':'invert(0%) sepia(0%) hue-rotate(0deg) saturate(1) contrast(1) brightness(1) grayscale(0%)'
    });
  // else  $(document.body).css({'filter':'invert(87%) sepia(80%) hue-rotate(90deg) saturate(1)'});
  else  
    $(document.body).css({
      'filter':'invert(87%) sepia(0%) hue-rotate(0deg) saturate(1) contrast(1) brightness(1) grayscale(0%)'
    });
  __dark_mode = !__dark_mode;
}
*/

var __active_color_mode = 'light';

function setDarkMode ( darkMode )  {
  
  let color_mode = null;
  if ('light_mode' in __user_settings.color_modes)
        color_mode = __user_settings.color_modes.light_mode;
  else  color_mode = __user_settings.color_modes.normal_mode;
  if (darkMode)  {
    color_mode = __user_settings.color_modes.dark_mode;
    __active_color_mode = 'dark';
  } else
    __active_color_mode = 'light';

  $(document.body).css({
    'filter' : 'invert('        + color_mode.invert     + 
               ') sepia('       + color_mode.sepia      + 
               ') hue-rotate('  + color_mode.hue        + 
               'deg) saturate(' + color_mode.saturate   + 
               ') contrast('    + color_mode.contrast   + 
               ') brightness('  + color_mode.brightness + 
               ') grayscale('   + color_mode.grayscale  + ')'
  });

  if (darkMode)  {
    $( "[dark_shadow]" ).each ( function(){
      this.style.boxShadow = this.getAttribute ( 'dark_shadow' );
    });
  } else  {
    $( "[light_shadow]" ).each ( function(){
      this.style.boxShadow = this.getAttribute ( 'light_shadow' );
    });
  }
  $('iframe').each ( function(){
    if (this.src)  {
      let win = this.contentWindow || this.contentDocument;
      win.postMessage ({
        action : 'theme',
        data   : __active_color_mode
      },window.location.href );
      // },this.src );
    }
  });

  // let elementsWithBoxShadow = $('*:has([style*="box-shadow"])');
  // if (darkMode)  {
  //   elementsWithBoxShadow.each(function(){
  //     let dark_shadow = 'none';
  //     if (this.hasAttribute('dark_shadow'))
  //           dark_shadow = this.getAttribute ( 'dark_shadow' );
  //     else  this.setAttribute ( 'dark_shadow',dark_shadow );
  //     this.style.boxShadow = dark_shadow;
  //   });
  // } else  {
  //   elementsWithBoxShadow.each(function(){
  //     let light_shadow = this.style.boxShadow;
  //     if (this.hasAttribute('light_shadow'))
  //           light_shadow = this.getAttribute ( 'light_shadow' );
  //     else  this.setAttribute ( 'light_shadow',light_shadow );
  //     this.style.boxShadow = light_shadow;
  //   });
  // }


}

function toggleDarkMode() {
  setDarkMode ( __active_color_mode=='light' );
}

function isDarkMode()  {
  // alert ( ' isdarkmode=' + window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches );
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function bindToBrowserColorMode ( setModeOnly=false )  {
  if (__user_settings.color_modes.preferred_mode!='system')
    setDarkMode ( __user_settings.color_modes.preferred_mode=='dark' );
  if (window.matchMedia)  {
    let query = window.matchMedia ( '(prefers-color-scheme: dark)' );
    if (__user_settings.color_modes.preferred_mode=='system')
        setDarkMode ( query.matches );
    if (!setModeOnly)
      query.addEventListener ( 'change',function(event){
        if (__user_settings.color_modes.preferred_mode=='system')
          setDarkMode ( event.matches );
      });
  }
}

/*
const runColorMode = (fn) => {
  if (!window.matchMedia)
    return;
  const query = window.matchMedia ( '(prefers-color-scheme: dark)' );
  fn ( query.matches );
  query.addEventListener ( 'change', (event) => fn(event.matches) );
}

runColorMode ( (isDarkMode) => {
  if (isDarkMode) {
    // console.log ( ' dark-mode' )
    setDarkMode ( false );
  } else {
    // console.log ( ' light-mode')
    toggleDarkMode ( true );
  }
})
*/

/*
document.addEventListener("fullscreenchange", function () {
    fullscreenState.innerHTML = (document.fullscreen)? "" : "not ";
}, false);

document.addEventListener("mozfullscreenchange", function () {
    fullscreenState.innerHTML = (document.mozFullScreen)? "" : "not ";
}, false);

document.addEventListener("webkitfullscreenchange", function () {
    fullscreenState.innerHTML = (document.webkitIsFullScreen)? "" : "not ";
}, false);

document.addEventListener("msfullscreenchange", function () {
    fullscreenState.innerHTML = (document.msFullscreenElement)? "" : "not ";
}, false);
*/


// ===========================================================================
// various constants

var __check_job_interval   = 8000;  // milliseconds
var __persistence_level    = 100;   // number of retries due to poor internet connection

//  task list parameters
var __suggested_task_prob  = 0.03;  // do not list tasks with combined probability
                                    // less than 3%
var __suggested_task_nmin  = 3;     // minimum 3 tasks to suggest

const __task_reference_base_url = './manuals/html-taskref/';
const __user_guide_base_url     = './manuals/html-userguide/';
const __dev_reference_base_url  = './manuals/html-dev/';
const __tutorials_base_url      = './manuals/html-tutorials/';

//var __rvapi_config_coot_btn = true;  // switch Coot button off (when undefined) in RVAPI

// ===========================================================================
// miscellaneous functions

// auxiliary function for getObjectInstance(), not to be used by itself
function __object_to_instance ( key,value ) {

  if (!value)
    return value;

  if (!value.hasOwnProperty('_type'))
    return value;

  let obj= makeNewInstance ( value._type );
  if (!obj)
    alert ( ' unknown class? ' + value._type );

  for (let property in value)
    obj[property]=value[property];

  return obj;

}

// recreates particular class instance from stringified object
function getObjectInstance ( data_json )  {
  return JSON.parse ( data_json,__object_to_instance );
}


// ===========================================================================
// client type identification

var client_code = {
  ccp4     : 'ccp4',    // ccp4 client
  ccpem    : 'ccpem'    // ccpem client
}

var __client = client_code.ccp4;

function setClientCode ( code )  {
  __client = code;
}

function getClientCode()  {
  return __client;
}

function getClientName()  {
  switch (__client)  {
    default :
    case client_code.ccp4  : return "CCP4";
    case client_code.ccpem : return "CCPEM";
  }
  return "CCP4";
}

function getFEURL()  {
  return window.location.protocol + '//' + window.location.host + window.location.pathname;
}

function replaceStylesheets ( href_pattern,href )  {
  // var queryString = '?reload=' + new Date().getTime();
  let href_p = window.location.href + href_pattern;
  let href_n = window.location.href + href;
  $('link[rel="stylesheet"]').each(function () {
    if (this.href.startsWith(href_p) && (this.href!=href_n))
      this.href = href_n;
  });
}

function copyToClipboard ( text )  {
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    
    navigator.clipboard.writeText(text).then(function(){},
      function(err) {
        console.error('Could not copy text: ', err);
      });

  } else {

    let textArea = document.createElement('textarea');
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top  = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      let successful = document.execCommand('copy');
      let msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

}

// ===========================================================================
// help support

var __doNotShowList = [];

function doNotShowAgain ( key,url )  {

  var topic = url.replace ( /^.*\/|\.[^.]*$/g,'' );

  if (key==0)  {

    return  (__doNotShowList.indexOf(topic)<0) &&
            (__doNotShowList.indexOf('*')<0);

  } else if (key==1)  {

    if (__doNotShowList.indexOf(topic)<0)  {
      __doNotShowList.push ( topic );
      var userData = {};
      userData.helpTopics = __doNotShowList;
      serverRequest ( fe_reqtype.saveHelpTopics,userData,'Do not show again',
                      null,null,'persist' );
    }

  }

  return false;

}


// ===========================================================================

function saveMyWorkflows()  {
  serverRequest ( fe_reqtype.saveMyWorkflows,__my_workflows,'Save my workflows',
                  null,null,'persist' );
}

function removeMyWorkflow ( workflowId )  {
  let n = -1;
  for (let i=0;(i<__my_workflows.length) && (n<0);i++)
    if (__my_workflows[i].id==workflowId)
      n = i;
  if (n>=0)
    __my_workflows.splice(n,1);
}

// ===========================================================================
// allow HTML markup in tooltips

/* -- now in cofe.session.js
$(document).tooltip({
  content: function (callback) {
     callback($(this).prop('title'));
  }
});
*/
