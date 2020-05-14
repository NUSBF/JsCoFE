##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    14.05.20   <--  Date of Last Modification.
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
from . import basic
from   pycofe.dtypes    import dtype_template
from   pycofe.proc      import qualrep, verdict
from   pycofe.verdicts  import verdict_refmac

# ============================================================================
# Make Refmac driver

class Refmac(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "refmac.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When refmac
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName() ):
            os.remove(self.getXYZOFName() )

        # Prepare refmac input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        hmodel  = None;
        if hasattr(self.input_data.data,"hmodel"):
            hmodel  = self.input_data.data.hmodel
            for i in range(len(hmodel) ):
                hmodel[i] = self.makeClass ( hmodel[i] )

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains
        sec3 = self.task.parameters.sec3.contains
        sec4 = self.task.parameters.sec4.contains
        sec5 = self.task.parameters.sec5.contains

        #  protein:  hmodel[i].hasSubtype ( dtype_template.subtypeProtein() )
        #  dna:  hmodel[i].hasSubtype ( dtype_template.subtypeDNA() )
        #  rna:  hmodel[i].hasSubtype ( dtype_template.subtypeRNA() )

        external_restraint_files = []
        if hasattr(self.input_data.data,"hmodel"):
           homolog_protein_fpaths = []
           homolog_dnarna_fpaths = []
           use_protein = False
           use_dnarna = False
           for i in range(len(hmodel) ):
              if hmodel[i].hasSubtype ( dtype_template.subtypeProtein() ):
                 use_protein = True
                 homolog_protein_fpaths.append ( hmodel[i].getXYZFilePath(self.inputDir() ) )
              if hmodel[i].hasSubtype ( dtype_template.subtypeDNA() ) or hmodel[i].hasSubtype ( dtype_template.subtypeRNA() ):
                 use_dnarna = True
                 homolog_dnarna_fpaths.append ( hmodel[i].getXYZFilePath(self.inputDir() ) )

           if use_protein:
              prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_protein", "-p1", istruct.getXYZFilePath(self.inputDir() ), "-p2" ] + homolog_protein_fpaths
              self.putMessage('Running ProSMART to generate external restraints for protein macromolecules')
              self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
              external_restraint_files.append(os.path.join('ProSMART_Output_protein',os.path.splitext(istruct.getXYZFileName() )[0]+'.txt') )

           if use_dnarna:
              prosmart_cmd = [ "-quick", "-dna_rna", "-o", "ProSMART_Output_dnarna", "-p1" ,istruct.getXYZFilePath(self.inputDir() ), "-p2" ] + homolog_dnarna_fpaths
              self.putMessage('Running ProSMART to generate external restraints for nucleic acid macromolecules')
              self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
              external_restraint_files.append(os.path.join('ProSMART_Output_dnarna',os.path.splitext(istruct.getXYZFileName() )[0]+'.txt') )

        if str(sec3.HBOND_RESTR.value) == 'yes':
           prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_hbond", "-p1", istruct.getXYZFilePath(self.inputDir() )]
           self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
           external_restraint_files.append(os.path.join('ProSMART_Output_hbond',os.path.splitext(istruct.getXYZFileName() )[0]+'.txt') )


        # Input

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

        stdin = [ hkl_labin + " FREE=" + hkl.dataset.FREE ]
        if str(hkl.useHKLSet) == 'Fpm':
            stdin.append ( 'ANOM MAPONLY' )

        # Basic options

        stdin.append ( 'NCYC ' + str(sec1.NCYC.value) )

        if str(sec1.WAUTO_YES.value) == 'yes':
            if str(sec1.WAUTO_VAL_AUTO.value) == '':
               stdin.append ( 'WEIGHT AUTO' )
            else:
               stdin.append ( 'WEIGHT AUTO ' + str(sec1.WAUTO_VAL_AUTO.value) )
        else:
            stdin.append ( 'WEIGHT MATRIX ' + str(sec1.WAUTO_VAL.value) )

        stdin.append ( 'MAKE HYDR ' + str(sec1.MKHYDR.value) )

        isTwinning = False
        if (str(hkl.useHKLSet) == 'TI') or (str(hkl.useHKLSet) == 'TF'):
            isTwinning = True
            stdin.append ( 'TWIN' )

        # Parameters
        stdin.append ( 'REFI BREF ' + str(sec2.BFAC.value) )

        if str(sec2.TLS.value) != 'none':
            stdin.append ( 'REFI TLSC ' + str(sec2.TLS_CYCLES.value) )
            if str(sec2.RESET_B.value) == 'yes':
                stdin.append ( 'BFAC SET' + str(sec2.RESET_B_VAL.value) )
            if str(sec2.TLSOUT_ADDU.value) == 'yes':
               stdin.append ( 'TLSOUT ADDU' )

        stdin.append ('SCALE TYPE ' + str(sec2.SCALING.value) )
        if str(sec2.SCALING.value) == 'no':
            stdin.append ( 'SOLVENT NO' )
        else:
            stdin.append ( 'SOLVENT YES' )
            if str(sec2.SOLVENT_CUSTOM.value) == 'yes':
                stdin += [
                    'SOLVENT VDWProb ' + str(sec2.SOLVENT_CUSTOM_VDW.value),
                    'SOLVENT IONProb ' + str(sec2.SOLVENT_CUSTOM_ION.value),
                    'SOLVENT RSHRink ' + str(sec2.SOLVENT_CUSTOM_SHRINK.value)
                ]

        # Restraints

        if str(sec3.NCSR.value) == 'yes':
            stdin.append ('NCSR ' + str(sec3.NCSR_TYPE.value) )

        if str(sec3.JELLY.value) == 'yes':
            stdin += [ 'RIDG DIST SIGM ' + str(sec3.JELLY_SIGMA.value),
                       'RIDG DIST DMAX ' + str(sec3.JELLY_DMAX.value) ]

        if len(external_restraint_files) > 0:
            stdin += [
                'EXTE WEIGHT SCALE ' + str(sec3.EXTE_WEIGHT.value),
                'EXTE WEIGHT GMWT '  + str(sec3.EXTE_GMWT.value),
                'EXTE DMAX '         + str(sec3.EXTE_MAXD.value)
            ]
            for i in range(len(external_restraint_files) ):
                stdin.append ( '@' + external_restraint_files[i] )

        # Output
        if str(sec4.RIDING_HYDROGENS.value) != 'DEFAULT':
           stdin.append ( 'MAKE HOUT ' + str(sec4.RIDING_HYDROGENS.value) )

        if str(sec4.MAP_SHARPEN.value) == 'yes':
           if str(sec4.MAP_SHARPEN_B.value) == 'default':
              stdin.append ( 'MAPC SHAR' )
           else:
              stdin.append ( 'MAPC SHAR ' + str(sec4.MAP_SHARPEN_B.value) )

        # Advanced
        if str(sec5.EXPERIMENT.value) == 'electron':
           if str(sec5.FORM_FACTOR.value) == 'mb':
              stdin.append ( 'SOURCE ELECTRON MB' )
           else:
              stdin.append ( 'SOURCE ELECTRON' )

        stdin.append ( 'REFI RESO ' + str(hkl.res_low) + ' ' + str(hkl.res_high) )

        # Other keywords
        stdin.append ( 'MAKE NEWLIGAND EXIT' )
        if str(sec5.KEYWORDS.value) != '':
           stdin.append ( str(sec5.KEYWORDS.value) )

        stdin.append ( 'END' )

        #self.file_stdout.write ( "keywords=" + self.task.parameters.sec1.contains.KEYWORDS.value )

        self.open_stdin  ()
        self.write_stdin ( stdin )
        self.close_stdin ()

        #self.file_stdin = 1 # a trick necessary because of using 'print' above

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

        if str(sec5.EXPERIMENT.value) == 'electron':
           if str(sec5.FORM_FACTOR.value) == 'gaussian':
              cmd += ["libin",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_electron.lib')]
        elif str(sec5.EXPERIMENT.value) == 'neutron':
           cmd += ["libin",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_neutron.lib')]

        # Prepare report parser
        self.setGenericLogParser ( self.refmac_report(),False )

        # Start refmac
        self.runApp ( "refmac5",cmd,logType="Main" )
        self.unsetLogParser()

        # check solution and register data
        have_results = False
        if os.path.isfile(xyzout):

            verdict_meta = {
                "data" : { "resolution" : hkl.getHighResolution(raw=True) },
                "params" : {
                    "refmac" : {
                        "ncycles"    : sec1.NCYC.value,
                        "twinning"   : isTwinning,
                        "jellyBody"  : str(sec3.JELLY.value) == 'yes',
                        "ncsRestr"   : str(sec3.NCSR.value) == 'yes',
                        "tls"        : str(sec2.TLS.value) != 'none',
                        "anisoBfact" : str(sec2.BFAC.value) == "ANIS",
                        "hydrogens"  : str(sec1.MKHYDR.value) == "YES"
                    }
                }
            }

            self.flush()
            self.file_stdout.close()
            verdict_meta["refmac"] = verdict_refmac.parseRefmacLog ( self.file_stdout_path() )
            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path(),"a" )

            verdict_row = self.rvrow
            self.rvrow += 4

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
                    meta = qualrep.quality_report ( self,revision )
                    if meta:
                        verdict_meta["molprobity"] = meta
                        verdict_score, verdict_message, bottomline =\
                                            verdict_refmac.calculate ( verdict_meta )
                        self.putMessage1 ( self.report_page_id(),"&nbsp;",verdict_row )
                        verdict.makeVerdictSection ( self,{
                            "title": "Phasing summary",
                            "state": 0, "class": "table-blue", "css": "text-align:right;",
                            "rows" : [
                                { "header": { "label"  : "R-factor",
                                              "tooltip": "R-factor for working set"},
                                  "data"   : [ str(verdict_meta["refmac"]["rfactor"][1]) ]
                                },
                                { "header": { "label"  : "R<sub>free</sub>",
                                              "tooltip": "Free R-factor"},
                                  "data"  : [ str(verdict_meta["refmac"]["rfree"][1]) ]
                                },
                                { "header": { "label"  : "Bond length rms",
                                              "tooltip": "Bond length r.m.s.d."},
                                  "data"  : [ str(verdict_meta["refmac"]["bond_length"][1]) ]
                                },
                                { "header": { "label"  : "Clash score",
                                              "tooltip": "Molprobity clash score" },
                                  "data"  : [ str(verdict_meta["molprobity"]["clashscore"]) ]
                                }
                            ]
                        },verdict_score,verdict_message,bottomline,row=verdict_row+1 )
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
