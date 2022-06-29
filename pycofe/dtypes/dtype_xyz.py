##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    28.06.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ (COORDINATES) DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import sys

import gemmi

#  application imports
from  pycofe.dtypes  import dtype_template
from  pycofe.proc    import xyzmeta

# ============================================================================

def dtype(): return "DataXYZ"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type         = dtype()
            self.dname         = "xyz"
            self.xyzmeta       = {}
            self.exclLigs      = ["(agents)"]  # list of excluded ligands for PISA
            #self.selChain      = "(all)"       # selected chains for comparison
            self.chainSel      = ""            # selected chains for comparison
            self.chainSelType  = ""
            self.coot_meta     = None
            self.BF_correction = "none"        # "none", "alphafold", "rosetta"
            self.version      += 0             # versioning increments from parent to children
        return

    def hasProtein(self):
        return dtype_template.subtypeProtein() in self.subtype

    def hasDNA(self):
        return dtype_template.subtypeDNA() in self.subtype

    def hasRNA(self):
        return dtype_template.subtypeRNA() in self.subtype

    def getSpaceGroup ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return self.xyzmeta["cryst"]["spaceGroup"]
        elif hasattr(self.xyzmeta,"cryst"):
            return self.xyzmeta.cryst.spaceGroup
        return None

    def copyCrystData ( self,xyz ):
        cryst = None
        if type(xyz.xyzmeta) == dict:
            cryst = xyz.xyzmeta["cryst"]
        else:
            cryst = xyz.xyzmeta.cryst
        if type(self.xyzmeta) == dict:
            self.xyzmeta["cryst"] = cryst
        else:
            self.xyzmeta.cryst = cryst

    def getCellParameters ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return [ self.xyzmeta["cryst"]["a"],
                         self.xyzmeta["cryst"]["b"],
                         self.xyzmeta["cryst"]["c"],
                         self.xyzmeta["cryst"]["alpha"],
                         self.xyzmeta["cryst"]["beta"],
                         self.xyzmeta["cryst"]["gamma"]
                       ]
        elif hasattr(self.xyzmeta,"cryst"):
            return [ self.xyzmeta.cryst.a,
                     self.xyzmeta.cryst.b,
                     self.xyzmeta.cryst.c,
                     self.xyzmeta.cryst.alpha,
                     self.xyzmeta.cryst.beta,
                     self.xyzmeta.cryst.gamma
                    ]
        return [0.0,0.0,0.0,0.0,0.0,0.0]


    def getNofPolymers ( self ):
        n = 0
        chains = None
        if type(self.xyzmeta) == dict:
            if "xyz" in self.xyzmeta:
                chains = self.xyzmeta["xyz"][0]["chains"]
                for i in range(len(chains)):
                    if chains[i]["seq"]:
                        n += 1
        elif hasattr(self.xyzmeta,"xyz"):
            chains = self.xyzmeta.xyz[0].chains
            for i in range(len(chains)):
                if chains[i].seq:
                    n += 1
        return n

    def fixBFactors ( self,dirPath ):
        self.BF_correction = "none"        # "none", "af2", "rosetta"
        fpath = self.getXYZFilePath ( dirPath )
        if fpath and fpath.lower().endswith(".pdb"):
            st = gemmi.read_structure ( fpath )
            need_to_fix  = True
            max_bfactor  = 0.0
            min_bfactor  = 1000000.0
            full_residue = False;
            for model in st:
                for chain in model:
                    polymer = chain.get_polymer()
                    t = polymer.check_polymer_type()
                    if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                        for res in chain:
                            if not full_residue:
                                full_residue = (len(res)>1)
                            bfactor = -1.0
                            for atom in res:
                                if bfactor>=0.0 and atom.b_iso!=bfactor:
                                    need_to_fix = False
                                else:
                                    bfactor     = atom.b_iso
                                    max_bfactor = max ( max_bfactor,bfactor )
                                    min_bfactor = max ( min_bfactor,bfactor )
                                if not need_to_fix:
                                    break
                            if not need_to_fix:
                                break
                        if not need_to_fix:
                            break
                    else:  # not a protein structure, cannot be alphafold
                        need_to_fix = False;
                        break;
                if not need_to_fix:
                    break
            if need_to_fix and max_bfactor!=min_bfactor and full_residue:
                for model in st:
                    for chain in model:
                        for res in chain:
                            for atom in res:
                                rmsd_est = atom.b_iso
                                if max_bfactor>=5.0:  # alphafold
                                    lddt = atom.b_iso / 100
                                    if lddt <= 0.5:
                                        rmsd_est = 5.0
                                    else:
                                        rmsd_est = (0.6 / (lddt ** 3))
                                atom.b_iso = min ( 999.99, 26.318945069571623*rmsd_est**2 )
                st.write_pdb ( fpath )
                if max_bfactor>=5.0:
                    self.BF_correction = "alphafold"
                else:
                    self.BF_correction = "rosetta"
        return

    def setXYZFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["xyz"] )
        return

    def getXYZFileName ( self ):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getXYZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def putXYZMeta ( self,fdir,file_stdout,file_stderr,log_parser=None ):
        setXYZMeta ( self,xyzmeta.getXYZMeta (
                            os.path.join(fdir,self.files[dtype_template.file_key["xyz"]]),
                            file_stdout,file_stderr,log_parser ) )
        return


    def putCootMeta(self,job_id):

        coot_meta = {
            "jobId"        : job_id,
            "files"        : [],
            "backup_dir"   : "",   # may need to be removed
            "backup_files" : []    # may need to be removed
        }

        files = [ "0-coot-history.py","0-coot-history.scm",
                  "0-coot.state.py","0-coot.state.scm" ]
        for fname in files:
            if os.path.isfile(fname):
                if fname.startswith("0-coot.state."):
                    f = open ( fname,"r" )
                    flines = f.readlines()
                    f.close()
                    os.remove ( fname )
                    f = open ( fname,"w" )
                    for line in flines:
                        if "read_cif_dictionary" not in line and \
                           "read-cif-dictionary" not in line:
                            f.write ( line )
                    f.close()
                coot_meta["files"].append(fname)

        # currently dysfunctinoal and does not work because Coot uses
        # platform-incompatible file naming in backup directory
        if os.path.isdir("coot-backup"):
            bfiles = os.listdir("coot-backup")
            if len(bfiles)>0:
                coot_meta["backup_dir"]   = "coot-backup"
                coot_meta["backup_files"] = bfiles

        if len(coot_meta["files"])>0 or len(coot_meta["backup_files"])>0:
            self.coot_meta = coot_meta

        return


    def copyAssociations ( self,data ):
        if hasattr(data,"coot_meta"):
            self.coot_meta = data.coot_meta
        self.associated = data.associated
        return


