

function MTZ()  {

  this.method = 'POST';
  this.url    = null;
  this.endian = false;

  this.Init();

}


MTZ.prototype.Init = function()  {

  this.spacegroup     = null;
  this.spacegroupconf = 'X';
  this.cell           = [];
  this.lowreso        = null;
  this.highreso       = null;
  this.latticenum     = 1;
  this.ncols          = null;
  this.nrows          = null;
  this.numreflections = null;
  this.ndif           = null;

  this.header         = [];
  this.reflections    = null;
  this.symm           = [];
  this.symm_matrix    = [];
  this.dataset        = {};  // index used as a key due to MTZ irregularities
  this.syminf         = [];
  this.historyfiles   = [];
  this.column_min     = [];  // length will be equal to the number of columns
  this.column_max     = [];  // length will be equal to the number of columns
  this.numberMissing  = [];  // length will be equal to the number of columns
  this.column_lowres  = [];  // length will be equal to the number of columns
  this.column_highres = [];  // length will be equal to the number of columns
  this.column_dataset = [];  // length will be equal to the number of columns

  this.zone           = null;

}


MTZ.prototype.Load = function ( source,function_success,function_fail,
                                       function_always )  {

  function getHeaderOffset ( dataView,dataLength )  {
    var offset = 4*dataView.getUint32(4,self.endian) - 4;
    if ((offset>0) && (offset<dataLength))  {
      var spattern = 'VERS MTZ:';
      var matched  = true;
      for (var i=0;(i<spattern.length) && matched;i++)
        matched = spattern.codePointAt(i) == dataView.getUint8(offset+i);
      if (matched)  return offset;
              else  return -2;
    } else {
      return -1;
    }
  }

  function processBuffer ( arrayBuffer )  {

    var dataView = new DataView(arrayBuffer);
    var hoffset  = getHeaderOffset ( dataView,arrayBuffer.byteLength );
    if (hoffset<0)  {
      self.endian = !self.endian;
      hoffset = getHeaderOffset ( dataView,arrayBuffer.byteLength );
    }

    if (hoffset<0)  {
      if (function_fail)
        function_fail ( 1 );  // no header
    } else  {

      self.header = [];  // will be a list of 80-character strings
      for (var i=hoffset;i<arrayBuffer.byteLength;i+=80)  {
        var s = "";
        var imax = Math.min(i+80,arrayBuffer.byteLength);
        for (var j=i;j<imax;j++)
          s += String.fromCharCode ( dataView.getUint8(j) );
        self.header.push ( s );
      }

      self.reflections = new DataView ( arrayBuffer,80,hoffset-80 );
      self.processData();

      //I've put makeLayouthere for now as variables won't show if put in initialisation
      if (function_success)
        function_success();

    }

  }

  this.Init();

  this.url = source;
  var self = this;

  if (typeof source === 'string' || source instanceof String)  {

    var oReq = new XMLHttpRequest();

    // oReq.onreadystatechange = function() {
    //   alert ( 'readystate = ' + oReq.readyState);
    // };

    oReq.onload = function(oEvent) {

      var arrayBuffer = oReq.response; // Note: not oReq.responseText
      if (arrayBuffer) {
        processBuffer ( arrayBuffer );
      } else {
        if (function_fail)
          function_fail ( 2 );   // no data
      }

      if (function_always)
        function_always();

    };

    oReq.onerror = function()  {
      if (function_fail)
        function_fail ( 3 );
      if (function_always)
        function_always();
    }

    // alert ( 'oReq 1');
    // oReq.send(null);
    // alert ( 'oReq 2 status=' + oReq.status);

    // oReq.overrideMimeType ( "text/plain; charset=x-user-defined" );
    oReq.responseType = 'arraybuffer';
    oReq.timeout      = 9999999;
    oReq.open ( self.method, self.url, true );

    try {
      oReq.send(null);
    } catch (e) {
      alert ( 'loading ' + self.url + ' failed:\n' + e );
    }

/*
    function str2ab(str) {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    $.ajax ({
      url         : self.url,
      async       : true,
      type        : 'POST',
      data        : null,
      // dataType    : 'text',
      crossDomain : true,
      cache       : false,   // added on 27.03.2019
      processData : false,
      // contentType : false,
      responseType: 'arraybuffer',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      timeout     : 0  // in ms; '0' means no timeout
    })
    .done ( function(rdata, status, xhr) {
      // alert ( rdata.length );
      // var arrayBuffer = str2ab ( rdata );
      console.log ( xhr );
      var arrayBuffer = xhr.responseText;
      if (arrayBuffer) {
        processBuffer ( arrayBuffer );
      } else {
        if (function_fail)
          function_fail ( 2 );   // no data
      }
      if (function_always)
        function_always();
    })
    .always ( function(){
      // if (function_always)
      //   function_always();
    })
    .fail   ( function(xhr,err){
      if (function_fail)
        function_fail ( 3 );
      if (function_always)
        function_always();
    });
*/

  } else  {
    // source is coming from SelectFile widget, use FileReader API

    // Read in the image file as a data URL.
    reader.readAsDataURL(source);

    var reader = new FileReader();
    reader.onload = function(e) {
      //var fname         = source.name;
      //var contents_list = e.target.result;
      var arrayBuffer = e.target.result; // Note: not oReq.responseText
      if (arrayBuffer)
        processBuffer ( arrayBuffer );
    };
    reader.readAsBinaryString ( source );

  }

}

