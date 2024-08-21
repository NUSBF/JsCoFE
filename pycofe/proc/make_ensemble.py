##!/usr/bin/python

#
# ============================================================================
#
#    02.02.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORINATE ENSEMBLE MAKER
#
#  Makes structural alignment of an ensemble with Gesamt, reports all
#  Gesamt's scores etc. and puts export data widget
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2023
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
import re
import math

#  ccp4-python imports
import gemmi

#  application imports
#from  pycofe.dtypes  import dtype_sequence
#from  pycofe.varut   import command

# ============================================================================

def make_fpath ( fpath,suffix ):
    slpt = os.path.splitext(fpath)
    return slpt[0] + "." + suffix + slpt[1]


# ============================================================================

def run ( body, panelId, models,fpath_out, # body is reference to the basic class
                trims=[80,60,40],
                logType="Service" ):
#  models is array of the following form:
#   [[path1,sel1],[path2,sel2], ..., [pathN,selN]]
#  if any 'selK' is missing, full selection is assumed. In this case, only path
#  string must be given, e.g.
#   [[path1,sel1],path2, ...,[pathN,selN]]
#  returns list of ensemble files generated

    nmodels   = len(models)
    fout_list = []

    if nmodels==1:

        if isinstance(models[0],str):
            shutil.copyfile ( models[0],fpath_out )
        else:
            shutil.copyfile ( models[0][0],fpath_out )

        fout_list.append ( [ fpath_out,"Single-model ensemble" ] )

    else:

        cmd = []
        for i in range(nmodels):
            if isinstance(models[i],str):
                cmd += [models[i]]
            else:
                cmd += [models[i][0],"-s",models[i][1]]

        cmd += [ "-o",fpath_out,"-o-cs" ]
        body.runApp ( "gesamt",cmd,logType )

        if os.path.isfile(fpath_out):

            body.flush()
            if logType=="Service":
                body.file_stdout1.close()
                fpath_log = body.file_stdout1_path()
            else:
                body.file_stdout.close()
                fpath_log = body.file_stdout_path()

            tag_start = " -------+-+------------+-+----------"
            tag_end   = " -------'-'------------'-'----------"
            alind     = 3
            if nmodels==2:
                tag_start = "|-------------+------------+-------------|"
                tag_end   = "`-------------'------------'-------------'"
                alind     = 2
            alignment  = []
            rmsd       = []
            nalign     = 0
            rmsd_ave   = 0.0
            rmsd_sigma = 0.0
            tkey       = 0
            with (open(fpath_log,'r')) as fstd:
                for line in fstd:
                    if tag_start in line:
                        tkey = 1
                    elif tag_end in line:
                        break
                    elif tkey>0:
                        lst  = line.replace("|S|","|  ").replace("|H|","|  ").split('|')
                        slst = [x.strip() for x in lst]
                        algn = [slst[0]]
                        if nmodels==2:
                            if slst[2]:
                                algn = [ re.findall(r"[-+]?\d*\.\d+|\d+",slst[2])[0] ]
                            else:
                                algn = [ "" ]
                        k = alind - 1
                        for i in range(nmodels):
                            algn.append ( slst[k] )
                            k += 2
                        alignment.append ( algn )
                        if algn[0]:
                            nalign     += 1
                            rms         = float(algn[0])
                            rmsd.append ( rms )
                            rmsd_ave   += rms
                            rmsd_sigma += rms*rms
            if nalign>0:
                rmsd_ave   = rmsd_ave / nalign
                rmsd_sigma = math.sqrt ( rmsd_sigma/nalign   - rmsd_ave*rmsd_ave )

            if logType=="Service":
                body.file_stdout1 = open ( body.file_stdout1_path(),'a' )
            else:
                body.file_stdout = open ( body.file_stdout_path(),'a' )

            fout_list.append ( [ fpath_out,"Untrimmed ensemble" ] )

            # trim ends
            st = gemmi.read_structure ( fpath_out )
            st.setup_entities()
            for j in range(len(alignment)):
                algn = alignment[-1-j]
                if algn[0]:
                    break
                else:
                    for k in range(nmodels):
                        if algn[k+1]:
                            del st[k][0][-1]
            for j in range(len(alignment)):
                algn = alignment[j]
                if algn[0]:
                    break
                else:
                    for k in range(nmodels):
                        if algn[k+1]:
                            del st[k][0][0]

            ftrimmed = make_fpath ( fpath_out,"trimmed" )
            fout_list.append ( [ ftrimmed,"Ends-trimmed ensemble (100% trim)" ] )
            st.write_pdb ( ftrimmed )

            # trim sigmas
            rmsd = sorted(rmsd)
            for i in range(len(trims)):
                if trims[i]<100:
                    rmsd0 = rmsd[int(trims[i]*(len(rmsd)-1)/100)]
                    st = gemmi.read_structure ( fpath_out )
                    st.setup_entities()
                    nres = []
                    for j in range(nmodels):
                        nres.append ( len(st[j][0])-1 )
                    for j in range(len(alignment)):
                        algn = alignment[-1-j]
                        if not algn[0] or float(algn[0])>rmsd0:
                            for k in range(nmodels):
                                if algn[k+1]:
                                    del st[k][0][nres[k]]
                        for k in range(nmodels):
                            if algn[k+1]:
                                nres[k] -= 1
                    ftrimmed = make_fpath ( fpath_out,str(trims[i]) )
                    fout_list.append ( [ ftrimmed,"Ensemble trimmed at " +\
                                                  str(trims[i]) + "%" ] )
                    st.write_pdb ( ftrimmed )

    return fout_list
