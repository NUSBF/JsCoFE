##!/usr/bin/python

#
# ============================================================================
#
#    30.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver AceDrg module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

import os
import sys
import shutil

#  ccp4-python imports
#import pyrvapi
import gemmi
from   gemmi   import  cif

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

        meta         = {}
        nResults     = 0
        quit_message = ""
        cmd          = []
        for i in range(len(self.ligands)):

            ldata = self.ligands[i]
            if ldata[0]=="LIGIN":
                code = ldata[1].upper()
                meta[code] = {}
                meta[code]["cif"] = ldata[2]
                if len(ldata)>3:
                    meta[code]["xyz"] = ldata[3]
                nResults += 1
                quit_message += code + " "
                if nResults==1:
                    self.putMessage ( "<h2><i>Results</i></h2>" )
                self.putMessage ( "<b>Ligand</b> " + code + " -- prepared" )

            else:
                code = ldata[0].upper()
                xyzPath = code + ".pdb"
                cifPath = code + ".cif"

                if len(ldata)>1:
                    fname = os.path.join ( resultdir,"smiles_"+code )
                    f = open ( fname,'w' )
                    f.write  ( ldata[1] + '\n' )
                    f.close  ()
                    # make command-line parameters
                    cmd = [ "-i",fname,"-r",code,"-o",code ]
                else:
                    ligpath = os.path.join(os.environ["CCP4"],"lib","data",
                                           "monomers",code[0].lower(),code + ".cif")
                    if os.path.isfile(ligpath):
                        block = cif.read(ligpath)[-1]
                        if block.find_values('_chem_comp_atom.x'):
                            # XYZ coordinates are found in dictionary, just copy
                            # them over
                            st = gemmi.make_structure_from_chemcomp_block ( block )
                            st.write_pdb ( xyzPath )
                            # complement with cif dictionary
                            shutil.copy2 ( ligpath,cifPath  )
                            cmd = []  # do not use AceDrg
                        else:
                            cmd = [ "-c",ligpath,"-r",code,"-o",code ] # run AceDrg

                # start acedrg
                if len(cmd)>0:
                    if sys.platform.startswith("win"):
                        self.runApp ( "acedrg.bat",cmd )
                    else:
                        self.runApp ( "acedrg",cmd )

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
