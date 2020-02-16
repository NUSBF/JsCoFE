#!/usr/bin/python

#
# ============================================================================
#
#    16.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SPHINX DOCUMENTATION DEVELOPMENT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.docdev.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
#import sys
import stat
import shutil

#  application imports
import basic
#from   pycofe.proc    import import_filetype, import_unmerged
#from   pycofe.varut   import signal
#try:
#    from pycofe.varut import messagebox
#except:
#    messagebox = None


# ============================================================================
# Make DocDev driver

class DocDev(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):
        # Prepare docdev job

        script  = "process.sh"
        repname = "jscofe-doc"
        f = open ( script,"w" )
        f.write (
            "rm -rf src html jscofe-doc\n" +\
            "git clone https://krissinel:ekr%40ccp4.ac.uk@gitlab.com/CCP4/jscofe-doc.git\n" +\
            "cd " + os.path.join(repname,"src") + "\n" +\
            "cp ../build/* .\n" +\
            "make html\n"
        )
        f.close()

        os.chmod ( script, stat.S_IRUSR  | stat.S_IXUSR )

        rc = self.runApp ( "/bin/bash",["-c","./"+script],logType="Main",quitOnError=False )

        if not rc.msg:
            shutil.move ( os.path.join(repname,"src","_build","html"),self.reportDir() )
            self.putTitle ( "Generated documents" )
            htmlDir = os.path.join ( self.reportDir(),"html" )
            files = [f for f in os.listdir(htmlDir) if f.lower().endswith(".html")]
            for f in files:
                url = "html/" + f
                self.putMessage (
                    "<a href=\"" + url + "\">" + f + "</a>"
                )
                #self.putMessage ( "<span onclick='alert(\"xxx\");'>" + f + "</span>" )


#              help_btn.addOnClickListener ( function(){
#                new HelpBox ( '','./html/jscofe_myprojects.html',null );
#              });


        else:
            self.putTitle   ( "Documentation build failed" )
            self.putMessage ( "<b>Error:</b> " + rc.msg )

        self.success ( False )
        return



# ============================================================================

if __name__ == "__main__":

    drv = DocDev ( "",os.path.basename(__file__) )
    #,options = {
    #    "report_page" : { "show" : True, "name" : "Report", "showTitle" : False }
    #})
    drv.start()
