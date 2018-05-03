

ViewHKL.prototype.makeDataSelector = function()  {

  this.column_ddn = new Dropdown();
  this.column_ddn.setWidth ( '280px' );

  var mtz = this.mtz;

  var col_cnt = 0;
  var select  = 0;
  for (var ds in mtz.dataset) {
    var group = null;
    for (var j=0;j<mtz.dataset[ds].col_labels.length;j++)  {
      if (mtz.dataset[ds].col_types[j]!='H')  {
        if (!group)
          group = new DropdownItemGroup ( mtz.dataset[ds].project + ' / ' +
                                          mtz.dataset[ds].crystal + ' / ' +
                                          mtz.dataset[ds].name );
        if ((!select) && (mtz.dataset[ds].col_types[j]!='I'))
          select = 1;
        group.addItem ( mtz.dataset[ds].col_labels[j],'',col_cnt,(select==1) );
        if (select)
          select = 2;
      }
      col_cnt++;
    }
    if (group)
      this.column_ddn.addItemGroup ( group );
  }

  var row = this.controlPanel.getNRows();
  this.controlPanel.setLabel  ( 'Select data'  ,row++,0,1,3 );
  this.controlPanel.setWidget ( this.column_ddn,row  ,0,1,3 );
  this.column_ddn.make();

  (function(self){
    self.column_ddn.addSignalHandler ( 'state_changed',function(detail){
      self.setMaxZone();
      self.setResolutionScale();
      self.drawZone  ();
    });
  }(this))

}


ViewHKL.prototype.makeProjectionRadio = function()  {

  this.projection_radio = new RadioSet();
  this.projection_radio.addButton ( 'H K 0','hk0','',true  );
  this.projection_radio.addButton ( 'H 0 L','h0l','',false );
  this.projection_radio.addButton ( '0 K L','0kl','',false );

  var row = this.controlPanel.getNRows();
  this.controlPanel.setLabel  ( '<br/>Select projection',row++,0,1,3 );
  this.controlPanel.setWidget ( this.projection_radio   ,row  ,0,1,3 );

  (function(self){
    self.projection_radio.make  ( function(){
      self.setMaxZone();
      self.setResolutionScale();
      self.drawZone  ();
    });
  }(this))

}


ViewHKL.prototype.setMaxZone = function()  {

  for (var k in this.mtz.dataset)  {
    var ds = this.mtz.dataset[k];
    var maxZone = 0;
    switch (this.projection_radio.getValue())  {
      default :
      case 'hk0' : maxZone = Math.max(Math.abs(ds.min[2]),Math.abs(ds.max[2]));
                break;
      case 'h0l' : maxZone = Math.max(Math.abs(ds.min[1]),Math.abs(ds.max[1]));
                break;
      case '0kl' : maxZone = Math.max(Math.abs(ds.min[0]),Math.abs(ds.max[0]));
    }
    break;  // use just 1st dataset
  }

  this.zoneLevel.setMaxValue (  maxZone );
  this.zoneLevel.setMinValue ( -maxZone );
  this.zoneLevel.setValue    ( 0 );

}


ViewHKL.prototype.makeZoneLevelSpinner = function()  {

  var mtz = this.mtz;
  for (var k in mtz.dataset)  {
    var ds = mtz.dataset[k];
    this.maxIndex = 0;
    for (var n=0;n<3;n++)
      this.maxIndex = Math.max ( this.maxIndex,Math.max(Math.abs(ds.min[n]),Math.abs(ds.max[n])) );
    break;  // use just 1st dataset
  }

  var row = this.controlPanel.getNRows();
  this.zoneLevel = new Spinner ( -this.maxIndex,this.maxIndex,1,5 );
  this.zoneLevel.setWidth_px ( 40 );
  this.controlPanel.setLabel  ( '&nbsp;',row++,0,1,3 );
  this.controlPanel.setLabel  ( 'Select level:&nbsp;',row,0,1,1 ).setNoWrap();
  this.controlPanel.setVerticalAlignment ( row,0,'middle' );
  this.controlPanel.setWidget ( this.zoneLevel,row,1,1,1 );
  this.controlPanel.setCellSize ( 'auto','',row,0 );
  this.controlPanel.setCellSize ( 'auto','',row,1 );
  this.controlPanel.setCellSize ( '95%' ,'',row,2 );

  this.setMaxZone();

  (function(self){
    self.zoneLevel.setListener ( function(v){
      self.setResolutionScale();
      self.drawZone();
    });
  }(this))

}



