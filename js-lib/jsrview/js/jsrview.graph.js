//
//  =================================================================
//
//    26.05.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  cofe.tree_job.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's graph module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

var gwHeight       = 400;
var gwTreeWidth    = 300;
var gwPlotWidth    = 605;
var _nGSliderSteps = 100;
var _GSliderPage   = 5;

var graphWidgetList = new Object();
var graphDataHash   = new Object();
var logGraphHash    = new Object();


function addRadarWidget ( data,options,holderId )  {
  if (document.getElementById(holderId))
    RadarChart.draw ( "#"+holderId,
                      eval ( "(" + data + ")" ),
                      eval ( "(" + options + ")" ) );
}


function drawHiddenGraphs ( panel )  {
  if (panel.length>0)  {
    let panelObj = $("#"+panel[0].id);
    if (panelObj)  {
      for (let key in graphWidgetList)  {
        if (panelObj.find("#"+key+"-plot")[0]!=null)  {
          if (graphWidgetList[key]=='loggraph')
                drawLogGraph ( key,null,null );
          else  drawGraph    ( key );
        }
      }
    }
  }
}


$.jqplot.rvapiBarRenderer = function(){
    $.jqplot.BarRenderer.call(this);
};

$.jqplot.rvapiBarRenderer.prototype = new $.jqplot.BarRenderer;

$.jqplot.rvapiBarRenderer.prototype.setBarWidth = function() {
// need to know how many data values we have on the approprate axis and figure it out.
let i,bw;
let nvals   = 0;
let nseries = 0;
let paxis   = this[this._primaryAxis];
let s, series, pos;
let temp = this._plotSeriesInfo = this.renderer.calcSeriesNumbers.call(this);
let nticks = paxis.numberTicks;
let nbins = (nticks-1)/2;

  nvals   = temp[0];
  nseries = temp[1];

  // so, now we have total number of axis values.
  if (paxis.name == 'xaxis' || paxis.name == 'x2axis') {
    if (this._stack) {
      bw = nseries*(paxis._offsets.max-paxis._offsets.min) -
           nvals*this.barMargin;
      this.barWidth = Math.max(1,Math.round(bw/nvals));
    } else {
      bw = paxis._offsets.max - paxis._offsets.min -
           (nvals+1)*(this.barPadding*(nseries-1)+2*this.barMargin);
      this.barWidth = Math.max(1,Math.round(bw/(nvals+1)));
//          this.barWidth = ((paxis._offsets.max - paxis._offsets.min)/ (nvals + 1 ) - this.barPadding * (nseries-1) - this.barMargin*2)/nseries;
          //this.barWidth = ((paxis._offsets.max - paxis._offsets.min)/nbins  - this.barPadding * (nseries-1) - this.barMargin*2)/nseries;
          //this.barWidth = (paxis._offsets.max - paxis._offsets.min) / nvals - this.barPadding - this.barMargin/nseries;
//          alert ( " 2. barWidth = " + this.barWidth + " max=" + paxis._offsets.max + "min=" + paxis._offsets.min + " nvals=" + nvals +
//                 " barPadding=" + this.barPadding + " barMargin=" + this.barMargin + " nseries=" + nseries );
    }
  } else  {
    if (this._stack) {
      bw = nseries*(paxis._offsets.min - paxis._offsets.max) -
           nvals*this.barMargin;
      this.barWidth = Math.max(1,Math.round(bw/nvals));
    } else  {
      bw = paxis._offsets.max - paxis._offsets.min -
           nbins*(this.barPadding*(nseries-1)+this.barMargin);
      this.barWidth = Math.max(1,Math.round(bw/(nbins*nseries)));
//      this.barWidth = ((paxis._offsets.min - paxis._offsets.max)/nbins  - this.barPadding * (nseries-1) - this.barMargin*2)/nseries;
          // this.barWidth = (paxis._offsets.min - paxis._offsets.max) / nvals - this.barPadding - this.barMargin/nseries;
      }
  }

  return [nvals, nseries];

};



function drawLogGraph ( gwdId,data,options )  {
let graphId = gwdId + "-plot";
let div     = document.getElementById ( graphId );

  if (!div)  {
    div = element    ( "div","id",graphId,"" );
    div.setAttribute ( "style","height: "    + gwHeight    +
                               "px; width: " + gwPlotWidth + "px;" +
                               "margin-left: 6px;" );
    setGridItem      ( gwdId,div,0,1,3,1 );
  }

  if (data==null)  {
    let node = $("#"+gwdId+"-tree").tree('getSelectedNode');
    if (node)  {
      let r = _draw_graph ( graphId,node.plotOptions,node.plotData );
      node.plotOptions = r['options'];
    }
  } else  {
    _draw_graph ( graphId,options,data );
  }

}

