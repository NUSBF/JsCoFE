##!/usr/bin/python

#
# ============================================================================
#
#    05.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  GENERATE USAGE STATS REPORT
#
#  Command line:
#
#  ccp4-python -m pycofe.proc.usagestats projectDataPath userDataPath statsFile.json reportDir
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
#
# ============================================================================
#

import os
import sys
import json

import pyrvapi
#from   pycofe.varut  import jsonut


# ============================================================================

def reportPage():  return "body"

# ----------------------------------------------------------------------------

def putGraphWidget ( graphId,legend,xData,yData,xTitle,yTitle,
                     lineNames,styles, row,col, width=700,height=400 ):

    color = [
        "darkcyan",        "darkred",         "green",
        "darkblue",        "orange",          "darkgoldenrod",
        "midnightblue",    "tomato",          "chocolate",
        "slateblue",       "crimson",         "olive",
        "aqua",            "brown",           "darkolivegreen",
        "dodgerblue",      "coral",           "darkseagreen",
        "mediumslateblue", "mediumvioletred", "mediumspringgreen",
        "slateblue",       "sandybrown",      "yellowgreen"
    ]

    pyrvapi.rvapi_set_text  ( legend ,reportPage(),  row,col,1,1 )
    pyrvapi.rvapi_add_graph ( graphId,reportPage(),row+1,col,1,1 )
    pyrvapi.rvapi_set_graph_size    ( graphId,width,height )

    pyrvapi.rvapi_add_graph_data    ( "data",graphId,"xydata" )
    pyrvapi.rvapi_add_graph_dataset ( "X","data",graphId,"Xcol","Xcol" )
    pyrvapi.rvapi_add_graph_plot    ( "plot",graphId,"---",xTitle,yTitle )

    nx = len(xData)
    for j in range(nx):
        pyrvapi.rvapi_add_graph_real ( "X","data",graphId,float(xData[j]),"%g" )

    ny   = len(yData)
    ymax = 0.0
    for i in range(ny):
        yId = "Y"+str(i)
        pyrvapi.rvapi_add_graph_dataset ( yId,"data",graphId,
                                          lineNames[i],"Ycol"+str(i) )
        for j in range(nx):
            y = float(yData[i][j])
            pyrvapi.rvapi_add_graph_real ( yId,"data",graphId,y,"%g" )
            ymax = max ( ymax,y );
        pyrvapi.rvapi_add_plot_line ( "plot","data",graphId,"X",yId )
        colour = color[i % len(color)]
        if styles[i]=="thin":
            pyrvapi.rvapi_set_line_options ( yId,"plot","data",graphId,
                                             colour,"dashed","off",1.25,True )
        elif styles[i]=="line":
            pyrvapi.rvapi_set_line_options ( yId,"plot","data",graphId,
                                             colour,"solid","off",2.0,True )
        elif styles[i]=="dotted":
            pyrvapi.rvapi_set_line_options ( yId,"plot","data",graphId,
                                             colour,"dotted","off",2.0,True )
        else:
            pyrvapi.rvapi_set_line_options ( yId,"plot","data",graphId,
                                             colour,"solid","filledCircle",2.5,True )

    if ymax==0.0:  ymax = 1.0
    pyrvapi.rvapi_set_plot_xrange ( "plot",graphId,0.0,max(5.0,float(nx)) )
    pyrvapi.rvapi_set_plot_yrange ( "plot",graphId,0.0,ymax*1.05 )
    pyrvapi.rvapi_set_plot_legend ( "plot",graphId,"nw","" )

    return

# ----------------------------------------------------------------------------

def getDiskUsage ( path ):
    st    = os.statvfs(path)
    r     = st.f_frsize / (1024.0*1024.0*1024.0);  # GByte
    free  = (st.f_bavail * r)
    total = (st.f_blocks * r)
    used  = (st.f_blocks - st.f_bfree) * r
    return (free,total,used)

# ----------------------------------------------------------------------------

