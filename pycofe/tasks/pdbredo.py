##!/usr/bin/python#

#
# ============================================================================
#
#    30.09.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB-REDO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pdbredo jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) M. Fando, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
# import sys
# import uuid
import shutil

# import gemmi

#  application imports
from . import basic
# from   pycofe.dtypes    import dtype_template
from   pycofe.proc      import qualrep

# ============================================================================
# Make PDB-REDO driver

class Pdbredo(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return "pdbredo.script"

    # ------------------------------------------------------------------------

    def formStructure ( self,xyzout,subfile,mtzout,libin,hkl,istruct,maplabels,copyfiles ):
        structure = self.registerStructure ( xyzout,subfile,mtzout,
                                             None,None,libin,leadKey=1,
                                             map_labels=maplabels,
                                             copy_files=copyfiles,
                                             refiner="pdbredo" )
        if structure:
            structure.copyAssociations   ( istruct )
            structure.addDataAssociation ( hkl.dataId     )
            structure.addDataAssociation ( istruct.dataId )  # ???
            structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
            if not subfile:
                mmcifout = self.getMMCIFOFName()
                if os.path.isfile(mmcifout):
                    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
            structure.addPhasesSubtype   ()
        return structure


    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. 
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName() ):
            os.remove(self.getXYZOFName() )

        # Prepare input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        xyzin = istruct.getXYZFilePath ( self.inputDir() )
        libin = istruct.getLibFilePath ( self.inputDir() )

        xyzout = self.getXYZOFName()
        mtzout = self.getMTZOFName()

        # imitate PDBREDO

        shutil.copyfile ( xyzin,xyzout )
        shutil.copyfile ( istruct.getMTZFilePath(self.inputDir()),mtzout )


        # check solution and register data
        have_results = False
        if os.path.isfile(xyzout):

            self.rvrow += 5

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            substructure = None

            structure = self.formStructure ( xyzout,None,mtzout,
                                             libin,hkl,istruct,
                                             "FWT,PHWT,DELFWT,PHDELWT",True )
            if structure:
                self.putStructureWidget ( "structure_btn",
                                          "Structure and electron density",
                                          structure )

                # make anomolous ED map widget
                if hkl.isAnomalous() and str(hkl.useHKLSet)!="TI":

                    mapfname = self.calcCCP4Maps ( mtzout,
                                        "pdbredo_ano",source_key="pdbredo_anom" )
                    hatype   = revision.ASU.ha_type.upper()
                    if not hatype:
                        hatype = "AX"

                    self.open_stdin()
                    self.write_stdin ([
                        "residue " + hatype,
                        "atname " + hatype,
                        "numpeaks 100",
                        "threshold rms 4",
                        "output pdb",
                        "end"
                    ])
                    self.close_stdin()
                    subfile = "substructure.pdb"
                    try:
                        self.runApp ( "peakmax",[
                            "mapin" ,mapfname[0],
                            "xyzout",subfile
                        ],logType="Service" )
                        for fname in mapfname:
                            if os.path.exists(fname):
                                os.remove ( fname )

                        xyz_merged = self.getOFName ( "_ha.pdb" )
                        is_substr  = self.merge_sites ( xyzout,subfile,hatype,xyz_merged )

                        self.putTitle ( "Structure, substructure and anomolous maps" )
                        struct_ano = self.formStructure ( xyz_merged,None,mtzout,
                                                          libin,hkl,istruct,
                                                          "FAN,PHAN,DELFAN,PHDELAN",
                                                          False )
                        if struct_ano:
                            nlst = struct_ano.dname.split ( " /" )
                            nlst[0] += " (anom maps)"
                            struct_ano.dname = " /".join(nlst)
                            self.putStructureWidget ( "struct_ano_btn",
                                        "Structure, substructure and anomalous maps",struct_ano )
                            if is_substr:
                                substructure = self.formStructure ( None,subfile,
                                        structure.getMTZFilePath(self.outputDir()),
                                        libin,hkl,istruct,"FWT,PHWT,DELFWT,PHDELWT",
                                        False )
                                if not substructure:
                                    self.putMessage ( "<i>Substructure could not be " +\
                                                      "formed (possible bug)</i>" )
                        else:
                            self.putMessage ( "<i>Structure with anomalous maps " +\
                                              "could not be formed (possible bug)</i>" )
                    except:
                        self.putMessage ( "<i>Structure with anomalous maps " +\
                                          "could not be formed due to exception " +\
                                          " (possible bug)</i>" )

                # update structure revision
                revision.setStructureData ( substructure )
                revision.setStructureData ( structure    )
                self.registerRevision     ( revision     )
                have_results = True

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision )
                try:
                    # meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                    meta = qualrep.quality_report ( self,revision )
                except:
                    meta = None
                    self.stderr ( " *** validation tools or molprobity failure" )
                    self.rvrow = rvrow0 + 4

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Pdbredo ( "",os.path.basename(__file__) )
    drv.start()
