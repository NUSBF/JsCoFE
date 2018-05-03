##!/usr/bin/python

#
# ============================================================================
#
#    07.02.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORDINATE FILE HANDLING ROUTINES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#from ccp4mg import mmdb2

import gemmi

"""
def stripLigWat ( mmFile,outFile ):
    mm  = mmdb2.Manager()
    mm.ReadCoorFile ( str(mmFile) )
    mm.DeleteAltLocs()
    nat1 = mm.GetNumberOfAtoms()         # initial number of atoms
    #mm.DeleteSolvent()
    selHnd = mm.NewSelection()
    mm.Select ( selHnd,2,"*",0 )         # select all residues, new selection
    mm.SelectProperty   ( selHnd,1,2,4 ) # select amino acid residues, subtract
    mm.SelectProperty   ( selHnd,2,2,4 ) # select nucleic acid residues, subtract
    mm.SelectProperty   ( selHnd,4,2,4 ) # select modified aminoacids, subtract
    mm.DeleteSelObjects ( selHnd )       # delete what remains (water and ligands)
    mm.FinishStructEdit ()               # optimise internal indexes
    nat2 = mm.GetNumberOfAtoms()         # final number of atoms
    if outFile.lower().endswith(".pdb"):
        mm.WritePDBASCII ( str(outFile) )
    else:
        mm.WriteCIFASCII ( str(outFile) )
    return  (nat1-nat2)    # !=0 indicates of changes made
"""


def mergeLigands ( mmFile, ligFiles, chainId, outFile ):
    st    = gemmi.read_structure ( mmFile )
    nligs = 0
    for lf in ligFiles:
        lig = gemmi.read_structure ( lf )
        for lig_chain in lig[0]:
            residues = list ( lig_chain )
            st[0].find_or_add_chain(chainId).append_residues ( residues )
            nligs += len(residues)
    st.write_pdb ( outFile )
    return nligs


"""
def mergeLigands ( mmFile,ligFiles,chainId,outFile ):

    mm  = mmdb2.Manager()
    mm.ReadCoorFile ( str(mmFile) )
    mm_model  = mm.GetFirstDefinedModel()
    mm_xchain = None

    lig   = mmdb2.Manager()
    nligs = 0
    for lf in ligFiles:
        lig.ReadCoorFile ( str(lf) )
        lig_model = lig.GetFirstDefinedModel()
        if mm_model and lig_model:
            lig_nchains = lig_model.GetNumberOfChains()
            for i in range(lig_nchains):
                lig_chain = lig_model.GetChain ( i )
                lig_nres  = lig_chain.GetNumberOfResidues()
                if lig_nres>0:
                    if not mm_xchain:
                        mm_xchain = mm_model.GetChainCreate ( chainId,False )
                    mm_nres = mm_xchain.GetNumberOfResidues()
                    for j in range(lig_nres):
                        res = lig_chain.GetResidue(j)
                        mm_nres += 1
                        res.seqNum = mm_nres
                        mm_xchain.AddResidue ( res )
                    nligs += lig_nres

    mm.WritePDBASCII ( str(outFile) )

    return nligs
"""


def fetchChains ( inFile,modelNo,chainList,removeWaters,removeLigands,outFile ):
#  Takes chains with chain IDs given in chainList from file 'inFile' and writes
# them out in file 'outFile'.
#  ModelNo:
#    -1 :  take chains only from first model available
#     0 :  take chains from all models
#    >0 :  take chains from the specified model number
    st = gemmi.read_structure ( inFile )
    if removeWaters and removeLigands:
        st.remove_ligands_and_waters()
    elif removeWaters:
        st.remove_waters()
    n = 0
    if ("(all)" in chainList) or ("*" in chainList):
        if modelNo!=0:
            for model in st:
                if ((modelNo<0) and (n>0)) or ((modelNo>0) and (str(modelNo)!=model.name)):
                    for name in [ch.name for ch in model]:
                        model.remove_chain ( name )
                n += 1
    else:
        for model in st:
            if ((modelNo<0) and (n==0)) or (modelNo==0) or str(modelNo)==model.name:
                for name in [ch.name for ch in model if ch.auth_name not in chainList]:
                    model.remove_chain ( name )
            elif modelNo!=0:
                for name in [ch.name for ch in model]:
                    model.remove_chain ( name )
            n += 1
    st.remove_empty_chains()
    st.write_pdb ( outFile )
    #or st.write_minimal_pdb('out.pdb')
    return

    """
    mm = mmdb2.Manager()
    mm.ReadCoorFile ( str(inFile) )
    selHnd = mm.NewSelection()

    selHnd = mm.Select ( selHnd,3,"*",0 )



    mm_model = mm.GetFirstDefinedModel()
    nchains  = mm_model.GetNumberOfChains()

    n = 0   # number of fetched chains
    for i in range(nchains):
        chain = mm_model.GetChain ( i )
        if chain.GetChainID() not in chainList:
            mm_model.DeleteChain ( i )

    mm.WritePDBASCII ( str(outFile) )

    return n
    """


def main():

    mergeLigands ( "0065-01_buccaneer.pdb",["fitted-ligand-0-0.pdb"], "X", "out.pdb" )

    return



if __name__ == '__main__':
    main()
