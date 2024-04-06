//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.global.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's global definitions
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

var mainToolBarId  = "_mainToolBar";
var mainTabBarId   = "_mainTabBar";
var pageTopId      = "_pageTop";
var pageHeaderId   = "_pageHeader";
var pageFooterId   = "_pageFooter";
var helpTabId      = "_helpTab";
var _helpInTab     = false;
var noTabGridId    = "body";

var printBtnId     = "_printBtn";
var sep1BtnId      = "_sep1Btn";
var refreshBtnId   = "_refreshBtn";
var sep2BtnId      = "_sep2Btn";
var helpPgmBtnId   = "_helpPgmBtn";
var helpCCP4BtnId  = "_helpCCP4Btn";
var sep3BtnId      = "_sep3Btn";
var goBackBtnId    = "_goBackBtn";
var goForwardBtnId = "_goForwardBtn";
var findBtnId      = "_findBtn";
var sep4BtnId      = "_sep4Btn";
var progressBarId  = "_progressBar";
var configureBtnId = "_configureBtn";
var exitBtnId      = "_exitBtn";

var watchedContent = [];

var timeQuant      = 1000;        // timer interval, milliseconds
var _commandNo     = 0;           // command number
var taskFile       = "task.tsk";  // task file name

var docURI         = "";
var helpBtnName    = "Help";
//var programDocFile = "refmac5.html";
var programDocFile = "INDEX.html";
//var ccp4DocFile    = "INDEX.html"

var _document_body       = null;  // HTML element to hold all document
                                  // set in InitPage
var _taskData            = "{*}";
var _taskTimer           = 0;
var _taskTimerInterval   = 500; // msec
var _formSubmittedID     = "";
var _waitDialogTitle     = "";
var _waitDialogMessage   = "";
var _waitDialogId        = "_wait_dialog";
var _waitDialogCountdown = -1;

var __color_mode = 'light';
