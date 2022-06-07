

function ViewHKL ( sceneId,resize_to_window )  {

  // clear the page first
  $('#'+sceneId).empty();

  // retain basic element for GUI classes
  this.sceneId = sceneId;
  this.element = document.getElementById ( sceneId );
  this.resize_to_window = resize_to_window;

}


ViewHKL.prototype.Init = function()  {
  this.mtz           = null;  // MTZ data class
  this.id_counter    = 0;     // intenal counter for element ids
  this.tab3_maxNrows = 100;   // maximum number of rows in reflection table
}


ViewHKL.prototype.Load = function ( source )  {

  var url_str = null;
  if (typeof source === 'string' || source instanceof String)
    url_str = source;
  else
    url_str = source.name;

  // url_str = url_str.split('/').reverse()[0];
  // alert ( ' url_str=' + url_str );

  // clear the page first

  $('#'+this.sceneId).empty();
  this.Init();

  // make master layout

  if (this.resize_to_window)  {
    $(this.element).css ( 'width:100%' );
    $(this.element).height ( window.innerHeight-16 );
  }

  this.tabs = new Tabs();
  $(this.tabs.element).appendTo(this.element);
  this.tab1 = null;
  this.tab2 = null;
  this.tab3 = null;
  this.tab4 = null;

  if (this.resize_to_window)  {
    (function(self){
      $(window).resize ( function(){
        $(self.element).height ( window.innerHeight-16 );
        self.tabs.refresh();
      });
    }(this));
  }

  this.mtz      = new MTZ();
  this.basename = url_str.split('/').reverse()[0];

  this.tab1 = this.tabs.addTab ( 'General',true );
  this.tab1.grid.setLabel ( '<h3><i>Loading ' + this.basename + ' ... </i></h3>',0,0,1,1 );

  (function(self){

    self.mtz.Load ( source,
      function(){  // on success

// alert ( 'success ' + url_str );

        self.makeTabs();

      },function(errCode){  // on failure

// alert ( 'failure ' + url_str );

        var err_msg;
        switch (errCode)  {
          case 1 : err_msg = 'header data could not be located';         break;
          case 2 : err_msg = 'no data could be read from file';          break;
          case 3 : err_msg = 'data transmission errors (file missing?)'; break;
          default: err_msg = 'unknown error code (' + errCode + ')';
        }
        $('<h1>ViewHKL</h1>' +
          '<h2>File "' + self.basename + '" cannot be processed</h2>' +
          '<h3>Error: ' + err_msg + '</h3>').appendTo('#' + self.sceneId );

      },function(){  // always
      }

    );

  }(this))

}


ViewHKL.prototype.makeTabs = function()  {

  (function(self){
    self.makeTab1();
    window.setTimeout ( function(){
      self.mtz.calculateStats();
      self.makeTab2();
      self.makeTab3();
      self.makeTab4();
      //self.tabs.setActiveTab ( self.tab4 );
    },0 );
  }(this));

}
