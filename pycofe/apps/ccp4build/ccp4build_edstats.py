##!/usr/bin/python

#
# ============================================================================
#
#    01.09.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build EDStats class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
#
# ============================================================================
#
#

import os
import sys
import uuid
import math

import gemmi

import ccp4build_findwaters

# ============================================================================

class EDStats(ccp4build_findwaters.FindWaters):


    zd_cutoff_m = []
    zd_cutoff_s = []
    zd_cutoff_w = []

    def trim_chain (  self,model,clist,zd_cutoff,trim_type,modlist,cname,logf ):
        if len(clist)>0:
            logf.write ( "\n " + cname + " zd_cutoff: (" + str(zd_cutoff[0]) + ":" +\
                                                           str(zd_cutoff[1]) + "," +\
                                                           str(zd_cutoff[2]) +\
                         "), cos=" + str(zd_cutoff[3]) + "\n" )
            if trim_type=="delete":
                logf.write ( "\n Removed due to low ED correlation:\n" )
            else:
                logf.write ( "\n Trimmed to alanine due to low ED correlation:\n" )
            for item in clist:
                if item[0]>zd_cutoff[2]:
                    rid = item[1] + "-" + item[2] + "-" + item[3]
                    if rid not in modlist:
                        logf.write ( " {0:3d}  {1:7.2f}  ".format(len(modlist)+1,item[0]) +\
                                     item[1] + "/" + item[2] + "(" + item[3] + ")\n" )
                        modlist.append ( rid )
                        if trim_type=="delete":
                            del model[item[1]][item[2]][item[3]]
                        else:
                            model[item[1]][item[2]][item[3]].trim_to_alanine()
                else:
                    break

        return modlist


    # ----------------------------------------------------------------------

    def edstats (  self,
                   meta,   # meta dictionary
                   trim   ="sidechains",  # "all" for trimming all "bad" fits
                   nameout="edstats",
                   collectStats=False
                ):

        stdout_prep_fpath = self.getStdOutPath ( nameout+"_prep" )
        stderr_prep_fpath = self.getStdErrPath ( nameout+"_prep" )

        #  fix mtz (possibly redundant but recommended)

        """
        labin_f   = self.getLabel ( meta["labin_fo"],0 )
        fixed_mtz = os.path.join ( self.workdir,"_fixed.mtz" )
        self.runApp ( "mtzfix",[
                            "FLABEL",labin_f,
                            "HKLIN" ,meta["mtzpath"],
                            "HKLOUT",fixed_mtz
                      ],fpath_stdout=stdout_prep_fpath,fpath_stderr=stderr_prep_fpath )

        if not os.path.isfile(fixed_mtz):
            fixed_mtz = meta["mtzpath"]
        """
        fixed_mtz = meta["mtzpath"]

        # calculate 2mfo-dfc map assuming refmac's mtz on input

        fo_map = os.path.join ( self.workdir,"fo.map" )

        self.open_script ( "fft_fo" )
        self.write_script ([
            "TITLE Sigmaa style 2mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=FWT PHI=PHWT",
            "RESO  " + self.input_data["res_high"] + " " + self.input_data["res_low"],
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        self.close_script()

        self.runApp ( "fft",[
                            "HKLIN" ,fixed_mtz,
                            "MAPOUT",fo_map
                      ],fpath_stdout=stdout_prep_fpath,fpath_stderr=stderr_prep_fpath )

        # calculate mfo-dfc difference map assuming refmac's mtz on input

        df_map = os.path.join ( self.workdir,"df.map" )

        self.open_script ( "fft_df" )
        self.write_script ([
            "TITLE Sigmaa style mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=DELFWT PHI=PHDELWT",
            "RESO  " + self.input_data["res_high"] + " " + self.input_data["res_low"],
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        self.close_script()

        self.runApp ( "fft",[
                            "HKLIN" ,fixed_mtz,
                            "MAPOUT",df_map
                      ],fpath_stdout=stdout_prep_fpath,fpath_stderr=stderr_prep_fpath )


        #  run edstats

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )

        self.open_script ( "edstats" )
        self.write_script ([
            "resl=" + self.input_data["res_low"],
            "resh=" + self.input_data["res_high"],
            "main=resi",
            "side=resi",
        ])
        self.close_script()

        inp_pdb     = meta["xyzpath"]
        edstats_out = os.path.join ( self.workdir,nameout + ".out" )

        self.runApp ( "edstats",[
                            "XYZIN" ,inp_pdb,
                            "MAPIN1",fo_map,
                            "MAPIN2",df_map,
                            "XYZOUT",os.path.join(self.workdir,nameout+".auth.pdb"),
                            "OUT"   ,edstats_out
                      ],fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        reslist = self.getResidueLists ( edstats_out,collectStats )

        #  remove unsequenced residues and residues with badly fit mainchain

        #unklist  = meta["cbuccaneer"]["unklist"]
        mclist   = reslist["mainchain"]
        sclist   = reslist["sidechain"]
        wclist   = reslist["solvent"  ]

        zd_cutoff_m = reslist["zd_cutoff_m"]
        zd_cutoff_s = reslist["zd_cutoff_s"]
        zd_cutoff_w = reslist["zd_cutoff_w"]

        #nmod_unk = len(unklist)
        #nmod_mc  = 0
        #nmod_sc  = 0

        edstats_pdb = os.path.join ( self.workdir,nameout+".pdb" )

        st = gemmi.read_structure ( inp_pdb )
        modlist = []

        f = open ( stdout_prep_fpath,"a" )
        f.write (
            "\n\n ===================================================\n" +\
            " ZD statistics:\n\n" +\
            "                 Mean   Sigma\n" +\
            "   Mainchain: " + "{0:7.3f} {1:7.3f}".format(reslist["mean_m"],reslist["sigma_m"]) + "\n" +\
            "   Sidechain: " + "{0:7.3f} {1:7.3f}".format(reslist["mean_s"],reslist["sigma_s"]) +\
            "\n\n ===================================================\n" +\
            " Modified residues (" + inp_pdb + ")\n" )

        if trim=="all":

            for model in st:
                modlist = []   # index of deleted residues
                modlist = self.trim_chain ( model,mclist,zd_cutoff_m,"trim"  ,modlist,"Mainchain",f )
                modlist = self.trim_chain ( model,sclist,zd_cutoff_s,"trim"  ,modlist,"Sidechain",f )
                modlist = self.trim_chain ( model,wclist,zd_cutoff_w,"delete",modlist,"Solvent"  ,f )

        else:

            for model in st:
                modlist = []   # index of deleted residues
                modlist = self.trim_chain ( model,mclist,zd_cutoff_m,"delete",modlist,"Mainchain",f )
                modlist = self.trim_chain ( model,sclist,zd_cutoff_s,"trim"  ,modlist,"Sidechain",f )
                modlist = self.trim_chain ( model,wclist,zd_cutoff_w,"delete",modlist,"Solvent"  ,f )

        f.close()

        st.remove_empty_chains()
        st.write_pdb ( edstats_pdb )

        out_meta = meta.copy()
        out_meta["xyzpath"] = edstats_pdb
        out_meta["edstats"] = self.getEDStatsMetrics ( stdout_fpath )
        out_meta["edstats"]["nmodified"]     = len(modlist)
        #out_meta["edstats"]["nmodified_unk"] = nmod_unk
        #out_meta["edstats"]["nmodified_mc"]  = nmod_mc
        #out_meta["edstats"]["nmodified_sc"]  = nmod_sc
        out_meta["edstats"]["nfixed"]        = 0
        out_meta["edstats"]["reslist"]       = reslist

        return out_meta


    def getResidueLists ( self,edstats_out,collectStats ):

        mainchain = []
        sidechain = []
        solvent   = []

        mean_m  = 0
        sigma_m = 0

        mean_s  = 0
        sigma_s = 0

        xm = []
        ym = []
        xs = []
        ys = []
        xw = []
        yw = []

        with open(edstats_out,"r") as f:
            line = f.readline()
            line = f.readline().rstrip("\n")
            while line:
                lst = line.split()

                #RT  CI RN     BAm  NPm   Rm    RGm  SRGm   CCSm   CCPm ZCCPm   ZOm  ZDm  ZD-m  ZD+m     BAs  NPs   Rs    RGs  SRGs   CCSs   CCPs ZCCPs   ZOs  ZDs  ZD-s  ZD+s     BAa  NPa   Ra    RGa  SRGa   CCSa   CCPa ZCCPa   ZOa  ZDa  ZD-a  ZD+a MN CP NR
                #0   1   2     3     4   5     6      7     8      9      10     11   12    13    14     15    16   17   18    19     20     21      22    23   24    25   26      27    28   29    30    31     32    33     34     35   36   37     38  39 40 41
                    #LEU A  17    36.7   86 0.244 0.533 0.012  0.587  0.718   8.4   1.7  7.8   0.0   7.8    33.8   49 0.194 0.383 0.026  0.914  0.865   9.2   1.2  0.2   0.0   0.2    35.6  135 0.227 0.501 0.011  0.680  0.750  11.3   1.5  7.3   0.0   7.3  1 A   1

                zdm = float(lst[12])
                if lst[0]=="HOH":
                    lst[1] = "W"  #  due to a bug or feature in edstats
                    solvent.append ( [zdm,lst[1],lst[2].replace(":",""),lst[0]] )
                else:
                    mainchain.append ( [zdm,lst[1],lst[2].replace(":",""),lst[0]] )
                    mean_m += zdm
                    if len(lst)>24:
                        if lst[24]!="n/a":
                            zds = float(lst[24])
                            sidechain.append ( [zds,lst[1],lst[2].replace(":",""),lst[0]] )
                            mean_s += zds

                line = f.readline().rstrip("\n")

        if len(mainchain)>0:
            mean_m /= len(mainchain)
            for i in range(len(mainchain)):
                for j in range(i+1,len(mainchain)):
                    if mainchain[j][0]>mainchain[i][0] or (mainchain[j][3]=="UNK" and mainchain[i][3]!="UNK"):
                        rl = [mainchain[i][0],mainchain[i][1],mainchain[i][2],mainchain[i][3]]
                        mainchain[i] = [mainchain[j][0],mainchain[j][1],mainchain[j][2],mainchain[j][3]]
                        mainchain[j] = rl
                xm.append ( len(xm)+1.0     )
                ym.append ( mainchain[i][0] )
                d = mainchain[i][0] - mean_m
                sigma_m += d*d
            sigma_m = math.sqrt(sigma_m/len(mainchain))

        if len(sidechain)>0:
            mean_s /= len(sidechain)
            for i in range(len(sidechain)):
                for j in range(i+1,len(sidechain)):
                    if sidechain[j][0]>sidechain[i][0] or (sidechain[j][3]=="UNK" and sidechain[i][3]!="UNK"):
                        rl = [sidechain[i][0],sidechain[i][1],sidechain[i][2],sidechain[i][3]]
                        sidechain[i] = [sidechain[j][0],sidechain[j][1],sidechain[j][2],sidechain[j][3]]
                        sidechain[j] = rl
                xs.append ( len(xs)+1.0     )
                ys.append ( sidechain[i][0] )
                d = sidechain[i][0] - mean_s
                sigma_s += d*d
            sigma_s = math.sqrt(sigma_s/len(sidechain))

        if len(solvent)>0:
            for i in range(len(solvent)):
                for j in range(i+1,len(solvent)):
                    if solvent[j][0]>solvent[i][0]:
                        rl = [solvent[i][0],solvent[i][1],solvent[i][2],solvent[i][3]]
                        solvent[i] = [solvent[j][0],solvent[j][1],solvent[j][2],solvent[j][3]]
                        solvent[j] = rl
                xw.append ( len(xw)+1.0   )
                yw.append ( solvent[i][0] )

        """
        zd_m = self.zd_cutoff ( xm,ym,"main" )
        zd_s = self.zd_cutoff ( xs,ys,"side" )
        zd_w = self.zd_cutoff ( xw,yw,"solvent" )
        zdm  = zd_m[2]

        if collectStats and self.zd_cutoff_m is not None:
            zdm = (zd_m[2]+self.zd_cutoff_m)/2.0
            zds = (zd_s[2]+self.zd_cutoff_s)/2.0
            zdw = (zd_w[2]+self.zd_cutoff_w)/2.0
        self.zd_cutoff_m = zd_m[2]
        self.zd_cutoff_s = zd_s[2]
        self.zd_cutoff_w = zd_w[2]
            zd_m[2] = zdm
            zd_s[2] = zds
            zd_w[2] = zdw
        """

        zd_m = self.zd_cutoff ( xm,ym,"main" )
        zd_s = self.zd_cutoff ( xs,ys,"side" )
        zd_w = self.zd_cutoff ( xw,yw,"solvent" )

        if collectStats:

            self.zd_cutoff_m.append ( zd_m[2] )
            self.zd_cutoff_s.append ( zd_s[2] )
            self.zd_cutoff_w.append ( zd_w[2] )

            zdm = 0.0
            zds = 0.0
            zdw = 0.0
            weight = 0.0
            for i in range(len(self.zd_cutoff_m)):
                w  = 1.0
                w /= len(self.zd_cutoff_m) - i  # focus on the latest
                #w  = math.sqrt(math.sqrt(w))
                zdm += w*self.zd_cutoff_m[i]
                zds += w*self.zd_cutoff_s[i]
                zdw += w*self.zd_cutoff_w[i]
                weight += w

            zd_m[2] = zdm/weight
            zd_s[2] = zds/weight
            zd_w[2] = zdw/weight

        return  { "mainchain"   : mainchain, "sidechain" : sidechain,
                  "mean_m"      : mean_m   , "mean_s"    : mean_s,
                  "sigma_m"     : sigma_m  , "sigma_s"   : sigma_s,
                  "solvent"     : solvent  ,
                  "zd_cutoff_m" : zd_m,
                  "zd_cutoff_s" : zd_s,
                  "zd_cutoff_w" : zd_w
                  #"zd_cutoff_m" : self.zd_cutoff ( xm,ym,"main" ),
                  #"zd_cutoff_s" : self.zd_cutoff ( xs,ys,"side" ),
                  #"zd_cutoff_w" : self.zd_cutoff ( xw,yw,"solvent" )
                }


    def getEDStatsMetrics ( self,stdout_fpath ):
        meta = {}
        with open(stdout_fpath,"r") as f:
            key = 0
            for line in f:
                if line.strip():
                    if key>0:
                        lst = line.split()
                        meta["EDCC"]  = float(lst[3])
                        meta["ZEDCC"] = float(lst[4])
                        break;
                    elif "Overall average scores for all residues:" in line:
                        key = 1
        return meta


    """
    def linreg ( self,x,y ):
        #  Returns linear regression coefficients (a,b) of (x,y): y=a+b*x

        n  = len(x)
        xm = 0.0
        ym = 0.0
        for i in range(n):
            xm += x[i]
            ym += y[i]

        xm  /= n
        ym  /= n
        cov  = 0.0
        var  = 0.0
        for i in range(n):
            dx   = x[i] - xm
            cov += dx*(y[i]-ym)
            var += dx*dx

        b = cov/var
        a = ym - b*xm

        return (a,b)


    def zd_cutoff ( self,x,y ):
        #  y(x) is assumed to be a bi-linear function, such that it can be
        #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
        #  This function returns index of "optimal" values (x0,y0)

        n  = len(x)
        n0 = 0
        x0 = x[0]
        y0 = y[0]
        if n>5:

            ymin = y[0]
            ymax = y[0]
            for i in range(1,n):
                ymin = min ( ymin,y[i] )
                ymax = max ( ymax,y[i] )

            xmin = x[0]
            xmax = x[n-1]

            scx = xmax - xmin
            scy = ymax - ymin

            if scy>0.0:

                x1 = []
                y1 = []
                for i in range(n):
                    x1.append ( (x[i]-xmin)/scx )
                    y1.append ( (y[i]-ymin)/scy )

                cos0 = 1.0
                for i in range(2,n-2):
                    a1,b1 = self.linreg ( x1[:i],y1[:i] )
                    a2,b2 = self.linreg ( x1[i:],y1[i:] )
                    cos   = (1.0+b1*b2)/math.sqrt((1.0+b1*b1)*(1.0+b2*b2))
                    if cos<cos0:
                        cos0 = cos
                        x0   = (a1-a2)/(b2-b1)
                        y0   = a1 + b1*x0
                        n0   = i

                x0 = xmin + scx*x0
                y0 = ymin + scy*y0

        return (n0,x0,y0)
    """

    def zd_cutoff_1 ( self,x,y,chain_type ):
        #  y(x) is assumed to be a bi-linear function, such that it can be
        #  approximated by y=a1+b1*x up until x0, and y=a2+b2*x beyond that.
        #  This function returns index of "optimal" values (x0,y0)

        #if chain_type=="solvent":
        #    return (0,0.0,1.5,1.0)

        if chain_type=="solvent":
            if self.input_data["trim_mode_w"]=="fixed":
                return (0,0.0,float(self.input_data["trim_zdw"]),1.0)
        elif self.input_data["trim_mode"]=="fixed":
            if chain_type=="main":
                return (0,0.0,float(self.input_data["trim_zdm"]),1.0)
            else:
                return (0,0.0,float(self.input_data["trim_zds"]),1.0)

        n    = len(x)
        n0   = 0
        x0   = 0.0
        y0   = 1.0
        cos0 = 1.0

        if n>2:
            ymin = y[0]
            ymax = y[0]
            for i in range(1,n):
                ymin = min ( ymin,y[i] )
                ymax = max ( ymax,y[i] )

            scx = x[n-1] - x[0]
            scy = ymax - ymin

            x0   = x[0]
            y0   = ymax

            if scy>0.0:

                cos0 = 0.85
                xl   = x[n-1]
                yl   = y[n-1]
                for i in range(1,n-1):
                    dx1 = (x[i]-x[0])/scx
                    dy1 = (y[i]-y[0])/scy
                    dx2 = (xl-x[i])/scx
                    dy2 = (yl-y[i])/scy
                    if abs(dy1)>0.0 and abs(dy2)>0.0:
                        cos = (dx1*dx2+dy1*dy2)/math.sqrt((dx1*dx1+dy1*dy1)*(dx2*dx2+dy2*dy2))
                        if cos<cos0:
                            cos0 = cos
                            n0   = i
                            x0   = x[i]
                            y0   = y[i]

        elif n>0:
            x0 = x[0]
            y0 = y[0]

        if chain_type=="solvent":
            if self.input_data["trim_mode_w"]=="restricted":
                y0 = min ( float(self.input_data["trimmax_zdw"]),
                           max(float(self.input_data["trimmin_zdw"]),y0) )
        elif self.input_data["trim_mode"]=="restricted":
            if chain_type=="main":
                y0 = min ( float(self.input_data["trimmax_zdm"]),
                           max(float(self.input_data["trimmin_zdm"]),y0) )
            else:
                y0 = min ( float(self.input_data["trimmax_zds"]),
                           max(float(self.input_data["trimmin_zds"]),y0) )

        return [n0,x0,y0,cos0]


    def zd_cutoff ( self,x,y,chain_type ):
        # calculate boundary between high and low changes in y

        if chain_type=="solvent":
            if self.input_data["trim_mode_w"]=="fixed":
                return (0,0.0,float(self.input_data["trim_zdw"]),1.0)
        elif self.input_data["trim_mode"]=="fixed":
            if chain_type=="main":
                return (0,0.0,float(self.input_data["trim_zdm"]),1.0)
            else:
                return (0,0.0,float(self.input_data["trim_zds"]),1.0)

        n  = len(x)
        n0 = 0
        x0 = 0.0
        y0 = 1.0

        if n>2:
            dy  = []
            dy2 = []
            for i in range(1,n):
                d = y[i-1] - y[i]  # always positive
                dy .append ( d )
                dy2.append ( d*d )
            nmax = int(n/4)
            kmax = 0
            for i in range(1,nmax):
                dym = 0.0
                dys = 0.0
                for j in range(i,len(dy)):
                    dym += dy[j]
                    dys += dy2[j]
                dym /= (n-i)
                dys /= (n-i)
                dys  = math.sqrt ( dys - dym*dym )
                dy0  = dym + 3.0*dys  # threshold value
                k    = 0
                for j in range(i):
                    if dy[j]>dy0:
                        k += 1
                if k>kmax:
                    kmax = k
                    n0   = i
        if n>0:
            x0 = x[n0]
            y0 = y[n0]
            if n0>0:
                x0 = (x0+x[n0-1])/2.0
                y0 = (y0+y[n0-1])/2.0

        if chain_type=="solvent":
            if self.input_data["trim_mode_w"]=="restricted":
                y0 = min ( float(self.input_data["trimmax_zdw"]),
                           max(float(self.input_data["trimmin_zdw"]),y0) )
        elif self.input_data["trim_mode"]=="restricted":
            if chain_type=="main":
                y0 = min ( float(self.input_data["trimmax_zdm"]),
                           max(float(self.input_data["trimmin_zdm"]),y0) )
            else:
                y0 = min ( float(self.input_data["trimmax_zds"]),
                           max(float(self.input_data["trimmin_zds"]),y0) )

        return [n0,x0,y0,1.0]