// Viewer.prototype.load_file = function load_file (url/*:string*/, options/*:{[id:string]: mixed}*/,
//           callback/*:Function*/) {
//   if (this.renderer === null) { return; }// no WebGL detected
//   var req = new XMLHttpRequest();
//   req.open('GET', url, true);
//   req.responseType = 'arraybuffer';
//   var self = this;
//   Object.keys(this.xhr_headers).forEach(function (name) {
//     req.setRequestHeader(name, self.xhr_headers[name]);
//   });
//   req.onreadystatechange = function () {
//     if (req.readyState === 4) {
//       // chrome --allow-file-access-from-files gives status 0
//       if (req.status === 200 || (req.status === 0 && req.response !== null &&
//                                                      req.response !== '')) {
//         try {
//           callback(req);
//         } catch (e) {
//           self.hud('Error: ' + e.message + '\nwhen processing ' + url, 'ERR');
//         }
//       } else {
//         self.hud('Failed to fetch ' + url, 'ERR');
//       }
//     }
//   };
//   if (options.progress) {
//     req.addEventListener('progress', function (evt /*:ProgressEvent*/) {
//       if (evt.lengthComputable && evt.loaded && evt.total) {
//         var fn = url.split('/').pop();
//         self.hud('loading ' + fn + ' ... ' + ((evt.loaded / 1024) | 0) +
//                  ' / ' + ((evt.total / 1024) | 0) + ' kB');
//         if (evt.loaded === evt.total) { self.hud(); } // clear progress message
//       }
//     });
//   }
//   try {
//     req.send(null);
//   } catch (e) {
//     self.hud('loading ' + url + ' failed:\n' + e, 'ERR');
//   }
// };


