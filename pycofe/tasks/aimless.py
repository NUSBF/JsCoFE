##!/usr/bin/python

#
# ============================================================================
#
#    10.08.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AIMLESS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python aimless.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskyi 2017-2024
#
# ============================================================================
#

#  python native imports
import os
# import sys
# import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from  pycofe.dtypes  import  dtype_template
from  pycofe.proc    import  datred_utils, import_filetype, import_merged
from  pycofe.auto    import  auto, auto_workflow

# ============================================================================
# Make Aimless driver

class ParamStorage(object):
    pass

class Aimless(basic.TaskDriver):

    # make task-specific definitions
    def pointless_xml    (self):  return "pointless.xml"
    def pointless_mtz    (self):  return "pointless.mtz"
    def pointless_report (self):  return "pointless_report"
    def aimless_xml      (self):  return "aimless.xml"
    def aimless_unmerged (self):  return "aimless_unmerged.mtz"
    def aimless_report   (self):  return "aimless_report"
    def ctruncate_mtz    (self):  return "merged.mtz"
    def ctruncate_report (self):  return "ctruncate_report"
    def symm_det         (self):  return "symm_det_table"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------

#   def log(self, *args):
#       self.file_stdout.write(repr(args))
#       self.file_stdout.write('\n')

    def run(self):

        unmerged = self.input_data.data.unmerged
        for i in range(len(unmerged)):
            unmerged[i] = self.makeClass ( unmerged[i] )
        merge_separately = len(unmerged) > 1
        reso_list = [str(ds.dataset.reso) for ds in unmerged]
        reso_high = min(reso_list, key=lambda x: float(x))

        par = ParamStorage()
        for k1, v1 in sorted(vars(self.task.parameters).items()):
            for k2, v2 in sorted(vars(v1.contains).items()):
                if v2.type != 'label':
                    assert k2 not in vars(par)
                    p2 = self.getParameter(v2).strip()
#                   self.log(k1, k2, p2)
                    setattr(par, k2, p2)

        aimless_lines = list()
        scalingProtocol        ( par, aimless_lines )
        scalingDetails         ( par, aimless_lines )
        rejectOutliers         ( par, aimless_lines )
        SDcorrection           ( par, aimless_lines )
        intensitiesAndPartials ( par, aimless_lines )
#       self.log('# Aimless parameters')
#       for line in aimless_lines:
#           self.log(' '.join(line.split()))

        pointless_lines = list()
        pointlessParams(par, pointless_lines, reso_high)
#       self.log('# Pointless parameters')
#       for line in pointless_lines:
#           self.log(' '.join(line.split()))

        if merge_separately:
            merge_separately = par.MERGE_DATASETS == 'SEPARATELY'

# for quick tests of parameters:
#       else:
#           self.success ( True )
#           return
#   def tmp(self):

        ds0 = self.makeClass ( self.input_data.data.ds0[0] )
        if ds0._type=="DataUnmerged":
            mtzRef = ds0.getUnmergedFilePath ( self.inputDir() )
        else:
            mtzRef = ds0.getHKLFilePath ( self.inputDir() )
        symm_select = ds0.symm_select if ds0._type=="DataUnmerged" else None
        #self.stderrln ( " >>>> " + str(ds0.symm_select) )

        plist = [[ds.dataset,ds.getUnmergedFilePath(self.inputDir()),ds.runs] for ds in unmerged]
        format_list = [getattr(ds.dataset,'original_format','unknown') for ds in unmerged]
        # see (A) below
        # onlymerge = not sum([f != 'xds_scaled' for f in format_list])

        script_list = datred_utils.get_point_script (
                            symm_select,mtzRef,plist,
                            self.pointless_mtz(),self.pointless_xml(),
                            merge_separately )

        if len(script_list)==3:
            title = [ "<h3>1. Extracting selected images</h3>",
                      "<h3>2. Symmetry assignment</h3>",
                      "<h3>3. Generating symmetry tables</h3>" ]
        elif len(script_list)==2:
            title = [ "<h3>1. Extracting selected images and assigning symmetry</h3>",
                      "<h3>2. Generating symmetry tables</h3>" ]
        else:
            self.fail (
                "<p>&nbsp;wrong number of pointless scripts: possible error in datred_utils.py",
                "wrong number of pointless scripts" )
            return