function zoomAxis ( curax )  {
let newmin,newmax,tickV,R;

  if (curax.renderer.constructor === $.jqplot.LogAxisRenderer)  {

    let min0 = Math.log(curax._min)/Math.LN10;
    let max0 = Math.log(curax._max)/Math.LN10;

    newmin = min0 + curax.smin*(max0-min0);
    newmax = min0 + curax.smax*(max0-min0);

    let tickN,tickL;
    R = newmax - newmin;
    newmin -= R/40.0;
    newmax += R/40.0;

    if (newmin<-320)  newmin = -320;
    if (newmax>320)   newmax = 320;


    if (R<=3.0)  {

      let dtick,k,tv,k0,tv0;

      if (R<=1.0)      dtick = [2,4,6,8,10];
      else if (R<=2.0) dtick = [2,5,8,10];
                  else dtick = [5,10];

      tickV  = Math.pow(10.0,Math.floor(newmin));
      newmin = Math.pow(10.0,newmin);
      newmax = Math.pow(10.0,newmax);

      curax.ticks = [];
      curax.ticks.push ( [newmin," "] );

      k = 0;
      do {
        k0  = k;
        tv  = tickV*dtick[k];
        tv0 = tickV;
        k++;
        if (k>=dtick.length)  {
          k = 0;
          tickV = tv;
        }
      } while (tv<newmin);

      k     = k0;
      tickV = tv0;
      tv    = tickV*dtick[k];

      while (tv<newmax) {
        if ((tv>0.0001) && (tv<10000))  {
          tv = Math.round(tv*1000000)/1000000;
          tickL = tv.toString();
        } else
          tickL = tv.toExponential(0);
        curax.ticks.push ( [tv,tickL] );
        k++;
        if (k>=dtick.length)  {
          k = 0;
          tickV = tv;
        }
        tv = tickV*dtick[k];
      }

      curax.ticks.push ( [newmax," "] );

    } else  {

      let step;
      if (R<8.0)         step = 1.0;
      else if (R<16.0)   step = 2.0;
      else if (R<51.0)   step = 5.0;
      else if (R<81.0)   step = 10.0;
      else if (R<161.0)  step = 20.0;
      else if (R<501.0)  step = 50.0;
      else if (R<801.0)  step = 100.0;
      else if (R<1601.0) step = 200.0;
      else if (R<5001.0) step = 500.0;
                    else step = 1000.0;
      tickN = 0;
      while (tickN<newmin)  tickN += step;
      while (tickN>newmin)  tickN -= step;
      tickN += step;

      curax.ticks = [];
      curax.ticks.push ( [Math.pow(10.0,newmin)," "] );

      while (tickN<newmax)  {
        tickV = Math.pow(10.0,tickN);
        if ((tickV>0.0001) && (tickV<10000))  {
          tickV = Math.round(tickV*1000000)/1000000;
          tickL = tickV.toString();
        } else
          tickL = tickV.toExponential(0);
//          else tick.push ( "\u2081\u2080" + tickN.toString() );
        curax.ticks.push ( [tickV,tickL] );
        tickN += step;
      }

      curax.ticks.push ( [Math.pow(10.0,newmax)," "] );

    }

    curax.tickOptions.tickDistribution = "power";
    curax.tickOptions.formatString     = "";

  } else  {

    newmin = curax._min + curax.smin*(curax._max-curax._min);
    newmax = curax._min + curax.smax*(curax._max-curax._min);

    R = newmax - newmin;
    newmin -= R/40.0;
    newmax += R/40.0;

    let _numberTicks = null;
    let ret = $.jqplot.LinearTickGenerator ( newmin,newmax,
                                       curax._scalefact,_numberTicks );

    if (curax.renderer.constructor === $.jqplot.LinearAxisRenderer)  {

//   alert ( " ret3=" + ret[3] + "  n="+ $.jqplot.sprintf( ret[3],10.5) );
      curax.ticks = [];

      tickV = ret[0];
      while (tickV<newmin)  tickV += ret[4];

      if (tickV>newmin)
        curax.ticks.push ( [newmin," "] );

      while (tickV<newmax)  {
        curax.ticks.push ( [tickV,$.jqplot.sprintf(ret[3],tickV)] );
        tickV += ret[4];
      }

      if (tickV==newmax)
            curax.ticks.push ( [tickV,$.jqplot.sprintf(ret[3],tickV)] );
      else  curax.ticks.push ( [newmax," "] );

    } else if (curax.renderer.constructor === $.jqplot.DateAxisRenderer)  {

      // if new minimum is less than "true" minimum of axis display, adjust it
      if (curax.tickInset && ret[0] < curax.min + curax.tickInset * curax.tickInterval) {
        ret[0] += ret[4];
        ret[2] -= 1;
      }
      // if new maximum is greater than "true" max of axis display, adjust it
      if (curax.tickInset && ret[1] > curax.max - curax.tickInset * curax.tickInterval) {
        ret[1] -= ret[4];
        ret[2] -= 1;
      }
      // for log axes, don't fall below current minimum, this will look bad and can't have 0 in range anyway.
      if (curax.renderer.constructor === $.jqplot.LogAxisRenderer && ret[0] < curax.min) {
        // remove a tick and shift min up
        ret[0] += ret[4];
        ret[2] -= 1;
      }

      curax.min = ret[0];
      curax.max = ret[1];
      curax._autoFormatString = ret[3];
      curax.numberTicks  = ret[2];
      curax.tickInterval = ret[4];
      // for date axes...
      curax.daTickInterval = [ret[4]/1000, 'seconds'];

    } else  {

      curax.min = newmin;
      curax.max = newmax;
      curax.tickInterval = null;
      curax.numberTicks  = null;
       // for date axes...
      curax.daTickInterval = null;

    }

  }

}


