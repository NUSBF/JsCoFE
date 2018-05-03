

ViewHKL.prototype.fillHKLTable = function ( firstRow,hkltable )  {

  hkltable.clearBody();

  var num_rows_shown = Math.min ( this.mtz.nrows,this.tab3_maxNrows );
  var row = Math.min ( firstRow,this.mtz.nrows-num_rows_shown );

  this.h0 = this.mtz.get_value ( row,0 )
  this.k0 = this.mtz.get_value ( row,1 )
  this.l0 = this.mtz.get_value ( row,2 )

  for (var s=0;s<num_rows_shown;s++)  {
    var cell_list = [];
    for (var d=0;d<this.mtz.ncols;d++) {
      var v = this.mtz.get_value(row,d);
      if (isNaN(v))
        cell_list.push ( '?' );
      else
        cell_list.push ( this.round2(v) );
    }
    hkltable.addRow ( row+1,'',cell_list, false ) ; //(s & 1)==1 );
    row++;
  }

}


ViewHKL.prototype.makeTab3 = function()  {

  this.tab3 = this.tabs.addTab ( 'HKL List',false );
  var grid  = this.tab3.grid;
  var mtz   = this.mtz;

  var header_list = [ '#' ];
  for (var ds in mtz.dataset)
    for (var q=0;q<mtz.dataset[ds].col_labels.length;q++)
      header_list.push ( mtz.dataset[ds].col_labels[q] );

  this.h0 = 0;
  this.k0 = 0;
  this.l0 = 0;
  var hklTable = new TableScroll ( '','',header_list,[] );//.setWidth ( 'auto' );

  var tpanel = grid.setPanel ( 0,0,1,10 );
  tpanel.addWidget ( hklTable );
  tpanel.setScrollable ( 'auto','hidden' );

  tpanel  .setHeight_px ( $(window).height() - 150 );
  hklTable.setHeight_px ( $(window).height() - 186 );
  tpanel  .setWidth_px  ( $(window).width () - 70  );

  $(window).resize(function() {
    tpanel  .setHeight_px ( $(window).height() - 150 );
    hklTable.setHeight_px ( $(window).height() - 186 );
    tpanel  .setWidth_px  ( $(window).width () - 70  );
  });

  this.fillHKLTable ( 0,hklTable );

  // ------------------------------------------------------------------------
  // vertical spacer
  grid.setLabel ( '&nbsp;',1,0,1,1 ).setFontSize ( '0.5em' );

  // ------------------------------------------------------------------------
  // table controls

  if (mtz.nrows>this.tab3_maxNrows)  {

    var col = 0;
    grid.setLabel ( 'Starting row:&nbsp;&nbsp;&nbsp;',2,col++,1,1 ).setNoWrap();

    var slider = new Slider ( mtz.nrows - this.tab3_maxNrows );
    grid.setWidget ( slider,2,col++,1,1 );
    grid.setLabel  ( '&nbsp;',2,col++,1,1 );

    var spinner = new Spinner ( 1,mtz.nrows - this.tab3_maxNrows + 1,1,100 );
    spinner.setWidth_px ( 60 );
    spinner.setValue    ( 1  );
    grid.setWidget ( spinner,2,col++,1,1 );

    grid.setLabel ( '&nbsp;&nbsp;&nbsp;H:',2,col++,1,1 );
    var inpH = grid.setInputText ( this.h0,2,col++,1,1 ).setWidth_px ( 50 );
    grid.setLabel ( '&nbsp;K:',2,col++,1,1 );
    var inpK = grid.setInputText ( this.k0,2,col++,1,1 ).setWidth_px ( 50 );
    grid.setLabel ( '&nbsp;L:',2,col++,1,1 );
    var inpL = grid.setInputText ( this.l0,2,col++,1,1 ).setWidth_px ( 50 );

    for (var i=0;i<col;i++)  {
      grid.setCellSize ( '2%','',2,i );
      grid.setVerticalAlignment ( 2,i,'middle' );
    }
    grid.setCellSize ( 'auto','',2,1 );

    (function(self){

      function setHKL()  {
        inpH.setValue ( self.h0 );
        inpK.setValue ( self.k0 );
        inpL.setValue ( self.l0 );
      }

      function findHKL ( x )  {
        var row = mtz.findHKL ( inpH.getValue(),inpK.getValue(),inpL.getValue() );
        if (row>=0)  {
          self.fillHKLTable ( row,hklTable );
          slider .setValue  ( row   );
          spinner.setValue  ( row+1 );
        } else {
          setHKL();
        }
      }

      slider.setListener  ( function(v){
        window.setTimeout ( function(){
          self.fillHKLTable ( v,hklTable );
          spinner.setValue  ( v+1 );
          setHKL();
        },0 );
      });

      spinner.setListener ( function(v){
        self.fillHKLTable ( v-1,hklTable );
        slider.setValue   ( v-1 );
        setHKL();
      });

      inpH.setOnEnterListener ( findHKL );
      inpK.setOnEnterListener ( findHKL );
      inpL.setOnEnterListener ( findHKL );

    }(this))

  }

}