MTZ.prototype.processData = function()  {

  function whiteSpaceFilter(str) {
    return /\S/.test(str);
  }

  function checkDataset ( datasets,x )  {
    if (!(x in datasets))  {
      var dataset = {};
      dataset.col_labels = [];
      dataset.col_types  = [];
      dataset.min        = [];
      dataset.max        = [];
      datasets[x] = dataset;
    }

  }

  //alert ( this.header.join('\n') );

  for (var i=0;i<this.header.length;i++)  {
    var hlist = this.header[i].split(" ");
    var key   = hlist[0].toLowerCase();

    switch (key)  {

      case 'ncol':
            var x = hlist.slice(1).filter(whiteSpaceFilter);
            this.ncols          = x[0];
            this.numreflections = x[1];
            this.nrows          = this.reflections.byteLength/(4*this.ncols);
          break;

      case 'cell':
            var cellarray = hlist.slice(1).filter ( whiteSpaceFilter );
            for (var j=0;j<cellarray.length;j++)
              this.cell.push ( parseFloat(cellarray[j]) );
          break;

      case 'syminf':
            // Declare var which contain array position of start and end of
            // space group name
            var x_start,x_end;

            // Store hlist as an array with no whitespace between each element
            this.syminf = hlist.slice(1).filter(whiteSpaceFilter);

            //acquire position of arrays containing spacegroup
            for(q=0;q<this.syminf.length;q++)  {
                if (this.syminf[q].startsWith("'") == true)  {
                    var x_start = q;
                }
                if (this.syminf[q].endsWith("'") == true)  {
                    var x_end = q + 1;
                }
            }
            this.spacegroup = this.syminf.slice(x_start,x_end).join(" ");

          break;

      case 'symm':
            this.symm.push ( hlist.slice(1).join('') );
          break;

      case 'reso':
            var reso      = hlist.slice(1).filter ( whiteSpaceFilter );
            this.lowreso  = 1.0/Math.sqrt(reso[0]);
            this.highreso = 1.0/Math.sqrt(reso[1]);
          break;

      case 'ndif':
            this.ndif    = hlist.slice(1).filter ( whiteSpaceFilter );
            this.dataset = {};
          break;

      case 'project':
            // Put components of dataset into an dataset object
            // create array that stores data in order as array without white-space
            var projectarray = hlist.slice(1).filter ( whiteSpaceFilter );

            //Get dataset number from first element
            var x = projectarray[0];  // this is used as a key, not as a number
            checkDataset ( this.dataset,x );

            //Put rest of data in dataset object
            this.dataset[x].project = projectarray.slice(1).join(' ');

          break;

      case 'crystal':
            var crystalarray = hlist.slice(1).filter ( whiteSpaceFilter );
            var x = crystalarray[0];  // this is used as a key, not as a number
            checkDataset ( this.dataset,x );
            this.dataset[x].crystal = crystalarray.slice(1).join(' ');
          break;

      case 'dataset':
            var dsarray = hlist.slice(1).filter ( whiteSpaceFilter );
            var x = dsarray[0];  // this is used as a key, not as a number
            checkDataset ( this.dataset,x );
            this.dataset[x].crystal = crystalarray.slice(1).join(' ');
            this.dataset[x].name    = dsarray.slice(1).join(' ');
            this.dataset[x].dcell   = [];
            this.dataset[x].dwavel  = null;
          break;

      case 'dcell':
            var dcellarray = hlist.slice(1).filter ( whiteSpaceFilter );
            var x = dcellarray[0];  // this is used as a key, not as a number
            checkDataset ( this.dataset,x );
            dcell = dcellarray.slice(1);
            this.dataset[x].dcell = [];
            for (var j=0;j<dcell.length;j++)
              this.dataset[x].dcell.push ( parseFloat(dcell[j]) );
          break;

      case 'dwavel':
            var dwavelarray = hlist.slice(1).filter ( whiteSpaceFilter );
            var x = dwavelarray[0];  // this is used as a key, not as a number
            checkDataset ( this.dataset,x );
            this.dataset[x].dwavel = parseFloat ( dwavelarray[1] );
          break;

      case 'mtzhist':
            for (var n = i+1; n < (this.header.length - 1); n++)
                this.historyfiles.push( this.header[n] );
          break;
    }

  }

  if (!this.ndif)  {
    this.ndif   = 1;
    checkDataset ( this.dataset,'0' );
  }

  for (var i=0;i<this.header.length;i++)  {
    var hlist = this.header[i].split(' ');
    var key   = hlist[0].toLowerCase();
    if (key=='column')  {
      var col_array = hlist.slice(1).filter(whiteSpaceFilter);
      var x;
      if (col_array.length<=4)  x = 0;
                          else  x = col_array[4];
      this.dataset[x].col_labels.push ( col_array[0] );
      this.dataset[x].col_types .push ( col_array[1] );
      this.dataset[x].min.push ( col_array[2] );
      this.dataset[x].max.push ( col_array[3] );
    }
  }

  this.calc_symm_hkl ();

}