function drawGraph ( gwdId )  {
let graphOptions = graphDataHash[gwdId]['options'];
let graphData    = graphDataHash[gwdId]['data'];
let plotId       = graphOptions.curplot;
let graphId      = gwdId+"-plot";
let k            = -1;

  for (let i=0;(i<graphData.length) && (k<0);i++)
    if (graphData[i].id==plotId)
      k = i;

  if (k<0)  {
    k = 0;
    plotId = graphData[0].id;
    graphOptions.curplot = plotId;
  }

  let plotData    = graphData[k].plotData;
  let plotOptions = graphData[k].plotOptions;
  plotOptions.graphId = gwdId;

  let div = document.getElementById ( graphId );

  if (!div)  {
    let div = element ( "div","id",graphId,"" );
    div.setAttribute ( "style",
              "height: "    + graphOptions.height +
              "px; width: " + graphOptions.width  +
              "px; margin-left: 6px;" );
    setGridItem ( gwdId,div,0,1,6,6 );
  }

  let r = _draw_graph ( graphId,plotOptions,plotData );

  graphDataHash[gwdId]['plot']        = r['plot'];
  graphDataHash[gwdId]['plotOptions'] = r['options'];

  if (graphOptions.hslider>0)  {
    $( "#" + gwdId + "-hslider" ).slider({
       values: [ _nGSliderSteps*plotOptions.axes.xaxis.smin,
                 _nGSliderSteps*plotOptions.axes.xaxis.smax ],
    });
  }
  if (graphOptions.vslider>0)  {
    $( "#" + gwdId + "-vslider" ).slider({
       values: [ _nGSliderSteps*plotOptions.axes.yaxis.smin,
                 _nGSliderSteps*plotOptions.axes.yaxis.smax ],
    });
  }

}


function cloneArray2 ( a )  {
let b = [];
  for (let i=0;i<a.length;i++)  {
    b.push ( [a[i][0],a[i][1]] );
  }
  return b;
}


function _draw_graph ( graphId,plotOptions,plotData )  {
let xmin   = null;
let xmax   = null;
let ymin   = null;
let ymax   = null;
let ticksx = null;
let ticksy = null;
let umin0,umax0,vmin0,vmax0;

  if (plotOptions.axes.xaxis.min != undefined)
    xmin = plotOptions.axes.xaxis.min;
  if (plotOptions.axes.xaxis.max != undefined)
    xmax = plotOptions.axes.xaxis.max;
  if (plotOptions.axes.yaxis.min != undefined)
    ymin = plotOptions.axes.yaxis.min;
  if (plotOptions.axes.yaxis.max != undefined)
    ymax = plotOptions.axes.yaxis.max;

  plotOptions.axes.xaxis.min = null;
  plotOptions.axes.xaxis.max = null;
  plotOptions.axes.yaxis.min = null;
  plotOptions.axes.yaxis.max = null;

  if (plotOptions.axes.xaxis.ticks != undefined)
    ticksx = cloneArray2 ( plotOptions.axes.xaxis.ticks );
  if (plotOptions.axes.yaxis.ticks != undefined)
    ticksy = cloneArray2 ( plotOptions.axes.yaxis.ticks );

  if (plotOptions.axes.yaxis.log == true)
    plotOptions.axes.yaxis.tickOptions.formatString = '%.1g';

  let fakeData = [];
  for (let i=0;i<plotOptions.series.length;i++)  {
    let umin = plotOptions.series[i].xmin;
    let umax = plotOptions.series[i].xmax;
    let vmin = plotOptions.series[i].ymin;
    let vmax = plotOptions.series[i].ymax;
    if (xmin!=null)  umin = Math.min(xmin,umin);
    if (xmax!=null)  umax = Math.max(xmax,umax);
    if (ymin!=null)  vmin = Math.min(ymin,vmin);
    if (ymax!=null)  vmax = Math.max(ymax,vmax);
    if (umin==umax)  {
      umin -= 1.0;
      umax += 1.0;
    }
    if (vmin==vmax)  {
      vmin -= 1.0;
      vmax += 1.0;
    }
    fakeData.push ( [[umin,vmin],[umax,vmax]] );
    if (i>0)  {
      umin0 = Math.min(umin0,umin);
      umax0 = Math.max(umax0,umax);
      vmin0 = Math.min(vmin0,vmin);
      vmax0 = Math.max(vmax0,vmax);
    } else  {
      umin0 = umin;
      umax0 = umax;
      vmin0 = vmin;
      vmax0 = vmax;
    }
    if (('rendererOptions' in plotOptions.series[i]) &&
        ('barMargin' in plotOptions.series[i].rendererOptions))  {
      // plotOptions.series[i].rendererOptions.barPadding   = 0;
      plotOptions.series[i].rendererOptions.barMargin    = 1;
      // plotOptions.series[i].rendererOptions.barWidth     = 1.0;
      plotOptions.series[i].rendererOptions.shadowOffset = 0;
      plotOptions.series[i].rendererOptions.shadowDepth  = 1;
      plotOptions.series[i].rendererOptions.shadowAlpha  = 0.5;
    }
  }

  // destroy the existing plot
  let inti = new Array();
  inti.push([0, 0, 0]);
  let plot = $.jqplot( graphId, inti, null);
  if (plot)
    plot.destroy();

  plot = $.jqplot ( graphId,fakeData,plotOptions );

  for (let i=0;i<plotOptions.series.length;i++)  {
    if (plot.series[i].show)
      plot.series[i].data = plotData[i];
    if (plot.series[i].barWidth != undefined)
      plot.series[i].barWidth = null;
  }

//  plotOptions.axes.xaxis.smin = 0.0;

  if (plotOptions.axes.xaxis.min == undefined)  xmin = umin0;
  if (plotOptions.axes.xaxis.max == undefined)  xmax = umax0;
  if (plotOptions.axes.yaxis.min == undefined)  ymin = vmin0;
  if (plotOptions.axes.yaxis.max == undefined)  ymax = vmax0;

  if (plotOptions.axes.xaxis.smin == undefined)
    plotOptions.axes.xaxis.smin = 0.0;
  if (plotOptions.axes.xaxis.smax == undefined)
    plotOptions.axes.xaxis.smax = 1.0;
  if (plotOptions.axes.yaxis.smin == undefined)
    plotOptions.axes.yaxis.smin = 0.0;
  if (plotOptions.axes.yaxis.smax == undefined)
    plotOptions.axes.yaxis.smax = 1.0;

  plotOptions.axes.xaxis.min = xmin;
  plotOptions.axes.xaxis.max = xmax;
  plotOptions.axes.yaxis.min = ymin;
  plotOptions.axes.yaxis.max = ymax;
  //if (plot.axes.xaxis._min == undefined)  {
    plot.axes.xaxis._min = plotOptions.axes.xaxis.min;
    plot.axes.xaxis._max = plotOptions.axes.xaxis.max;
    plot.axes.yaxis._min = plotOptions.axes.yaxis.min;
    plot.axes.yaxis._max = plotOptions.axes.yaxis.max;
  //}
  plot.axes.xaxis.smin = plotOptions.axes.xaxis.smin;
  plot.axes.xaxis.smax = plotOptions.axes.xaxis.smax;
  plot.axes.yaxis.smin = plotOptions.axes.yaxis.smin;
  plot.axes.yaxis.smax = plotOptions.axes.yaxis.smax;
  plot.axes.yaxis.tickOptions.formatString = '';
//  zoomAxis ( plot.axes.xaxis );
  zoomAxis ( plot.axes.yaxis );
  if (ticksx)  plot.axes.xaxis.ticks = cloneArray2(ticksx);
         else  zoomAxis ( plot.axes.xaxis );
  if (ticksy)  plot.axes.yaxis.ticks = cloneArray2(ticksy);

/*
console.log ( "plot.axes.xaxis._min  " + plot.axes.xaxis._min );
console.log ( "plot.axes.xaxis._max  " + plot.axes.xaxis._max );
console.log ( "plot.axes.yaxis._min  " + plot.axes.yaxis._min );
console.log ( "plot.axes.yaxis._max  " + plot.axes.yaxis._max );

console.log ( "plot.axes.xaxis.smin  " + plot.axes.xaxis.smin );
console.log ( "plot.axes.xaxis.smax  " + plot.axes.xaxis.smax );
console.log ( "plot.axes.yaxis.smin  " + plot.axes.yaxis.smin );
console.log ( "plot.axes.yaxis.smax  " + plot.axes.yaxis.smax );
*/
  plot.replot();

  let returnValue = new Object();
  returnValue['plot']    = plot;
  returnValue['options'] = plotOptions;

  return returnValue;

}