# print all pointless scripts
#       self.file_stdout.write('#!/bin/sh -xe\n')
#       for script in script_list:
#           self.file_stdout.write('#-------------------------------------\n')
#           self.file_stdout.write('pointless <<+\n')
#           for line in pointless_lines:
#               self.file_stdout.write(line + '\n')
#
#           self.file_stdout.write(script)
#           self.file_stdout.write('+\n')
#
#       self.file_stdout.write('#-------------------------------------\n')
        n = 0
        for script in script_list:

            self.open_stdin()
            for line in pointless_lines:
                self.write_stdin ( line + '\n' )

            self.write_stdin ( script )
            self.close_stdin()

            self.putMessage ( title[n] )

            # Prepare report parser
            panel_id = self.pointless_report() + "_" + str(n)
            self.setGenericLogParser ( panel_id,True )

            try:
                os.remove ( self.pointless_xml() )   #  needed for Windows
            except OSError:
                pass
            self.runApp ( "pointless",[],logType="Main" )
            n += 1

        #self.putSection ( self.symm_det(),"Symmetry determination tables",True )
        pyrvapi.rvapi_add_section ( self.symm_det(),"Symmetry determination tables",
                                    panel_id,3,0,1,1,False )

        table_list = datred_utils.parse_xmlout(self.pointless_xml())
        datred_utils.report(table_list, self.symm_det())

        # dump_keyargs = dict(sort_keys=True, indent=4, separators=(',', ': '))
        # print json.dumps(datred_utils.tabs_as_dict(tab_list), **dump_keyargs)

        self.open_stdin()

        # (A) currently this is an option
        # it needs to be set before upload or after import, as a subtype
        # if onlymerge:
        #     self.write_stdin ( "ONLYMERGE\n" )

        for line in aimless_lines:
            self.write_stdin ( line + '\n' )

        self.write_stdin ([
            "XMLOUT      " + self.aimless_xml(),
            "OUTPUT      UNMERGED",
            "UNMERGEDOUT " + self.aimless_unmerged(),
            "END"
        ])
        self.close_stdin()

        self.putMessage ( "<h3>" + str(n+1) + ". Scaling and merging</h3>" )
        self.setGenericLogParser ( self.aimless_report(),True )

        self.runApp ( "aimless",[ "HKLIN",self.pointless_mtz(),"HKLOUT",
                                          self.getMTZOFName() ],logType="Main" )

        # ====================================================================
        # do individual data type imports

        self.putTitle ( "Results" )

        # get list of files to import
        output_ok = True
        self.resetFileImport()
        hkl = []
        if merge_separately:
            for i in range(len(unmerged)):
                file_i = "aimless_" + str(i+1) + ".mtz"
                if os.path.isfile(file_i):
                    self.addFileImport ( file_i,import_filetype.ftype_MTZMerged() )
                else:
                    output_ok = False
                    break

            if output_ok:
                hkl = import_merged.run ( self,importPhases="" )

        else:
            file_i = self.getMTZOFName()
            if os.path.isfile(file_i):
                self.addFileImport ( file_i,import_filetype.ftype_MTZMerged() )
                hkl = import_merged.run ( self,"Reflection dataset",importPhases="" )
            else:
                output_ok = False

        if (len(hkl)>0) and os.path.isfile(self.aimless_xml()):
            aimless_meta = {
                "jobId"    : self.job_id,
                "file_xml" : dtype_template.makeFileName ( self.job_id,
                                    self.dataSerialNo+1,self.aimless_xml() )
            }
            aimless_xml_path = os.path.join(self.outputDir(),aimless_meta["file_xml"])
            os.rename ( self.aimless_xml(),aimless_xml_path )

            res_high = 10000.0
            res_low  = 0.0
            for i in range(len(hkl)):
                if i<len(unmerged) and hasattr(unmerged[i],"ha_type"):
                    hkl[i].ha_type = unmerged[i].ha_type
                hkl[i].aimless_meta = aimless_meta
                res_high = min ( res_high,float(hkl[i].getHighResolution()) )
                res_low  = max ( res_low ,float(hkl[i].getLowResolution ()) )
                # self.stderr('\n\n' + str(hkl[i].dataStats) + '\n\n')
                hkl[i].readAimlessDataStats ( aimless_xml_path )
                # self.stderr('\n\n' + str(hkl[i].dataStats) + '\n\n')

            if "aimless" in self.generic_parser_summary:
                self.generic_parser_summary["aimless"]["res_high"] = res_high
                self.generic_parser_summary["aimless"]["res_low"]  = res_low

        if os.path.isfile(self.aimless_unmerged()):
            aimless_meta["jobId"]    = self.job_id;
            aimless_meta["file_unm"] = dtype_template.makeFileName ( self.job_id,
                                       self.dataSerialNo+1,self.aimless_unmerged() )
            os.rename ( self.aimless_unmerged(),
                        os.path.join(self.outputDir(),aimless_meta["file_unm"]) )


        # close execution logs and quit

        if output_ok:
            
            if "aimless" in self.generic_parser_summary:
                dsum = self.generic_parser_summary["aimless"]
                dsum["summary_line"] = "Compl="                 + str(dsum["Completeness"]) + "%" +\
                                       " CC<sub>1/2</sub>="     + str(dsum["Half_set_CC"])  +\
                                       " R<sub>meas_all</sub>=" + str(dsum["R_meas_all"])   +\
                                       " R<sub>meas_ano</sub>=" + str(dsum["R_meas_ano"])   +\
                                       " Res=" + str(dsum["res_high"])  + "-" + str(dsum["res_low"]) +\
                                       " SpG=" + dsum["Space_group"]

            if self.task.autoRunName.startswith("@"):
                # scripted workflow framework
                variables = {
                    "N_hkl"      : len(hkl),
                    "N_hkl_anom" : 0
                }
                for i in range(len(hkl)):
                    if hkl[i].isAnomalous():
                        variables["N_hkl_anom"] += 1
                auto_workflow.nextTask ( self,{
                    "data"  : {
                        "hkl" : hkl,
                    },
                    "variables" : variables
                })
                # self.putMessage ( "<h3>Workflow started</hr>" )
            else:
                auto.makeNextTask ( self,{
                    "hkl" : hkl
                })

            self.success ( True )

        else:
            self.file_stdout.write ( "Aimless failed, see above." )
            if self.task.autoRunName.startswith("@"):
                self.putMessage ( "<h3>Workflow stopped</h3>" )
            self.fail ( "<p>&nbsp;Aimless failed, see Log and Error tabs for details",
                        "Aimless_Failed" )

        return


