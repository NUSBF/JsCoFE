
/*
 *  =================================================================
 *
 *    12.02.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_darkmode.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Dark Mode Tune-up Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';


function DarkModeDialog()  {

  Widget.call ( this,'div' );

  let darkMode    = isDarkMode();

  let pmode_cbox  = null;
  let invert0     = __user_settings.color_modes.dark_mode.invert;
  let sepia0      = __user_settings.color_modes.dark_mode.sepia;
  let hue0        = __user_settings.color_modes.dark_mode.hue;
  let saturate0   = __user_settings.color_modes.dark_mode.saturate;
  let contrast0   = __user_settings.color_modes.dark_mode.contrast;
  let brightness0 = __user_settings.color_modes.dark_mode.brightness;
  let grayscale0  = __user_settings.color_modes.dark_mode.grayscale;

  setDarkMode ( true );

  QuestionBox.call ( this,'Dark Mode Tune-up',
                     '<h3>Dark  Mode parameters</h3>',
                     [{ name    : 'Save mode',
                        onclick : function(){
                          let userData   = new UserData();
                          userData.login = __login_id;
                          userData.pwd   = '';  // can save only some records without password
                          if (pmode_cbox)
                            __user_settings.color_modes.preferred_mode = pmode_cbox.getValue(); 
                          userData.settings = __user_settings;
                          serverRequest ( fe_reqtype.updateUserData,userData,
                                          'Dark Mode preferences update',function(response){} );
                          bindToBrowserColorMode ( true );
                        }
                      },{
                        name    : 'Reset mode',
                        onclick : function(){
                          __user_settings.color_modes.preferred_mode       = 'system'; 
                          __user_settings.color_modes.dark_mode.invert     = invert0;
                          __user_settings.color_modes.dark_mode.sepia      = sepia0;
                          __user_settings.color_modes.dark_mode.hue        = hue0;
                          __user_settings.color_modes.dark_mode.saturate   = saturate0;
                          __user_settings.color_modes.dark_mode.contrast   = contrast0;
                          __user_settings.color_modes.dark_mode.brightness = brightness0;
                          __user_settings.color_modes.dark_mode.grayscale  = grayscale0;
                          setDarkMode ( darkMode );               
                        }
                      }
                     ],'darkmode',true,false );

  let grid = this.grid.setGrid ( '',2,2,1,1 );

  let r = 0;

  grid.setLabel ( 'Preferred mode:',r,0,1,1 );
  grid.setLabel ( '&nbsp;&nbsp;&nbsp;',r,1,1,1 );
  pmode_cbox = grid.setCombobox ( r++,2,1,3 );
  pmode_cbox.addItem ( 'System','system',__user_settings.color_modes.preferred_mode=='system' );
  pmode_cbox.addItem ( 'Light' ,'light' ,__user_settings.color_modes.preferred_mode=='light'  );
  pmode_cbox.addItem ( 'Dark'  ,'dark'  ,__user_settings.color_modes.preferred_mode=='dark'   );
  window.setTimeout ( function(){
    pmode_cbox.make();
  },0);
  pmode_cbox.setWidth ( '140px' );

  grid.setLabel ( '&nbsp;',r++,0,1,5 );

  function collectData()  {
    __user_settings.color_modes.dark_mode.invert     = grid.invert.value;
    __user_settings.color_modes.dark_mode.sepia      = grid.sepia.value;
    __user_settings.color_modes.dark_mode.hue        = grid.hue.value;
    __user_settings.color_modes.dark_mode.saturate   = grid.saturate.value;
    __user_settings.color_modes.dark_mode.contrast   = grid.contrast.value;
    __user_settings.color_modes.dark_mode.brightness = grid.brightness.value;
    __user_settings.color_modes.dark_mode.grayscale  = grid.grayscale.value;
    setDarkMode ( true );
  }

  function setSlider ( label,range,value,id,value_func )  {
    grid.setLabel ( label,r,0,1,1 );
    grid.setLabel ( '&nbsp;&nbsp;&nbsp;',r,1,1,1 );
    grid.setLabel ( '&nbsp;&nbsp;&nbsp;',r,3,1,1 );
    grid[id] = {
      slider : grid.setSlider ( range,value,200,8,r,2,1,1 ),
      value  : value_func(value),
      vlabel : grid.setLabel  ( value_func(value),r,4,1,1 )
    };
    grid[id].slider.setListener ( function(value){
      grid[id].value = value_func(value);
      grid[id].vlabel.setText ( grid[id].value );
      collectData();  
    });
    r++;
  }

  setSlider ( 'Invert'    ,100,100*invert0    ,'invert'    ,function(s){ return s/100.0; } );
  setSlider ( 'Sepia'     ,100,100*sepia0     ,'sepia'     ,function(s){ return s/100.0; } );
  setSlider ( 'HUE'       ,360,180+hue0       ,'hue'       ,function(s){ return s-180;   } );
  setSlider ( 'Saturation',150,100*saturate0  ,'saturate'  ,function(s){ return s/100.0; } );
  setSlider ( 'Contrast'  ,150,100*contrast0  ,'contrast'  ,function(s){ return s/100.0; } );
  setSlider ( 'Brightness',150,100*brightness0,'brightness',function(s){ return s/100.0; } );
  setSlider ( 'Gray scale',100,100*grayscale0 ,'grayscale' ,function(s){ return s/100.0; } );

  for (let i=0;i<r;i++)  {
    grid.setVerticalAlignment ( i,0,'middle' );
    grid.setVerticalAlignment ( i,1,'middle' );
  }

}

DarkModeDialog.prototype = Object.create ( QuestionBox.prototype );
DarkModeDialog.prototype.constructor = DarkModeDialog;