function switchGraph ( gwdId,plotId )  {
let graphOptions = graphDataHash[gwdId]['options'];
  graphOptions.curplot = plotId;
  drawGraph ( gwdId );
}

function showGraphLine ( gwdId,dataId,plotId,lineId,show )  {
let ok = 0;

  if (gwdId in graphDataHash)  {
    let graphOptions = graphDataHash[gwdId]['options'];
    let graphData    = graphDataHash[gwdId]['data'];
    let k            = -1;

    for (let i=0;(i<graphData.length) && (k<0);i++)
      if (graphData[i].id==plotId)
        k = i;

    if (k>=0)  {
      let plotData   = graphData[k].plotData;
      let plotSeries = graphData[k].plotOptions.series;
      let lid        = dataId + ":" + lineId;
      let n          = 0;
      let nl         = 0;
      let plot;

      if (plotId==graphOptions.curplot)
            plot = graphDataHash[gwdId]['plot'];
      else  plot = null;

      for (let i=0;i<plotSeries.length;i++)  {
        if (plotSeries[i].lineId==lid)  {
          plotSeries[i].show = show;
          if (plot)  {
            plot.series[i].show = show;
            if (show)  {
              plot.series[i].data = plotData[i];
            } else  {
              plot.series[i].data = [
                              [plotSeries[i].xmin,plotSeries[i].ymin],
                              [plotSeries[i].xmax,plotSeries[i].ymax]
                                    ];
            }
          }
          n++;
        }
        if (plotSeries[i].show)
          nl++;
      }

      if (plot && (n>0) && (nl>0))
        plot.replot();  // should be this for speed, but it does not work
      if (nl<=0)
        ok = 1;

    }

  }

  return ok; // return 1 if plot runs out of lines

}


function setZoomHandler() {
  $.jqplot.preDrawHooks.push(zoomHandler);
}

