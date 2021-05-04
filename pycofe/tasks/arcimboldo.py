#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    03.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ARCIMBOLDO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python arcimboldo.py jobManager jobDir jobId [queueName [nSubJobs]]
#
#  where:
#    jobManager    is either SHELL or SGE
#    jobDir     is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    jobId      is job id assigned by jsCoFE (normally an integer but should
#               be treated as a string with no assumptions)
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os
#import sys
import shutil
#import json
import xml.etree.ElementTree as ET

#  ccp4-python imports
#import pyrvapi

#  application imports
from . import basic
#from   pycofe.proc  import xyzmeta


# ============================================================================
# Make Arcimboldo driver

class Arcimboldo(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def arcimboldoDir(self):  return "arcimboldo"
    def input_hkl    (self):  return "_input.hkl"

    # ------------------------------------------------------------------------

    def prepare_setup ( self ):

        self.mtzinpath = self.hkl.getHKLFilePath ( self.inputDir() )

        labels = self.hkl.getMeanF()
        self.f_label    = labels[0] #selected reflections, use the variable accordingly.
        self.sigf_label = labels[1] #selected reflections, use the variable accordingly.
        #i_label = #selected reflections, use the variable accordingly.
        #sigi_label = #selected reflections, use the variable accordingly.

        self.mtz2hkl ( self.mtzinpath,
                       [self.f_label,self.sigf_label,self.hkl.getFreeRColumn()],
                       self.input_hkl() )

        self.distribute_computing = "multiprocessing" #select between three options:
        #multiprocessing
        #local_grid
        #remote_grid

        if self.distribute_computing != "multiprocessing":
            self.setup_bor_path = "setup.bor"   # auxiliar .bor file with the grid information.

        self.number_of_cpus = 3

        self.number_of_component = 1      # integer
        self.molecular_weight    = float(self.revision.ASU.molWeight) # float

        self.ccp4_home = os.environ.get ( "CCP4", "not_set" )

        return


    def make_setup_lite ( self ):

        self.prepare_setup()

        # mtzinpath  = self.hkl.getHKLFilePath ( self.inputDir() )
        # hklinpath  = "_input.hkl"
        #
        # labels     = self.hkl.getMeanF()
        # f_label    = labels[0] #selected reflections, use the variable accordingly.
        # sigf_label = labels[1] #selected reflections, use the variable accordingly.
        # #i_label = #selected reflections, use the variable accordingly.
        # #sigi_label = #selected reflections, use the variable accordingly.
        #
        # self.mtz2hkl ( mtzinpath,
        #                [f_label,sigf_label,self.hkl.getFreeRColumn()],
        #                hklinpath )
        #
        # working_directory = self.arcimboldoDir()
        #
        # distribute_computing = "multiprocessing" #select between three options:
        # #multiprocessing
        # #local_grid
        # #remote_grid
        #
        # if distribute_computing != "multiprocessing":
        #     setup_bor_path = "setup.bor"   # auxiliar .bor file with the grid information.
        #
        # name_job       = self.arcimboldoDir() # string             #Should be the same as the
        # number_of_cpus = 3

        coiled_coil    = (self.getParameter(self.sec1.COIL_COILED_CBX)=="True")
        rmsd           = float(self.getParameter(self.sec1.RMSD))

        # number_of_component = 1      # integer
        # molecular_weight    = float(self.revision.ASU.molWeight) # float

        search_model = "HELIX" #select between four options:
        # one or more copies of a helix (HELIX)
        # one or more copies of a custom model (CUSTOM)
        # several different helices (HELICES)
        # several different custom models (CUSTOMS)

        nHelices = 0
        if len(self.xyz)==1:
            search_model = "CUSTOM"
        elif len(self.xyz)>1:
            search_model = "CUSTOMS"
        else:
            nHelices = int(self.getParameter(self.sec1.HELICES_SEL))
            if nHelices>1:
                search_model = "HELICES"

        if search_model == "HELIX":
            fragment_to_search = int(self.getParameter(self.sec1.HCOPIES1)) #integer
            helix_length = int(self.getParameter(self.sec1.HLEN1)) #integer

        elif search_model == "CUSTOM":
            fragment_to_search = int(self.getParameter(self.sec1.SCOPIES1)) #integer
            model_file = self.xyz[0].getXYZFilePath ( self.inputDir() )#Absolute path to a .pdb

        elif search_model == "HELICES":
            list_helices = [] #List of integers list_helices
            for i in range(nHelices):
                list_helices.append(self.getParameter(getattr(self.sec1,"HLEN_"+str(i+1),"*")))

        elif search_model == "CUSTOMS":
            list_customs = [] #List of paths to a .pdb list_customs
            for i in range(len(self.xyz)):
                list_customs.append ( self.xyz[i].getXYZFilePath(self.inputDir()) )

        #pdbout_path = "./best.pdb"
        #logfile     = "./arcimboldo_out.log"

        f_bor = open(os.path.join(self.arcimboldoDir(),'setup.bor'),'w')
        f_bor.write('[CONNECTION]\n')
        f_bor.write('distribute_computing = %s\n' % (self.distribute_computing) )
        if self.distribute_computing != "multiprocessing":
            f_bor.write('setup_bor_path = %s\n' % (self.setup_bor_path) )

        f_bor.write('[GENERAL]\n')
        f_bor.write('working_directory = %s\n' % (self.arcimboldoDir()) )
        f_bor.write('mtz_path = %s\n' % (self.mtzinpath) )
        f_bor.write('hkl_path = %s\n' % (self.input_hkl()) )

        f_bor.write('[ARCIMBOLDO]\n')
        f_bor.write('name_job = %s\n' % (self.arcimboldoDir()) )
        f_bor.write('force_core = %d\n' % (self.number_of_cpus) )
        f_bor.write('f_label = %s\n' % (self.f_label))
        f_bor.write('sigf_label = %s\n' % (self.sigf_label))
        #f_bor.write('i_label = %s\n' % (i_label))
        #f_bor.write('sigi_label = %s\n' % (sigi_label))

        f_bor.write('coiled_coil = %s\n' % (coiled_coil) )
        f_bor.write('rmsd = %6.2f\n' % (rmsd) )
        f_bor.write('molecular_weight = %10.2f\n' % (self.molecular_weight) )
        f_bor.write('number_of_component = %d\n' % (self.number_of_component) )

        if search_model == "HELIX":
            f_bor.write('fragment_to_search = %d\n' % (fragment_to_search) )
            f_bor.write('helix_length = %d\n' % (helix_length) )

        elif search_model == "CUSTOM":
            f_bor.write('fragment_to_search = %d\n' % (fragment_to_search) )
            f_bor.write('model_file = %s\n' % (model_file) )

        elif search_model == "HELICES":
            frag_count = 0
            i = 0
            f_bor.write('fragment_to_search = %d\n' % (len(list_helices)))
            while i < len(list_helices):
                f_bor.write('helix_length_%d = %s\n' % (i+1,list_helices[i]))
                i += 1

        elif search_model == "CUSTOMS":
            frag_count = 0
            i = 0
            f_bor.write('fragment_to_search = %d\n' % (len(list_customs)) )
            while i < len(list_customs):
                f_bor.write('model_file_%d = %s\n' % (i+1,list_customs[i]))
                i += 1

        f_bor.write('[LOCAL]\n')
        f_bor.write('path_local_phaser = %s/bin/phaser\n' % (self.ccp4_home))
        f_bor.write('path_local_shelxe = %s/bin/shelxe\n' % (self.ccp4_home))

        return


    def make_setup_borges ( self ):

        self.prepare_setup()

        custom_library = ""
        borges_library = self.getParameter ( self.sec1.LIBRARY_SEL )
        									#HELI_lib_uu: helices uu
        									#HELI_lib_ud: helices ud
        									#BETA_lib_udu: strands udu
        									#BETA_lib_uud: strands uud
        									#BETA_lib_uuu: strands uuu
        									#BETA_lib_uuuu: strands uuuu
        									#BETA_lib_udud: strands udud

        # if borges_library == "CUSTOM":
        # 	custom_library = "/path/to/folder"	#user selected folder


rotation_model_refinement = "On"	#Empty, On or Off #Switch Phaser GYRE option
gimble = "On"						#Empty, On or Off #Switch Phaser GIMBLE option
									# I think, the best way to implement this is with a checkbox that enables the
									# variable, then, the user can select On or Off (True or False)

        #pdbout_path = "./best.pdb"
        #logfile     = "./arcimboldo_out.log"

        f_bor = open(os.path.join(self.arcimboldoDir(),'setup.bor'),'w')
        f_bor.write('[CONNECTION]\n')
        f_bor.write('distribute_computing = %s\n' % (self.distribute_computing) )
        if self.distribute_computing != "multiprocessing":
            f_bor.write('setup_bor_path = %s\n' % (self.setup_bor_path) )

        f_bor.write('[GENERAL]\n')
        f_bor.write('working_directory = %s\n' % (self.arcimboldoDir()) )
        f_bor.write('mtz_path = %s\n' % (self.mtzinpath) )
        f_bor.write('hkl_path = %s\n' % (self.input_hkl()) )

        f_bor.write('molecular_weight = %10.2f\n' % (self.molecular_weight) )
        f_bor.write('number_of_component = %d\n' % (self.number_of_component) )

        f_bor.write('[ARCIMBOLDO]\n')
        f_bor.write('name_job = %s\n' % (self.arcimboldoDir()) )
        f_bor.write('force_core = %d\n' % (self.number_of_cpus) )
        f_bor.write('f_label = %s\n' % (self.f_label))
        f_bor.write('sigf_label = %s\n' % (self.sigf_label))
        #f_bor.write('i_label = %s\n' % (i_label))
        #f_bor.write('sigi_label = %s\n' % (sigi_label))


        if borges_library ==  'CUSTOM':
        	f_bor.write('library_path = %s\n' % (custom_library))
        else:
        	ccp4_master_home = os.environ.get ( 'CCP4_MASTER', 'not_set' )
        	lib_path = os.path.join(ccp4_master_home,'BORGES_LIBS',borges_library.__str__())
        	f_bor.write('library_path = %s\n' % (lib_path))

if rotation_model_refinement != "":
	f_bor.write('rotation_model_refinement = %s\n' % ("both" if rotation_model_refinement == "On" else "no_gyre"))

if gimble != "":
	f_bor.write('gimble = %s\n' % ("True" if gimble == "On" else "False"))


        f_bor.write('[LOCAL]\n')
        f_bor.write('path_local_phaser = %s/bin/phaser\n' % (self.ccp4_home))
        f_bor.write('path_local_shelxe = %s/bin/shelxe\n' % (self.ccp4_home))

        return


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare arcimboldo job

        #if "ROSETTA_DIR" not in os.environ:
        #    pyrvapi.rvapi_set_text (
        #        "<b>Error: " + self.appName() + " is not configured to work " +\
        #        "with ARCIMBOLDO.</b><p>Please look for support.",
        #        self.report_page_id(),self.rvrow,0,1,1 )
        #
        #    self.fail ( "<p>&nbsp; *** Error: " + self.appName() + " is not " +\
        #                "configured to work with ARCIMBOLDO.\n" + \
        #                "     Please look for support\n",
        #                "ARCIMBOLDO is not configured" )

        # fetch input data
        self.revision = self.makeClass ( self.input_data.data.revision[0] )
        self.hkl      = self.makeClass ( self.input_data.data.hkl[0] )

        self.xyz = []
        if hasattr(self.input_data.data,"xyz"):
            for i in range(len(self.input_data.data.xyz)):
                if self.input_data.data.xyz[i]:
                    self.xyz.append ( self.makeClass(self.input_data.data.xyz[i]) )

        self.sec1 = self.task.parameters.sec1.contains

        self.putMessage (
            "<h3>The job is likely to take very long time</h3>" +\
            "<i>You may close this window and check later. Logout and " +\
            "subsequent login will not affect the job running." )
        self.rvrow -= 1

        #shutil.copytree ( "/Users/eugene/Projects/jsCoFE/work/arcimboldo/arcimboldo",self.arcimboldoDir() )

        if not os.path.isdir(self.arcimboldoDir()):
            os.mkdir ( self.arcimboldoDir() )
        self.make_setup_lite()

        with open(os.path.join(self.arcimboldoDir(),"setup.bor"),"r") as f:
            self.stdoutln (
                "## ARCIMBOLDO SETUP FILE\n" +\
                "--------------------------------------------------------------------------------\n\n" +\
                f.read()
            )

        # seed Arcimboldo's html report
        with (open(os.path.join(self.arcimboldoDir(),"arcimboldo.html"),"w")) as f:
            f.write (
                "<html><head><title>Report is being generated</title>" +\
                "<meta http-equiv=\"refresh\" content=\"90\" /></head>" +\
                "<body class=\"main-page\">&nbsp;<p><h2><i>Report is being generated ....</i></h2>" +\
                "</body></html>"
            )
        self.insertTab   ( "arcimboldo_report","Arcimboldo Report",None,True )
        self.putMessage1 (
            "arcimboldo_report",
            "<iframe src=\"../" + self.arcimboldoDir() + "/arcimboldo.html\" " +\
            "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
            0 )
        self.flush()

        # run arcimboldo
        self.runApp ( "ARCIMBOLDO_LITE",
                      [os.path.join(self.arcimboldoDir(),"setup.bor")],
                      logType="Main" )

        self.addCitations ( ['phaser','shelxe'] )

        have_results = False

        phs_out      = os.path.join ( self.arcimboldoDir(),"best.phs" )
        pdb_out      = os.path.join ( self.arcimboldoDir(),"best.pdb" )
        #html_report  = os.path.join ( self.arcimboldoDir(),"arcimboldo.html" )

        """
        if os.path.isfile(html_report):
            # Add Arcimboldo's own html report
            os.rename ( html_report,"arcimboldo.html")
            self.insertTab   ( "arcimboldo_report","Arcimboldo Report",None,True )
            self.putMessage1 ( "arcimboldo_report","<iframe src=\"../arcimboldo.html\" " +\
                "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
                0 )
        """

        if os.path.isfile(phs_out) and os.path.isfile(pdb_out):

            # Convert output to mtz file
            self.open_stdin  ()
            self.write_stdin (
                "TITLE   shelxeOUT" +\
                "\ncell    "   + self.hkl.getCellParameters_str() +\
                "\nsymm    \"" + self.hkl.getSpaceGroup() + "\""  +\
                "\nlabout  H K L ShelxE.F ShelxE.FOM ShelxE.PHI ShelxE.SIGF" +\
                "\nCTYPOUT H H H F W P Q" +\
                "\npname   shelxeOUT" +\
                "\ndname   shelxeOUT" +\
                "\nEND\n"
            )
            self.close_stdin()

            tmp_mtz = "_tmp.mtz"
            cmd = [ "hklin" ,phs_out,
                    "hklout",tmp_mtz
                  ]
            self.runApp ( "f2mtz",cmd,logType="Service" )

            labels = self.hkl.getColumnNames(sep=",").split(",")
            llist  = ""
            n      = 1
            for l in labels:
                if l and "ShelxE" not in l:
                    llist += " E" + str(n) + "=" + l
                    n     += 1
            self.open_stdin  ()
            self.write_stdin ([
                "LABIN FILE 1 ALLIN",
                "LABIN FILE 2 " + llist,
                "END"
            ])
            self.close_stdin()
            tmp1_mtz = "_tmp1.mtz"
            cmd = [ "hklin1",tmp_mtz,
                    "hklin2",self.hkl.getHKLFilePath(self.inputDir()),
                    "hklout",tmp1_mtz
                  ]
            self.runApp ( "cad",cmd,logType="Service" )

            # Calculate map coefficients
            arcimboldo_mtz = self.getMTZOFName()
            self.open_stdin  ()
            self.write_stdin (
                "mode batch\n" +\
                #"read " + self.shelxe_wrk_mtz() + " mtz\n" +\
                "read " + tmp1_mtz + " mtz\n" +\
                "CALC F COL FWT  = COL ShelxE.F COL ShelxE.FOM *\n" +\
                "CALC P COL PHWT = COL ShelxE.PHI 0 +\n" +\
                "write " + arcimboldo_mtz + " mtz\n" +\
                "EXIT\n" +\
                "YES\n"
            )
            self.close_stdin()

            self.runApp ( "sftools",[],logType="Service" )

            arcimboldo_xyz = self.getXYZOFName()
            if arcimboldo_xyz!=pdb_out:
                shutil.copy2 ( pdb_out,arcimboldo_xyz )

            structure = self.registerStructure ( arcimboldo_xyz,None,arcimboldo_mtz,
                                                 None,None,None,leadKey=1,
                                                 map_labels="FWT,PHWT",
                                                 copy_files=True )
            if structure:
                structure.copyAssociations ( self.hkl )
                #structure.copyLabels       ( istruct )
                structure.setShelxELabels  ( None )
                structure.FreeR_flag = self.hkl.getFreeRColumn()
                structure.addPhasesSubtype()

                #structure.copySubtype      ( istruct )
                #structure.mergeSubtypes    ( istruct,exclude_types=[
                #  dtype_template.subtypeXYZ(),
                #  dtype_template.subtypeSubstructure(),
                #  dtype_template.subtypeAnomSubstr()
                #])
                self.putStructureWidget   ( "structure_btn",
                                            "Structure and electron density",
                                            structure )

                # update structure revision
                self.revision.setStructureData ( structure )
                self.registerRevision     ( self.revision  )
                have_results = True

                tree = ET.parse ( os.path.join(self.arcimboldoDir(),"arcimboldo.xml") )
                root = tree.getroot()
                if root.find("backtracing/finalcc") is not None:
                    # this will go in the project tree job's line
                    self.generic_parser_summary["arcimboldo"] = {
                        "summary_line" : "CC=" + root.find("backtracing/finalcc").text
                    }

        else:
            self.putTitle ( "No Solution Found" )

        # unless cleaned up, symbolic links inside this directory will not let
        # it to be sent back to FE.
        dlist = os.listdir ( self.arcimboldoDir() )
        for dname in dlist:
            fpath = os.path.join ( self.arcimboldoDir(),dname )
            if os.path.isdir(fpath):
                shutil.rmtree ( fpath )

        #shutil.rmtree ( self.arcimboldoDir() )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Arcimboldo ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                })

    drv.start()