MTZ.prototype.calc_symm_hkl = function ()  {

  //create matrix from XYZ in SYMM header part
  this.symm_matrix = [];

  //alert ( JSON.stringify(this.symm)  );

  for (var t=0; t<this.symm.length; t++)  {

    var T    = [[0,0,0],[0,0,0],[0,0,0]];
    var symm = this.symm[t].split(',');

    for (var n=0; n<3; n++)  {
      var p = 0;
      if (symm[n].startsWith('X'))
        T[n][0] = 1;
      do {
        p = symm[n].indexOf('+X',p);
        if (p>=0) {
          T[n][0] += 1;
          p++;
        }
      } while (p>=0);
      p = 0;
      do {
        p = symm[n].indexOf('-X',p);
        if (p>=0)  {
          T[n][0] -= 1;
          p++;
        }
      } while (p>=0);
      p = 0;
      if (symm[n].startsWith('Y'))
        T[n][1] = 1;
      do {
        p = symm[n].indexOf('+Y',p);
        if (p>=0) {
          T[n][1] += 1;
          p++;
        }
      } while (p>=0);
      p = 0;
      do {
        p = symm[n].indexOf('-Y',p);
        if (p>=0)  {
          T[n][1] -= 1;
          p++;
        }
      } while (p>=0);
      p = 0;
      if (symm[n].startsWith('Z'))
        T[n][2] = 1;
      do {
        p = symm[n].indexOf('+Z',p);
        if (p>=0) {
          T[n][2] += 1;
          p++;
        }
      } while (p>=0);
      p = 0;
      do {
        p = symm[n].indexOf('-Z',p);
        if (p>=0)  {
          T[n][2] -= 1;
          p++;
        }
      } while (p>=0);

    }

    for (var i=0; i < 3; i++)
    {
      for (var j=0; j < i; j++)
      {
        var q = T[j][i]
        T[j][i] = T[i][j]
        T[i][j] = q
      }
    }

    var similar = false;
    for (var k=0;(k<this.symm_matrix.length) && (!similar);k++)  {
      similar = true;
      for (var i=0;(i<3) && similar;i++)
        for (var j=0;(j<3) && similar;j++)
          similar = (T[i][j] == this.symm_matrix[k][i][j]);
    }

    if (!similar)
      this.symm_matrix.push ( T );

  }

}