ViewHKL.prototype.setResolutionScale = function()  {

  var mtz        = this.mtz;
  var projection = this.projection_radio.getValue();
  var zoneLevel  = this.zoneLevel       .getValue();
  var columnNo   = parseInt(this.column_ddn.getValue());
  var zone       = mtz.makeZone ( projection,mtz.column_dataset[columnNo],zoneLevel );

  var reso_steps = [];
  var s1 = 1.0/zone.lowReso;
  var s2 = 1.0/zone.highReso;
  var ds = (s1-s2)/19;
  for (var i=0;i<20;i++)
    reso_steps.push ( this.round2(1.0/(s2+i*ds)) );

  this.resCircle.setCustomSteps ( reso_steps,0 );

}


ViewHKL.prototype.makeResolutionSpinner = function()  {

  var row = this.controlPanel.getNRows();
  this.resCircle = new Spinner ( 1.0,60.0,0.001,5 );
  this.resCircle.setWidth_px ( 40 );
  this.controlPanel.setLabel  ( 'Resolution circle:&nbsp;',row,0,1,1 ).setNoWrap();
  this.controlPanel.setVerticalAlignment ( row,0,'middle' );
  this.controlPanel.setWidget ( this.resCircle,row,1,1,1 );
  this.controlPanel.setCellSize ( 'auto','',row,0 );
  this.controlPanel.setCellSize ( 'auto','',row,1 );
  this.controlPanel.setCellSize ( '95%' ,'',row,2 );

  this.setResolutionScale();

  (function(self){
    self.resCircle.setListener ( function(v){
      self.drawZone();
    });
  }(this))

}


ViewHKL.prototype.makeContrastSliders = function()  {

  var row = this.controlPanel.getNRows();
  this.controlPanel.setLabel   ( '<br/><center><i>contrast</i></center>',row++,0,1,3 );
  this.contrastSD = new Slider ( 99 );
  this.controlPanel.setWidget  ( this.contrastSD,row++,0,1,3 );
  this.contrastSD.setValue     ( Math.round(this.vcontrast*100) - 1 );

  this.controlPanel.setLabel   ( '<center><i>value cut-off</i></center>',row++,0,1,3 );
  this.ithreshSD = new Slider  ( 99 );
  this.controlPanel.setWidget  ( this.ithreshSD,row,0,1,3 );
  this.ithreshSD.setValue      ( 99 );
  this.ithresh = 1.0;

  (function(self){

    self.contrastSD.setListener ( function(v){
      self.vcontrast = (v+1)/100.0;
      //self.vcontrast = Math.log10 ( (v+2) ) / 2;
      self.drawZone();
    });

    self.ithreshSD.setListener ( function(v){
      self.ithresh = Math.exp ( -(100.0-v)/25.0 );
      self.drawZone();
    });

  }(this))

}


ViewHKL.prototype.erf = function ( x )  {
// erf(x) = 2/sqrt(pi) * integrate(from=0, to=x, e^-(t^2) ) dt
// with using Taylor expansion,
//        = 2/sqrt(pi) * sigma(n=0 to +inf, ((-1)^n * x^(2n+1))/(n! * (2n+1)))
// calculationg n=0 to 50 bellow (note that inside sigma equals x when n = 0, and 50 may be enough)
  var m = 1.00;
  var s = 1.00;
  var sum = x * 1.0;
  for(var i = 1; i < 50; i++){
    m   *=  i;
    s   *= -1;
    sum += (s*Math.pow(x,2.0*i+1.0))/(m*(2.0*i+1.0));
  }
  return 2.0 * sum / Math.sqrt(Math.PI);
}


ViewHKL.prototype.drawSpot = function ( spotData )  {
  this.canvas.setLineWidth     ( 0 );
  this.canvas.setFillColor     ( spotData.c1,spotData.c1,spotData.c1,1 );
  this.canvas.drawFilledCircle ( spotData.x,spotData.y,spotData.r1 );
  this.canvas.setFillColor     ( spotData.c2,spotData.c2,spotData.c2,1 );
  this.canvas.drawFilledCircle ( spotData.x,spotData.y,spotData.r2 );
}


