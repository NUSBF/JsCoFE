##!/usr/bin/python

#
# ============================================================================
#
#    19.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ (COORDINATES) DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from  pycofe.dtypes  import dtype_template
from  pycofe.proc    import xyzmeta


# ============================================================================

def dtype(): return "DataXYZ"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type        = dtype()
            self.dname        = "xyz"
            self.xyzmeta      = {}
            self.exclLigs     = ["(agents)"]  # list of excluded ligands for PISA
            self.selChain     = "(all)"       # selected chains for comparison
            self.chainSelType = ""
            self.coot_meta    = None
            self.version     += 0             # versioning increments from parent to children
        return

    def getSpaceGroup ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return self.xyzmeta["cryst"]["spaceGroup"]
        elif hasattr(self.xyzmeta,"cryst"):
            return self.xyzmeta.cryst.spaceGroup
        return None

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
            "backup_dir"   : "",
            "backup_files" : []
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
