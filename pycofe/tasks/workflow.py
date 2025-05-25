##!/usr/bin/python

#
# ============================================================================
#
#    25.05.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CUSTOM WORKFLOW EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.workflow jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2023-2025
#
# ============================================================================
#

#  python native imports
import os
# import shutil
import json

#  application imports
from   pycofe.tasks   import import_task
from   pycofe.auto    import auto_workflow

# ============================================================================
# Make CCP4go driver

# simulates ligand data structure that is normally coming from JS part

# class ligandCarrier():
#     def __init__(self, source, smiles, code):
#         self.source = source
#         self.smiles = smiles
#         self.code = code

class Workflow(import_task.Import):

    import_dir = "uploads"
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def importData(self):
        #  works with uploaded data from the top of the project

        library_files = []
        for i in range(len(self.task.file_select)):
            if self.task.file_select[i].inputId=="flibrary":
                # this gives only file name but not the full path on client
                if self.task.file_select[i].path:
                    library_files = self.task.file_select[i].path

        super ( Workflow,self ).import_all(ligand_libraries=library_files)

        # -------------------------------------------------------------------
        # fetch data for Custom Workflow pipeline

        if "DataUnmerged" in self.outputDataBox.data:
            self.unm = self.outputDataBox.data["DataUnmerged"]

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]
            # maxres = 10000.0
            # for i in range(len(self.outputDataBox.data["DataHKL"])):
            #     res = self.outputDataBox.data["DataHKL"][i].getHighResolution(True)
            #     if res<maxres:
            #         maxres   = res
            #         self.hkl = self.outputDataBox.data["DataHKL"][i]

        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"]

        if "DataLibrary" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLibrary"]

        if "DataLigand" in self.outputDataBox.data:
            self.lig = self.outputDataBox.data["DataLigand"]
            # """
            # if not self.lib or len(self.lib)<=0:
            #     # check whether this is actually upload for library rather than ligand
            #     lig1     = self.lig
            #     self.lib = []
            #     self.lig = []
            #     for i in range(len(lig1)):
            #         ligfname = lig1[i].lessDataId ( lig1[i].getLibFileName() )
            #         for j in range(len(self.task.file_select)):
            #             if self.task.file_select[j].inputId=="flibrary" and \
            #                self.task.file_select[j].path==ligfname:
            #                 libfname = os.path.splitext(ligfname)[0] + ".lib"
            #                 shutil.copyfile ( lig1[i].getLibFilePath(self.outputDir()),
            #                                   libfname )
            #                 library = self.registerLibrary ( libfname,copy_files=False )
            #                 self.lib.append ( library )
            #                 ligfname = None
            #                 break
            #         if ligfname:
            #             # remove from ligand list as it is not supposed 
            #             # to be used for fitting        
            #             self.lig.append ( lig1[i] )
            #     # self.outputDataBox.data["DataLigand"]  = self.lig
            #     # self.outputDataBox.data["DataLibrary"] = self.lib
            # """

        self.ligdesc = []
        ldesc = getattr ( self.task,"input_ligands",[] )
        for i in range(len(ldesc)):
            if ldesc[i].source!='none':
                self.ligdesc.append ( ldesc[i] )

        # checking whether ligand codes were provided
        # for i in range(len(self.ligdesc)):
        #     code = self.ligdesc[i].code.strip().upper()
        #     if (not code) or (code in self.ligand_exclude_list):
        #         self.ligdesc[i].code = self.get_ligand_code([])

        return


    def prepareData(self):
        #  works with pre-imported data from the project

        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkldata = []
            for i in range(len( self.input_data.data.hkl)):
                hkldata.append ( self.makeClass ( self.input_data.data.hkl[i] ) )
            if self.input_data.data.hkl[0]._type=="DataUnmerged":
                self.unm = hkldata
            else:
                self.hkl = hkldata

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            self.seq = []
            for i in range(len(self.input_data.data.seq)):
                self.seq.append ( self.makeClass(self.input_data.data.seq[i]) )

        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            self.xyz = []
            for i in range(len(self.input_data.data.xyz)):
                self.xyz.append ( self.makeClass(self.input_data.data.xyz[i]) )

        if hasattr(self.input_data.data,"library"):  # optional data parameter
            self.lib = []
            for i in range(len(self.input_data.data.library)):
                self.lib.append ( self.makeClass(self.input_data.data.library[i]) )

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = []
            for i in range(len(self.input_data.data.ligand)):
                self.lig.append ( self.makeClass(self.input_data.data.ligand[i]) )

        if hasattr(self.input_data.data,"revision"):  # optional data parameter
            self.revision = []
            for i in range(len(self.input_data.data.revision)):
                self.revision.append ( self.makeClass(self.input_data.data.revision[i]) )

        return


    # ------------------------------------------------------------------------

    def run(self):

        self.unm      = []  # unmerged dataset
        self.hkl      = []  # selected merged dataset
        self.seq      = []  # list of sequence objects
        self.xyz      = []  # coordinates (model/apo)
        self.lig      = []  # not used in this function but must be initialised
        self.ligdesc  = []
        self.lib      = []
        self.revision = []

        summary_line  = ""
        ilist = []

        # ligand library CIF has been provided
        # if self.lib:
        #     ligand = self.makeClass(self.lib)
        #     self.lig.append(ligand)

        # fileDir = self.outputDir()
        if self.task.inputMode=="standard":
            # fileDir = self.inputDir()
            self.prepareData()  #  pre-imported data provided
            summary_line = "received "
        else:
            self.importData()   #  data was uploaded
            summary_line = "imported "
            self.putMessage ( "&nbsp;" )

        if len(self.unm)>0:
            ilist.append ( "Unmerged" )
        if len(self.hkl)>0:
            ilist.append ( "HKL (" + str(len(self.hkl)) + ")" )
        if len(self.seq)>0:
            ilist.append ( "Sequences (" + str(len(self.seq)) + ")" )
        if len(self.xyz)>0:
            ilist.append ( "XYZ (" + str(len(self.xyz)) + ")" )
        if len(self.lib)>0:
            ilist.append ( "Library (" + str(len(self.lib)) + ")" )
        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "
        if len(self.revision)>0:
            ilist.append ( "Revision (" + str(len(self.revision)) + ")" )

        have_results = (len(ilist)>0)

        variables = {
            "True"       : True,
            "False"      : False,
            "N_unmerged" : 0,
            "N_hkl"      : 0,
            "N_hkl_anom" : 0,
            "N_seq"      : 0,
            "N_xyz"      : 0,
            "N_lig"      : 0,
            "N_ligdesc"  : 0,
            "N_lib"      : 0,
            "N_revision" : 0
        }

        if self.unm:
            variables["reso_high" ] = self.unm[0].getHighResolution(raw=True)
            variables["N_unmerged"] = len(self.unm)
        elif self.hkl:
            variables["reso_high" ] = self.hkl[0].getHighResolution(raw=True)
            variables["N_hkl"     ] = len(self.hkl)
            for i in range(len(self.hkl)):
                if self.hkl[i].isAnomalous():
                    variables["N_hkl_anom"] += 1
        
        if self.seq:      variables["N_seq"]      = len(self.seq)
        if self.xyz:      variables["N_xyz"]      = len(self.xyz)
        if self.lig:      variables["N_lig"]      = len(self.lig)
        if self.ligdesc:  variables["N_ligdesc"]  = len(self.ligdesc)
        if self.lib:      variables["N_lib"]      = len(self.lib)
        if self.revision: variables["N_revision"] = len(self.revision)

        if hasattr(self.task.parameters,"sec1"):
            sec1 = self.task.parameters.sec1.contains
            for key in vars(sec1):
                item = getattr(sec1,key)
                if item:
                    # if item.type.startswith("real"):
                    variables[key] = item.value
            # self.stderrln ( " variables="+str(variables) )

        # put variables describing status of tasks queried with "checkTask(name)"
        with open("__checked_tasks.json","r") as f:
            checked_tasks = json.loads ( f.read() )
            for key in checked_tasks:
                variables[key+"_available"] = checked_tasks[key]

        if have_results:
            self.task.autoRunName = "@ROOT"   # step identifier
            # self.stdoutln ( " >>>> into workflow " + str(len(self.ligdesc)) )
            self.flush()
            rc = auto_workflow.nextTask ( self,{
                    "data" : {
                        "unmerged" : self.unm,
                        "hkl"      : self.hkl,
                        "seq"      : self.seq,
                        "xyz"      : self.xyz,
                        "ligand"   : self.lig,
                        "lib"      : self.lib,
                        "ligdesc"  : self.ligdesc,
                        "revision" : self.revision
                    },
                    "variables" : variables
                 })
            if rc.startswith("error"):
                summary_line += "workflow start failed"
                self.putMessage ( "<h3><i>Workflow start failed</i></h3>" )
            elif rc=="ok":
                summary_line += "workflow started"
                self.putMessage ( "<h3>Workflow started</h3>" )
        else:
            summary_line += "insufficient input"


        """
        seqHasNA      = False
        seqHasProtein = False
        xyzHasNA      = False
        xyzHasProtein = False
        # for s in self.seq:
        #     sc = self.makeClass ( s )
        #     if sc.isDNA() or sc.isRNA():
        #         seqHasNA = True
        #     elif sc.isProtein():
        #         seqHasProtein = True
        for i in range(len(self.seq)):
            s = self.makeClass ( self.seq[i] )
            if s.isDNA() or s.isRNA():
                seqHasNA = True
            elif s.isProtein():
                seqHasProtein = True

        # for x in self.xyz:
        for i in range(len(self.xyz)):
            x = self.makeClass ( self.xyz[i] )
            if x.hasDNA() or x.hasRNA():
                xyzHasNA = True
            elif x.hasProtein():
                xyzHasProtein = True

        if not seqHasNA and not seqHasProtein:
            fmsg = 'Sequence seems not to have any protein or nucleic acids; please check input.'
            self.putMessage("<h3>%s</hr>" % fmsg)
            self.fail('','SMR_WF')

        if not xyzHasNA and not xyzHasProtein:
            fmsg = 'PDB structure seems not to have any protein or nucleic acids; please check input.'
            self.putMessage("<h3>%s</hr>" % fmsg)
            self.fail('','SMR_WF')

        if not seqHasProtein and xyzHasProtein:
            fmsg = 'Sequence is nucleic acid only while PDB structure has protein; please check input.'
            self.putMessage("<h3>%s</hr>" % fmsg)
            self.fail('', 'SMR_WF')

        if not seqHasNA and xyzHasNA:
            fmsg = 'Sequence is protein only while PDB structure has nucleic acid; please check input.'
            self.putMessage("<h3>%s</hr>" % fmsg)
            self.fail('', 'SMR_WF')

        self.flush()
        """


        """
        if ((len(self.unm)>0) or (len(self.hkl)>0)) and (len(self.seq)>0) and (len(self.xyz)>0):
            self.task.autoRunName = "_root"
            if auto.makeNextTask ( self,{
                    "unm"       : self.unm,
                    "hkl"       : self.hkl,
                    "seq"       : self.seq,
                    "lig"       : self.lig,
                    "ligdesc"   : self.ligdesc,
                    "xyz"       : self.xyz,
                    "na"        : xyzHasNA
                    # "mr_engine" : mr_engine,
                    # "mb_engine" : mb_engine
               },self.file_stderr):
                summary_line += "workflow started"
                self.putMessage ( "<h3>Simple Molecular Replacement workflow started</hr>" )
            else:
                summary_line += "workflow start failed"
        else:
            summary_line += "insufficient input"
        """

        self.generic_parser_summary["import_autorun"] = {
          "summary_line" : summary_line
        }

        # import time
        # time.sleep ( 1 )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Workflow ( "",os.path.basename(__file__),{} )
    drv.start()