# ============================================================================

def scalingProtocol(par, lines):

    if par.PERFORM_SCALING == 'NO':
        lines.append('ONLYMERGE')
        return

    s = 'SCALES'
    if par.SCALING_PROTOCOL == 'CONSTANT':
        s += ' CONSTANT'

    elif par.SCALING_PROTOCOL == 'BATCH':
        s += ' BATCH'
        if par.BFACTOR_SCALE == 'False':
            s += ' BFACTOR OFF'

    else:
        if par.SCALES_ROTATION_TYPE == 'SPACING':
            p1 = par.SCALES_ROTATION_SPACING
            if p1 != '':
                s += ' ROTATION SPACING ' + p1

        else:
            p1 = par.SCALES_ROTATION_NBINS
            s += ' ROTATION ' + (p1 if p1 != '' else '1')

        if par.SCALES_SECONDARY_CORRECTION == 'True':
            p1 = par.SCALES_SECONDARY_NSPHHARMONICS
            if p1 != '':
                s += ' SECONDARY ' + p1

        else:
            s += ' SECONDARY 0'

        if par.SCALES_TILETYPE == 'NONE':
            s += ' NOTILE'

        elif par.SCALES_TILETYPE == 'CCD':
            s += ' TILE'
            s += ' ' + par.SCALES_NTILEX if par.SCALES_NTILEX != '' else '3'
            s += ' ' + par.SCALES_NTILEY if par.SCALES_NTILEY != '' else '3'
            s += ' CCD'

        if par.BFACTOR_SCALE == 'True':
            if par.SCALES_BROTATION_TYPE == 'SPACING':
                p1 = par.SCALES_BROTATION_SPACING
                if p1 != '':
                    s += ' BROTATION SPACING ' + p1

            else:
                p1 = par.SCALES_BROTATION_NBINS
                s += ' BROTATION ' + (p1 if p1 != '' else '1')

        else:
            s += ' BFACTOR OFF'

    if s != 'SCALES':
        lines.append(s)

