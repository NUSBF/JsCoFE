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

        # close execution logs and quit
        self.success()
        return

# ============================================================================

if __name__ == "__main__":

    drv = HelloWorld ( "",os.path.basename(__file__) )
    drv.run()
