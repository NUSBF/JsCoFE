
/*
 *  =================================================================
 *
 *    09.08.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.sequence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Sequence Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.template' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataSequence()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type   = 'DataSequence';

  this.size    = 0;     // number of residues
  this.weight  = 0.0;   // molecular weight
  this.ncopies = 1;     // expected number of copies in ASU
  this.nfind   = 1;     // copies to find
  this.ncopies_auto = true;  // flag to find ncopies automatically

  //this.ensembles = [];    // list of chosen ensemble models for MR

}

if (__template)
      DataSequence.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataSequence.prototype = Object.create ( DataTemplate.prototype );
DataSequence.prototype.constructor = DataSequence;


// ===========================================================================

DataSequence.prototype.title      = function()  { return 'Macromolecular sequence'; }
DataSequence.prototype.icon_small = function()  { return './images/data_20x20.svg'; }
DataSequence.prototype.icon_large = function()  { return './images/data.svg';       }

// when data class version is changed here, change it also in python
// constructors
DataSequence.prototype.currentVersion = function()  { return 3; } // from 09.08.2018

// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataSequence.prototype.extend = function() {
    var seqext = $.extend ( true,{},this );
    seqext.xyzmeta = $.extend ( true,{},this.xyzmeta );
    /*
    seqext.ensembles = [];
    for (var i=0;i<this.ensembles.length;i++)
      seqext.ensembles.push ( this.ensembles[i].extend() );
    */
    return seqext;
  }


  DataSequence.prototype.makeDataSummaryPage = function ( task ) {
    var dsp = new DataSummaryPage ( this );

    if (this.files[file_key.seq]=='(unknown)')

      dsp.makeRow ( 'Contents','** UNKNOWN SEQUENCE **','Macromolecular sequence' );

    else  {

      dsp.makeRow ( 'Contents'            ,'','Macromolecular sequence' );

      var req_data  = {};
      req_data.meta = {};
      req_data.meta.project = task.project;
      req_data.meta.id      = this.jobId;
      req_data.meta.file    = 'output/' + this.files[file_key.seq];

      serverRequest ( fe_reqtype.getJobFile,req_data,'Inspect sequence data',
                      function(data){
        dsp.table.setLabel ( '<pre>'+data+'</pre>', dsp.trow-1,1, 1,1 );
      },null,'persist');

    }

    return dsp;

  }


  DataSequence.prototype.layCustomDropdownInput = function ( dropdown )  {
  var customGrid = dropdown.customGrid;
  var row        = 0;

    this.makeASUContentInput = function ( g )  {
      g.setLabel ( 'Number of copies in ASU:',0,0,1,1 ).setFontItalic ( true );
      customGrid.ncopies_inp = g.setInputText ( this.ncopies,0,1,1,1 )
                    .setStyle ( 'text','integer','',
                      'Specify the anticipated number of sequence copies ' +
                      'in asymmetric unit' )
                    .setWidth_px ( 50 );
      g.setVerticalAlignment ( 0,0,'middle' );
    }

//    if (dropdown.layCustom.startsWith('asu-content'))  {
    if (startsWith(dropdown.layCustom,'asu-content'))  {

      var grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      this.makeASUContentInput ( grid );

//    } else if (dropdown.layCustom.startsWith('stoichiometry'))  {
    } else if (startsWith(dropdown.layCustom,'stoichiometry'))  {

      var grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      grid.setLabel ( 'Number of copies in a.s.u.:',0,0,1,1 )
          .setFontItalic ( true ).setNoWrap ( true );
      var nc_value = this.ncopies;
      if ((dropdown.layCustom=='stoichiometry-wauto') && this.ncopies_auto)
        nc_value = '';
      customGrid.ncopies_inp = grid.setInputText ( nc_value,0,1,1,1 )
                    .setStyle ( 'text','integer','auto',
                      'Specify stoichiometric coefficent for given sequence ' +
                      'in the crystal' )
                    .setWidth_px ( 50 );
      grid.setVerticalAlignment ( 0,0,'middle' );

    }
/*
    } else if (dropdown.layCustom.startsWith('ensemble'))  {

      var grid = customGrid.setGrid ( '-compact',row++,0,1,2 );
      this.makeASUContentInput ( grid );

      var data = dropdown.dataBox.data;
      if ('DataEnsemble' in data)  {

        var de  = data['DataEnsemble'];
        var ens = [];
        for (var i=0;i<de.length;i++)
          if (de[i].associated.indexOf(this.dataId)>=0)
            ens.push ( de[i] );

        customGrid.ensembles = ens;
        customGrid.widgets   = [];

        if (ens.length<1)
          customGrid.setLabel ( 'No models were prepared for this sequence',
                                row,0,1,6 ).setFontItalic ( true );
        else  {

          customGrid.setLabel ( '<hr/>' ,row++,0,1,5 );
          customGrid.setLabel ( ''        ,row,0,1,1 ).setWidth_px   ( 32   );
          customGrid.setLabel ( 'Model(s)',row,1,1,1 ).setFontItalic ( true );
          customGrid.setLabel ( '&nbsp;'  ,row,2,1,1 ).setWidth_px   ( 10   );
          customGrid.ncopies_lbl =
                      customGrid.setLabel ( 'N<sub>copies</sub>',row,3,1,1 )
                                .setFontItalic ( true )
                                .setVisible ( (this.ensembles.length>0) );
//          customGrid.setLabel ( '',row,4,1,1 ).setWidth_px   ( 1   );
          customGrid.rmsds_lbl =
                      customGrid.setLabel ( 'R.m.s.d.',row,4,1,1 )
                                .setFontItalic ( true )
                                .setVisible ( (this.ensembles.length>0) );
          row++;

          for (var i=0;i<ens.length;i++)
            for (var j=0;j<this.ensembles.length;j++)
              if (ens[i].dataId==this.ensembles[j].dataId)
                ens[i] = this.ensembles[j].extend();

          for (var i=0;i<ens.length;i++)  {
            var widgets = {};

            widgets.inspect_btn = customGrid
                            .setButton  ( '','./images/inspect.svg',row,0,1,1 )
                            .setTooltip ( 'Inspect details' )
                            .setSize    ( '32px','32px' )
                            .setVisible ( (i<this.ensembles.length) );

            var ddn     = new Dropdown();
            var ncopies = 1;
            var rmsd    = 0.0;

            ddn.addItem ( '[select ensemble]','',-1,(i>=this.ensembles.length) );

            if (i<this.ensembles.length)  {
              for (var j=0;j<ens.length;j++)  {
                ddn.addItem ( ens[j].dname,'',j,
                                    (ens[j].dataId==this.ensembles[i].dataId) );
                if (ens[j].dataId==this.ensembles[i].dataId)  {
                  ncopies = ens[j].ncopies;
                  rmsd    = ens[j].rmsd;
                }
              }
            } else  {
              for (var j=0;j<ens.length;j++)
                ddn.addItem ( ens[j].dname,'',j,false );
            }
            customGrid.setWidget ( ddn,row,1,1,1 );
            ddn.setWidth ( '130%' );
            ddn.make();

            (function(ibtn,d,t,task){
              ibtn.addOnClickListener ( function(){
                t[d.getValue()].inspectData ( task );
              });
            }(widgets.inspect_btn,ddn,ens,dropdown.task));

            widgets.ddn     = ddn;
            widgets.ncopies = customGrid.setInputText ( ncopies,row,3,1,1 )
                          .setStyle ( 'text','integer','',
                            'Specify the number of model copies to look for ' +
                            'in asymmetric unit' )
                          .setWidth_px ( 50 )
                          .setVisible  ( (i<this.ensembles.length) );

            widgets.rmsd = customGrid.setInputText ( rmsd,row,4,1,1 )
                          .setStyle ( 'text','real','',
                  'Specify the measure of dispersion (in angstroms) for model' )
                          .setWidth_px ( 50 )
                          .setVisible  ( (i<this.ensembles.length) );

            customGrid.widgets.push ( widgets );
            ddn.setVisible ( (i<=this.ensembles.length) );
            ddn.serNo = i;

            (function(d,cgrid){
              d.addSignalHandler ( 'state_changed',function(data){
                var widgets = cgrid.widgets;
                var k       = widgets.length;

                for (var n=widgets.length;n>0;n--)
                  if (widgets[n-1].ddn.getValue()<0)  k = n-1;
                                                else  break;

                // read current input except one for the changed item
                for (var n=0;n<k;n++)
                  if (widgets[n].ncopies.isVisible() && (n!=d.serNo))  {
                    var ensNo = widgets[n].ddn.getValue();
                    if (ensNo>=0)  {
                      var de     = cgrid.ensembles[ensNo];
                      de.ncopies = parseInt   ( widgets[n].ncopies.getValue() );
                      de.rmsd    = parseFloat ( widgets[n].rmsd   .getValue() );
                    }
                  }

                // read input for the changed item
                if ((data.prev_item!==undefined) && (data.prev_item>=0))  {
                  var de     = cgrid.ensembles[data.prev_item];
                  de.ncopies = parseInt   ( widgets[d.serNo].ncopies.getValue() );
                  de.rmsd    = parseFloat ( widgets[d.serNo].rmsd   .getValue() );
                }

                for (var n=0;n<widgets.length;n++)  {
                  widgets[n].inspect_btn.setVisible ( (n<k)  );
                  widgets[n].ddn        .setVisible ( (n<=k) );
                  widgets[n].ncopies    .setVisible ( (n<k)  );
                  widgets[n].rmsd       .setVisible ( (n<k)  );
                  var ensNo = widgets[n].ddn.getValue();
                  if (ensNo>=0)  {
                    var de = cgrid.ensembles[ensNo];
                    widgets[n].ncopies.setValue ( de.ncopies );
                    widgets[n].rmsd   .setValue ( de.rmsd    );
                  }
                }

                cgrid.ncopies_lbl.setVisible ( (k>0) );
                cgrid.rmsds_lbl  .setVisible ( (k>0) );

              });
            }(ddn,customGrid));

            row++;

          }

        }

      } else
        customGrid.setLabel ( 'No models were prepared for molecular replacement',
                              row,0,1,2 ).setFontItalic ( true );

    }
    */

    if (row>0)
      customGrid.setLabel ( ' ',row,0,1,2 ).setHeight_px ( 8 );

  }


  DataSequence.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

//    if ((dropdown.layCustom.startsWith('asu-content')) ||
//        (dropdown.layCustom.startsWith('stoichiometry')))  {
    if (startsWith(dropdown.layCustom,'asu-content') ||
        startsWith(dropdown.layCustom,'stoichiometry'))  {
      var nc_value = customGrid.ncopies_inp.getValue();
      this.ncopies_auto = (nc_value.length<=0);
      if (!this.ncopies_auto)
        this.ncopies = parseInt ( nc_value );
    }

    /*
    this.ensembles = [];  // list of chosen ensemble models for MR

    if ('widgets' in customGrid)  {
      var n = 0;
      for (var i=0;i<customGrid.widgets.length;i++)  {
        var k = customGrid.widgets[i].ddn.getValue();
        if (k>=0)  {
          var de     = customGrid.ensembles[k].extend();
          de.ncopies = parseInt   ( customGrid.widgets[i].ncopies.getValue() );
          de.rmsd    = parseFloat ( customGrid.widgets[i].rmsd   .getValue() );
          this.ensembles.push ( de );
        }
      }
    }
    */

    return msg;

  }


} else  {
  //  for server side

  module.exports.DataSequence = DataSequence;

}