MTZ.prototype.calculateStats = function()  {

  this.numberMissing  = [];
  this.column_min     = [];  // length will be equal to the number of columns
  this.column_max     = [];  // length will be equal to the number of columns
  this.column_lowres  = [];  // length will be equal to the number of columns
  this.column_highres = [];  // length will be equal to the number of columns
  this.column_dataset = [];  // length will be equal to the number of columns
  this.data_total     = [];
  this.abs_data_total = [];

  for (var i=0;i<this.ncols;i++)  {
    this.column_min    .push ( 0.0 );
    this.column_max    .push ( 0.0 );
    this.numberMissing .push ( 0   );
    this.column_lowres .push ( 0.0 );
    this.column_highres.push ( 0.0 );
    this.column_dataset.push ( 0   );
    this.data_total    .push ( 0.0 );
    this.abs_data_total.push ( 0.0 );
  }

  for (var i=0;i<this.nrows;i++)  {
    for (var j=0;j<this.ncols;j++)  {
      var r = this.get_value ( i,j );
      if (isNaN(r))  {
        this.numberMissing[j]++;
      }
      else {
        this.data_total[j]     += r;
        this.abs_data_total[j] += Math.abs ( r );
      }
    }
  }


  var col_count = 0;
  for (var d in this.dataset)  {

    var dcell;
    if ('dcell' in this.dataset[d])
          dcell = this.dataset[d].dcell;
    else  dcell = this.cell;

    var a     = dcell[0];
    var b     = dcell[1];
    var c     = dcell[2];
    var alpha = dcell[3];
    var beta  = dcell[4];
    var gamma = dcell[5];

    var c1    = Math.cos(Math.PI*alpha/180.0);
    var c2    = Math.cos(Math.PI*beta /180.0);
    var c3    = Math.cos(Math.PI*gamma/180.0);
    var s1    = Math.sin(Math.PI*alpha/180.0);
    var s2    = Math.sin(Math.PI*beta /180.0);
    var s3    = Math.sin(Math.PI*gamma/180.0);

    var omega  = 1.0 - (c1*c1) - (c2*c2) - (c3*c3) + (2.0*c1*c2*c3);
    var somega = Math.sqrt(omega);
    var treso  = [ (1.0-(c1*c1))/(a*a*omega),
                   (1.0-(c2*c2))/(b*b*omega),
                   (1.0-(c3*c3))/(c*c*omega),
                   2.0*((c2*c3)-c1)/(b*c*omega),
                   2.0*((c3*c1)-c2)/(a*c*omega),
                   2.0*((c1*c2)-c3)/(a*b*omega) ];

    var hkl2xy = {};
    hkl2xy['hk0'] = [[s1/(a*somega),(c1*c2-c3)/(s1*b*somega),(c3*c1-c2)/(s1*c*somega)],
                     [0.0, 1.0/(s1*b), -c1/(s1*c)]];
    hkl2xy['0kl'] = [[(c1*c2-c3)/(s2*a*somega),s2/(b*somega),(c2*c3-c1)/(s2*c*somega)],
                     [-c2/(s2*a), 0.0, 1.0/(s2*c)]];
    hkl2xy['h0l'] = [[s1/(a*somega),(c1*c2-c3)/(s1*b*somega),(c3*c1-c2)/(s1*c*somega)],
                     [0.0, -c1/(s1*b), 1.0/(s1*c)]];

    this.dataset[d].hkl2xy  = hkl2xy;
    this.dataset[d].treso   = treso;
    this.dataset[d].lowres  = 0.0;
    this.dataset[d].highres = Number.MAX_VALUE;
    this.dataset[d].col_num = [];

    for (var q=0;q<this.dataset[d].col_labels.length;q++)  {

      this.dataset[d].col_num.push ( col_count );

      var s_min =  Number.MAX_VALUE;
      var s_max = -Number.MAX_VALUE;
      var r_min =  Number.MAX_VALUE;
      var r_max = -Number.MAX_VALUE;

      for (var r=0;r<this.nrows;r++)  {
        var v = this.get_value ( r,col_count );
        if (!isNaN(v))  {

          var h  = this.get_value(r,0);
          var k  = this.get_value(r,1);
          var l  = this.get_value(r,2);

          var s_2 = treso[0]*h*h + treso[1]*k*k + treso[2]*l*l +
                    treso[3]*k*l + treso[4]*h*l + treso[5]*h*k;
          s_min = Math.min ( s_min,s_2 );
          s_max = Math.max ( s_max,s_2 );

          r_min = Math.min ( r_min,v );
          r_max = Math.max ( r_max,v );

        }

      }

      this.column_min    [col_count] = r_min;
      this.column_max    [col_count] = r_max;
      this.column_lowres [col_count] = 1.0/Math.sqrt ( s_min );
      this.column_highres[col_count] = 1.0/Math.sqrt ( s_max );

      this.dataset[d].lowres  = Math.max ( this.dataset[d].lowres,
                                           this.column_lowres[col_count] );
      this.dataset[d].highres = Math.min ( this.dataset[d].highres,
                                           this.column_highres[col_count] );

      this.column_dataset[col_count] = d;

      col_count++;

    }

  }

}


MTZ.prototype.get_value = function ( row,col )  {
  return this.reflections.getFloat32 ( (col + row*this.ncols)*4, this.endian );
}


MTZ.prototype.findHKL = function ( h,k,l )  {
var row = -1;
  for (var i=0;(i<this.nrows) && (row<0);i++)
    if ((Math.abs(this.get_value(i,0)-h)<0.00001) &&
        (Math.abs(this.get_value(i,1)-k)<0.00001) &&
        (Math.abs(this.get_value(i,2)-l)<0.00001))
      row = i;
  return row;
}


MTZ.prototype.getCellString = function ( datasetNo )  {

  var dcell;
  if (parseInt(datasetNo)<0)
    dcell = this.cell;
  else if (!(datasetNo in this.dataset))
    return '';
  else
    dcell = this.dataset[datasetNo].dcell;

  var cstr = '';
  for (var j=0;j<dcell.length;j++)  {
    cstr += dcell[j] + '&nbsp;';
    if (j==2)
      cstr += '&nbsp;&nbsp;&nbsp;';
  }

  return cstr;

}


MTZ.prototype.getZone = function()  {
  return this.zone;
}


