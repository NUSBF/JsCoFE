##!/usr/bin/python

#
# ============================================================================
#
#    27.12.19   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
import math

import gemmi

#  application imports
import basic
from   pycofe.etc  import pyrama


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
        st2 = gemmi.read_structure ( xyz2 )
        result = {
            "nmodified" : 0,
            "rmsd"      : 0.0,
            "max_rmsd"  : 0.0,
            "modlist"   : []
        }
        nrmsd = 0
        for mno in range(len(st1)):
            model1 = st1[mno]
            model2 = st2[mno]
            for cno in range(len(model1)):
                chain1 = model1[cno]
                chain2 = model2[cno]
                for rno in range(len(chain1)):
                    res1 = chain1[rno]
                    res2 = chain2[rno]
                    if len(res1)!=len(res2):
                        result["nmodified"] += 1
                    for ano in range(len(res1)):
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

        coot_xyzout = self.coot_out() + str(combId) + ".pdb"
        coot_script = self.coot_out() + str(combId) + ".py"

        f = open ( coot_script,"w" )
        f.write(
            "make_and_draw_map('" + params["mtzin"]  +\
                                "', '" + params["labin_fc"][0] +\
                                "', '" + params["labin_fc"][1] +\
                                "', '', 0, 0)\n"        +\
            params["function"] + "(0)\n"                +\
            "write_pdb_file(0,'" + coot_xyzout + "')\n" +\
            "coot_real_exit(0)\n"
        )
        f.close()

        cmd = [ "--no-state-script", "--no-graphics", "--no-guano", "--python",
                "--pdb",params["xyzin"], "--script",coot_script ]

        self.runApp ( "coot",cmd,logType="Main" )

        results = self.assess_results ( params["xyzin"],coot_xyzout )
        
        out_msg = []
        if combId=="FR" or results["nmodified"]>0:
            out_msg.append ( str(results["nmodified"]) + " residues were modified" )
        if combId!="FR":
            out_msg.append (
                "Overall r.m.s.d. of changes: {:.3f} &Aring;".format(results["rmsd"])
            )
            out_msg.append (
                "Maximum residue r.m.s.d.:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "{:.3f} &Aring;".format(results["max_rmsd"])
            )
        for msg in out_msg:
            self.putMessage1 ( secId,msg,report_row,col=0,colSpan=2 )
            report_row += 1

        #if combId=="RR" and sys.platform == "darwin":  # gemmi-numpy clash in 7.0
        if True:
            plot1_png = "_rama_general_1.png"
            plot2_png = "_rama_general_2.png"
            pyrama.make_ramaplot1 ( "General","Original Ramachandran Plot",
                        params["xyzin"],os.path.join(self.reportDir(),plot1_png) )
            pyrama.make_ramaplot1 ( "General","Refined Ramachandran Plot",
                        coot_xyzout,os.path.join(self.reportDir(),plot2_png) )
            self.putMessage1 ( secId,"<img src=\"" + plot1_png +
                        "\" height=\"420pt\" style=\"vertical-align: middle;\"/>",
                        report_row,0 )
            self.putMessage1 ( secId,"<img src=\"" + plot2_png +
                        "\" height=\"420pt\" style=\"vertical-align: middle;\"/>",
                        report_row,1 )
            report_row += 1


        #  refine phases

        """
        hkl_labels = hkl.getMeanColumns()
        if hkl_labels[2]=="F":
            hkl_labin = "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
        else:
            hkl_labin = "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]
        """

        if int(params["ncycles"])>0:

            hkl_labels = hkl.getMeanF()
            hkl_labin  = "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
            hkl_labin += " FREE=" + hkl.getFreeRColumn()

            self.open_stdin()
            self.write_stdin ([
                hkl_labin,
                "NCYC " + params["ncycles"],
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

            refmac_mtzout = self.refmac_out() + str(combId) + ".mtz"
            refmac_xyzout = self.refmac_out() + str(combId) + ".pdb"

            cmd = [ "hklin" ,hkl.getHKLFilePath(self.inputDir()),
                    "xyzin" ,coot_xyzout,
                    "hklout",refmac_mtzout,
                    "xyzout",refmac_xyzout,
                    "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

            if params["libin"]:
                cmd += ["libin",params["libin"]]

            # Prepare report parser
            panelId = self.getWidgetId ( self.refmac_report() + "_" + secId )
            self.putPanel1 ( secId,panelId,report_row,colSpan=2 )
            self.setGenericLogParser ( panelId,False,graphTables=False,
                                       makePanel=False )
            self.runApp ( "refmac5",cmd,logType="Main" )
            self.unsetLogParser()

        else:
            refmac_mtzout = params["mtzin"]
            refmac_xyzout = coot_xyzout

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
            istruct.getXYZFilePath ( self.inputDir() )
        ]
        labin_fc = [istruct.FWT,istruct.PHWT]

        for i in range(4):
            combN = "COMB" + str(i+1) + "_"
            code  = self.getParameter ( getattr(sec1,combN+"SEL") )
            if code!="N":
                secId   = self.getWidgetId ( "comb_"+code )
                self.putSection ( secId,self.pass_meta[code]["title"] )
                npasses = self.getParameter ( getattr(sec1,combN+"NPASS") )
                ncycles = self.getParameter ( getattr(sec1,combN+"NCYC" ) )
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


        # check solution and register data
        if os.path.isfile(mtzxyz[1]):

            os.rename ( mtzxyz[0],self.getMTZOFName() )
            os.rename ( mtzxyz[1],self.getXYZOFName() )

            self.putTitle ( "CombStructure Output" )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),None,
                                                 self.getMTZOFName(),
                                                 None,None,libin,
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
