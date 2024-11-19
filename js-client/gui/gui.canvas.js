//
//  =================================================================
//
//    22.08.17   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  gui.canvas.js  <interface>
//       ~~~~~~~~~
//  **** Project :  Object-Oriented HTML5 GUI Toolkit
//       ~~~~~~~~~
//  **** Content :  Canvas module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2017
//
//  =================================================================
//

'use strict'; // *client*

function Canvas ( width_px,height_px, x0,y0,x1,y1 )  {

  Widget.call ( this,'canvas' );

  this.element.width  = width_px;
  this.element.height = height_px;

  this.ctx       = this.element.getContext ( '2d' );
  this.do_stroke = true;
  this.setGeometry ( x0,y0, x1,y1 );

}

Canvas.prototype = Object.create ( Widget.prototype );
Canvas.prototype.constructor = Canvas;

Canvas.prototype.setGeometry = function ( x0,y0, x1,y1 )  {

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this.rescale();

}

Canvas.prototype.resize = function ( width_px,height_px )  {
// use this for dynamic resizing
  this.element.width  = width_px;
  this.element.height = height_px;
  this.rescale();
}

Canvas.prototype.rescale = function()  {
  this._scx  = this.element.width /(this._x1-this._x0);
  this._scy  = this.element.height/(this._y0-this._y1);
  this._scxy = Math.min ( Math.abs(this._scx),Math.abs(this._scy) );
//  this.ctx  = this.element.getContext ( '2d' );
}

Canvas.prototype.u = function ( x )  {
// horizontal screen coordinate u(x)
  return Math.floor ( (x-this._x0)*this._scx );
}

Canvas.prototype.v = function ( y )  {
// vertical screen coordinate v(y)
  return Math.floor ( (y-this._y1)*this._scy );
}

Canvas.prototype.clear = function()  {
  this.ctx.clearRect ( 0,0,this.element.width,this.element.height );
}

/*
Canvas.prototype.start = function()  {
  this.ctx = this.element.getContext ( '2d' );
}
*/

Canvas.prototype.setLineWidth = function ( lineWidth )  {
  this.do_stroke = (lineWidth>0);
  this.ctx.lineWidth = lineWidth;
}