ViewHKL.prototype.highlightSpot = function ( spotData )  {
  /*  creates side-effects of unclear nature
  this.canvas.setLineWidth     ( 0 );
  this.canvas.setFillColor     ( 255,0,255,1 );
  this.canvas.drawFilledCircle ( spotData.x,spotData.y,spotData.r2 );
  */
}


ViewHKL.prototype.drawReflections = function ( zone,columnNo )  {

  var mtz     = this.mtz;
  var highres = mtz.column_highres[columnNo];
  var maxV    = mtz.column_max    [columnNo];
  var rmin    = 1.0/this.canvas.element.width;
  var rmax    = 1.0/(2.5*this.maxIndex);
  var Vmax    = maxV*this.ithresh;
  var erfD    = this.erf(4.0*this.vcontrast/2.0);
  var V,val,logv,r1,r2,vm,c1,c2

  // prepare lookup structure for mouse move processing
  this.mouse_cell  = 1.8*this.canvas._scxy/this.maxIndex;
  this.mouse_nx    = Math.round ( this.canvas.element.width /this.mouse_cell );
  this.mouse_ny    = Math.round ( this.canvas.element.height/this.mouse_cell );
  this.mouse_cells = [];
  for (var i=0;i<this.mouse_ny;i++)  {
    var mx = [];
    for (var j=0;j<this.mouse_nx;j++)
      mx.push ( null );
    this.mouse_cells.push ( mx );
  }
  this.mouse_refl = null;  // previously highlighted reflection

  //this.canvas.setLineWidth ( 0 );

  for (var i=0;i<zone.reflections.length;i++)  {

    V = mtz.get_value ( zone.reflections[i].row,columnNo );

    if (!isNaN(V))  {

      val  = Math.min(1.0,V/Vmax) - 0.5;
      val  = (1.0 + this.erf(4.0*this.vcontrast*val)/erfD)/2.0;
      val  = Math.pow ( Math.abs(val),0.66 );

      logv = Math.max ( 0.0,val*Vmax );
      r2   = logv/Vmax;
      r2   = Math.max ( 1.02*rmin,rmax*Math.min(1.0,Math.sqrt(r2)) );
      r1   = rmax*this.vcontrast - rmax/Vmax*(Vmax-logv);
      r1   = Math.max ( 0.9*rmin,Math.sqrt(r1) );
      r1   = Math.min ( r1,r2-0.01*rmin );

      vm = logv/Math.max ( Vmax*this.vcontrast,logv );

      if (this.vcontrast<=0.01)
            c2 = 0;
      else  c2 = Math.round(this.color_range*(1.0-Math.min(1.0,vm)));
      c2 = Math.min ( Math.max ( c2,0 ),255 );

      //draw spot with radius 'r2' and color (c,c,c)
      var m = {};
      m.reflectionNo = i;
      m.x  = zone.reflections[i].x;
      m.y  = zone.reflections[i].y;
      m.V  = V;
      m.r1 = r1;
      m.r2 = r2;
      m.c1 = (c2+255)/2;
      m.c2 = c2;

      this.drawSpot ( m );

      var ix = Math.round ( this.canvas.u(m.x)/this.mouse_cell );
      var iy = Math.round ( this.canvas.v(m.y)/this.mouse_cell );
      this.mouse_cells[iy][ix] = m;

    }

  }

}


ViewHKL.prototype.drawResCircle = function ( zone )  {

  this.canvas.setLineWidth ( 1 );
  this.canvas.setLineColor ( 0,200,0,1 );

  var cs = 1.0/this.resCircle.getValue();
  var s1 = 1.0/zone.lowReso;
  var s2 = 1.0/zone.highReso;
  var rad = zone.minRadius + (zone.maxRadius-zone.minRadius)*(cs-s1)/(s2-s1);

  this.canvas.drawCircle   ( 0,0,rad );

}


ViewHKL.prototype.drawAxes = function ( zone )  {

  this.canvas.setLineWidth ( 1 );
  this.canvas.setLineColor ( 220,0,0,1 );
  this.canvas.setFillColor ( 220,0,0,1 );
  if (zone.axisx.x1<Number.MAX_VALUE)
    this.canvas.drawArrow  ( zone.axisx.x1,zone.axisx.y1,
                             zone.axisx.x2,zone.axisx.y2, 0.075 );
  if (zone.axisy.x1<Number.MAX_VALUE)
    this.canvas.drawArrow  ( zone.axisy.x1,zone.axisy.y1,
                             zone.axisy.x2,zone.axisy.y2, 0.075 );

}


