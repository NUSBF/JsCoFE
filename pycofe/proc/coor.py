##!/usr/bin/python

#
# ============================================================================
#
#    31.03.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORDINATE FILE HANDLING ROUTINES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2025
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
    st.setup_entities()
    nligs = 0
    try:
        chain = st[0].find_last_chain(chainId) or st[0].add_chain(gemmi.Chain(chainId))
    except:
        chain = st[0].find_last_chain(chainId) or st[0].add_chain(chainId)

    if len(chain) > 0:
        resNumbers = []
        for res in chain:
            resNumbers.append(res.seqid.num)
        resNum = max(resNumbers) + 1
    else:
        resNum = 1

    for lf in ligFiles:
        lig = gemmi.read_structure ( lf )
        lig.setup_entities()
        for lig_chain in lig[0]:
            residues = list ( lig_chain )
            for res in residues:
                chain.append_residues([res])
                chain[-1].seqid.num = resNum
                resNum += 1
                nligs += 1

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
#  them out in file 'outFile'.
#  ModelNo:
#    -1 :  take chains only from first model available
#     0 :  take chains from all models
#    >0 :  take chains from the specified model number

    # this will work until gemmi can handle mmdb selections
    selList = {}
    mNo     = modelNo
    if ("(all)" in chainList) or ("*" in chainList):
        mNo = 0
    for c in chainList:
        if c.startswith("/"):  # apply to specified model only
            clist = c.split("/")
            mdl = clist[1]
            chn = clist[2]
        else:
            mdl = "0"  # apply to all models
            chn = c
        if mNo<=0 or str(mNo)==mdl:
            if not mdl in selList:
                selList[mdl] = [chn]
            else:
                selList[mdl].append ( chn )
        if modelNo<0:
            break

    #fd = open ( "debug.deb","w" )
    #fd.write ( str(selList)  + "\n" )
    #fd.close()

    st = gemmi.read_structure ( inFile )
    st.setup_entities()

    if removeWaters and removeLigands:
        st.remove_ligands_and_waters()
    elif removeWaters:
        st.remove_waters()

    if not (("(all)" in chainList) or ("*" in chainList)):
        if "0" in selList:
            for model in st:
                for name in [ch.name for ch in model if ch.name not in selList["0"]]:
                    model.remove_chain ( name )
        else:
            for name in [str(m.num) for m in st if str(m.num) not in selList]:
                del st[name]
            for model in st:
                mnum = str(model.num)
                if mnum in selList:
                    for name in [ch.name for ch in model if ch.name not in selList[mnum]]:
                        model.remove_chain ( name )

    st.remove_empty_chains()
    st.write_pdb ( outFile )
    #or st.write_minimal_pdb('out.pdb')

    # ugly temporary hack to remove NUMMDL till mmdb is updated to 2.0.17
    f = open(outFile,"r+")
    lines = f.readlines()
    f.seek(0)
    for l in lines:
        if not l.startswith("NUMMDL"):
            f.write(l)
    f.truncate()
    f.close()

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

def hasMacromolecule ( path ):
    st = gemmi.read_structure ( path )
    st.setup_entities()
    st.add_entity_types()
    for chain in st[0]:
        polymer = chain.get_polymer()
        if polymer:
            return True
    return False


def main():

    mergeLigands ( "0065-01_buccaneer.pdb",["fitted-ligand-0-0.pdb"], "X", "out.pdb" )

    return



if __name__ == '__main__':
    main()