def setXYZMeta ( data_class,xyz_meta ):
    data_class.xyzmeta = xyz_meta
    if type(data_class.xyzmeta) == dict:
        xyz = data_class.xyzmeta["xyz"]
        for i in range(len(xyz)):
            chains = xyz[i]["chains"]
            for j in range(len(chains)):
                t = chains[j]["type"]
                if t=="Protein":
                    data_class.addSubtype ( dtype_template.subtypeProtein() )
                elif t=="DNA":
                    data_class.addSubtype ( dtype_template.subtypeDNA() )
                elif t=="RNA":
                    data_class.addSubtype ( dtype_template.subtypeRNA() )
    else:
        xyz = data_class.xyzmeta.xyz
        for i in range(len(xyz)):
            chains = xyz[i].chains
            for j in range(len(chains)):
                t = chains[j].type
                if t=="Protein":
                    data_class.addSubtype ( dtype_template.subtypeProtein() )
                elif t=="DNA":
                    data_class.addSubtype ( dtype_template.subtypeDNA() )
                elif t=="RNA":
                    data_class.addSubtype ( dtype_template.subtypeRNA() )

    return


def register ( xyzFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(xyzFilePath):
        xyz   = DType   ( job_id )
        fname = os.path.basename(xyzFilePath)
        xyz.setXYZFile ( fname )
        xyz.makeDName  ( dataSerialNo )
        newFileName = xyz.dataId + "_" + fname
        xyz.setXYZFile ( newFileName )
        if outDataBox:
            outDataBox.add_data ( xyz )
        os.rename ( xyzFilePath, os.path.join(outputDir,newFileName) )
        return xyz
    else:
        return None
