

ViewHKL.prototype.makeTab2 = function()  {

  this.tab2 = this.tabs.addTab ( 'Summary',false );
  var grid  = this.tab2.grid;
  var mtz   = this.mtz;

  grid.setLabel ( '<h2>History</h2>',0,0,1,1 );
  grid.setLabel ( mtz.historyfiles.join("<br/>"),1,0,1,1 )
      .setFontSize ( '0.85em' );

  grid.setLabel ( '<h2>Summary</h2>',2,0,1,1 );
  var stable = grid.setTable ( 3,0,1,1 ).setWidth ( 'auto' );
  stable.setHeaderRow ( [
    'Dataset',
    'Label',
    'Type',
    'Min',
    'Max',
    'Number<br>Missing',
    '% Complete',
    'Mean',
    'Mean<br>abs',
    'Reso.<br>Low',
    'Reso.<br>High'
  ],[] );

  var col_count = 0;
  for (var d in mtz.dataset)  {
    var ds = mtz.dataset[d];
    var i = parseInt(d);
    for (var n=0;n<mtz.dataset[d].col_labels.length;n++)  {
      var num_miss  = mtz.numberMissing[col_count];
      var num_found = mtz.numreflections - num_miss;
      stable.setRow ( '','',[
        i,
        ds.col_labels[n],
        ds.col_types [n],
        this.round2 ( ds.min[n] ),
        this.round2 ( ds.max[n] ),
        num_miss,
        this.round1 ( 100*(mtz.numreflections-num_miss)/mtz.numreflections ),
        this.round2 ( mtz.data_total    [col_count]/num_found ),
        this.round2 ( mtz.abs_data_total[col_count]/num_found ),
        this.round2 ( mtz.column_lowres [col_count] ),
        this.round2 ( mtz.column_highres[col_count] )
      ],++col_count,(i & 1)==1 );
    }
  }

  stable.setAllColumnCSS ( {'text-align':'left'},1,0 );

  grid.setLabel ( '&nbsp;',4,0,1,1 );

}