def main():

    if len(sys.argv)<3:
        print ( "Wrong number of arguments" )
        return

    statsFile = sys.argv[1]
    reportDir = sys.argv[2]
    volumes   = {}
    for i in range(3,len(sys.argv),2):
        volumes[sys.argv[i]] = sys.argv[i+1]

    #userDataPath    = sys.argv[3]
    #projectDataPath = sys.argv[4]

    pyrvapi.rvapi_init_document (
            "stats_report", # document Id
            reportDir,  # report directory (reserved)
            "Title",    # title (immaterial)
            1,          # HTML report to be produced
            0,          # Single-page report
            "jsrview",  # where to look for js support (reserved)
            None,None,
            "task.tsk",
            None )

    #usageStats = jsonut.readjObject ( statsFile )

    usageStats = None
    try:
        with open(statsFile) as json_file:
            usageStats = json.load(json_file)
    except:
        pass

    if usageStats is None:
        pyrvapi.rvapi_set_text (
            "<h2>Usage stats not available</h2>" +\
            "<i>Possibly not enough data for report yet -- try later</i>",
            reportPage(), 0,0,1,1 )
        return

    pyrvapi.rvapi_set_text  (
            "<h1>Usage Stats</h2>"   +\
            "<h3><i>Collected from " + usageStats["startDateS"] + "</i></h3>",
            reportPage(), 0,0,1,1 )
    row = 1

    ndays = len(usageStats["njobs"])
    days  = range(ndays)

    njobs_total = [usageStats["njobs"][0]]
    for i in range(1,ndays):
        njobs_total.append ( njobs_total[i-1] + usageStats["njobs"][i] )
    njobs_average = [float(njobs_total[-1])/float(ndays)]
    for i in range(1,ndays):
        njobs_average.append ( njobs_average[0] )

    putGraphWidget ( "njobs_graph","<h2>Number of jobs per day</h2>",
                     days,[usageStats["njobs"],njobs_average],"Day",
                     "Number of jobs per day",["number of jobs","average"],
                     ["normal","thin"],row,0, width=700,height=400 )
    pyrvapi.rvapi_set_text ( "&nbsp;&nbsp;&nbsp;",reportPage(), row,1,1,1 )
    putGraphWidget ( "njobs_total_graph","<h2>Total number of jobs</h2>",
                     days,[njobs_total],"Day",
                     "Total number of jobs",["number of jobs"],["normal"],
                     row,2, width=550,height=400 )
    row += 2

    cpu = []
    for i in range(ndays):
        cpu.append ( usageStats["cpu"][i] )
    cpu_total = [usageStats["cpu"][0]]
    for i in range(1,ndays):
        cpu_total.append ( cpu_total[i-1] + usageStats["cpu"][i] )
    cpu_average = [cpu_total[-1]/ndays]
    for i in range(1,ndays):
        cpu_average.append ( cpu_average[0] )

    putGraphWidget ( "cpu_graph","&nbsp;<br>&nbsp;<h2>CPU hours per day</h2>",
                     days,[cpu,cpu_average],"Day","CPU (hours/day)",
                     ["cpu hours","average"],["normal","thin"],
                     row,0, width=700,height=400 )
    putGraphWidget ( "cpu_total_graph","&nbsp;<br>&nbsp;<h2>Total CPU hours</h2>",
                     days,[cpu_total],"Day","CPU (hours)",["cpu hours"],["normal"],
                     row,2, width=550,height=400 )
    row += 2

    for vname in volumes:
        du = getDiskUsage ( volumes[vname] )
        if vname in usageStats["volumes"]:
            usageStats["volumes"][vname]["free"][-1] = du[0]
            usageStats["volumes"][vname]["total"]    = du[1]
        else:
            usageStats["volumes"][vname] = {
                "free"      : [du[0]]*ndays,
                "total"     :  du[1],
                "committed" : [du[1]]*ndays
            }

    """
    disk_projects = getDiskUsage ( projectDataPath )
    disk_users    = getDiskUsage ( userDataPath    )
    usageStats.disk_free_projects[-1] = disk_projects[0]  # free
    usageStats.disk_free_users   [-1] = disk_users   [0]  # free
    usageStats.disk_total_projects    = disk_projects[1]  # total
    usageStats.disk_total_users       = disk_users   [1]  # total
    """

    #usageStats.currentDate = int(time.time()*1000.0)
    #jsonut.writejObject ( usageStats,statsFile )
    with open(statsFile,'w') as outfile:
        json.dump ( usageStats,outfile,indent=2 )

    """
    disk_total_projects = []
    disk_total_users    = []
    for i in range(ndays):
        disk_total_projects.append ( usageStats.disk_total_projects )
        disk_total_users   .append ( usageStats.disk_total_users    )

    putGraphWidget ( "disk_projects_graph",
                     "&nbsp;<br>&nbsp;<h2>Disk space for project data</h2>",
                     days,[usageStats.disk_free_projects,disk_total_projects],
                     "Day","Disk space (GBytes)",["available","total"],["normal","thin"],
                     row,0, width=700,height=400 )
    putGraphWidget ( "disk_users_graph","&nbsp;<br>&nbsp;<h2>Disk space for user data</h2>",
                     days,[usageStats.disk_free_users,disk_total_users],
                     "Day","Disk space (GBytes)",["available","total"],["normal","thin"],
                     row,2, width=550,height=400 )

    """

    gdata  = []
    names  = []
    styles = []
    for vname in volumes:
        if vname!="user_data" and vname!="storage":
            gdata .append ( usageStats["volumes"][vname]["free"] )
            gdata .append ( usageStats["volumes"][vname]["committed"] )
            gdata .append ( [usageStats["volumes"][vname]["total"]]*ndays )
            names .append ( str(vname) + "-free"  )
            names .append ( str(vname) + "-comt"  )
            names .append ( str(vname) + "-total" )
            styles.append ( "line"   )
            styles.append ( "thin"   )
            styles.append ( "dotted" )

    putGraphWidget ( "disk_projects_graph",
                     "&nbsp;<br>&nbsp;<h2>Disk space for project data</h2>",
                     days,gdata,"Day","Disk space (GBytes)",names,styles,
                     row,0, width=700,height=400 )

    putGraphWidget ( "disk_users_graph",
                     "&nbsp;<br>&nbsp;<h2>Disk space for user data</h2>",
                     days,[
                         usageStats["volumes"]["user_data"]["free"],
                        [usageStats["volumes"]["user_data"]["total"]]*ndays,
                         usageStats["volumes"]["storage"  ]["free"],
                        [usageStats["volumes"]["storage"  ]["total"]]*ndays
                     ],
                     "Day","Disk space (GBytes)",[
                        "user-free",
                        "user-total",
                        "storage-free",
                        "storage-total"
                     ],[
                        "line",
                        "dotted",
                        "line",
                        "dotted"
                     ],
                     row,2, width=550,height=400 )
    row += 2

    pyrvapi.rvapi_set_text ( "&nbsp;<p>&nbsp;<h2><i>Tasks</i></h2>",
                             reportPage(), row,0,1,1 )

    tasks = []
    #for t in usageStats.tasks.__dict__.iteritems():
    #    t[1].title = t[0]
    #    tasks.append ( t[1] )
    for t in usageStats["tasks"]:
        usageStats["tasks"][t]["title"] = t
        tasks.append ( usageStats["tasks"][t] )

    tableId = "tasks_table"
    pyrvapi.rvapi_add_table        ( tableId,"",reportPage(),row+1,0,1,3, 0 )
    pyrvapi.rvapi_set_table_type   ( tableId,True,False )
    #pyrvapi.rvapi_set_table_style  ( tableId,"table-tasks","" )

    pyrvapi.rvapi_put_horz_theader ( tableId,"Task","Task name"         ,0 )
    pyrvapi.rvapi_put_horz_theader ( tableId,"N<sub>uses</sub>",
                                     "Number of times the task was used",1 )
    pyrvapi.rvapi_put_horz_theader ( tableId,"N<sub>fails</sub>",
                                     "Number of times the task failed"  ,2 )
    pyrvapi.rvapi_put_horz_theader ( tableId,"N<sub>terms</sub>",
                                     "Number of times the task was terminated by user",
                                     3 )
    pyrvapi.rvapi_put_horz_theader ( tableId,"CPU hours",
                                     "Average CPU hours taken by task"  ,4 )
    pyrvapi.rvapi_put_horz_theader ( tableId,"Disk (MB)",
                                     "Average Disk space taken by task" ,5 )
    for i in range(len(tasks)):
        pyrvapi.rvapi_put_table_string ( tableId,
            "<img style='vertical-align:middle;' src='xxJsCoFExx-fe/" + tasks[i]["icon"] +\
            "' width='26px' height='26px'/>&nbsp;&nbsp;" + tasks[i]["title"],i,0 )
        pyrvapi.rvapi_put_table_int  ( tableId,tasks[i]["nuses"] ,i,1 )
        pyrvapi.rvapi_put_table_int  ( tableId,tasks[i]["nfails"],i,2 )
        pyrvapi.rvapi_put_table_int  ( tableId,tasks[i]["nterms"],i,3 )
        pyrvapi.rvapi_put_table_real ( tableId,tasks[i]["cpu_time"]  ,"%9.4f",i,4 )
        pyrvapi.rvapi_put_table_real ( tableId,tasks[i]["disk_space"],"%9.3f",i,5 )
        pyrvapi.rvapi_shape_table_cell ( tableId,i,0,"", "text-align:left;" +\
            "font-family:\"Trebuchet MS\",\"Helvetica\",\"Arial\"," +\
            "\"Verdana\",\"sans-serif\";","",1,1 )

    return


if __name__ == '__main__':
    main()
