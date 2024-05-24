##!/usr/bin/python

#
# ============================================================================
#
#    02.12.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CALCULATION OF ED MAPS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import sys

import command

# ============================================================================

def file_pdb       ():  return ".pdb"
def file_mtz       ():  return ".mtz"
def file_cif       ():  return ".cif"
def file_lib       ():  return ".lib"
def refmac_script  ():  return "_refmac.script"
def file_map       ():  return ".map"
def file_dmap      ():  return ".diff.map"
def fft_map_script ():  return "_fft_map.script"
def fft_dmap_script():  return "_fft_dmap.script"

_columns = {
  "refmac"      : ("FWT","PHWT","DELFWT","PHDELWT" ),
  "shelxe"      : ("FWT","PHWT" ),
  "phaser-ep"   : ("FWT","PHWT" ),
  "parrot"      : ("parrot.F_phi.F","parrot.F_phi.phi","parrot.F_phi.F","parrot.F_phi.phi"),
  "acorn-map"   : ("acorn.EO.FWT","acorn.PHI","acorn.EC.FWT","acorn.PHI" ),
  "refmac_anom" : ("FAN","PHAN","DELFAN","PHDELAN" )
}


# ============================================================================

def calcCCP4Maps ( mtzin,output_file_prefix,job_dir,file_stdout,file_stderr,
                   source_key="refmac",log_parser=None ):

    # Calculate CCP4 Maps from refinement mtz, given in mtzin. The maps will be
    # placed in files output_file_prefix_map.map and output_file_prefix_dmap.map
    #
    #  Sigmaa style 2mfo-dfc map with restored data

    LAB_F1  = None
    LAB_PHI = None
    if source_key.startswith("phaser-ep:"):
        LAB_F1  = "FLLG_"  + source_key[10:]
        LAB_PHI = "PHLLG_" + source_key[10:]
    elif source_key.startswith("acorn:"):
        LAB_F1  = source_key[6:]
        LAB_PHI = _columns["acorn-map"][1]
    else:
        LAB_F1  = _columns[source_key][0]
        LAB_PHI = _columns[source_key][1]

    # Start cfft
    rc = command.call ( "cfft",
              ["-mtzin" ,mtzin,
               "-mapout",output_file_prefix + file_map(),
               "-colin-fc","/*/*/[" + LAB_F1 + "," + LAB_PHI + "]"
              ],
              job_dir,None,file_stdout,file_stderr,log_parser )

    if rc.msg:
        file_stdout.write ( "Error calling FFT(1): " + rc.msg + "\n" )
        file_stderr.write ( "Error calling FFT(1): " + rc.msg + "\n" )

    #   Sigmaa style mfo-dfc map
    if source_key in ["refmac","acorn-map"]:

        # Start cfft
        rc = command.call ( "cfft",
                  ["-mtzin" ,mtzin,
                   "-mapout",output_file_prefix + file_dmap(),
                   "-colin-fc","/*/*/[" + _columns[source_key][2] + "," + _columns[source_key][3] + "]"
                  ],
                  job_dir,None,file_stdout,file_stderr,log_parser )

        if rc.msg:
            file_stdout.write ( "Error calling FFT(2): " + rc.msg + "\n" )
            file_stderr.write ( "Error calling FFT(2): " + rc.msg + "\n" )

    return


# ============================================================================