function setSlider ( gwdId,plot,axis,sliderSuffix )  {
let slider = document.getElementById ( gwdId+sliderSuffix );
  if (slider)  {
    let min0 = axis._min;
    let max0 = axis._max;
    let amin = axis.min;
    let amax = axis.max;
    if (axis.renderer.constructor === $.jqplot.LogAxisRenderer)  {
      min0 = Math.log(min0);
      max0 = Math.log(max0);
      amin = Math.log(amin);
      amax = Math.log(amax);
    }
    let arange = max0 - min0;
    axis.smin = (amin-min0)/arange;
    axis.smax = (amax-min0)/arange;
    zoomAxis ( axis );
    $(slider).slider({
       change: function(event,ui)  {},
       values: [ _nGSliderSteps*axis.smin,_nGSliderSteps*axis.smax ]
    });
    $(slider).slider({
       change: function(event,ui)  {
            responseToSlider ( gwdId,sliderSuffix,
                                     ui.values[0]/_nGSliderSteps,
                                     ui.values[1]/_nGSliderSteps );
          }
    });

  }
}

function zoomHandler() {
  if (this.plugins.cursor._zoom.zooming)  {
    let gwdId       = this.options.graphId;
    if (gwdId in graphDataHash)  {
      let plotOptions = graphDataHash[gwdId]['plotOptions'];
      plotOptions.axes.xaxis.smin = this.axes.xaxis.smin;
      plotOptions.axes.xaxis.smax = this.axes.xaxis.smax;
      plotOptions.axes.yaxis.smin = this.axes.yaxis.smin;
      plotOptions.axes.yaxis.smax = this.axes.yaxis.smax;
    }
    setSlider ( gwdId,this,this.axes.xaxis,"-hslider" );
    setSlider ( gwdId,this,this.axes.yaxis,"-vslider" );
  }
}

function printPlot ( gwdId )  {
let plotData,plotOptions,h,w;

  h = 0;

  if (graphWidgetList[gwdId]=='loggraph')  {

    let node = $("#"+gwdId+"-tree").tree('getSelectedNode');

    if (node)  {
      plotData    = node.plotData;
      plotOptions = node.plotOptions;
      h           = gwHeight;
      w           = gwPlotWidth;
    }

  } else  {

    let graphOptions = graphDataHash[gwdId]['options'];
    let graphData    = graphDataHash[gwdId]['data'];
    let plotId       = graphOptions.curplot;
    let k            = -1;

    for (let i=0;(i<graphData.length) && (k<0);i++)
      if (graphData[i].id==plotId)
        k = i;

    if (k>=0)  {
      plotData    = graphData[k].plotData;
      plotOptions = graphData[k].plotOptions;
      h           = graphOptions.height;
      w           = graphOptions.width;
    }

  }

  if (h>0)  {

    document.body.innerHTML = "";

    let div = element ( "div"  ,"id","div-plot","" );
    div.setAttribute  ( "style","height: "+h+
                                "px; width: "+w+"px;" +
                                "margin-left: 6px;" );
    document.body.appendChild ( div );
    let plot = $.jqplot ( "div-plot",plotData,plotOptions );
//    if (graphWidgetList[gwdId]=='graph')  {
      zoomAxis ( plot.axes.xaxis );
      zoomAxis ( plot.axes.yaxis );
      plot.redraw();
//    }

    print_window();

    window.location.reload();

  }

}


function getOpenNodeIds ( node,openNodesIds )  {
  if (node.is_open)
    openNodesIds.push ( node.id );
  for (let i=0;i<node.children.length;i++)
    getOpenNodeIds ( node.children[i],openNodesIds );
}


function addLogGraph ( gwdId,holderId, treeData,
                       row,col,rowSpan,colSpan )  {

  if (!treeData)
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  let dataArray;

  if (treeData[0]!='[')  {
    $("body").css("cursor","progress");

    processFile ( treeData,"post",true,
      function(data)  {
        // console.log ( "treeData=\""+ treeData+"\"" );
        let pp = data.indexOf("<");
        // console.log ( " pp=" + pp);
        // if (pp>=0)
        //   console.log ( " str=\"" + data.substring(pp-20,pp+20) + "\"" );
        dataArray = eval (
          "(" +
          data.replace(new RegExp('<>','g'),"") +
          ")"
        );
        // console.log ( ' >>>> data ');
        // dataArray = eval (
        //   "("  +
        //   data +
        //   ")"
        // );
        _add_log_graph ( gwdId,holderId, dataArray,
                         row,col,rowSpan,colSpan );
      },
      function() {
        $("body").css("cursor", "default");
      },
      function() {
//    commented out as this can give spurious messages because of
// asynchronous mode. Change the mode?
//        alert ( "Data transmission error in LogGraph Widget" );
      }
    );

  } else  {
    dataArray = eval ( "(" + treeData + ")" );
    _add_log_graph ( gwdId,holderId, dataArray,
                     row,col,rowSpan,colSpan );
  }

}