Canvas.prototype.setLineColor = function ( r,g,b,a )  {
  this.ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

Canvas.prototype.setFillColor = function ( r,g,b,a )  {
  this.ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

Canvas.prototype.drawCircle = function ( x,y,r )  {
  this.ctx.beginPath();
  let rad = Math.min ( Math.abs(r*this._scx),Math.abs(r*this._scy) );
  this.ctx.arc ( this.u(x),this.v(y),rad, 0, 2.0*Math.PI, false );
  if (this.do_stroke)
    this.ctx.stroke();
  this.ctx.closePath();
}

Canvas.prototype.drawFilledCircle = function ( x,y,r )  {
  this.ctx.beginPath();
  this.ctx.arc ( this.u(x),this.v(y),r*this._scxy, 0, 2.0*Math.PI, false );
  this.ctx.fill();
  if (this.do_stroke)
    this.ctx.stroke();
  this.ctx.closePath();
}


Canvas.prototype.drawArrow = function ( x1,y1,x2,y2, hsize )  {
// hsize is the absolute length of arrow head beyond (x2,y2)

  let u1 = this.u(x1);
  let v1 = this.v(y1);
  let ua = this.u(x2);
  let va = this.v(y2);

  let d1 = ua-u1;
  let d2 = va-v1;
  let d3 = Math.sqrt ( d1*d1+d2*d2 );
  let ca,sa;
  if (d3>0.0)  {
    ca = d1/d3;
    sa = d2/d3;
  } else  {
    ca = 1.0;
    sa = 0.0;
  }

  let beta = Math.PI/12.0;
  let cb   = Math.cos(beta);
  let sb   = Math.sin(beta);

  let lw   = Math.max ( 0.5,this._scxy*this.ctx.lineWidth/200.0-0.5 );  // "line" width
  let u2   = sa*lw;
  let v2   = ca*lw;

  let u0   = ua-u2;
  let v0   = va+v2;

  this.ctx.beginPath();
  this.ctx.moveTo ( u0,v0 );
  this.ctx.lineTo ( u1-u2,v1+v2 );
  this.ctx.lineTo ( u1+u2,v1-v2 );
  this.ctx.lineTo ( ua+u2,va-v2 );

  d3 = this._scxy*hsize;
  d1 = cb*d3;
  d2 = sb*d3;

  u2 = ua + ca*d1;
  v2 = va + sa*d1;

  let u3 = ua - sa*d2;
  let v3 = va + ca*d2;

  let u4 = ua + sa*d2;
  let v4 = va - ca*d2;

  this.ctx.lineTo ( u4,v4 );
  this.ctx.lineTo ( u2,v2 );
  this.ctx.lineTo ( u3,v3 );
  this.ctx.lineTo ( u0,v0 );

  this.ctx.closePath();
  this.ctx.fill();
  if (this.do_stroke)
    this.ctx.stroke();

/*
void CHKLVAxis::setAxis ( const HKLlist::ZoneAxis & axisInfo,
                          qreal scale, const QColor & axisColor,
                          qreal arrowSize, qreal lineWidth,
                          qreal fontSize  )  {
QPolygonF          p;
QBrush             brush;
QPen               pen;
QFont              font;
QGraphicsTextItem *label;
qreal              ca,sa, beta,cb,sb, d1,d2,d3,lw,fs;
qreal              x0,y0, x1,y1, x2,y2, x3,y3, x4,y4, xa,ya;

  x1 =  scale*axisInfo.endpoints[0][0];
  y1 = -scale*axisInfo.endpoints[0][1];
  xa =  scale*axisInfo.endpoints[1][0];
  ya = -scale*axisInfo.endpoints[1][1];

  brush.setColor ( axisColor        );
  brush.setStyle ( Qt::SolidPattern );

  setBrush ( brush );

  pen.setColor ( axisColor     );
  pen.setStyle ( Qt::SolidLine );
  pen.setWidth ( 1             );

  setPen ( pen );

  d1 = xa-x1;
  d2 = ya-y1;
  d3 = sqrt ( d1*d1+d2*d2 );
  if (d3>0.0)  {
    ca = d1/d3;
    sa = d2/d3;
  } else  {
    ca = 1.0;
    sa = 0.0;
  }

  beta = Pi/12.0;
  cb   = cos(beta);
  sb   = sin(beta);

  lw   = qMax ( 0.5,scale*lineWidth/200.0-0.5 );  // "line" width
  x2   = sa*lw;
  y2   = ca*lw;

  x0   = xa-x2;
  y0   = ya+y2;

  p << QPointF(x0,y0) << QPointF(x1-x2,y1+y2) <<
       QPointF(x1+x2,y1-y2) << QPointF(xa+x2,ya-y2);

  d3   = scale*getArrowLength(arrowSize);
  d1   = cb*d3;
  d2   = sb*d3;

  x2 = xa + ca*d1;
  y2 = ya + sa*d1;

  x3 = xa - sa*d2;
  y3 = ya + ca*d2;

  x4 = xa + sa*d2;
  y4 = ya - ca*d2;

  p << QPointF(x4,y4) << QPointF(x2,y2) <<
       QPointF(x3,y3) << QPointF(x0,y0);

  setPolygon ( p );

  x1 = qMin ( x2,qMin(x3,x4) );
  y1 = qMin ( y2,qMin(y3,y4) );

  x2 = qMax ( x2,qMax(x3,x4) );
  y2 = qMax ( y2,qMax(y3,y4) );

//  fs = qMax ( 6.0,scale*fontSize/12.0 );
  fs = 20.0*fontSize;
  font.setPixelSize ( int(fs) );
  font.setFamily ( "Helvetica,Arial" );
//  font.setPixelSize ( 20 );
  font.setBold ( true );

  label = new QGraphicsTextItem(this);
  label->setDefaultTextColor ( axisColor              );
  label->setFont             ( font                   );
  label->setPlainText        ( axisInfo.label.c_str() );

  x0 = label->boundingRect().width ();
  y0 = label->boundingRect().height();

  if (sa>0.707)  {
    xa = x2;
    ya = y1;
  } else if (sa<-0.707)  {
    xa = x2;
    ya = y1 - y0/2.0;
  } else if (ca>0.0)  {
    xa = (x1+x2)/2.0;
    ya = y1 - y0;
  } else  {
    xa = (x1+x2)/2.0 - x0;
    ya = y1 - y0;
  }

  label->setPos ( xa,ya );

*/

}

Canvas.prototype.setMouseListener = function ( mouse_event,socket_function )  {
  (function(canvas){
    canvas.addEventListener ( mouse_event,function(evt){
      let rect = canvas.getBoundingClientRect();
      socket_function (  // mouseX,mouseY in canvas coordinates
          (evt.clientX-rect.left)*canvas.width/(rect.right-rect.left),
          (evt.clientY-rect.top)*canvas.height/(rect.bottom-rect.top)
      );
    },false );
  }(this.element))
}

Canvas.prototype.setMouseMoveListener = function ( socket_function )  {
  this.setMouseListener ( 'mousemove',socket_function );
}

Canvas.prototype.setMouseDownListener = function ( socket_function )  {
  this.setMouseListener ( 'mousedown',socket_function );
}

Canvas.prototype.setMouseUpListener = function ( socket_function )  {
  this.setMouseListener ( 'mouseup',socket_function );
}
