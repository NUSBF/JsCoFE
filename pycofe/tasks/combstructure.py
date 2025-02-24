##!/usr/bin/python

#
# ============================================================================
#
#    25.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COMBSTRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.combstructure jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
import math
import shutil

import gemmi

#  application imports
from . import basic
from   pycofe.etc   import pyrama
from   pycofe.proc  import qualrep


# ============================================================================
# Make CombStructure driver

class CombStructure(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return ".script"

    def refmac_out(self): return "_refmac_"
    def coot_out  (self): return "_coot_"

    # ------------------------------------------------------------------------

    def assess_results ( self,xyz1,xyz2 ):
        st1 = gemmi.read_structure ( xyz1 )
        st1.setup_entities()
        
        st2 = gemmi.read_structure ( xyz2 )
        st2.setup_entities()
        result = {
            "nmodified" : 0,
            "rmsd"      : 0.0,
            "max_rmsd"  : 0.0,
            "modlist"   : []
        }
        nrmsd = 0
        for mno in range(min(len(st1),len(st2))):
            model1 = st1[mno]
            model2 = st2[mno]
            for cno in range(min(len(model1),len(model2))):
                chain1 = model1[cno]
                chain2 = model2[cno]
                for rno in range(min(len(chain1),len(chain2))):
                    res1 = chain1[rno]
                    res2 = chain2[rno]
                    if len(res1)!=len(res2):
                        result["nmodified"] += 1
                    for ano in range(min(len(res1),len(res2))):
                        pos1 = res1[ano].pos
                        pos2 = res2[ano].pos
                        dx = pos1[0] - pos2[0]
                        dy = pos1[1] - pos2[1]
                        dz = pos1[2] - pos2[2]
                        rmsd = dx*dx + dy*dy + dz*dz
                        result["rmsd"]    += rmsd
                        result["max_rmsd"] = max ( result["max_rmsd"],rmsd )
                        nrmsd += 1
        if nrmsd>0:
            result["rmsd"] = math.sqrt ( result["rmsd"]/nrmsd )
        return result


    # ------------------------------------------------------------------------

    pass_meta = {
        "FR" :  { "title"  : "Fill partial residues",
                  "script" : "fill_partial_residues"
                },
        "FP" :  { "title"  : "Fit protein",
                  "script" : "fit_protein"
                },
        "SR" :  { "title"  : "Stepped refine",
                  "script" : "stepped_refine_protein"
                },
        "RR" :  { "title"  : "Ramachandran Plot refine/improve",
                  "script" : "stepped_refine_protein_for_rama"
                }
    }

    def comb_structure ( self,secId,combId,hkl,params ):

        self.putMessage1 ( secId,"<h3>" + self.pass_meta[combId]["title"] +\
                                 " with Coot</h3>",0,col=0,colSpan=2 )
        self.flush()
        report_row = 1

        #  comb structure

        work_xyz = params["xyzin"]
        work_mtz = params["mtzin"]
        table_id = None

        for passNo in range(params["npasses"]):

            passId = combId + "_" + str(passNo+1).zfill(2)

            coot_xyzout = self.coot_out() + passId + ".pdb"
            coot_script = self.coot_out() + passId + ".py"

            f = open ( coot_script,"w" )
            f.write(
                "make_and_draw_map('" + work_mtz +\
                                    "', '" + params["labin_fc"][0] +\
                                    "', '" + params["labin_fc"][1] +\
                                    "', '', 0, 0)\n"        +\
                params["function"] + "(0)\n"                +\
                "write_pdb_file(0,'" + coot_xyzout + "')\n" +\
                "coot_real_exit(0)\n"
            )
            f.close()

            # cmd = [ "--no-state-script", "--no-graphics", "--no-guano", "--python",
            #         "--pdb",work_xyz, "--script",coot_script ]
            cmd = [ "--no-state-script", "--no-graphics", "--no-guano",
                    "--pdb",work_xyz, "--script",coot_script ]

            if sys.platform.startswith("win"):
                coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
                self.runApp ( coot_bat,cmd,logType="Service" )
            else:
                self.runApp ( "coot",cmd,logType="Service" )

            results = self.assess_results ( work_xyz,coot_xyzout )

            if combId=="FR" or results["nmodified"]>0:
                self.putMessage1 ( secId,
                        str(results["nmodified"]) + " residues were modified",
                        report_row,col=0,colSpan=2 )
                report_row += 1
                if results["nmodified"]<=0:
                    refmac_xyzout = work_xyz
                    refmac_mtzout = work_mtz
                    break  # do not refine
            else:
                if not table_id:
                    table_id = self.getWidgetId ( combId + "_table" )
                    self.putTable ( table_id,"Summary",secId,report_row,
                                    colSpan=3,mode=0 )
                    self.setTableVertHeader ( table_id,0,
                                "Overall r.m.s.d. of changes (&Aring;)","" )
                    self.setTableVertHeader ( table_id,1,
                                "Maximum residue r.m.s.d. (&Aring;)","" )
                    self.setTableVertHeader ( table_id,2,"R-factor","" )
                    self.setTableVertHeader ( table_id,3,"R-free","" )
                    report_row += 1
                self.setTableHorzHeader ( table_id,passNo,"Pass "+str(passNo+1),"" )
                self.putTableString ( table_id,
                            "{:.3f}".format(results["rmsd"]),"",0,passNo )
                self.putTableString ( table_id,
                            "{:.3f}".format(results["max_rmsd"]),"",1,passNo )


            #  refine phases

            if params["ncycles"]>0:

                hkl_labels = hkl.getMeanF()
                hkl_labin  = "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
                hkl_labin += " FREE=" + hkl.getFreeRColumn()

                self.open_stdin()
                self.write_stdin ([
                    hkl_labin,
                    "NCYC " + str(params["ncycles"]),
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

                refmac_mtzout = self.refmac_out() + passId + ".mtz"
                refmac_xyzout = self.refmac_out() + passId + ".pdb"

                cmd = [ "hklin" ,hkl.getHKLFilePath(self.inputDir()),
                        "xyzin" ,coot_xyzout,
                        "hklout",refmac_mtzout,
                        "xyzout",refmac_xyzout,
                        "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

                if params["libin"]:
                    cmd += ["libin",params["libin"]]

                # Prepare report parser
                if passNo==0:
                    panelId = self.getWidgetId ( self.refmac_report() + "_" + secId )
                    self.putPanel1 ( secId,panelId,report_row,colSpan=2 )
                    self.setGenericLogParser ( panelId,True,graphTables=False,
                                               makePanel=False )
                self.runApp ( "refmac5",cmd,logType="Main" )
                #self.unsetLogParser()
                #self.stdoutln ( str(self.generic_parser_summary) )
                self.putTableString ( table_id,
                    self.generic_parser_summary["refmac"]["R_factor"],"",2,passNo )
                self.putTableString ( table_id,
                    self.generic_parser_summary["refmac"]["R_free"],"",3,passNo )

            else:
                refmac_mtzout = params["mtzin"]
                refmac_xyzout = coot_xyzout
                self.putTableString ( table_id,"fail","",2,passNo )
                self.putTableString ( table_id,"fail","",3,passNo )

            work_xyz = refmac_xyzout
            work_mtz = refmac_mtzout

            self.flush()

        self.unsetLogParser()

        if table_id:
            results = self.assess_results ( params["xyzin"],refmac_xyzout )
            self.setTableHorzHeader ( table_id,params["npasses"],"Overall","" )
            self.putTableString ( table_id,
                    "{:.3f}".format(results["rmsd"]),"",0,params["npasses"] )
            self.putTableString ( table_id,
                    "{:.3f}".format(results["max_rmsd"]),"",1,params["npasses"] )

        #if combId=="RR" and sys.platform == "darwin":  # gemmi-numpy clash in 7.0
        if combId=="RR":

            report_row += 1

            plot1_png = combId + "_rama_general_1"
            plot2_png = combId + "_rama_general_2"

            pyrama_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "../etc/pyrama.py" ) )

            cmd1 = [
                pyrama_path,
                params["xyzin"],
                "Original Ramachandran Plot",
                os.path.join(self.reportDir(),plot1_png)
            ]
            cmd2 = [
                pyrama_path,
                refmac_xyzout,
                "Refined Ramachandran Plot",
                os.path.join(self.reportDir(),plot2_png)
            ]

            if sys.platform.startswith("win"):
                self.runApp ( "ccp4-python.bat",cmd1,logType="Main" )
                self.runApp ( "ccp4-python.bat",cmd2,logType="Main" )
            else:
                self.runApp ( "ccp4-python",cmd1,logType="Main" )
                self.runApp ( "ccp4-python",cmd2,logType="Main" )

            self.putMessage1 ( secId,"<img src=\"" + plot1_png +
                    ".png\" height=\"420pt\" style=\"vertical-align: middle;\"/>",
                    report_row,0 )
            self.putMessage1 ( secId,"<img src=\"" + plot2_png +
                    ".png\" height=\"420pt\" style=\"vertical-align: middle;\"/>",
                    report_row,1 )

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
        libin   = istruct.getLibFilePath ( self.inputDir() )

        sec1    = self.task.parameters.sec1.contains
        mtzxyz  = [
            istruct.getMTZFilePath ( self.inputDir() ),
            istruct.getPDBFilePath ( self.inputDir() )
        ]
        labin_fc = [istruct.FWT,istruct.PHWT]

        for i in range(4):
            combN = "COMB" + str(i+1) + "_"
            code  = self.getParameter ( getattr(sec1,combN+"SEL") )
            if code!="N":
                secId   = self.getWidgetId ( "comb_"+code )
                self.putSection ( secId,self.pass_meta[code]["title"] )
                npasses = 1
                if code!="FR":
                    npasses = int(self.getParameter(getattr(sec1,combN+"NPASS")))
                ncycles = int(self.getParameter(getattr(sec1,combN+"NCYC")))
                mtzxyz  = self.comb_structure ( secId,code,hkl,{
                  "libin"    : libin,
                  "mtzin"    : mtzxyz[0],
                  "xyzin"    : mtzxyz[1],
                  "labin_fc" : labin_fc,
                  "npasses"  : npasses,
                  "ncycles"  : ncycles,
                  "function" : self.pass_meta[code]["script"]
                })
                if ncycles>0:
                    labin_fc = ["FWT","PHWT"]
            else:
                break

        # check solution and register data
        have_results = False
        if os.path.isfile(mtzxyz[1]):

            os.rename ( mtzxyz[0],self.getMTZOFName() )
            os.rename ( mtzxyz[1],self.getXYZOFName() )

            self.putTitle ( "CombStructure Output" )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( 
                            None,
                            self.getXYZOFName(),
                            None,
                            self.getMTZOFName(),
                            libPath = libin,
                            leadKey = 1,
                            refiner = "refmac" 
                        )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
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
                have_results = True

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision,mtzxyz[1] )
                except:
                    self.stderr ( " *** validation tools failure" )
                    self.rvrow = rvrow0 + 6

        else:
            self.putTitle ( "No Output Generated" )

        shutil.rmtree ( "coot-backup", ignore_errors=True, onerror=None )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = CombStructure ( "",os.path.basename(__file__) )
    drv.start()


"""
# Input molecules are given internal identifiers "MolHandle_1" etc"
# Input maps are given internal identifiers "MapHandle_1" etc"
# Input difference maps are given internal identifiers "DifmapHandle_1" etc"
#
# The appropriate place to put output pdb files to be picked up by the system
# is stored in the variable dropDir (see below for how to use this)
#
# Beware spaces...this is python after all
def is_polymer_chain(imol, ch_id):
    return is_protein_chain_qm(imol, ch_id) or is_nucleotide_chain_qm(imol, ch_id)


def reso_morph(imol, imol_map, n_rounds):
    for round in range(n_rounds):
        f = float(round)/float(n_rounds)
        for ch_id in chain_ids(imol):
            if is_polymer_chain(imol, ch_id):

                # play with these numbers
                radius =   6 * (2 - f)
                sf     = 100 * (1 - f)
                sharpen(0, sf)
                morph_fit_chain(imol, ch_id, radius)

# run the script
reso_morph(MolHandle_1, MapHandle_1, 20)
write_pdb_file(MolHandle_1,os.path.join(dropDir,"output.pdb"))
"""