function _add_log_graph ( gwdId,holderId, dataArray,
                          row,col,rowSpan,colSpan )  {

let cell         = getGridCell ( holderId,row,col );
let selNodeId    = "";
let openNodesIds = new Array();
let graphTree;
let node,created;

  if (cell)  {

    if (gwdId in logGraphHash)  {
      openNodesIds = logGraphHash[gwdId]['nodes'];
      selNodeId    = logGraphHash[gwdId]['selid'];
    } else  {
      logGraphHash[gwdId] = new Object();
      logGraphHash[gwdId]['nodes'] = openNodesIds;
      logGraphHash[gwdId]['selid'] = selNodeId;
    }

    if (!document.getElementById(gwdId+"-grid"))  {
      // make new graph widget, with tree data and plots

      created = 1;

      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      cell.height  = gwHeight;

      $( "<table id='" +gwdId + "-grid' " +
         "class='grid-layout-compact'>" +
         "</table>" )
       .appendTo ( cell );

      let table = element ( "table","class","graphwidget-table","" );
      table.setAttribute ( "id",gwdId+"_panel-grid" );
      $( "<thead><tr><th>Graph Data</th></tr></thead>" ).appendTo ( table );
      $( "<tbody style='height:" + (gwHeight-80) +
         "px;width:" + gwTreeWidth + "px;display:inline-block;overflow:auto;'>" +
         "<tr><td style='width:"   + gwTreeWidth + "px;height:" + (gwHeight-84) +
         "px;'><div style='width:" + (gwTreeWidth-44) + "px;' id='" + gwdId +
         "-tree'></div></td></tr></tbody>" ).appendTo ( table );

      setGridItem ( gwdId,table,0,0,1,1 );

      addButtonGrid ( gwdId+"-print","Print","{print-gwd}",
                      gwdId,false,gwdId,1,0,1,1 );
      getGridCell   ( gwdId,1,0 ).setAttribute ( "style",
                              "text-align: right; margin-top: 2px;" );

      if (cell.style.display!="block")
        graphWidgetList[gwdId] = 'loggraph';

    } else  {
      // modify existing graph widget with new tree and/or data
      created   = 0;

      graphTree = $("#"+gwdId+"-tree");
      if (graphTree)
        graphTree.tree('destroy');
      else  {
      //removeElement ( gwdId+"-tree" );
        $( "<div id='"+gwdId+"-tree'></div>" )
            .appendTo ( getGridCell(gwdId+"_panel",1,0) );
      }

    }

    let div = document.getElementById ( gwdId+"-tree" );
    div.setAttribute ( "class","graphwidget-box" );

    graphTree = $("#"+gwdId+"-tree");
    graphTree.tree({
        data: dataArray,
        onCanSelectNode: function(node) {
          return (node.children.length == 0); // can select if true
        }
    });
    graphTree.bind (
      'tree.click',
      function(event) {
        let node = event.node; // the clicked node
        let oni  = new Array();
        getOpenNodeIds ( graphTree.tree('getTree'),oni );
        logGraphHash[gwdId]['nodes'] = oni;
        if ($(this).tree('isNodeSelected',node))  {
          logGraphHash[gwdId]['selid'] = node.id;
          event.preventDefault();
        }
    });
    graphTree.bind (
      'tree.open',
      function(event) {
        let node = event.node; // the clicked node
        let oni  = new Array();
        getOpenNodeIds ( graphTree.tree('getTree'),oni );
        logGraphHash[gwdId]['nodes'] = oni;
    });
    graphTree.bind (
      'tree.close',
      function(event) {
        let node = event.node; // the clicked node
        let oni  = new Array();
        getOpenNodeIds ( graphTree.tree('getTree'),oni );
        logGraphHash[gwdId]['nodes'] = oni;
    });
    graphTree.bind(
      'tree.select',
      function(event) {
        let node = event.node; // the selected node
        let oni  = new Array();
        getOpenNodeIds ( graphTree.tree('getTree'),oni );
        logGraphHash[gwdId]['nodes'] = oni;
        if (node)  {
          logGraphHash[gwdId]['selid'] = node.id;
          drawLogGraph ( gwdId,node.plotData,event.node.plotOptions );
        }
    });

    if (created == 1)  {
      // the tree is newly created, select first node

      node = graphTree.tree('getTree');
      if (selNodeId == "")  {

        while (node!=null)
          if (node.plotData!=null)  {
            graphTree.tree( 'selectNode',node );
            node = null;
          } else if (node.children.length>0)
            node = node.children[0];
          else
            node = null;

        getOpenNodeIds ( graphTree.tree('getTree'),openNodesIds );
        logGraphHash[gwdId]['nodes'] = openNodesIds;
        logGraphHash[gwdId]['selid'] = graphTree.tree('getSelectedNode').id;
      }

    }

    if (selNodeId != "")  {
      // the tree was modified, set old state

//      setTimeout(function(){

        for (let i=0;i<openNodesIds.length;i++)  {
          node = graphTree.tree ( 'getNodeById',openNodesIds[i] );
          if (node!=null)
            graphTree.tree ( 'openNode',node,false );
        }

        graphTree.tree ( 'selectNode',
                         graphTree.tree('getNodeById',selNodeId) );
//      }, 0);

    }

  }

}



function resetGraph ( gwdId )  {
let slider;

  let plot = graphDataHash[gwdId]['plot'];
  if (plot)  {
    let plotOptions = graphDataHash[gwdId]['plotOptions'];
    plot.axes.xaxis.smin = plotOptions.axes.xaxis.smin0;
    plot.axes.xaxis.smax = plotOptions.axes.xaxis.smax0;
    plot.axes.yaxis.smin = plotOptions.axes.yaxis.smin0;
    plot.axes.yaxis.smax = plotOptions.axes.yaxis.smax0;
    plot.axes.yaxis.tickOptions.formatString = '';
    zoomAxis ( plot.axes.xaxis );
    zoomAxis ( plot.axes.yaxis );
    plot.replot();
    plotOptions.axes.xaxis.smin = plot.axes.xaxis.smin;
    plotOptions.axes.xaxis.smax = plot.axes.xaxis.smax;
    plotOptions.axes.yaxis.smin = plot.axes.yaxis.smin;
    plotOptions.axes.yaxis.smax = plot.axes.yaxis.smax;
  } else
    drawGraph ( gwdId );

  slider = document.getElementById ( gwdId+"-hslider" );
  if (slider)
    $(slider).slider({values:[_nGSliderSteps*plot.axes.xaxis.smin,
                              _nGSliderSteps*plot.axes.xaxis.smax]});

  slider = document.getElementById ( gwdId+"-vslider" );
  if (slider)
    $(slider).slider({values:[_nGSliderSteps*plot.axes.yaxis.smin,
                              _nGSliderSteps*plot.axes.yaxis.smax]});

}

