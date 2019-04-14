##!/usr/bin/python

#
# ============================================================================
#
#    31.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#

import sys
import os
import uuid

import ccp4build_cbuccaneer

# ============================================================================

class Refmac(ccp4build_cbuccaneer.CBuccaneer):

    # refmac options
    refmac_cycles  = 30    # default number of cycles
    '''
    refmac_options = {
        #"ncyc"              : 30,
        "weight"            : "AUTO",
        "make check"        : "NONE",
        "make+hydrogen"     : "NO",
        "make+hout"         : "NO",
        "make+peptide"      : "NO",
        "make+cispeptide"   : "YES",
        "make+ssbridge"     : "YES",
        "make+symmetry"     : "YES",
        "make+sugar"        : "YES",
        "make+connectivity" : "NO",
        "make+link"         : "NO",
        "refi+type"         : "REST PHASE",
        "refi+resi"         : "MLKF",
        "refi+meth"         : "CGMAT",
        "refi+bref"         : "ISOT",
        "scal+type"         : "SIMP LSSC ANISO EXPE",
        "solvent"           : "YES VDWProb 1.4 IONProb 0.8 RSHRink 0.8",
        "PHOUT"             : True,
        "PNAME"             : "buccaneer",
        "DNAME"             : "buccaneer"
    }

    refmac_options_bucc = {
        #"ncyc"              : 30,
        "weight"            : "AUTO",
        "make+check"        : "NONE",
        "make"              : "hydrogen NO hout NO peptide NO cispeptide YES ssbridge YES symmetry YES sugar YES connectivity NO link NO",
        "refi"              : "type REST PHASE resi MLKF meth CGMAT bref ISOT",
        "scal"              : "type SIMP LSSC ANISO EXPE",
        "solvent"           : "YES VDWProb 1.4 IONProb 0.8 RSHRink 0.8",
        "PHOUT"             : True,
        "PNAME"             : "buccaneer",
        "DNAME"             : "buccaneer"
    }
    '''

    refmac_options_bucc = {
        #NCYCLES 10
        "weight"            : "AUTO",
        "make+check"        : "NONE",
        "make+hydr"         : "NO",
        "refi"              : "BREF ISOT",
        "MAKE+NEWLIGAND"    : "NOEXIT",
        "SCALE+TYPE"        : "SIMPLE",
        "SOLVENT"           : "YES",
        "PHOUT"             : True
    }

    refmac_options_jelly = {
        #"NCYC"           : 50,
        "WEIGHT"         : "AUTO",
        "MAKE+HYDR"      : "NO",
        "REFI"           : "BREF ISOT",
        "SCALE+TYPE"     : "SIMPLE",
        "SOLVENT"        : "YES",
        "NCSR"           : "LOCAL",
        "RIDG+DIST+SIGM" : 0.01,
        "RIDG+DIST+DMAX" : 4.2,
        "PHOUT"          : True
        #"REFI+RESO"      : "19.91 1.59",
        #REFI RESO 71.09 2.12
        #MAKE NEWLIGAND EXIT
    }

    refmac_options_simple = {
        #LABIN FP=F SIGFP=SIGF FREE=FREE
        #NCYC 10
        "WEIGHT"         : "AUTO",
        "MAKE+HYDR"      : "NO",
        "REFI+BREF"      : "ISOT",
        "SCALE+TYPE"     : "SIMPLE",
        "SOLVENT"        : "YES",
        "NCSR"           : "LOCAL",
        #"REFI RESO"      : " 19.91 1.59
        "MAKE+NEWLIGAND" : "EXIT",
        "PHOUT"             : True
    }


    """
    LABIN FP=F SIGFP=SIGF FREE=FREE
    NCYC 40
    WEIGHT AUTO
    MAKE HYDR NO
    REFI BREF ISOT
    SCALE TYPE SIMPLE
    SOLVENT YES
    NCSR LOCAL
    RIDG DIST SIGM 0.01
    RIDG DIST DMAX 4.2
    REFI RESO 19.91 1.59
    MAKE NEWLIGAND EXIT
    END
    """

    # ----------------------------------------------------------------------

    def readRefmacOptions ( self ):
        self.refmac_options_bucc   = self.readPGMOptions ( "refmac_bucc"  ,self.refmac_options_bucc   )
        self.refmac_options_jelly  = self.readPGMOptions ( "refmac_jelly" ,self.refmac_options_jelly  )
        self.refmac_options_simple = self.readPGMOptions ( "refmac_simple",self.refmac_options_simple )
        return

    # ----------------------------------------------------------------------

    def refmac (  self,
                  meta,               # meta dictionary
                  ncycles = -1,       #  -1 means "use default"
                  mode    = "bucc",   #  "simple" or "jelly"
                  nameout = "refmac"
               ):

        self.open_script ( "refmac" )

        self.write_script ([
            "title " + self.job_title + "_refmac"
        ])

        labin_hkl  = self.splitLabin ( meta["labin_fo"] )
        labin_free = meta["labin_free"].replace("[","").replace("]","")

        hklin = self.input_data["mtzpath"]  # works in case of MR

        if (self.input_data["mode"]=="EP") and meta["labin_hl"]:
            hklin = meta["mtzpath"]
            labin_abcd = self.splitLabin ( meta["labin_hl"] )
            self.write_script ([
                "labin HLA="  + labin_abcd[0]  + " HLB="    + labin_abcd[1] +\
                     " HLC="  + labin_abcd[2]  + " HLD="    + labin_abcd[3] +\
                     " FP="   + labin_hkl[0]   + " SIGFP="  + labin_hkl[1]  +\
                     " FREE=" + labin_free
            ])
        #elif meta["labin_phifom"]:
        #    labin_phifom = self.splitLabin ( meta["labin_phifom"] )
        #    self.write_script ([
        #        "labin PHIB=" + labin_phifom[0] + " FOM="   + labin_phifom[1] +\
        #             " FP="   + labin_hkl[0]    + " SIGFP=" + labin_hkl[1]    +\
        #             " FREE=" + labin_free
        #    ])
        else:
            self.write_script ([
                "labin FP="  + labin_hkl[0] + " SIGFP=" + labin_hkl[1] +\
                    " FREE=" + labin_free
            ])

        if ncycles>=0:
            self.write_script ([ "ncyc " + str(ncycles) ])
        else:
            self.write_script ([ "ncyc " + str(self.refmac_cycles) ])

        if mode=="bucc":
            self.write_script ( self.refmac_options_bucc   )
        elif mode=="simple":
            self.write_script ( self.refmac_options_simple )
        else:
            self.write_script ( self.refmac_options_jelly  )

        self.write_script ([
            "REFI RESO  " + self.input_data["res_low"] + " " + self.input_data["res_high"]
        ])


        self.write_script ([ "END" ])
        self.close_script()

        refmac_mtzout = os.path.join ( self.workdir,nameout + ".mtz" )
        refmac_xyzout = os.path.join ( self.workdir,nameout + ".pdb" )

        cmd = [ "hklin" ,hklin,
                "xyzin" ,meta["xyzpath"],
                "hklout",refmac_mtzout,
                "xyzout",refmac_xyzout,
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        self.runApp ( "refmac5",cmd,
                      fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        self.unsetLogParser()

        f = open ( refmac_xyzout,"r" )
        flist = f.readlines()
        f.close()
        f = open ( refmac_xyzout,"w" )
        for line in flist:
            if not line.startswith("TER "):
                f.write ( line )
        f.close()

        out_meta = meta.copy()
        out_meta["mtzpath"]      = refmac_mtzout
        out_meta["xyzpath"]      = refmac_xyzout
        out_meta["labin_phifom"] = "/*/*/[PHIC_ALL_LS,FOM]"
        out_meta["labin_fc"]     = "/*/*/[FWT,PHWT]"
        out_meta["labin_dfc"]    = "/*/*/[DELFWT,PHDELWT]"
        out_meta["labin_hl"]     = "/*/*/[HLACOMB,HLBCOMB,HLCCOMB,HLDCOMB]"
        out_meta["refmac"]       = self.getRefmacMetrics ( stdout_fpath )

        #return out_meta

        return self.mergeHKL ( out_meta,self.input_data,nameout,
                               fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )




    def getRefmacMetrics ( self,stdout_fpath ):
        meta = {}
        with open(stdout_fpath,"r") as f:
            key = 0
            for line in f:
                if key>0:
                    lst = line.split()
                    if "R factor" in line:
                        meta["rfactor"] = [float(lst[2]),float(lst[3])]
                    elif "R free" in line:
                        meta["rfree"]   = [float(lst[2]),float(lst[3])]
                    elif "Rms BondLength" in line:
                        meta["bond_length"] = [float(lst[2]),float(lst[3])]
                    elif "Rms BondAngle" in line:
                        meta["bond_angle"]  = [float(lst[2]),float(lst[3])]
                    elif "Rms ChirVolume" in line:
                        meta["chir_volume"] = [float(lst[2]),float(lst[3])]
                        break;
                elif "$TEXT:Result: $$ Final results $$" in line:
                    key = 1
        return meta
