##!/usr/bin/python

#
# ============================================================================
#
#    22.12.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLREP-REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.dimple exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid

#  application imports
import basic
from   pycofe.dtypes import dtype_template,dtype_structure


# ============================================================================
# Make Dimple driver

class Dimple(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "dimple.script"

    # ------------------------------------------------------------------------

    def runDimple ( self,hkl,istruct ):

        sec1 = self.task.parameters.sec1.contains

        # make command-line parameters for dimple
        cmd = [
            hkl.getHKLFilePath(self.inputDir()),
            istruct.getXYZFilePath(self.inputDir()),
            "./",
            "--free-r-flags","-",
             "--freecolumn",hkl.getMeta("FREE","")
        ]

        reflevel = self.getParameter ( sec1.REFLEVEL )
        if reflevel=="1":    cmd += [ "--slow" ]
        elif reflevel=="2":  cmd += [ "--slow","--slow" ]

        cmd += [
            "--hklout",self.getMTZOFName(),
            "--xyzout",self.getXYZOFName()
        ]

        #  make this check because function can be used also with DataXYZ
        if istruct._type==dtype_structure.dtype():
            libin = istruct.getLibFilePath ( self.inputDir() )
            if libin:
                cmd += [ "--libin",libin ]

        mr_prog = self.getParameter ( sec1.MRPROG )

        cmd += [
            "--jelly"       ,self.getParameter ( sec1.NJELLY      ),
            "--restr-cycles",self.getParameter ( sec1.NRESTR      ),
            "--mr-when-r"   ,self.getParameter ( sec1.MRTHRESHOLD ),
            "--mr-reso"     ,self.getParameter ( sec1.MRRESO      ),
            "--mr-prog"     ,mr_prog
        ]

        reslimit = self.getParameter ( sec1.RESLIMIT )
        if reslimit:
            cmd += [ "--reso",reslimit ]

        weight = self.getParameter ( sec1.WEIGHT )
        if weight:
            cmd += [ "--weight",weight ]

        mrnum = self.getParameter ( sec1.MRNUM )
        if mrnum:
            cmd += [ "--mr-num",mrnum ]


        # run dimple
        if sys.platform.startswith("win"):
            self.runApp ( "dimple.bat",cmd )
        else:
            self.runApp ( "dimple",cmd )

        self.file_stdout.close()
        self.file_stdout = open ( self.file_stdout_path(),'r' )
        dimple_log = self.file_stdout.read()
        self.file_stdout.close()
        self.file_stdout = open ( self.file_stdout_path(),'a' )

        if "pointless" in dimple_log:
            self.addCitations ( ["pointless"] )
        if mr_prog in dimple_log:
            self.addCitations ( [mr_prog] )
        self.addCitations ( ["rwcontents","refmac5"] )
        if "find-blobs" in dimple_log:
            self.addCitations ( ["find-blobs"] )

        # ================================================================
        # make output structure and register it

        return self.finaliseStructure ( self.getXYZOFName(),self.outputFName,
                                             hkl,None,[],1,False )


    def run(self):

        # Prepare dimple input -- script file

        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        hkl      = self.makeClass ( revision.HKL )   # note that 'hkl' was added
                                  # to input databox by TaskDimple.makeInputData(),
                                  # therefore, hkl=self.input_data.data.hkl[0]
                                  # would also work

        structure = self.runDimple ( hkl,istruct )

        if structure:
            # update structure revision
            revision = self.makeClass  ( self.input_data.data.revision[0] )
            revision.setReflectionData ( hkl       )
            revision.setStructureData  ( structure )
            self.registerRevision      ( revision  )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Dimple ( "Refinement and optional MR with Dimple",os.path.basename(__file__) )
    drv.start()