function moveGraphSlider ( sliderId,handle,direction )  {
let slider = document.getElementById ( sliderId );
  if (slider)  {
    let smin = $(slider).slider("values",0);
    let smax = $(slider).slider("values",1);
    if (handle>0)  smax += direction*_GSliderPage;
             else  smin += direction*_GSliderPage;
    $(slider).slider({values:[smin,smax]});
  }
}

function responseToSlider ( gwdId,sliderSuffix,smin,smax ) {
let plot        = graphDataHash[gwdId]['plot'];
let plotOptions = graphDataHash[gwdId]['plotOptions'];
let pAxis,poAxis;
  if (sliderSuffix=="-vslider")  {
    pAxis  = plot.axes.yaxis;
    poAxis = plotOptions.axes.yaxis;
  } else {
    pAxis  = plot.axes.xaxis;
    poAxis = plotOptions.axes.xaxis;
  }
  if ((plot.axes.yaxis.smin!=smin) || (plot.axes.yaxis.smax!=smax))  {
    pAxis.smin = smin;
    pAxis.smax = smax;
    zoomAxis ( pAxis );
    plot.replot();
    poAxis.smin = pAxis.smin;
    poAxis.smax = pAxis.smax;
  }
}


function addGraph ( gwdId,holderId, graphData, row,col,rowSpan,colSpan )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  let dataArray;

  if (graphData[0]!='[')  {
    $("body").css("cursor","progress");

    processFile ( graphData,"post",true,
      function(data)  {
        dataArray = eval ( "(" + data + ")" );
        _add_graph ( gwdId,holderId, dataArray, row,col,rowSpan,colSpan );
      },
      function()  {
        $("body").css("cursor", "default");
      },
      function()  {
//    commented out as this can give spurious messages because of
// asynchronous mode. Change the mode?
//        alert ( "Data transmission error in Graph Widget" );
      }
    );

  } else  {
    dataArray = eval ( "(" + graphData + ")" );
    _add_graph ( gwdId,holderId, dataArray, row,col,rowSpan,colSpan );
  }

}