ViewHKL.prototype.drawZone = function()  {

  var mtz        = this.mtz;
  var projection = this.projection_radio.getValue();
  var zoneLevel  = this.zoneLevel       .getValue();
  var columnNo   = parseInt(this.column_ddn.getValue());
  var zone       = mtz.makeZone ( projection,mtz.column_dataset[columnNo],zoneLevel );

  // clear canvas
  this.canvas.clear();

  // draw axis
  this.drawAxes ( zone );

  // draw resolution circle
  this.drawResCircle ( zone );

  // draw reflection spots
  this.drawReflections ( zone,columnNo );

}


ViewHKL.prototype.makeReflectionMonitor = function()  {

  var row = this.controlPanel.getNRows();
  this.controlPanel.setLabel   ( '<p>&nbsp;<hr/>Current reflection',row++,0,1,2 );
  this.monitor = this.controlPanel.setGrid ( '-compact',row,0,1,3 )
  this.monitor.setLabel   ( 'HKL'       ,0,0,1,1 ).setFontItalic ( true );
  this.monitor.setLabel   ( 'Value'     ,1,0,1,1 ).setFontItalic ( true );
  this.monitor.setLabel   ( 'Resolution',2,0,1,1 ).setFontItalic ( true );

  (function(self){
    self.canvas.setMouseMoveListener ( function(x,y){
      var ix = Math.round ( x/self.mouse_cell );
      var iy = Math.round ( y/self.mouse_cell );
      var clear = true;
      if (iy<self.mouse_cells.length)  {
        if (ix<self.mouse_cells[iy].length)  {
          var m = self.mouse_cells[iy][ix];
          if (m)  {
            refl = self.mtz.getZone().reflections[m.reflectionNo];
            self.monitor.setLabel ( refl.h + '&nbsp;&nbsp;' + refl.k +
                                             '&nbsp;&nbsp;' + refl.l, 0,1,1,1 );
            self.monitor.setLabel ( self.round2(m.V)      ,1,1,1,1 );
            self.monitor.setLabel ( self.round2(refl.reso),2,1,1,1 );
            if (self.mouse_refl)
              self.drawSpot ( self.mouse_refl );
            self.highlightSpot ( m );
            self.mouse_refl = m;
            clear = false;
          }
        }
      }
      if (clear)  {
        self.monitor.setLabel ( '',0,1,1,1 );
        self.monitor.setLabel ( '',1,1,1,1 );
        self.monitor.setLabel ( '',2,1,1,1 );
        if (self.mouse_refl)
          self.drawSpot ( self.mouse_refl );
        self.mouse_refl = null;
      }
    });
  }(this))

}


ViewHKL.prototype.makeTab4 = function()  {

  this.tab4 = this.tabs.addTab ( 'HKL Zone',false );
  var grid  = this.tab4.grid;
  var mtz   = this.mtz;

  this.ithresh     = 1.0;
  this.vcontrast   = 0.5;
  this.color_range = 250;
  this.mouse_cell  = 1.0;
  this.mouse_cells = [];

  this.canvas = new Canvas ( 300,300, -1.1,-1.1, 1.1,1.1 );
  grid.setWidget ( this.canvas,0,0,5,1 );

  grid.setLabel ( '&nbsp;&nbsp;',0,1,1,1 );

  this.controlPanel = grid.setGrid ( '',0,2,1,1 );

  this.makeDataSelector     ();
  this.makeProjectionRadio  ();
  this.makeZoneLevelSpinner ();
  this.makeResolutionSpinner();
  this.makeContrastSliders  ();
  this.makeReflectionMonitor();

  grid.setLabel ( '',0,3,1,1 );
  grid.setCellSize ( 'auto','',0,0 );
  grid.setCellSize ( 'auto','',0,1 );
  grid.setCellSize ( 'auto','',0,2 );
  grid.setCellSize ( '95%' ,'',0,3 );

  (function(self){

    function resizeTab()  {
      var d = Math.min ( $(window).height()-80,$(window).width()-370 );
      self.canvas.resize ( d,d );
      window.setTimeout ( function(){
        self.drawZone();
      },0 );
    }

    $(window).resize ( resizeTab );

    resizeTab();

  }(this))

}
