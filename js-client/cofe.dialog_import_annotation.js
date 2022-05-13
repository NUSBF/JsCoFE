
/*
 *  ==========================================================================
 *
 *    20.01.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_import_annotation.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Annotation Dialog (to annotate data before upload)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  ==========================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// ---------------------------------------------------------------------------
// ImportAnnotationDialog class

function ImportAnnotationDialog ( file_mod,onReady_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Import Annotation' );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  this.annotation = file_mod.annotation;
  this.scalepack  = {};
  if ('scalepack' in file_mod)
    this.scalepack = file_mod.scalepack;

  this.makePage();

  (function(self){
    var h = $(window).height()/2;
    $(self.element).dialog({
      resizable : true,
      height    : 'auto',
      maxHeight : h,
      width     : 750,
      modal     : true,
      open      : function(event, ui) {
        $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
      },
      buttons   : {
        "Apply & Upload": function() {
          if (self.validate())  {
            $( this ).dialog( "close" );
            onReady_func();
          }
        }
      }
    });
  }(this))

}

ImportAnnotationDialog.prototype = Object.create ( Widget.prototype );
ImportAnnotationDialog.prototype.constructor = ImportAnnotationDialog;


ImportAnnotationDialog.prototype.makePage = function()  {
  var proteinRes = [ "E","F","J","L","O","P","Q","X","Z" ];

  var row = 0;  // glogal grid
  var r   = 0;  // local grids

  this.winputs = [];
  if (!jQuery.isEmptyObject(this.scalepack))  {

    this.grid.setLabel ( '<h2>Import of Scalepack Dataset(s)</h2> ' +
                         '<i>Specify wavelength values.</i>',
                         row++,0, 1,1 );
    this.grid.setHLine ( 1, row++,0,1,1 );
    //this.grid.setLabel ( '&nbsp;', row++,0, 1,1 );

    var sca_grid = this.grid.setGrid ( '-compact',row++,0,1,5 );

    r = 0;
    for (fname in this.scalepack)  {
      sca_grid.setLabel ( 'File:&nbsp;',r,0, 1,1 );
      sca_grid.setLabel ( '<span class="pre-heavy">' + fname + '</span>',r,1, 1,1 );
      sca_grid.setLabel ( '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                          'wavelength (&Aring;):',r,2, 1,1 );
      sca_grid.setVerticalAlignment  ( r,0,'middle' );
      sca_grid.setVerticalAlignment  ( r,1,'middle' );
      sca_grid.setVerticalAlignment  ( r,2,'middle' );
      sca_grid.setHorizontalAlignment ( r,2,'right' );
      var winput = sca_grid.setInputText(this.scalepack[fname].wavelength,r++,3,1,1)
                           .setStyle ( 'text','real','','must be specified' )
                           .setWidth_px ( 40 );
      winput.file = fname;
      this.winputs.push ( winput );
    }

    sca_grid.setLabel ( '&nbsp;',r++,0, 1,1 );

  }

  this.dropdowns = [];

  if (this.annotation.length>0)  {

    this.grid.setLabel ( '<h2>Sequence Import</h2> ' +
                         '<i>Specify appropriate sequence types.</i>',
                         row++,0, 1,1 );
    this.grid.setHLine ( 1, row++,0,1,1 );
    //this.grid.setLabel ( '&nbsp;', row++,0, 1,1 );

    var seq_grid = this.grid.setGrid ( '-compact',row++,0,1,1 );

    for (var i=this.annotation.length-1;i>=0;i--)
      if (this.annotation[i].items[0].type=='none')  {

        seq_grid.setLabel ( 'File: ',row,0, 1,1 );
        var lbl_text = this.annotation[i].file;
        if (this.annotation[i].items.length>1)
          lbl_text += ' will be split into single-sequence files';
        else if (this.annotation[i].file!=this.annotation[i].rename)
          lbl_text += ' (renamed to ' + this.annotation[i].rename + ')';
        seq_grid.setLabel ( lbl_text,row++,1, 1,1 );
        seq_grid.setLabel ( ' ',row,4, 1,1 );

        seq_grid.setCellSize ( 'auto','',row,0 );
        seq_grid.setCellSize ( 'auto','',row,1 );
        seq_grid.setCellSize ( 'auto','',row,2 );
        seq_grid.setCellSize ( 'auto','',row,3 );
        seq_grid.setCellSize ( '99%' ,'',row,4 );

        for (var j=0;j<this.annotation[i].items.length;j++)  {
          //var clist   = this.annotation[i].items[j].contents.match(/^.*([\n\r]+|$)/gm);
          var clist   = this.annotation[i].items[j].contents.replace(/\r/g,'').split('\n');
          var seqline = '<pre class="pre-heavy">';
          if (clist.length>0)
            seqline += clist[0] + '\n';
          var n = 0;
          for (var k=1;k<clist.length;k++)  {
            for (var m=0;m<clist[k].length;m++)  {
              if (n>=62)  {
                seqline += '\n';
                n = 0;
              }
              seqline += clist[k][m];
              n++;
            }
          }
          while (n<62)  {
            seqline += ' ';
            n++;
          }
          seqline += '\n';
          var contents_lbl = seq_grid.setLabel ( seqline+'</pre>',row,1, 1,1 );
          if (this.annotation[i].items[j].type=='none')  {
            var clist = this.annotation[i].items[j].contents.split('\n');
            clist[0]  = '';
  //          if ((clist.length>2) && this.annotation[i].file.toLowerCase().endsWith('.pir'))
            if ((clist.length>2) && endsWith(this.annotation[i].file.toLowerCase(),'.pir'))
              clist[1] = '';
            var s = clist.join(' ');
            var isProtein = false;
            for (var k=0;(k<s.length) && (!isProtein);k++)
              isProtein = (proteinRes.indexOf(s[k]) >= 0);
            if (isProtein)
              this.annotation[i].items[j].type = 'protein';
          }
          seq_grid.setLabel ( '&nbsp;&nbsp;&nbsp;',row,2, 1,1 ); //.setWidth_px ( 200 );
          var dropdown = new Dropdown();
          seq_grid.addWidget ( dropdown,row++,3,1,1 );
          dropdown.addItem ( '[select type]','','none',this.annotation[i].items[j].type=='none');
          dropdown.addItem ( 'Protein','','protein',this.annotation[i].items[j].type=='protein');
          dropdown.addItem ( 'DNA','','dna',this.annotation[i].items[j].type=='dna');
          dropdown.addItem ( 'RNA','','rna',this.annotation[i].items[j].type=='rna');
          dropdown.make();
          dropdown.annotation_item = this.annotation[i].items[j];
          this.dropdowns.push ( dropdown );
        }
        seq_grid.setLabel ( '&nbsp;',row++,0, 1,1 );

      }

  }

}

ImportAnnotationDialog.prototype.validate = function()  {
var msg = '';

  for (var i=0;i<this.winputs.length;i++)  {
    var wl = this.winputs[i].getValue();
    this.scalepack[this.winputs[i].file].wavelength = wl;
    if (!isFloat(wl))  {
      msg = '<li>specify wavelength for all datasets</li>';
      break;
    }
  }

  for (var i=0;i<this.dropdowns.length;i++)  {
    this.dropdowns[i].annotation_item.type = this.dropdowns[i].getValue();
    if (this.dropdowns[i].annotation_item.type=='none')  {
      msg += '<li>specify types of all sequences</li>';
      break;
    }
  }

  if (msg.length>0)
    new MessageBox ( 'Annotation not complete',
                     'Please complete annotation of imported data item(s):<ul>' +
                     msg + '</ul', 'msg_warning' );

  return (msg.length<=0);

}
