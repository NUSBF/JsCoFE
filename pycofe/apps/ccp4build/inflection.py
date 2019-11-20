##!/usr/bin/python

#
# ============================================================================
#
#    15.03.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build EDStats class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#

import math

def slope ( x,y ):
    #  Returns slope of linear regression of (x,y)

    n  = len(x)
    xm = 0.0
    ym = 0.0
    for i in range(n):
        xm += x[i]
        ym += y[i]

    xm  /= n
    ym  /= n
    cov  = 0.0
    var  = 0.0
    for i in range(n):
        dx   = x[i] - xm
        cov += dx*(y[i]-ym)
        var += dx*dx

    return cov/var


def inflection ( x,y ):
    #  y(x) is assumed to be a bi-linear function, such that it can be
    #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
    #  This function returns index of "optimal" values (x0,y0)

    n  = len(x)
    n0 = 0
    if n>5:

        ymin = y[0]
        ymax = y[0]
        for i in range(1,n):
            ymin = min ( ymin,y[i] )
            ymax = max ( ymax,y[i] )

        scx = x[len(x)-1] - x[0]
        scy = ymax - ymin

        if scy>0.0:

            cos0 = 1.0
            for i in range(2,n-2):
                b1  = slope(x[:i],y[:i])*scx/scy
                b2  = slope(x[i:],y[i:])*scx/scy
                cos = (1.0+b1*b2)/math.sqrt((1.0+b1*b1)*(1.0+b2*b2))
                if cos<cos0:
                    cos0 = cos
                    n0   = i

    return n0






"""


a1 + b1*x = a2 + b2*x
a1-a2 = x(b2-b1)
x = (a1-a2)/(b2-b1)

def epsilon ( x,y ):
    #  Performs linear regression of (yi,xi) and returns square deviation
    #  |(yi,xi)-y(x)|^2

    n = len(x)
    if n<=2:
        return 0.0

    xmin  = x[0]
    xmax  = x[n-1]
    xave  = 0.0
    #x2ave = 0.0
    ymin  = y[0]
    ymax  = y[0]
    yave  = 0.0
    #y2ave = 0.0
    for i in range(n):
        xave  += x[i]
        #x2ave += x[i]*x[i]
        ymin   = min(ymin,y[i])
        ymax   = max(ymax,y[i])
        yave  += y[i]
        #y2ave += y[i]*y[i]

    xave /= n
    yave /= n
    cov   = 0.0
    var   = 0.0
    for i in range(n):
        dx   = x[i] - xave
        cov += dx*(y[i]-yave)
        var += dx*dx

    return cov/var

"""



"""
    eps = 0.0
    dx  = max ( (ymax-ymin),(xmax-xmin) )
    if var<0.00001*dx*dx:
        # vertical line
        eps = var
    else:
        b = cov/var
        a = yave - b*xave
        for i in range(n):
            xm = (x[i]+b*y[i]-a*b)/(1.0+b*b)
            dx = xm - x[i]
            dy = a + b*xm - y[i]
            eps += dx*dx + dy*dy

    eps = 0.0
    b   = cov/var
    a   = yave - b*xave
    for i in range(n):
        dy   = a + b*x[i] - y[i]
        eps += dy*dy

    #return math.sqrt ( eps/n )
    return eps
"""

"""
def inflection ( x,y ):
    #  y(x) is assumed to be a bi-linear function, such that it can be
    #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
    #  This function returns index of "optimal" values (x0,y0)

    n0 = 0
    if len(x)>5:

        ymin = y[0]
        ymax = y[0]
        for i in range(1,len(x)):
            ymin = min ( ymin,y[i] )
            ymax = max ( ymax,y[i] )

        scx = x[len(x)-1] - x[0]
        scy = ymax - ymin

        if scy>0.0:

            cos0 = 0.0
            for i in range(2,len(x)-2):
                b1  = epsilon(x[:i],y[:i])
                b2  = epsilon(x[i:],y[i:])
                cos = abs ( (1.0+b1*b2)/math.sqrt((1.0+b1*b1)*(1.0+b2*b2)) )
                if cos>cos0:
                    cos0 = cos
                    n0   = i

    return n0
"""

"""
def inflection ( x,y,dfactor=0.5 ):
    #  y(x) is assumed to be a bi-linear function, such that it can be
    #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
    #  This function returns index of "optimal" values (x0,y0)

    eps0 = epsilon(x,y)
    eps  = eps0
    n0   = 0
    for i in range(3,len(x)-3):
        epsi = epsilon(x[:i],y[:i]) + epsilon(x[i:],y[i:])
        if epsi<eps:
            eps = epsi
            n0  = i

    if eps < dfactor*eps0:
        return n0
    return 0
"""


"""
def inflection ( x,y ):
    #  y(x) is assumed to be a bi-linear function, such that it can be
    #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
    #  This function returns index of "optimal" values (x0,y0)

    n0 = 0
    if len(x)>5:

        ymin = y[0]
        ymax = y[0]
        for i in range(1,len(x)):
            ymin = min ( ymin,y[i] )
            ymax = max ( ymax,y[i] )

        scx = x[len(x)-1] - x[0]
        scy = ymax - ymin

        if scy>0.0:

            x0   = x[0]
            y0   = y[0]
            xl   = x[len(x)-1]
            yl   = y[len(x)-1]
            cos0 = 1.0
            for i in range(1,len(x)-1):
                dx1 = (x[i]-x0)/scx
                dy1 = (y[i]-y0)/scy
                dx2 = (xl-x[i])/scx
                dy2 = (yl-y[i])/scy
                cos = (dx1*dx2+dy1*dy2)/math.sqrt((dx1*dx1+dy1*dy1)*(dx2*dx2+dy2*dy2))
                if cos<cos0:
                    cos0 = cos
                    n0   = i

    return n0
"""