def calcEDMap ( xyzin,hklin,libin,hkl_dataset,output_file_prefix,job_dir,
                file_stdout,file_stderr,log_parser=None ):

    # prepare refmac input script
    scr_file = open ( refmac_script(),"w" )
    scr_file.write (
       "make check NONE\n" +
       "make -\n" +
       "    hydrogen ALL -\n" +
       "    hout NO -\n" +
       "    peptide NO -\n" +
       "    cispeptide YES -\n" +
       "    ssbridge YES -\n" +
       "    symmetry YES -\n" +
       "    sugar YES -\n" +
       "    connectivity NO -\n" +
       "    link NO\n" +
       "refi -\n" +
       "    type UNREST -\n" +
       "    resi MLKF -\n" +
       "    meth CGMAT -\n" +
       "    bref ISOT\n" +
       "ncyc 0\n" +
       "scal -\n" +
       "    type SIMP -\n" +
       "    LSSC -\n" +
       "    ANISO -\n" +
       "    EXPE\n" +
       "solvent YES\n" +
       "weight -\n" +
       "    AUTO\n" +
       "monitor MEDIUM -\n" +
       "    torsion 10.0 -\n" +
       "    distance 10.0 -\n" +
       "    angle 10.0 -\n" +
       "    plane 10.0 -\n" +
       "    chiral 10.0 -\n" +
       "    bfactor 10.0 -\n" +
       "    bsphere 10.0 -\n" +
       "    rbond 10.0 -\n" +
       "    ncsr 10.0\n" +
       "    labin  FP=" + hkl_dataset.Fmean.value +
                 " SIGFP=" + hkl_dataset.Fmean.sigma + " -\n" +
       "       FREE=" + hkl_dataset.FREE + "\n" +
       "labout  FC=FC FWT=FWT PHIC=PHIC PHWT=PHWT DELFWT=DELFWT PHDELWT=PHDELWT FOM=FOM\n" +
       "PNAME CoFE\n" +
       "DNAME\n" +
       "RSIZE 80\n" +
       "EXTERNAL WEIGHT SCALE 10.0\n" +
       "EXTERNAL USE MAIN\n" +
       "EXTERNAL DMAX 4.2\n" +
       "END\n"
    )
    scr_file.close()

    # prepare refmac command line
    cmd = [ "XYZIN" ,xyzin,
            "XYZOUT",output_file_prefix + file_pdb(),
            "HKLIN" ,hklin,
            "HKLOUT",output_file_prefix + file_mtz(),
            "LIBOUT",output_file_prefix + file_lib(),
          ]
    if libin:
        cmd += ["LIBIN",libin]

    # Start refmac
    rc = command.call ( "refmac5",cmd,
                job_dir,refmac_script(),file_stdout,file_stderr,
                log_parser=log_parser,citation_ref="refmac5-srv" )

    if rc.msg:
        file_stdout.write ( "Error calling refmac5: " + rc.msg )
        file_stderr.write ( "Error calling refmac5: " + rc.msg )

    # else: # Generate maps
    #     calcCCP4Maps ( output_file_prefix+file_mtz(),output_file_prefix,
    #                    job_dir,file_stdout,file_stderr,"refmac",log_parser )

    return rc


# ============================================================================

def calcAnomEDMap ( xyzin,hklin,hkl_dataset,anom_form,output_file_prefix,job_dir,
                    file_stdout,file_stderr,log_parser=None ):

    # prepare refmac input script
    scr_file = open ( refmac_script(),"w" )
    scr_file.write (
        anom_form   +
        "solv NO\n" +
        "refi -\n"  +
        "    type UNREST -\n" +
        "    resi MLKF -\n"   +
        "    meth CGMAT -\n"  +
        "    bref ISOT\n"     +
        "ncyc 0\n"  +
        "labin FREE="    + hkl_dataset.FREE +
               " F+="    + hkl_dataset.Fpm.plus.value +
               " SIGF+=" + hkl_dataset.Fpm.plus.sigma +
               " F-="    + hkl_dataset.Fpm.minus.value +
               " SIGF-=" + hkl_dataset.Fpm.minus.sigma + "\n" +
        "end\n"
    )
    scr_file.close()

    # prepare refmac command line
    cmd = [ "XYZIN" ,xyzin,
            "XYZOUT",output_file_prefix + file_pdb(),
            "HKLIN" ,hklin,
            "HKLOUT",output_file_prefix + file_mtz(),
            "LIBOUT",output_file_prefix + file_lib(),
          ]

    # Start refmac
    rc = command.call ( "refmac5",cmd,
                job_dir,refmac_script(),file_stdout,file_stderr,log_parser )

    if rc.msg:
        file_stdout.write ( "Error calling refmac5: " + rc.msg )
        file_stderr.write ( "Error calling refmac5: " + rc.msg )

    # else:
    #     # Generate maps
    #     calcCCP4Maps ( output_file_prefix+file_mtz(),output_file_prefix,
    #                    job_dir,file_stdout,file_stderr,"refmac_anom",log_parser )

    return