def rejectOutliers(par, lines):

    sdrej = '6.0'

    p1 = par.OUTLIER_EMAX
    if p1 != '':
        lines.append('REJECT EMAX ' + p1)

    s = 'REJECT'
    if par.OUTLIER_COMBINE == 'False':
        s += ' SEPARATE'

    p1 = par.OUTLIER_SDMAX
    p2 = par.OUTLIER_SDMAX2
    if p1 != '' or p2 != '':
        s += ' ' + (p1 if p1 != '' else sdrej) + ' ' + p2

    p1 = par.OUTLIER_SDMAXALL
    if p1 != '':
        p2 = '-' if par.OUTLIER_SDMAXALL_ADJUST == 'True' else ''
        s += ' ALL ' + p2 + p1

    if s != 'REJECT':
        lines.append(s)

def SDcorrection(par, lines):

    if par.SDCORRECTION_REFINE == 'True':
        p0 = par.SDCORRECTION_OPTIONS
        assert p0 in ('INDIVIDUAL', 'SAME', 'SIMILAR')
        s = 'SDCORRECTION REFINE ' + p0
        if p0 == 'SIMILAR':
            p1 = par.SDCORRECTION_SIMILARITY_SDFAC
            p2 = par.SDCORRECTION_SIMILARITY_SDB
            p3 = par.SDCORRECTION_SIMILARITY_SDADD
            pp = (p1, p2, p3)
            if ''.join(pp):
                pp = [p if p else d for p, d in zip(pp, ('0.2', '3.0', '0.04'))]
                s += ' %s %s %s' %tuple(pp)

        if par.SDCORRECTION_FIXSDB == 'True':
            s += ' FIXSDB'

        if s != 'SDCORRECTION REFINE INDIVIDUAL':
            lines.append(s)

        if par.SDCORRECTION_FIXSDB == 'Tie':
            s = 'SDCORRECTION TIE'
            p1 = par.SDCORRECTION_TIESDB_SD
            if p1 != '':
                s += ' SdB 0.0 ' + p1

            lines.append(s)

    else:
        p1 = par.SDCORRECTION_SDFAC
        p2 = par.SDCORRECTION_SDB
        p3 = par.SDCORRECTION_SDADD
        pp = (p1, p2, p3)
        if ''.join(pp):
            pp = [p if p else d for p, d in zip(pp, ('1.0', '0.0', '0.03'))]
            s = 'SDCORRECTION %s %s %s' %tuple(pp)
            lines.append(s)

        else:
            lines.append('SDCORRECTION NOREFINE')