function _add_graph ( gwdId,holderId, dataArray, row,col,rowSpan,colSpan )  {
let cell = getGridCell ( holderId,row,col );

  if (cell)  {

    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    if (!document.getElementById(gwdId+"-grid"))  {
      // Make new graph widget, with plot switcher and scale sliders

      // 1. Set widget grid
      $( "<table id='" +gwdId + "-grid' " +
         "class='grid-layout-compact'>" +
         "</table>" )
       .appendTo ( cell );

      if (cell.style.display!="block")
        graphWidgetList[gwdId] = 'graph';

      let graphOptions = dataArray['graphOptions'];
      let plotData     = dataArray['graphData'];
      graphDataHash[gwdId] = new Object();
      graphDataHash[gwdId]['options'] = graphOptions;
      graphDataHash[gwdId]['data']    = plotData;

      addIconButtonGrid ( gwdId+"-print","icon_print1","Print plot",
                        "{print-gwd}",gwdId,false,gwdId,6,0,1,1 )
            .setAttribute ( "style","vertical-align: middle;" +
                                    "text-align: center;" );

      let div;
      if ((graphOptions.hslider>0) || (plotData.length>1))  {
        let w = graphOptions.width;
        if (plotData.length>1)  {
          let sel = element ( "select","id",gwdId+"-select","" );
          sel.setAttribute ( "onchange",
            "switchGraph('"+gwdId+"',this.options[this.selectedIndex].value);" );
          for (let i=0;i<plotData.length;i++)  {
            let opt = new Option ( plotData[i].title,plotData[i].id );
            sel.options.add ( opt );
            if (plotData[i].id==graphOptions.curplot)
              sel.selectedIndex = i;
          }
          setGridItem ( gwdId,sel,6,1,1,1 )
                   .setAttribute ( "style","vertical-align: middle;" );
        }
        if (graphOptions.hslider>0)  {

          addIconButtonGrid ( gwdId+"-hup_btn","icon_zoomin",
                              "Increase upper limit","{function}",
                              "moveGraphSlider('"+gwdId+"-hslider',1,1);",
                              false,gwdId,6,6,1,1 )
                     .setAttribute ( "style","vertical-align: middle;" +
                                             "width         : 16px;"   +
                                             "text-align    : left;"   +
                                             "padding-right : 16px;" );
          addIconButtonGrid ( gwdId+"-hum_btn","icon_zoomout",
                              "Decrease upper limit","{function}",
                              "moveGraphSlider('"+gwdId+"-hslider',1,-1);",
                              false,gwdId,6,5,1,1 )
                     .setAttribute ( "style","vertical-align: middle;" +
                                             "width         : 16px;"   +
                                             "text-align    : left;"   +
                                             "padding-right : 0px;");

          div = element ( "div","id",gwdId+"-hslider","" );
          div.setAttribute ( "title","X-axis range" );
          setGridItem ( gwdId,div,6,4,1,1 )
                   .setAttribute ( "style","vertical-align: middle;" +
                                           "width: "+w/2+"px;" +
                                           "text-align: right;" +
                                           "padding-right : 12px;"  );
          $( "#" + gwdId + "-hslider" ).slider({
            range: true,
            min: 0,
            max: _nGSliderSteps,
            values: [ 0,_nGSliderSteps ],
            change: function(event,ui)  {
              responseToSlider ( gwdId,"-hslider",
                                       ui.values[0]/_nGSliderSteps,
                                       ui.values[1]/_nGSliderSteps );
            },
            slide: function(event,ui)  {
              responseToSlider ( gwdId,"-hslider",
                                       ui.values[0]/_nGSliderSteps,
                                       ui.values[1]/_nGSliderSteps );
            }
          });

          addIconButtonGrid ( gwdId+"-hlp_btn","icon_zoomin",
                              "Increase lower limit","{function}",
                              "moveGraphSlider('"+gwdId+"-hslider',0,1);",
                              false,gwdId,6,3,1,1 )
                     .setAttribute ( "style","vertical-align: middle;" +
                                             "width         : 16px;"   +
                                             "text-align    : left;"   +
                                             "padding-right : 10px;" );
          addIconButtonGrid ( gwdId+"-hlm_btn","icon_zoomout",
                              "Decrease lower limit","{function}",
                              "moveGraphSlider('"+gwdId+"-hslider',0,-1);",
                              false,gwdId,6,2,1,1 )
                     .setAttribute ( "style","vertical-align: middle;" +
                                             "width         : 16px;"   +
                                             "text-align    : left;"   +
                                             "padding-right : 0px;");

        }

      }

      if (graphOptions.vslider>0)  {

        addIconButtonGrid ( gwdId+"-vup_btn","icon_zoomin",
                            "Increase upper limit","{function}",
                            "moveGraphSlider('"+gwdId+"-vslider',1,1);",
                            false,gwdId,0,0,1,1 )
                   .setAttribute ( "style","vertical-align: top;"  +
                                           "height        : 16px;" +
                                           "padding-top   : 12px;" +
                                           "padding-right : 8px;" );
        addIconButtonGrid ( gwdId+"-vum_btn","icon_zoomout",
                            "Decrease upper limit","{function}",
                            "moveGraphSlider('"+gwdId+"-vslider',1,-1);",
                            false,gwdId,1,0,1,1 )
                   .setAttribute ( "style","vertical-align: top;"  +
                                           "height        : 16px;" +
                                           "text-align    : left;" +
                                           "padding-right : 8px;");

        let h = graphOptions.height/2;
        div = element ( "div","id",gwdId+"-vslider","" );
        div.setAttribute ( "style","vertical-align: top;" +
                                   "height: " + h + "px;" );
        div.setAttribute ( "title","Y-axis range" );
        h += 4;
        setGridItem ( gwdId,div,2,0,1,1 )
                   .setAttribute ( "style","vertical-align: top;"    +
                                           "text-align    : center;" +
                                           "height        : " +
                                                          h + "px;"  +
                                           "padding-top   : 12px;"   +
                                           "padding-left  : 4px;"  );
        $( "#" + gwdId + "-vslider" ).slider({
          orientation: "vertical",
          range: true,
          min: 0,
          max: _nGSliderSteps,
          values: [ 0,_nGSliderSteps ],
          change: function(event,ui)  {
            responseToSlider ( gwdId,"-vslider",
                                     ui.values[0]/_nGSliderSteps,
                                     ui.values[1]/_nGSliderSteps );
          },
          slide: function(event,ui)  {
            responseToSlider ( gwdId,"-vslider",
                                     ui.values[0]/_nGSliderSteps,
                                     ui.values[1]/_nGSliderSteps );
          }
        });

        addIconButtonGrid ( gwdId+"-vlp_btn","icon_zoomin",
                            "Increase lower limit","{function}",
                            "moveGraphSlider('"+gwdId+"-vslider',0,1);",
                            false,gwdId,3,0,1,1 )
                   .setAttribute ( "style","vertical-align: top;"  +
                                           "text-align    : left;" +
                                           "height        : 16px;" +
                                           "padding-top   : 10px;" +
                                           "padding-right : 8px;" );
        addIconButtonGrid ( gwdId+"-vlm_btn","icon_zoomout",
                            "Decrease lower limit","{function}",
                            "moveGraphSlider('"+gwdId+"-vslider',0,-1);",
                            false,gwdId,4,0,1,1 )
                   .setAttribute ( "style","vertical-align: top;"  +
                                           "text-align    : left;" +
                                           "height        : 16px;" +
                                           "padding-right : 8px;");

        addIconButtonGrid ( gwdId+"-reset","icon_fullscreen1",
                            "Reset range","{function}",
                            "resetGraph('"+gwdId+"');",
                            false,gwdId,5,0,1,1 )
                   .setAttribute ( "style","vertical-align: bottom;" +
                                           "text-align    : center;" );
      }

    }

    drawGraph ( gwdId );

  }

}
