#!/usr/bin/python

#
# ============================================================================
#
#    01.03.20   <--  Date of Last Modification.
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

        cwd     = os.path.abspath(os.getcwd())
        scriptf = "process.sh"
        reppath = os.environ["DOCREPO"]
        repname = "jscofe-doc"
        doctype = self.getParameter ( self.task.parameters.DOC_SEL    )
        restype = self.getParameter ( self.task.parameters.OUTPUT_SEL )
        srcpath = os.path.join ( repname,"src-" + doctype )

        if doctype=="dev":
            self.putMessage ( "<h3>Generating developer's reference</h3>" )
        else:
            self.putMessage ( "<h3>Generating user manual</h3>" )

        self.putMessage ( os.path.realpath ( os.path.dirname ( __file__ ) ) )

        theme = self.getParameter ( self.task.parameters.THEME_SEL )

        script = "#!/bin/bash" +\
                 "\ncd "    + reppath +\
                 "\ngit pull origin master" +\
                 "\ncd "    + cwd +\
                 "\ncp -r " + reppath + " " + repname +\
                 "\ncd "    + srcpath +\
                 "\ncp -r tasks/* ."  +\
                 "\ncp ../build/Makefile ." +\
                 "\ncp ../build/conf-" + theme + ".py conf.py" +\
                 "\nmake html\n";

        self.stdout (
            " ============================================================\n" +\
            "   Processing script:\n\n" +\
            script +\
            " ============================================================\n"
        )

        f = open ( scriptf,"w" )
        f.write ( script )
        f.close()

        os.chmod ( scriptf, stat.S_IRUSR  | stat.S_IXUSR )

        rc = self.runApp ( "/bin/bash",["-c","./"+scriptf],logType="Main",quitOnError=False )

        if not rc.msg:
            docdir = "html-" + doctype
            shutil.move ( os.path.join(srcpath,"_build","html"),
                          os.path.join(self.reportDir(),docdir) )
            self.putTitle ( "Generated documents" )
            htmlDir = os.path.join ( self.reportDir(),docdir )
            files = [f for f in os.listdir(htmlDir) if f.lower().endswith(".html")]
            for f in files:
                url = docdir + "/" + f
                self.putMessage (
                    "<a href=\"" + url + "\" " +\
                    "onclick='window.parent.launchHelpBox(" +\
                        "\"\",window.parent.getJobFileURL(" + self.job_id +\
                        ",\"report/" + url + "\"),null,0); return false;'>" + f +\
                    "</a>"
                )

#getJobFileURL ( jobId,filePath )

#function launchHelpBox ( title,helpURL,onDoNotShowAgain_func,delay_msec )  {


                #self.putMessage ( "<span onclick='alert(\"xxx\");'>" + f + "</span>" )

#              help_btn.addOnClickListener ( function(){
#                new HelpBox ( '','./html/jscofe_myprojects.html',null );
#              });

        else:
            self.putTitle   ( "Documentation build failed" )
            self.putMessage ( "<b>Error:</b> " + rc.msg )

        self.clearCitations()
        self.success ( True )
        return



# ============================================================================

if __name__ == "__main__":

    drv = DocDev ( "",os.path.basename(__file__) )
    #,options = {
    #    "report_page" : { "show" : True, "name" : "Report", "showTitle" : False }
    #})
    drv.start()
