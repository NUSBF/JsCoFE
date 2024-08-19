##!/usr/bin/python

#
# ============================================================================
#
#    10.02.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CONTACT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python sc.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2023
#
# ============================================================================
#

#  python native imports
import os
import pyrvapi

#  application imports
from pycofe.tasks import basic
from pycofe.dtypes import dtype_revision


# ============================================================================
# Make SC driver


class SC(basic.TaskDriver):

    def run(self):

        # fetch input data
        xyz = self.makeClass(self.input_data.data.xyz[0])

        # make command-line parameters

        cmd = ['XYZIN', xyz.getPDBFilePath(self.inputDir())]

        self.open_stdin()
        self.write_stdin([
            "MOLECULE 1",
            "CHAIN    " + xyz.chainSel,
            "MOLECULE 2",
            "CHAIN    " + xyz.chainSel2,
            "END"
        ])
        self.close_stdin()


       
        # --------------------------------------------------------------------

        # xyzin = xyz.getPDBFilePath(self.inputDir())

        # keywords = self.getParameter(self.task.parameters.SC_INPUT).strip()
        
        # keywords += ["END"]
        # for molecule in molecules:
        #     num = 1
        #     keywords = ('MOLECULE', num, '\n', 'CHAIN', xyz[i].chainSel)
        #     num += 1

        rvrow0 = self.rvrow
        self.rvrow += 1
        self.putMessage ( "&nbsp;" )

        # prepare report parser
        self.setGenericLogParser ( self.getWidgetId("sc_report"),True )

        # run SC
        self.runApp ( "sc",cmd, logType="Main" )

        # close report parser
        self.unsetLogParser()

        self.putMessage ( "&nbsp;" )
        grid_id = self.getWidgetId("grid")
        self.putGrid(grid_id)
        self.putMessage1(
            grid_id, "See all details in <i>Main Log</i><sup>&nbsp;&nbsp;</sup>", 0, 0
        )
        self.putDownloadButton(self.file_stdout_path(), "download", grid_id, 0, 1)

        # parse Summary

        self.flush()
        self.file_stdout.close()
        f        = open ( self.file_stdout_path(),"r" )
        scores   = []
        sc_score = None
        key      = 0
        for line in f:
            if line.startswith("______________________________________"):
                key += 1
            if key==1:
                vals = line.split()
                if len(vals)==4:
                    scores.append ( [vals[1].strip(),vals[2].strip(),vals[3].strip()] )
                elif len(vals)>4:
                    sc_score = vals[-1].strip()
        f.close()

        # continue writing to stdout
        self.file_stdout = open ( self.file_stdout_path(),"a" )

        # make summary table

        if len(scores)==4:

            # self.putMessage1 ( self.report_page_id(),"<b><i>Summary of results</i></b>",rvrow0 )

            tableId = self.getWidgetId ( "sc_summary" )
            hcss    = "background:#5d9bd0;color:white;white-space:nowrap;text-align:left;" +\
                      "font-family:\"Trebuchet MS\",\"Helvetica\",\"Arial\"," +\
                      "\"Verdana\",\"sans-serif\";"

            hcss_c  = hcss.replace ( "left","center" )

            pyrvapi.rvapi_add_table ( tableId,"<b><i>Summary of results</i></b>",
                                      self.report_page_id(),rvrow0,0,1,1,0 )
            pyrvapi.rvapi_set_table_style ( tableId,"table-blue","text-align:right;" )

            pyrvapi.rvapi_put_table_string ( tableId,"D(A-&gt;B)",0,1 )
            pyrvapi.rvapi_put_table_string ( tableId,"D(B-&gt;A)",0,2 )
            pyrvapi.rvapi_put_table_string ( tableId,"D(A-&gt;B)+D(B-&gt;A)/2",0,3 )

            pyrvapi.rvapi_put_table_string ( tableId,"S(A-&gt;B)",3,1 )
            pyrvapi.rvapi_put_table_string ( tableId,"S(B-&gt;A)",3,2 )
            pyrvapi.rvapi_put_table_string ( tableId,"S(A-&gt;B)+S(B-&gt;A)/2",3,3 )

            pyrvapi.rvapi_put_table_string ( tableId,"Mean"  ,1,0 )
            pyrvapi.rvapi_put_table_string ( tableId,"Median",2,0 )

            pyrvapi.rvapi_put_table_string ( tableId,"Mean"  ,4,0 )
            pyrvapi.rvapi_put_table_string ( tableId,"Median",5,0 )

            for i in range(3):
                pyrvapi.rvapi_put_table_string ( tableId,scores[0][i],1,i+1 )
                pyrvapi.rvapi_put_table_string ( tableId,scores[1][i],2,i+1 )
                pyrvapi.rvapi_put_table_string ( tableId,scores[2][i],4,i+1 )
                pyrvapi.rvapi_put_table_string ( tableId,scores[3][i],5,i+1 )

                pyrvapi.rvapi_shape_table_cell ( tableId,i  ,0,"",hcss,"",1,1 );
                pyrvapi.rvapi_shape_table_cell ( tableId,i+3,0,"",hcss,"",1,1 );

                pyrvapi.rvapi_shape_table_cell ( tableId,0,i+1,"",hcss_c,"",1,1 );
                pyrvapi.rvapi_shape_table_cell ( tableId,3,i+1,"",hcss_c,"",1,1 );

            pyrvapi.rvapi_put_table_string ( tableId,"Shape complementarity statistic S<sub>c</sub> =",6,0 )
            pyrvapi.rvapi_shape_table_cell ( tableId,6,0,"",hcss,"",1,3 );
            pyrvapi.rvapi_put_table_string ( tableId,"<b>"+sc_score+"</b>",6,1 )
            pyrvapi.rvapi_shape_table_cell ( tableId,6,1,"","text-align:left;","",1,1 );


        # this will go in the project tree line
        if sc_score:
            self.generic_parser_summary["SC"] = {"summary_line": "S<sub>c</sub>="+sc_score }
        else:
            self.generic_parser_summary["SC"] = {"summary_line": "score not obtained"}

        # close execution logs and quit
        self.success ( False )

        return

# ============================================================================

if __name__ == "__main__":

    drv = SC ( "",os.path.basename(__file__) )
    drv.start()
