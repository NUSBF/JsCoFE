
/*
 *  =================================================================
 *
 *    12.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_desktop.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Desktop title page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict';

// -------------------------------------------------------------------------
// authorisation end page class

function LocalLoginPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','LocalLoginPage' );

  // adjust scene grid attributes such that login panel is centered
  this.grid.setCellSize            ( '45%','',0,0,1,1 );
  this.grid.setCellSize            ( '10%','',0,1,1,1 );
  this.grid.setVerticalAlignment   ( 0,1,'middle'     );
  this.grid.setHorizontalAlignment ( 0,1,'center'     );
  this.grid.setCellSize            ( '45%','',0,2,1,1 );
  this.makeLogoPanel               ( 1,0,3 );

  let panel = new Grid('');
  panel.setWidth      ( '300pt' );
  this.grid.setWidget ( panel,0,1,1,1 );

  let text = '<b>Collaborative Computational Project No.4</b><br>' +
             '<div style="font-size:80%;padding-bottom:28px;">' +
             'Science and Technology Facilities Council UK<br>' +
             'Rutherford Appleton Laboratory<br>' +
             'Didcot, Oxon, OX1 0FA, United Kingdom<br>' +
             '<a href="https://www.ccp4.ac.uk" target="_blank">' +
             'https://www.ccp4.ac.uk</a></div>' +
             '<b style="font-size:250%">' + appName() + '</b><br>' +
             '<b style="font-size:150%"><i>Local Setup</i></b><p>' +
             '<ul style="padding:16px;"><li style="padding-bottom:8px;">';

  serverCommand ( fe_command.getLocalInfo,{},'Local Login',
    function(response){
      // when success
      
      let rData = response.data;
      let paths = rData.project_paths.join('<br>');
      let dfree = Math.round ( rData.disk_free/1024.0 );
      
      if (rData.userData)  {
        let color_modes = __user_settings.color_modes;
        __user_settings = rData.userData.settings;
        if (!('color_modes' in __user_settings))
          __user_settings.color_modes = color_modes;
        bindToBrowserColorMode ( true ); 
      }

      let speed = 0;
      for (let i=0;i<rData.cpus.length;i++)
        speed = Math.max(speed,rData.cpus[i].speed);
      if (speed<100)  // due to a bug in some versions of nodejs
            speed /= 10;
      else  speed  = Math.round(speed/100)/10.0;

      let row = 0;

      panel.setLabel ( text +
        'Projects and data stored on your machine:<br>' +
        // '<i style="font-size:85%">path(s): </i>' +
        '<span style="font-size:85%;font-family:courier;">' + paths + '</span>' +
        '</li><li style="padding-bottom:8px;">' +
        'Projects and data <b><i>not</i></b> synced with ' + appName() + ' server(s)<br>' +
        '<i style="font-size:85%">(use project export/import for manual syncing)</i>' +
        '</li><li style="padding-bottom:8px;">' +
        'Jobs run on your machine<br>' +
        '<i style="font-size:85%">(except when 3rd party web-services are used)</i>' +
        '</li><li>' +
        'You have ' + dfree + 'GB free disk space & ' + rData.cpus.length + 
        ' cores @ ' + speed + ' GHz' +
        '</li></ul>',
        row++,2,1,1
      ).setHorizontalAlignment('left').setNoWrap();

      let login_btn = panel.setButton ( 'Go to your projects',
                                        image_path('enter'),row,0,1,1 )
                          .addOnClickListener(function(){
        login ( '**' + __local_user_id + '**','',sceneId,0 );
      }).setHorizontalAlignment('left');
      panel.setHorizontalAlignment ( row++,0,'left' );

      panel.setImage ( image_path('ccp4cloud_desktop'), '300px','300px', 0,0,row,1 );
      panel.setLabel ( '&nbsp;',0,1,row,1 ).setWidth('40px');
      panel.setVerticalAlignment ( 0,0,'middle' );

      login_btn.element.focus();
      setDefaultButton ( login_btn,{ element: window } );

      if (!__mobile_device)  {
        // panel.setLabel ( '&nbsp;',row++,0,0,3 );
        row++;
        let tip_lbl = panel.setLabel ( '&nbsp;',row,0,0,3 ).setFontSize('80%');
        panel.setHorizontalAlignment ( row,0,'center' );
        panel.setVerticalAlignment   ( row,0,'top' );
        panel.setCellSize            ( '','36px',row-1,0,1,3 );
        panel.setCellSize            ( '','12px',row,0,1,3 );
        panel.setCellSize            ( '','3px',row+1,0,1,3 );

        window.setTimeout ( function(){
          if (__tips && __tips.use_tips && (__tips.tips.length>0))  {
            let tipNo = 0;
            if ('tipNo' in __tips)  tipNo = __tips.tipNo;
                              else  tipNo = round(Date.now()/5000,0);
            tipNo = tipNo % __tips.tips.length;
            let tipLink = '<a href="javascript:' +
                              'launchHelpBox1(\'' + __tips.tips[tipNo].title + '\',' +
                                            '\'' + __tips.tips[tipNo].doc   + '/'   +
                                                   __tips.tips[tipNo].link  + '\',' +
                                            'null,10);">';
            tip_lbl.setText (
              '<img src="' + image_path('tip') +
              '" style="width:20px;height:20px;vertical-align:bottom;"/>' +
              '<span><i style="font-style:Garamond;color:#666666;">' +
              __tips.tips[tipNo].summary.replace('<a>',tipLink) +
              '</i></span>'
            );
          }
        },100);
      
      }

      return true;

    },
    null,         // no 'always' function
    function(){ 
      // when fail
    });

}

// LocalLoginPage.prototype = Object.create ( BasePage.prototype );
// LocalLoginPage.prototype.constructor = LocalLoginPage;

registerClass ( 'LocalLoginPage',LocalLoginPage,BasePage.prototype );

function makeLocalLoginPage ( sceneId )  {
  makePage ( function() { new LocalLoginPage(sceneId); } );
  setHistoryState ( 'LocalLoginPage' );
}
