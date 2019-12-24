##!/usr/bin/python

#
# ============================================================================
#
#    20.12.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks. jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

#  application imports
import basic


# ============================================================================
# Make CombStructure driver

class CombStructure(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return ".script"

    def refmac_out(self): return "_refmac_"
    def coot_out  (self): return "_coot_"

    # ------------------------------------------------------------------------

    def make_pass ( self,passId,hkl,params ):

        #  comb structure

        self.open_script ( "coot" )

        lab_f   = self.getLabel ( meta["labin_fc"],0 )
        lab_phi = self.getLabel ( meta["labin_fc"],1 )
        xyzout  = os.path.join  ( self.workdir,nameout+".pdb" )

        self.write_script ([
            "make_and_draw_map('" + params["mtzin"]  +\
                                "', '" + params["labin_fc"][0] +\
                                "', '" + params["labin_fc"][1] +\
                                "', '', 0, 0)",
            script + "(0)",
            "write_pdb_file(0,'" + xyzout + "')",
            "coot_real_exit(0)"
        ])

        self.close_script()

        script_path = self.script_path + ".py"
        os.rename ( self.script_path,script_path )
        self.script_path = None

        cmd = [ "--no-state-script", "--no-graphics", "--no-guano", "--python",
                "--pdb",params["xyzin"], "--script",script_path ]

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        if sys.platform.startswith("win"):
            self.runApp ( "coot.bat",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )
        else:
            self.runApp ( "coot",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        out_meta = meta.copy()
        out_meta["xyzpath"  ] = xyzout



        #  polish with Refmac

        hkl_labels = hkl.getMeanColumns()
        if hkl_labels[2]=="F":
            hkl_labin = "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
        else:
            hkl_labin = "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]
        hkl_labin += " FREE=" + hkl.getFreeRColumn()

        self.open_stdin()
        self.write_stdin ([
            hkl_labin,
            "NCYC " + params["NCYCLES"],
            "WEIGHT AUTO",
            "MAKE HYDR NO",
            "REFI BREF ISOT",
            "SCALE TYPE SIMPLE",
            "SOLVENT YES",
            "NCSR LOCAL",
            "MAKE NEWLIGAND EXIT",
            "END"
        ])
        self.close_stdin()

        refmac_mtzout = self.refmac_out() + str(passId) + ".mtz"
        refmac_xyzout = self.refmac_out() + str(passId) + ".pdb"

        cmd = [ "hklin" ,hkl.getHKLFilePath(self.inputDir()),
                "xyzin" ,meta["xyzpath"],
                "hklout",refmac_mtzout,
                "xyzout",refmac_xyzout,
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        if params["libin"]:
            cmd += ["libin",params["libin"]]

        self.runApp ( "refmac5",cmd,logType="Main" )

        return [refmac_mtzout,refmac_xyzout]


    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare  input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        # Prepare report parser
        #self.setGenericLogParser ( self._report(),False )


        if self.getParameter(self.task.parameters.sec1.contains.PDB_CBX)=="True":
            cmd += [ "-auto" ]

        minres = self.getParameter(self.task.parameters.sec1.contains.MINRES)
        if minres:
            cmd += [ "-minres",minres ]

        if self.getParameter(self.task.parameters.sec1.contains.DNA_CBX)=="True":
            cmd += [ "-dna" ]

        if self.getParameter(self.task.parameters.sec1.contains.MR_CBX)=="True":
            cmd += [ "-mr" ]


        libin = istruct.getLibFilePath ( self.inputDir() )

        self.make_pass ( 1,hkl,{
          "libin"    : libin,
          "xyzin"    : istruct.getXYZFilePath ( self.inputDir() ),
          "mtzin"    : istruct.getMTZFilePath ( self.inputDir() ),
          "labin_fc" : [istruct.FWT,istruct.PHWT]
        })


        # check solution and register data
        if os.path.isfile(self.getXYZOFName()):

            self.putTitle ( "CombStructure Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),None,
                                                 self.getMTZOFName(),
                                                 None,None,None,
                                                 #fnames[0],fnames[1],None,  -- not needed for new UglyMol
                                                 leadKey=1 )
            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( hkl     )
                structure.copySubtype        ( istruct )
#               structure.copyLigands        ( istruct )
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = CombStructure ( "",os.path.basename(__file__) )
    drv.start()
