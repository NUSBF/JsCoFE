##!/usr/bin/python

#
# ============================================================================
#
#    04.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver AceDrg module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import shutil
import sys

#  ccp4-python imports
#import pyrvapi

import edmap

import ccp4go_lorestr

# ============================================================================

class AceDrg(ccp4go_lorestr.Lorestr):

    # ----------------------------------------------------------------------

    def acedrg ( self,resultdir,parent_branch_id ):

        if len(self.ligands)<=0:
            return ""  # no ligands to make

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Making ligand structures (AceDrg)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Making ligands",
                        "CCP4go Automated Structure Solver: Make " +
                        "Ligands with AceDrg", resultdir,parent_branch_id )

        self.flush()

        # loop over ligands

        meta = {}
        nResults = 0
        quit_message = ""
        for i in range(len(self.ligands)):
            ldata = self.ligands[i]
            code  = ldata[0].upper()
            if len(ldata)>1:
                fname = os.path.join ( resultdir,"smiles_"+code )
                f = open ( fname,'w' )
                f.write  ( ldata[1] + '\n' )
                f.close  ()
                # make command-line parameters
                cmd = [ "-i",fname,"-r",code,"-o",code ]
            else:
                cmd = [ "-c",os.path.join(os.environ["CCP4"],"lib","data",
                                    "monomers",code[0].lower(),code + ".cif"),
                        "-r",code,"-o",code ]

            # start acedrg
            if sys.platform.startswith("win"):
                self.runApp ( "acedrg.bat",cmd )
            else:
                self.runApp ( "acedrg",cmd )

            xyzPath = code + ".pdb"
            cifPath = code + ".cif"
            if os.path.isfile(xyzPath):
                xyzPath1 = os.path.join ( resultdir,xyzPath  )
                cifPath1 = os.path.join ( resultdir,cifPath  )
                xyzPath2 = os.path.join ( self.outputdir,xyzPath1 )
                cifPath2 = os.path.join ( self.outputdir,cifPath1 )
                shutil.copy2 ( xyzPath,xyzPath2  )
                shutil.copy2 ( cifPath,cifPath2  )
                os.rename ( xyzPath,xyzPath1 )
                os.rename ( cifPath,cifPath1 )
                meta[code] = {}
                meta[code]["xyz"] = xyzPath1
                meta[code]["cif"] = cifPath1
                nResults += 1
                quit_message += code + " "
                if nResults==1:
                    self.putMessage ( "<h2><i>Results</i></h2>" )
                #self.putStructureWidget ( code + " structure",
                #                          [ "/".join(["..",xyzPath2]) ],-1 )
                self.putStructureWidget ( code + " structure",
                                          [ os.path.join("..",xyzPath2) ],-1 )

        self.output_meta["results"][resultdir] = {}
        self.output_meta["results"][resultdir]["ligands"]  = meta
        self.output_meta["results"][resultdir]["nResults"] = nResults
        if nResults>0:
            if nResults==1:
                quit_message = "built ligand " + quit_message
            else:
                quit_message = "built ligands " + quit_message
        else:
            quit_message = "no ligands built (errors)"

        self.quit_branch ( branch_data,resultdir,
                           "Making ligand structures (AceDrg): " + quit_message )

        return  branch_data["pageId"]
