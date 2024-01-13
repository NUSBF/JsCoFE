##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AWNUCE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.awnuce jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2022-2024
#
# ============================================================================
#

#  python native imports
import os

import gemmi

#  application imports
from .           import basic
from pycofe.proc import optimize_xyz
# from   pycofe.auto   import auto

# ============================================================================
# Make Refmac driver

class AWNuce(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare awnuce input
        # fetch input data

        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl[0]     )

        # make command-line parameters
        pdbin = None
        if not istruct.isSubstructure():
            pdbin = istruct.getXYZFilePath ( self.inputDir() )
        mtzin = istruct.getMTZFilePath ( self.inputDir() )

        labin_fo = hkl.getMeanF()
        if labin_fo[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"
        labin_ph    = [istruct.PHI,istruct.FOM]
        self.makePhasesMTZ (
            hkl.getHKLFilePath(self.inputDir()),labin_fo,mtzin,labin_ph,input_mtz
        )

        awnuceDir = "awnuce"
        cmd       = [ "datafile", os.path.abspath(input_mtz),
                      "jobid"   , awnuceDir,
                      "fp"      , istruct.FP,
                      "sigfp"   , istruct.SigFP,
                      "phib"    , istruct.PHWT,
                      "fom"     , istruct.FOM
                    ]

        # asu_comp = revision.getResComposition()
        # if asu_comp["nchains"]>0:
        #     if asu_comp["protein"]>0:
        #         cmd += [ "residues",str(asu_comp["protein"]) ]
        #     nas = asu_comp["rna"] + asu_comp["dna"]
        #     if nas>0:
        #         cmd += [ "nucleotides",str(nas) ]

        self.putWaitMessageLF ( "Building in progress ..." )
        # self.rvrow -= 1

        self.runApp ( "auto_nuce.sh",cmd,logType="Main" )

        nuceout = [f for f in os.listdir(awnuceDir) if f.lower().endswith(".pdb")]

        # self.stdoutln ( " >>>>> nuceout=" + str(nuceout) )

        nRNAbuilt = 0
        nDNAbuilt = 0
        nChains   = 0

        if len(nuceout)==1:

            st = None
            if pdbin:
                st = gemmi.read_structure ( pdbin )
                st.setup_entities()
            else:
                st = gemmi.Structure()
                st.spacegroup_hm= hkl.getSpaceGroup()
                parameters = hkl.getCellParameters()
                st.cell = gemmi.UnitCell(parameters[0], parameters[1], parameters[2], parameters[3], parameters[4], parameters[5])
                st.add_model ( gemmi.Model("1") )  # structure with empty model

            stnuce = gemmi.read_structure ( os.path.join(awnuceDir,nuceout[0]) )
            stnuce.setup_entities()
            for chain_nuce in stnuce[0]:
                for res in chain_nuce:
                    for atom in res:
                        if   atom.name=="O2P":
                            atom.name = "OP2"
                        elif atom.name=="O1P":  
                            atom.name = "OP1"
                        else: 
                            atom.name = atom.name.replace ( "*","'" )
            stnuce.setup_entities()

            chain_ids = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            for chain in st[0]:
                polymer = chain.get_polymer()
                t       = polymer.check_polymer_type()
                if t in (gemmi.PolymerType.Rna,gemmi.PolymerType.Dna,gemmi.PolymerType.DnaRnaHybrid):
                    st[0].remove_chain ( chain.name )
                    # self.stdoutln ( " >>>> chain " + chain.name + " excluded from repeat (" + str(t) + ")" )
                else:
                    chain_ids = chain_ids.replace ( chain.name,"" )

            for chain_nuce in stnuce[0]:
                chain     = st[0].add_chain ( chain_ids[0] )
                chain_ids = chain_ids[1:]
                residues  = list ( chain_nuce )
                polymer   = chain_nuce.get_polymer()
                t         = polymer.check_polymer_type()
                if t == gemmi.PolymerType.Rna:
                    nRNAbuilt += len(residues)
                if t == gemmi.PolymerType.Dna:
                    nDNAbuilt += len(residues)
                chain.append_residues ( residues )
                nChains += 1

            if nRNAbuilt>0 or nDNAbuilt>0:

                pdbout = self.getXYZOFName()

                optimize_xyz.optimizeXYZ ( st )
                st.write_pdb ( pdbout )

                structure = self.registerStructure ( None,pdbout,None,mtzin,
                                istruct.getMapFilePath (self.inputDir()),
                                istruct.getDMapFilePath(self.inputDir()),
                                istruct.getLibFilePath (self.inputDir()),
                                leadKey=istruct.leadKey,
                                refiner=istruct.refiner )
                if structure:
                    structure.copy_refkeys_parameters ( istruct )
                    structure.copyAssociations ( istruct )
                    structure.copySubtype      ( istruct )
                    structure.copyLabels       ( istruct )
                    structure.copyLigands      ( istruct )
                    structure.setXYZSubtype    ()
                    if nRNAbuilt:
                        structure.addRNASubtype()
                    if nDNAbuilt:
                        structure.addDNASubtype()
                    self.putTitle   ( "Results" )
                    message = "<b>Total "
                    if nRNAbuilt>0 and nDNAbuilt>0:
                        message += str(nRNAbuilt) + " RNA residues and " +\
                                str(nDNAbuilt) + " DNA residues "
                    elif nRNAbuilt>0:
                        message += str(nRNAbuilt) + " RNA residues "
                    elif nDNAbuilt>0:
                        message += str(nDNAbuilt) + " DNA residues "
                    message += "were built in " + str(nChains) + " chain(s)</b><br>&nbsp;"
                    self.putMessage ( message )
                    self.putStructureWidget ( "structure_btn_",
                                            "Structure and electron density",
                                            structure )
                    # update structure revision
                    revision.setStructureData ( structure )
                    self.registerRevision     ( revision  )

                    # auto.makeNextTask ( self,{
                    #     "revision" : revision,
                    #     "nwaters"  : str(nwaters)
                    # })

        summary_line = ""
        if nRNAbuilt<=0 and nDNAbuilt<=0:
            self.putTitle ( "No nucleic acid chains were built." )
            summary_line = "no nucleic acid chains built"
        else:
            if nRNAbuilt>0 and nDNAbuilt>0:
                summary_line = str(nRNAbuilt) + " RNA residues and " +\
                               str(nDNAbuilt) + " DNA residues "
            elif nRNAbuilt>0:
                summary_line = str(nRNAbuilt) + " RNA residues "
            elif nDNAbuilt>0:
                summary_line = str(nDNAbuilt) + " DNA residues "
            summary_line += " built in " + str(nChains) + " chain(s)"

        # this will go in the project tree job's line
        self.generic_parser_summary["awnuce"] = {
          "summary_line" : summary_line
        }

        # close execution logs and quit
        self.success ( (nRNAbuilt>0 or nDNAbuilt>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = AWNuce ( "",os.path.basename(__file__) )
    drv.start()
