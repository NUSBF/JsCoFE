##!/usr/bin/python

#  system imports
import os

#  ccp4-python imports
import pyrvapi

#  jsCoFE imports
from pycofe.tasks  import basic

# ============================================================================
# HelloWorld driver

class HelloWorld(basic.TaskDriver):

    def run(self):

        # put message
        self.putMessage ( "Hello World!" )

        # print in standard output and standard error streams
        self.file_stdout.write ( "Hello World!\n" )
        self.file_stderr.write ( "Hello World!\n" )

        # process input data
        if hasattr(self.input_data.data,"xyz"): # check if any data was chosen

            xyz = self.input_data.data.xyz
            self.putMessage ( "<p><b>Total " + str(len(xyz)) +\
                              " data objects chosen by user.</b>" )

            for i in range(len(xyz)):
                self.putMessage ( "<i>Process dataset #" + str(i) + "</i>" )
                self.file_stdout.write (
                    "\n=========  Data Object (metadata) #" + str(i) + "\n" +\
                    xyz[i].to_JSON() + "\n" )
                xyzi     = self.makeClass ( xyz[i] )
                filepath = xyzi.getFilePath ( self.inputDir() )
                filei    = open ( filepath,'r' )
                self.file_stdout.write (
                    "\n=========  Data Content (file " + xyzi.files[0] +\
                    ") #" + str(i) + "\n\n" + filei.read() + "\n" )
                filei.close()

        else:
            self.putMessage ( "<p><b>No input data was chosen by user.</b>" )

        # process input parameters
        self.putMessage ( "&nbsp;" )  # spaceholder

        sec1 = self.task.parameters.sec1.contains

        # make table
        tableId = "report_table1"  # make sure all PyRVAPI Ids are unique
        pyrvapi.rvapi_add_table ( tableId,"<font size='+1'>Summary of Parameters</font>",
                                  self.report_page_id(),self.rvrow,0,1,1, 0 )
        pyrvapi.rvapi_set_table_style ( tableId,"table-blue","text-align:left;" )
        self.rvrow += 1  # important or table will be lost!

        # make table headers
        pyrvapi.rvapi_put_horz_theader ( tableId,"Type","Parameter type",0 )
        pyrvapi.rvapi_put_horz_theader ( tableId,"Python type","Python type",1 )
        pyrvapi.rvapi_put_horz_theader ( tableId,"Label","Parameter label",2 )
        pyrvapi.rvapi_put_horz_theader ( tableId,"Visibility","visibility",3 )
        pyrvapi.rvapi_put_horz_theader ( tableId,"Value","Parameter value",4 )

        # fill rows with parameter data and metadata
        def makeRow ( name,parameter,row ):
            pyrvapi.rvapi_put_vert_theader ( tableId,name,parameter.tooltip,row )
            pyrvapi.rvapi_put_table_string ( tableId,parameter.type,row,0 )
            pyrvapi.rvapi_put_table_string ( tableId,type(parameter.value).__name__,row,1 )
            pyrvapi.rvapi_put_table_string ( tableId,parameter.label,row,2 )
            pyrvapi.rvapi_put_table_string ( tableId,str(parameter.visible),row,3 )
            pyrvapi.rvapi_put_table_string ( tableId,str(parameter.value),row,4 )
            return

        makeRow ( "NCLUST"    ,sec1.NCLUST    ,0 )
        makeRow ( "HATOM"     ,sec1.HATOM     ,1 )
        makeRow ( "PROGRAM"   ,sec1.PROGRAM   ,2 )
        makeRow ( "HANDDET_DO",sec1.HANDDET_DO,3 )

        # close execution logs and quit
        self.success()
        return

# ============================================================================

if __name__ == "__main__":

    drv = HelloWorld ( "",os.path.basename(__file__) )
    drv.run()