MTZ.prototype.makeZone = function ( projection,datasetNo,zoneLevel )  {

  if (this.zone)  {
    if ((this.zone.projection==projection) && (this.zone.zoneLevel==zoneLevel) &&
        (this.zone.datasetNo==datasetNo))
      return this.zone;
  }

  this.zone = {};
  this.zone.projection = projection;
  this.zone.zoneLevel  = zoneLevel;
  this.zone.datasetNo  = datasetNo;

  var ds      = this.dataset[datasetNo];
  var highres = ds.highres;
  var tx      = ds.hkl2xy[projection][0];
  var ty      = ds.hkl2xy[projection][1];
  var treso   = ds.treso;
  var T       = this.symm_matrix;

  var reflections = [];

  var maxRadius = 0.0;
  var minRadius = 10.0;
  var lowReso   = 0.0;

  function addReflection ( h1,k1,l1, iz, row )  {
    if (Math.abs(iz-zoneLevel)<0.000001)  {
      var r  = {};
      r.h    = h1;
      r.k    = k1;
      r.l    = l1;
      r.x    = (tx[0]*h1 + tx[1]*k1 + tx[2]*l1) * highres;
      r.y    = (ty[0]*h1 + ty[1]*k1 + ty[2]*l1) * highres;
      r.reso = 1.0/Math.sqrt ( treso[0]*h1*h1 + treso[1]*k1*k1 + treso[2]*l1*l1 +
                               treso[3]*k1*l1 + treso[4]*h1*l1 + treso[5]*h1*k1 );
      r.row  = row;
      lowReso = Math.max ( lowReso,r.reso );
      var rad = r.x*r.x + r.y*r.y;
      maxRadius = Math.max ( maxRadius,rad );
      minRadius = Math.min ( minRadius,rad );
      reflections.push ( r );
    }
    if (Math.abs(iz+zoneLevel)<0.000001)  {
      var r  = {};
      r.h    = -h1;
      r.k    = -k1;
      r.l    = -l1;
      r.x    = -(tx[0]*h1 + tx[1]*k1 + tx[2]*l1) * highres;
      r.y    = -(ty[0]*h1 + ty[1]*k1 + ty[2]*l1) * highres;
      r.reso = 1.0/Math.sqrt ( treso[0]*h1*h1 + treso[1]*k1*k1 + treso[2]*l1*l1 +
                               treso[3]*k1*l1 + treso[4]*h1*l1 + treso[5]*h1*k1 );
      r.row  = row;
      if (zoneLevel || (Math.abs(r.x)>0.000001) || (Math.abs(r.y)>0.000001))  {
        lowReso = Math.max ( lowReso,r.reso );
        var rad = r.x*r.x + r.y*r.y;
        maxRadius = Math.max ( maxRadius,rad );
        minRadius = Math.min ( minRadius,rad );
        reflections.push ( r );
      }
    }
  }

  for (var i=0;i<this.nrows;i++)  {

    var present = false;
    for (var k=0;(k<ds.col_num.length) && (!present);k++)
      present = !isNaN ( this.get_value(i,ds.col_num[k]) );

    if (present)  {

      var h = this.get_value ( i,0 );
      var k = this.get_value ( i,1 );
      var l = this.get_value ( i,2 );

      for (var j=0;j<T.length;j++)  {

        var h1 = T[j][0][0]*h + T[j][0][1]*k + T[j][0][2]*l;
        var k1 = T[j][1][0]*h + T[j][1][1]*k + T[j][1][2]*l;
        var l1 = T[j][2][0]*h + T[j][2][1]*k + T[j][2][2]*l;

        switch (projection)  {
          default    :
          case 'hk0' : addReflection ( h1,k1,l1, l1, i );  break;
          case '0kl' : addReflection ( h1,k1,l1, h1, i );  break;
          case 'h0l' : addReflection ( h1,k1,l1, k1, i );  break;
        }

      }

    }

  }

  maxRadius = Math.sqrt(maxRadius);
  minRadius = Math.sqrt(minRadius);
  this.zone.reflections = reflections;
  this.zone.maxRadius   = maxRadius;
  this.zone.minRadius   = minRadius;
  this.zone.lowReso     = lowReso;
  this.zone.highReso    = highres;

  this.zone.axisx = {};
  this.zone.axisy = {};

  switch (projection)  {
    default    :
    case 'hk0' : this.zone.axisx.x1 = tx[2]*zoneLevel*highres;
                 this.zone.axisx.y1 = ty[2]*zoneLevel*highres;
                 this.zone.axisx.x2 = this.zone.axisx.x1 + tx[0]*highres;
                 this.zone.axisx.y2 = this.zone.axisx.y1 + ty[0]*highres;
                 this.zone.axisy.x1 = this.zone.axisx.x1;
                 this.zone.axisy.y1 = this.zone.axisx.y1;
                 this.zone.axisy.x2 = this.zone.axisy.x1 + tx[1]*highres;
                 this.zone.axisy.y2 = this.zone.axisy.y1 + ty[1]*highres;
      break;
    case '0kl' : this.zone.axisx.x1 = tx[0]*zoneLevel*highres;
                 this.zone.axisx.y1 = ty[0]*zoneLevel*highres;
                 this.zone.axisx.x2 = this.zone.axisx.x1 + tx[1]*highres;
                 this.zone.axisx.y2 = this.zone.axisx.y1 + ty[1]*highres;
                 this.zone.axisy.x1 = this.zone.axisx.x1;
                 this.zone.axisy.y1 = this.zone.axisx.y1;
                 this.zone.axisy.x2 = this.zone.axisy.x1 + tx[2]*highres;
                 this.zone.axisy.y2 = this.zone.axisy.y1 + ty[2]*highres;
      break;
    case 'h0l' : this.zone.axisx.x1 = tx[1]*zoneLevel*highres;
                 this.zone.axisx.y1 = ty[1]*zoneLevel*highres;
                 this.zone.axisx.x2 = this.zone.axisx.x1 + tx[0]*highres;
                 this.zone.axisx.y2 = this.zone.axisx.y1 + ty[0]*highres;
                 this.zone.axisy.x1 = this.zone.axisx.x1;
                 this.zone.axisy.y1 = this.zone.axisx.y1;
                 this.zone.axisy.x2 = this.zone.axisy.x1 + tx[2]*highres;
                 this.zone.axisy.y2 = this.zone.axisy.y1 + ty[2]*highres;
      break;
  }

  function adjustAxis ( axis,R,type )  {
    var dx = axis.x2 - axis.x1;
    var dy = axis.y2 - axis.y1;
    var a  = dx*dx + dy*dy;
    var b  = axis.x1*dx + axis.y1*dy;
    var c  = axis.x1*axis.x1 + axis.y1*axis.y1 - R*R;
    var D  = b*b - a*c;
    if (D<0.0)  {
      axis.x1 = Number.MAX_VALUE;  axis.y1 = Number.MAX_VALUE;
      axis.x2 = Number.MAX_VALUE;  axis.y2 = Number.MAX_VALUE;
    } else  {
      D  = Math.sqrt ( D );
      var t1 =  (D-b)/a;
      var t2 = -(D+b)/a;
      var x1 = axis.x1 + t1*dx;
      var x2 = axis.x1 + t2*dx;
      var y1 = axis.y1 + t1*dy;
      var y2 = axis.y1 + t2*dy;
      var cd,c1,c2;
      if (type=='x')  {
        cd = dx;
        c1 = x1;
        c2 = x2;
      } else  {
        cd = dy;
        c1 = y1;
        c2 = y2;
      }
      if (cd>0)  {
        if (c1<c2)  {
          axis.x1 = x1;  axis.y1 = y1;
          axis.x2 = x2;  axis.y2 = y2;
        } else  {
          axis.x1 = x2;  axis.y1 = y2;
          axis.x2 = x1;  axis.y2 = y1;
        }
      } else  {
        if (c1<c2)  {
          axis.x1 = x2;  axis.y1 = y2;
          axis.x2 = x1;  axis.y2 = y1;
        } else  {
          axis.x1 = x1;  axis.y1 = y1;
          axis.x2 = x2;  axis.y2 = y2;
        }
      }
    }
  }

  adjustAxis ( this.zone.axisx,maxRadius,'x' );
  adjustAxis ( this.zone.axisy,maxRadius,'y' );

  return this.zone;

}


// ===========================================================================
// export such that it could be used in both node and a browser

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.MTZ = MTZ;
}
