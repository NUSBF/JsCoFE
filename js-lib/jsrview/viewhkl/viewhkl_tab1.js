

ViewHKL.prototype.round1 = function ( V )  {
  return  Math.round ( 10*V ) / 10;
}

ViewHKL.prototype.round2 = function ( V )  {
  return  Math.round ( 100*V ) / 100;
}


ViewHKL.prototype.makeTab1 = function()  {

  var grid = this.tab1.grid;

  grid.setLabel ( '<h2>General data</h2>',0,0,1,1 );
  var table1 = grid.setTable ( 1,0,1,1 ).setWidth ( 'auto' );
  var mtz    = this.mtz;
  var cstr   = this.mtz.getCellString ( -1 );

  table1.setRow ( 'Path','',                        [this.basename], 0, false );
  table1.setRow ( 'Type','',                         ['Merged MTZ'], 1, false );
  table1.setRow ( 'Space group','',                [mtz.spacegroup], 2, false );
  table1.setRow ( 'Space group confidence','', [mtz.spacegroupconf], 3, false );
  table1.setRow ( 'Cell (a,b,c,&alpha;,&beta;,&gamma;)','',  [cstr], 4, false );
  table1.setRow ( 'Resolution low' ,'',  [this.round2(mtz.lowreso)], 5, false );
  table1.setRow ( 'Resolution high','', [this.round2(mtz.highreso)], 6, false );
  table1.setRow ( 'Number of Lattices','',         [mtz.latticenum], 7, false );
  table1.setRow ( 'Number of Reflections','',  [mtz.numreflections], 8, false );
  table1.setRow ( 'Number of Datasets','',               [mtz.ndif], 9, false );

  table1.setColumnCSS ( {'text-align':'left'},1,0 );

  grid.setCellSize ( '10%','',1,0 );
  grid.setCellSize ( '90%','',1,1 );

  grid.setLabel ( '<br>&nbsp;',2,0,1,1 );

  var r = 3;
  for (var ds in mtz.dataset)  {

    var sectitle;
    if (ds=='0')
      sectitle = 'Columns common to all datasets';
    else
      sectitle = 'Dataset #' + ds + ':&nbsp;&nbsp;&nbsp;' +
                            mtz.dataset[ds].project + ' / ' +
                            mtz.dataset[ds].crystal + ' / ' +
                            mtz.dataset[ds].name;

    var sec    = grid.setSection ( sectitle,false,r++,0,1,2 );
    var stable = sec.grid.setTable ( 0,0,1,1 ).setWidth ( 'auto' );

    var row = 0;
    cstr = this.mtz.getCellString ( ds );
    if (cstr)  {
      stable.setRow  ( 'Cell (a,b,c,&alpha;,&beta;,&gamma;)','',[cstr],row,false );
      stable.setSpan ( row++,1,1,60 );
    }
    if (mtz.dataset[ds].dwavel!=null)  {
      stable.setRow  ( 'Wavelength','',[mtz.dataset[ds].dwavel],row,false );
      stable.setSpan ( row++,1,1,60 );
    }

    var cols = [];
    for (var j=0;j<mtz.dataset[ds].col_labels.length;j++)
      cols.push ( '<center>' + mtz.dataset[ds].col_labels[j] + '<br><i>' +
                               mtz.dataset[ds].col_types[j]  + '</i></center>' );
    stable.setRow ( 'Column Label<br>Column Type','',cols,row++,false );
    stable.setAllColumnCSS ( {'text-align':'left'},0,1 );

  }

  grid.setLabel ( '&nbsp;',3+mtz.ndif,0,1,1 );

}
