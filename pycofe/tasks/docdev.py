#!/usr/bin/python

#
# ============================================================================
#
#    23.12.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

# sudo port install py39-sphinx
# pip3 install sphinxcontrib-contentui
# pip3 install sphinxcontrib-jquery
# pip3 install git+https://github.com/bwithd/sphinx-material


#  python native imports
import os
#import sys
import stat
import shutil

#  application imports
from . import basic


# ============================================================================
# Make DocDev driver

class DocDev(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):
        # Prepare docdev job

        cwd     = os.path.abspath(os.getcwd())
        scriptf = "process.sh"
        reppath = os.environ["DOCREPO"]  # documentation repository path
        repname = "jscofe-doc"           # documentation repository name
        doctype = self.getParameter ( self.task.parameters.DOC_SEL    )
        restype = self.getParameter ( self.task.parameters.OUTPUT_SEL )
        srcpath = os.path.join ( repname,"src-" + doctype )

        copytasks = ""
        if doctype=="dev":
            self.putMessage ( "<h3>Generating Developer's Reference</h3>" )
        elif doctype=="taskref":
            self.putMessage ( "<h3>Generating Task Reference</h3>" )
            copytasks = "\nmv tasks/* .\nrm -rf tasks" 
        elif doctype=="tutorials":
            self.putMessage ( "<h3>Generating Tutorials</h3>" )
            # copytasks = "\nmv tutorials/* .\nrm -rf tutorials"
        elif doctype=="userguide":
            self.putMessage ( "<h3>Generating User Guide</h3>" )
            copytasks = "\nmv tips/* .\nrm -rf tips" +\
                        "\nmv atlas/* .\nrm -rf atlas"
        elif doctype=="source":
            self.putMessage ( "<h3>Generating CCP4 documentation</h3>" )

        #self.putMessage ( os.path.realpath ( os.path.dirname ( __file__ ) ) )
        #self.putMessage ( self.jscofe_dir )

        # self.stdoutln ( "PYTHONPATH="+os.environ["PYTHONPATH"] )

        # os.environ["PYTHONPATH"] = ""

        theme = self.getParameter ( self.task.parameters.THEME_SEL )

        script = "#!/bin/bash"
        if "SPHINX_PATH" in os.environ:
            script += "\nexport PATH=" + os.environ["SPHINX_PATH"] + ":$PATH"
        script += "\necho $PATH" +\
                  "\ncd "    + reppath +\
                  "\ngit pull origin master" +\
                  "\ncd "    + cwd +\
                  "\ncp -r " + reppath + " " + repname +\
                  "\ncd "    + srcpath +\
                  copytasks  +\
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

        os.chmod ( scriptf, os.stat(scriptf).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH )

        if "SPHINX_PATH" in os.environ:
            rc = self.runApp ( "env",[
                                    "-i",
                                    "HOME=" + os.environ["HOME"],
                                    "/bin/bash","-l","-c","./"+scriptf
                                ],logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "/bin/bash",["-l","-c","./"+scriptf],
                               logType="Main",quitOnError=False )

        # rc = self.runApp ( "/bin/bash",["-l","-c","./"+scriptf],logType="Main",quitOnError=False )

        # env HOME="$HOME" bash -l -c

        if not rc.msg:

            gtag = None
            if gtag:
                gtag = [
                    "",
                    "<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-FCVD2T7BGM\"></script>",
                    "<script>",
                    "  window.dataLayer = window.dataLayer || [];",
                    "  function gtag(){dataLayer.push(arguments);}",
                    "  gtag('js', new Date());",
                    "  gtag('config', 'G-FCVD2T7BGM');",
                    "</script>",
                    ""
                ]

            docdir  = "html-" + doctype
            srcdir  = os.path.join ( srcpath,"_build","html" )
            with open(os.path.join(srcdir,"versions.json"),"w") as f:
                f.write ( "{}" )

            deppath = None
            if restype=="compile":
                self.putMessage ( "Documentation will be compiled only" )
            else:
                self.putMessage ( "Documentation will be compiled and deployed" )
                depdir = os.path.join ( self.jscofe_dir,"manuals",docdir )
                if os.path.exists(depdir):
                    shutil.rmtree ( depdir )
                shutil.copytree ( srcdir,depdir )
                self.stdoutln ( " \n" )
                if gtag:
                    files = [f for f in os.listdir(depdir) if f.lower().endswith(".html")]
                    for f in files:
                        fpath = os.path.join ( depdir,f )
                        self.stdoutln ( " ... put GA tag in " + fpath )
                        file  = open ( fpath,"r" )
                        content = file.read()
                        file.close()
                        file  = open ( fpath,"w" )
                        file.write ( content.replace("<head>","<head>\n" + "\n    ".join(gtag)) )
                        file.close()
                # write demo loader file
                f = open ( os.path.join(self.jscofe_dir,"manuals","demo_project.html"),"w" )
                f.write (
                    "<!DOCTYPE html>\n" +
                    "<html><body><script>\n" +
                    "  window.location = '../' + window.location.search;\n" +
                    "</script></body></html>\n"
                )
                f.close()

            shutil.move ( srcdir,os.path.join(self.reportDir(),docdir) )
            self.putTitle ( "Generated documents" )
            htmlDir = os.path.join ( self.reportDir(),docdir )
            files   = [f for f in os.listdir(htmlDir) if f.lower().endswith(".html")]
            files   = sorted(files)
            pos = files.index("index.html")
            if pos>0:
                files.remove("index.html")
                files = ["index.html"] + files
            for f in files:
                url = docdir + "/" + f
                self.putMessage (
                    "<a href=\"" + url + "\" " +\
                    "onclick='window.parent.launchHelpBox(" +\
                        "\"\",window.parent.getJobFileURL(" + self.job_id +\
                        ",\"report/" + url + "\"),null,0); return false;'>" + f +\
                    "</a>"
                )
                if f=="index.html":
                    self.putMessage ( "_"*60 )

#getJobFileURL ( jobId,filePath )

#function launchHelpBox ( title,helpURL,onDoNotShowAgain_func,delay_msec )  {


                #self.putMessage ( "<span onclick='alert(\"xxx\");'>" + f + "</span>" )

#              help_btn.addOnClickListener ( function(){
#                new HelpBox ( '','./html/jscofe_myprojects.html',null );
#              });

            summary_line = "source"
            if doctype=="dev":
                summary_line = "developer's reference"
            elif doctype=="taskref":
                summary_line = "task reference"
            elif doctype=="tutorials":
                summary_line = "tutorials reference"
            elif doctype=="userguide":
                summary_line = "user guide"
            summary_line += " compiled"
            if restype!="compile":
                summary_line += " and deployed"
            self.generic_parser_summary["pisa"] = {
                "summary_line" : summary_line
            }

        else:
            self.putTitle   ( "Documentation build failed" )
            self.putMessage ( "<b>Error:</b> " + rc.msg )
            self.generic_parser_summary["pisa"] = {
                "summary_line" : "failed"
            }

        shutil.rmtree ( repname )

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
