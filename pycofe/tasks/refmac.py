##!/usr/bin/python

#
# ============================================================================
#
#    15.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.refmac jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Robert Nicholls 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
#import shutil

#  application imports
import basic
from   pycofe.dtypes import dtype_template
from   pycofe.proc   import qualrep

# ============================================================================
# Make Refmac driver

class Refmac(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "refmac.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When refmac
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare refmac input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        hmodel  = None;
        if hasattr(self.input_data.data,"hmodel"):
            hmodel  = self.input_data.data.hmodel
            for i in range(len(hmodel)):
                hmodel[i] = self.makeClass ( hmodel[i] )

        #  protein:  hmodel[i].hasSubtype ( dtype_template.subtypeProtein() )
        #  dna:  hmodel[i].hasSubtype ( dtype_template.subtypeDNA() )
        #  rna:  hmodel[i].hasSubtype ( dtype_template.subtypeRNA() )

        external_restraint_files = []
        if hasattr(self.input_data.data,"hmodel"):
           homolog_protein_fpaths = []
           homolog_dnarna_fpaths = []
           use_protein = False
           use_dnarna = False
           for i in range(len(hmodel)):
              if hmodel[i].hasSubtype ( dtype_template.subtypeProtein() ):
                 use_protein = True
                 homolog_protein_fpaths.append ( hmodel[i].getXYZFilePath(self.inputDir()) )
              if hmodel[i].hasSubtype ( dtype_template.subtypeDNA() ) or hmodel[i].hasSubtype ( dtype_template.subtypeRNA() ):
                 use_dnarna = True
                 homolog_dnarna_fpaths.append ( hmodel[i].getXYZFilePath(self.inputDir()) )

           if use_protein:
              prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_protein", "-p1", istruct.getXYZFilePath(self.inputDir()), "-p2" ] + homolog_protein_fpaths
              self.putMessage('Running ProSMART to generate external restraints for protein macromolecules')
              self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
              external_restraint_files.append(os.path.join('ProSMART_Output_protein',os.path.splitext(istruct.getXYZFileName())[0]+'.txt'))

           if use_dnarna:
              prosmart_cmd = [ "-quick", "-dna_rna", "-o", "ProSMART_Output_dnarna", "-p1" ,istruct.getXYZFilePath(self.inputDir()), "-p2" ] + homolog_dnarna_fpaths
              self.putMessage('Running ProSMART to generate external restraints for nucleic acid macromolecules')
              self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
              external_restraint_files.append(os.path.join('ProSMART_Output_dnarna',os.path.splitext(istruct.getXYZFileName())[0]+'.txt'))

        if str(self.task.parameters.sec3.contains.HBOND_RESTR.value) == 'yes':
           prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_hbond", "-p1", istruct.getXYZFilePath(self.inputDir())]
           self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
           external_restraint_files.append(os.path.join('ProSMART_Output_hbond',os.path.splitext(istruct.getXYZFileName())[0]+'.txt'))


        with open(self.file_stdin_path(),'w') as scr_file:

            # Input

            """
            use_anom = False
            if str(hkl.useHKLSet) == 'Fpm':
               hkl_labels = ( hkl.dataset.Fpm.plus.value, hkl.dataset.Fpm.plus.sigma,
                              hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma )
               hkl_labin  =  "LABIN F+=" + hkl_labels[0] + " SIGF+=" + hkl_labels[1] +\
                                  " F-=" + hkl_labels[2] + " SIGF-=" + hkl_labels[3]
               use_anom = True
            elif str(hkl.useHKLSet) == 'I':
               if str(self.task.parameters.sec1.contains.TWIN.value) == 'no':
                  self.fail('Error - intensities can only be used for twin refinement (at present)<ol><li>If data are twinned, select for twin refinement to be performed.<li>If data are not twinned, provide structure factor amplitudes instead of intensities.</ol>','')
                  raise
               hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
               hkl_labin  =  "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]
            elif str(hkl.useHKLSet) == 'F':
               hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
               hkl_labin  =  "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
            else: #  automatic choice
               try:
                  if str(self.task.parameters.sec1.contains.TWIN.value) == 'no':
                     # Do not throw error message, as intensities have not been specifically selected.
                     raise
                  hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
                  hkl_labin  =  "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]
               except:
                  try:
                     hkl_labels = ( hkl.dataset.Fpm.plus.value, hkl.dataset.Fpm.plus.sigma,
                                    hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma )
                     hkl_labin  =  "LABIN F+=" + hkl_labels[0] + " SIGF+=" + hkl_labels[1] +\
                                        " F-=" + hkl_labels[2] + " SIGF-=" + hkl_labels[3]
                     use_anom = True
                  except:
                     hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
                     hkl_labin  =  "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
            """

            if (str(hkl.useHKLSet) == 'F') or (str(hkl.useHKLSet) == 'TF'):
                hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
                hkl_labin  =  "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
            elif str(hkl.useHKLSet) == 'Fpm':
                hkl_labels = ( hkl.dataset.Fpm.plus.value, hkl.dataset.Fpm.plus.sigma,
                               hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma )
                hkl_labin  =  "LABIN F+=" + hkl_labels[0] + " SIGF+=" + hkl_labels[1] +\
                              " F-=" + hkl_labels[2] + " SIGF-=" + hkl_labels[3]
            else: # if str(hkl.useHKLSet) == 'TI':
               hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
               hkl_labin  =  "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]


            #self.putTitle('html')
            #self.putMessage('html')
            #self.fail('','')

            print >>scr_file, hkl_labin + " FREE=" + hkl.dataset.FREE
            if str(hkl.useHKLSet) == 'Fpm':
               print >>scr_file, 'ANOM MAPONLY'

            # Basic options
            print >>scr_file, 'NCYC', str(self.task.parameters.sec1.contains.NCYC.value)

            if str(self.task.parameters.sec1.contains.WAUTO_YES.value) == 'yes':
               if str(self.task.parameters.sec1.contains.WAUTO_VAL_AUTO.value) == '':
                  print >>scr_file, 'WEIGHT AUTO'
               else:
                  print >>scr_file, 'WEIGHT AUTO', str(self.task.parameters.sec1.contains.WAUTO_VAL_AUTO.value)
            else:
               print >>scr_file, 'WEIGHT MATRIX', self.task.parameters.sec1.contains.WAUTO_VAL.value

            print >>scr_file, 'MAKE HYDR', str(self.task.parameters.sec1.contains.MKHYDR.value)

            #if str(self.task.parameters.sec1.contains.TWIN.value) == 'yes':
            #   print >>scr_file, 'TWIN'

            if (str(hkl.useHKLSet) == 'TI') or (str(hkl.useHKLSet) == 'TF'):
                print >>scr_file, 'TWIN'

            # Parameters
            print >>scr_file, 'REFI BREF', str(self.task.parameters.sec2.contains.BFAC.value)

            if str(self.task.parameters.sec2.contains.TLS.value) != 'none':
                print >>scr_file, 'REFI TLSC', str(self.task.parameters.sec2.contains.TLS_CYCLES.value)
                if str(self.task.parameters.sec2.contains.RESET_B.value) == 'yes':
                   print >>scr_file, 'BFAC SET', str(self.task.parameters.sec2.contains.RESET_B_VAL.value)
                if str(self.task.parameters.sec2.contains.TLSOUT_ADDU.value) == 'yes':
                   print >>scr_file, 'TLSOUT ADDU'

            print >>scr_file, 'SCALE TYPE', str(self.task.parameters.sec2.contains.SCALING.value)
            if str(self.task.parameters.sec2.contains.SCALING.value) == 'no':
               print >>scr_file, 'SOLVENT NO'
            else:
               print >>scr_file, 'SOLVENT YES'
               if str(self.task.parameters.sec2.contains.SOLVENT_CUSTOM.value) == 'yes':
                  print >>scr_file, 'SOLVENT VDWProb', str(self.task.parameters.sec2.contains.SOLVENT_CUSTOM_VDW.value)
                  print >>scr_file, 'SOLVENT IONProb', str(self.task.parameters.sec2.contains.SOLVENT_CUSTOM_ION.value)
                  print >>scr_file, 'SOLVENT RSHRink', str(self.task.parameters.sec2.contains.SOLVENT_CUSTOM_SHRINK.value)

            # Restraints
            #ncsrv = str(self.task.parameters.sec3.contains.NCSR.value)
            #if ncsrv in ('local', 'global'):
            #print >>scr_file, 'ncsr', ncsrv
            if str(self.task.parameters.sec3.contains.NCSR.value) == 'yes':
               print >>scr_file, 'NCSR', str(self.task.parameters.sec3.contains.NCSR_TYPE.value)

            if str(self.task.parameters.sec3.contains.JELLY.value) == 'yes':
               print >>scr_file, 'RIDG DIST SIGM', self.task.parameters.sec3.contains.JELLY_SIGMA.value
               print >>scr_file, 'RIDG DIST DMAX', self.task.parameters.sec3.contains.JELLY_DMAX.value


            if len(external_restraint_files) > 0:
               print >>scr_file, 'EXTE WEIGHT SCALE', str(self.task.parameters.sec3.contains.EXTE_WEIGHT.value)
               print >>scr_file, 'EXTE WEIGHT GMWT', str(self.task.parameters.sec3.contains.EXTE_GMWT.value)
               print >>scr_file, 'EXTE DMAX', str(self.task.parameters.sec3.contains.EXTE_MAXD.value)
               for i in range(len(external_restraint_files)):
                  print >>scr_file, '@'+external_restraint_files[i]

            # Output
            if str(self.task.parameters.sec4.contains.RIDING_HYDROGENS.value) != 'DEFAULT':
               print >>scr_file, 'MAKE HOUT', str(self.task.parameters.sec4.contains.RIDING_HYDROGENS.value)

            if str(self.task.parameters.sec4.contains.MAP_SHARPEN.value) == 'yes':
               if str(self.task.parameters.sec4.contains.MAP_SHARPEN_B.value) == 'default':
                  print >>scr_file, 'MAPC SHAR'
               else:
                  print >>scr_file, 'MAPC SHAR', self.task.parameters.sec4.contains.MAP_SHARPEN_B.value

            # Advanced
            if str(self.task.parameters.sec5.contains.EXPERIMENT.value) == 'electron':
               if str(self.task.parameters.sec5.contains.FORM_FACTOR.value) == 'mb':
                  print >>scr_file, 'SOURCE ELECTRON MB'
               else:
                  print >>scr_file, 'SOURCE ELECTRON'

            """
            if str(self.task.parameters.sec5.contains.RES_LIMIT_MIN.value) == 'custom':
               if str(self.task.parameters.sec5.contains.RES_LIMIT_MAX.value) == 'custom':
                  print >>scr_file, 'REFI RESO', self.task.parameters.sec5.contains.RES_LIMIT_MIN.value, self.task.parameters.sec5.contains.RES_LIMIT_MAX.value
               else:
                  print >>scr_file, 'REFI RESO 0', self.task.parameters.sec5.contains.RES_LIMIT_MIN.value
            else:
               if str(self.task.parameters.sec5.contains.RES_LIMIT_MAX.value) == 'custom':
                  print >>scr_file, 'REFI RESO', self.task.parameters.sec5.contains.RES_LIMIT_MAX.value, '999'
            """
            print >>scr_file, 'REFI RESO', hkl.res_low, hkl.res_high

            # Other keywords
            print >>scr_file, 'MAKE NEWLIGAND EXIT'
            if str(self.task.parameters.sec5.contains.KEYWORDS.value) != '':
               print >>scr_file, self.task.parameters.sec5.contains.KEYWORDS.value

            print >>scr_file, 'END'

        #self.file_stdout.write ( "keywords=" + self.task.parameters.sec1.contains.KEYWORDS.value )

        self.file_stdin = 1 # a trick necessary because of using 'print' above

        # make command-line parameters for bare morda run on a SHELL-type node
        xyzin  = istruct.getXYZFilePath ( self.inputDir() )
        xyzout = self.getXYZOFName()
        cmd = [ "hklin" ,hkl.getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
                "xyzin" ,xyzin,
                "hklout",self.getMTZOFName(),
                "xyzout",xyzout,
                "scrref",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["libin",libin]

        if str(self.task.parameters.sec5.contains.EXPERIMENT.value) == 'electron':
           if str(self.task.parameters.sec5.contains.FORM_FACTOR.value) == 'gaussian':
              cmd += ["libin",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_electron.lib')]
        elif str(self.task.parameters.sec5.contains.EXPERIMENT.value) == 'neutron':
           cmd += ["libin",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_neutron.lib')]

        # Prepare report parser
        self.setGenericLogParser ( self.refmac_report(),False )

        # Start refmac
        self.runApp ( "refmac5",cmd,logType="Main" )
        self.unsetLogParser()

        #if not xyzin.lower().endswith(".pdb"):
        #    xyzout1 = xyzout
        #    xyzout  = os.path.splitext(xyzout1)[0] + ".cif"
        #    shutil.copy2 ( xyzout1,xyzout )

        # check solution and register data
        have_results = False
        if os.path.isfile(xyzout):

            self.putTitle ( "Output Structure" +\
                    self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( xyzout,None,
                                                 self.getMTZOFName(),
                                                 None,None,libin,
                                                 #fnames[0],fnames[1],libin,  -- not needed for new UglyMol
                                                 leadKey=1,map_labels="FWT,PHWT,DELFWT,PHDELWT" )
            if structure:

                mmcifout = self.getMMCIFOFName()
                if os.path.isfile(mmcifout):
                    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )

                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision )
                except:
                    self.stderr ( " *** molprobity failure" )
                    self.rvrow = rvrow0

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Refmac ( "",os.path.basename(__file__) )
    drv.start()