def intensitiesAndPartials(par, lines):

    if par.INTENSITIES_OPTIONS != 'COMBINE':
        s = 'INTENSITIES ' + par.INTENSITIES_OPTIONS
        lines.append(s)

    fracl = par.PARTIALS_FRACLOW
    frach = par.PARTIALS_FRACHIGH
    if fracl != '' or frach != '':
        fracl_prn = fracl if fracl != '' else '0.95'
        frach_prn = frach if frach != '' else '1.05'
        s = 'PARTIALS TEST %7.3f %7.3f ' %(float(fracl), float(frach))
        lines.append(s)

    if par.ACCEPT_OVERLOADS == 'True':
        lines.append('KEEP OVERLOADS')

    if par.ACCEPT_EDGES == 'True':
        lines.append('KEEP EDGE')

    if par.ACCEPT_XDS_MISFITS == 'True':
        # XDS MISFIT (outlier) flag
        lines.append('KEEP MISFIT')

    if par.RESOLUTION_SYMM != 'EXPLICIT':
        p1 = par.RESO_LOW
        p2 = par.RESO_HIGH
        if p1 != '' or p2 != '':
            low = ' LOW ' + p1 if p1 != '' else ''
            high = ' HIGH ' + p2 if p2 != '' else ''
            lines.append('RESOLUTION' + low + high)

def scalingDetails(par, lines):

    if par.PERFORM_SCALING == 'NO':
        lines.append('ONLYMERGE')
        return

    p1 =  par.CYCLES_N
    if p1 != '':
        lines.append('REFINE CYCLES ' + p1)

    emin = par.SELECT_EMIN
    iovsdmin = par.SELECT_IOVSDMIN
    if iovsdmin != '' or emin != '':
        s  = 'REFINE SELECT'
        s += ' ' + '-1' if iovsdmin == '' else iovsdmin
        if emin != '':
            s += ' ' + emin

        lines.append(s)

    if par.TIE_DETAILS == 'ADJUST':
        bf_sd = '-1' if par.TIE_BFACTOR == 'False' else par.TIE_BFACTOR_SD
        bz_sd = '-1' if par.TIE_BZERO == 'False' else par.TIE_BZERO_SD
        ro_sd = '-1' if par.TIE_ROTATION == 'False' else par.TIE_ROTATION_SD
        su_sd = '-1' if par.TIE_SURFACE == 'False' else par.TIE_SURFACE_SD
        bf_sd_prn = bf_sd if bf_sd != '' else '0.05'
        bz_sd_prn = bz_sd if bz_sd != '' else '10.0'
        ro_sd_prn = ro_sd if ro_sd != '' else '0.05'
        su_sd_prn = su_sd if su_sd != '' else '0.005'
        s  = "TIE "
        s += 'ROTATION %7.4f ' %float(ro_sd_prn)
        s += 'BFACTOR %7.4f ' %float(bf_sd_prn)
        s += 'SURFACE %7.4f ' %float(su_sd_prn)
        s += 'ZEROB %7.4f ' %float(bz_sd_prn)
        lines.append(s)

def pointlessParams(par, lines, high_data):

    if par.TOLERANCE != '':
        lines.append('TOLERANCE ' + par.TOLERANCE)

    if par.RESOLUTION_SYMM == 'EXPLICIT':
        p1 = par.RESO_LOW
        p2 = par.RESO_HIGH
        if p1 != '' or p2 != '':
            low = ' LOW ' + p1 if p1 != '' else ''
            high = ' HIGH ' + p2 if p2 != '' else ''
            lines.append('RESOLUTION' + low + high)

        else:
            lines.append('RESOLUTION HIGH ' + high_data)


    else:
        p1 = par.ISIGLIMIT
        if p1 != '':
            lines.append('ISIGLIMIT ' + p1)

        p1 = par.CCHALFLIMIT
        if p1 != '':
            lines.append('ISIGLIMIT CCHALF ' + p1)

if __name__ == "__main__":

    drv = Aimless ( "Data Reduction with Aimless",os.path.basename(__file__) )
    drv.start()
