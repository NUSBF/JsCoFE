##!/usr/bin/python

#
# ============================================================================
#
#    06.09.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT WIDGET UTILITIES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import math

from   pycofe.varut  import rvapi_utils

# ============================================================================


def calcVerdictScore ( data,score_type ):

    #
    # data for monotonic isomorphic scores (1):
    #
    #    {   "KEY1" : {  "value"  : score,
    #                    "weight" : 2.0,
    #                    "map"    : [(s0,0),(s20,20),...(s100,100)]
    #                 },
    #        "KEY2" : ......
    #    }
    #    weight  - relative weight of given parameter
    #    map     - the mapping function:
    #                 scores < =s0    are mapped on 0
    #                 scores >= s100  are mapped on 100
    #                 other scores are linearly interpolated such that score
    #                 sN is mapped on N
    #              Conditions: a) map[i][1]<map[i+1][1]
    #                          b) map[i][0] is monotonic (increasing or decreasing)

    #
    # data for monotonic isomorphic scores (2):
    #
    #    {   "KEY1" : {  "value"  : score,
    #                    "weight" : 2.0,
    #                    "good"   : [8.0,10.0,12.0,50.0],
    #                    "bad"    : [8.0,7.0,6.0,0.0]
    #                 },
    #        "KEY2" : ......
    #    }
    #
    #    weight  - relative weight of given parameter
    #    good    - list of monotonic scores which are equidistantly mapped on
    #              interval 50 - 100
    #    bad     - list of monotonic scores which are equidistantly mapped on
    #              interval 0 - 50
    #    if 'good' goes up, 'bad' must go down and the other way round.
    #    good[0] == bad[0]
    #
    #    Example: if given score equals to g0,g1,g2,g3,g4, or g5, then it is
    #             transformed as g0->50, g1->60, g2->70, g3->80, g4->90, g5->100
    #             Other scores will be linearly interpolated in the corresponding
    #             sections. The same work for scores falling in 'bad' region.
    #             Outsider scores are mapped to 0 or 100.
    #

    #
    # data for gaussian or bell-shaped scores:
    #
    #    {   "KEY1" : {  "value"  : score,
    #                    "weight" : 2.0,
    #                    "center" : center_score,
    #                    "gwidth" : gaussian_width
    #                    "bwidth" : bell_width
    #                 },
    #        "KEY2" : ......
    #    }
    #
    #    weight  - relative weight of given parameter
    #    center  - score giving the peak (100)
    #    gwidth  - gaussian width:  exp ( -(s-center)^2/(2*gwidth^2) )
    #    bwidth  - bell width:  1/(1+(s-center)^2/(2*gwidth)^2)
    #
    #    either gwidth or bwidth should be given, but not both
    #

    #
    #    score_type = 0   : arithmetic average
    #               = 1   : geometric average
    #

    def score_map ( x,map ):
        n = len(map)-1
        if map[0][0]<map[n][0]:
            if x<=map[0][0]:
                return map[0][1]
            elif x>=map[n][0]:
                return map[n][1]
            for j in range(n):
                if map[j][0]<=x and x<=map[j+1][0]:
                    return map[j][1] + (map[j+1][1]-map[j][1])*(x-map[j][0])/(map[j+1][0]-map[j][0])
        else:
            if x>=map[0][0]:
                return map[0][1]
            elif x<=map[n][0]:
                return map[n][1]
            for j in range(n):
                if map[j][0]>=x and x>=map[j+1][0]:
                    return map[j][1] + (map[j+1][1]-map[j][1])*(x-map[j][0])/(map[j+1][0]-map[j][0])
        return 0.0  #  should never happen

    def score_direct ( x,d ):
        n = len(d)-1
        for j in range(n):
            if d[j]<=x and x<=d[j+1]:
                return (j+(x-d[j])/(d[j+1]-d[j]))/n
        return 1.0

    def score_reverse ( x,d ):
        n = len(d)-1
        for j in range(n):
            if d[j+1]<=x and x<=d[j]:
                return (j+(x-d[j])/(d[j+1]-d[j]))/n
        return 1.0

    def score_gaussian ( x,center,width ):
        sigma = width/1.17741
        dx    = (x-center)/sigma
        return math.exp ( -dx*dx/2.0 )

    def score_bell ( x,center,width ):
        dx = (x-center)/width
        return 1.0/(1.0+dx*dx)

    score  = 0.0
    weight = 0.0
    for key in data:
        w = data[key]["weight"]
        v = data[key]["value"]
        if "gwidth" in data[key]:
            ds = score_gaussian ( v,data[key]["center"],data[key]["gwidth"] )
        elif "bwidth" in data[key]:
            ds = score_bell ( v,data[key]["center"],data[key]["bwidth"] )
        elif "map" in data[key]:
            ds = score_map ( v,data[key]["map"] ) / 100.0
        else:
            g  = data[key]["good"]
            b  = data[key]["bad"]
            ds = -1.0
            if g[-1]>b[-1]:  # direct order
                if v>=g[0]:
                    ds = 1.0 + score_direct(v,g)
                else:
                    ds = 1.0 - score_reverse(v,b)
            else:   # reverese order
                if v<=g[0]:
                    ds = 1.0 + score_reverse(v,g)
                else:
                    ds = 1.0 - score_direct(v,b)
            ds /= 2.0

        if score_type==1:
            if ds<1.0e-12:
                return 0.0
            score += w*math.log(ds)
        else:
            score += w*ds
        weight += w

    if score_type==1:
        return 100.0*math.exp ( score/weight )
    else:
        return 100.0*score/weight


def makeVerdictSection ( body,table_dict,score,message,bottomline,
                         title="Verdict",row=-1,pageId=None,secId="" ):

    row0 = row
    if row<0:
        row0 = body.rvrow

    page_id = pageId
    if not pageId:
        page_id = body.report_page_id()

    if title.startswith("*"):
        body.putMessage1 ( page_id,"<h2>"+title[1:]+"</h2>",row0 )
    else:
        body.putTitle1 ( page_id,title,row0 )

    if table_dict:
        grid_id = body.getWidgetId ( "verdict_grid" )
        body.putGrid1  ( grid_id,page_id,False,row0+1 )
        rvapi_utils.makeTable ( table_dict,body.getWidgetId("summary_table"),
                                grid_id,0,0,2,1 )

        body.putMessage1 ( grid_id,"&nbsp;&nbsp;&nbsp;",1,1 )
        body.putMessage1 ( grid_id,"<span style='font-size:10px;'>&nbsp;</span>",0,2 )
        body.putVerdict1 ( grid_id,score,message,1,col=2,secId=secId )
    else:
        body.putVerdict1 ( page_id,score,message,row0+1,col=0,secId=secId )

    body.putMessage1 ( page_id,bottomline,row0+2 )

    return
