##!/usr/bin/python

import os

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
            self.putMessage ( "<p><b>No input data was chosen by user -- stop.</b>" )

        # close execution logs and quit
        self.success()
        return

# ============================================================================

if __name__ == "__main__":

    drv = HelloWorld ( "",os.path.basename(__file__) )
    drv.run()
