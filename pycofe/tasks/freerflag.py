##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    18.12.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FITWATERS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.fitwaters jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import basic
from   pycofe.proc   import coor, import_filetype, import_merged
from   pycofe.dtypes import dtype_revision


# ============================================================================
# Make Refmac driver

class FreeRFlag(basic.TaskDriver):

    # make task-specific definitions
    def freer_mtz (self):  return "freer.mtz"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare makeligand input
        # fetch input data

        freer = None
        if hasattr(self.input_data.data,"freer0"):
            freer = self.makeClass ( self.input_data.data.freer0[0] )
        elif hasattr(self.input_data.data,"freer"):
            freer = self.makeClass ( self.input_data.data.freer[0] )

        hkl = self.input_data.data.hkl
        for i in range(len(hkl)):
            hkl[i] = self.makeClass ( hkl[i] )

        sec1 = self.task.parameters.sec1.contains

        res0 = 1.0e12
        n0   = 0
        for i in range(len(hkl)):
            reso = hkl[i].getHighResolution ( True )
            if reso<res0:
                res0 = reso
                n0   = i

        freeRColumn = None
        hklinPath   = None
        freerPath   = None
        if freer:
            freeRColumn = freer.getMeta("FREE","")
            hklinPath   = freer.getHKLFilePath ( self.inputDir() )
            reso = freer.getHighResolution ( True )
            if reso<res0:
                res0 = res0
                n0   = -1
        else:
            freeRColumn = hkl[0].getMeta("FREE","")
            hklinPath   = hkl[0].getHKLFilePath ( self.inputDir() )

        if n0 >= 0:  # need to regenerate or extend freeR-flag

            if freer:
                self.open_stdin()
                self.write_stdin ( "COMPLETE FREE=" + freer.getMeta("FREE","") + "\n" )
            else:
                # remove FreeR column from file in order to avoid column name clash
                # in freerflag
                col_list = hkl[0].getColumnNames ( sep=",",includeFreeR=False ).split(",")
                col_str  = ""
                ncols    = 0
                for i in range(len(col_list)):
                    if col_list[i]:
                        ncols   += 1
                        col_str += " E" + str(ncols) + "=" + col_list[i]
                self.open_stdin()
                self.write_stdin ([ "LABIN FILE 1" + col_str,"END" ])
                self.close_stdin()
                self.runApp ( "cad",["hklin1",hklinPath,"hklout","__tmp.mtz"],
                              logType="Service" )
                os.remove ( hklinPath )
                os.rename ( "__tmp.mtz",hklinPath )
                #cad hklin1 path1 hklout path2 <<eof
                #LABIN FILE 1 E1=... E2=...
                #END
                #eof
                self.open_stdin()
                self.writeKWParameter ( sec1.FREERFRAC )

            if self.getParameter(sec1.SEED_CBX) == "True":
                self.write_stdin ( "SEED\n" )
            self.write_stdin ([
                "RESOL " + str(res0),
                "UNIQUE",
                "END",
            ])
            self.close_stdin()

            freerPath = self.freer_mtz()
            cmd = [ "hklin" ,hklinPath, "hklout",freerPath ]

            # Start freerflag
            self.runApp ( "freerflag",cmd,logType="Main" )

            if not freer:
                # freerflag added column FreeR_flag; rename it to original name
                if freeRColumn!="FreeR_flag":
                    self.open_stdin()
                    self.write_stdin ([
                      "LABIN  FILE 1" + col_str + " E" + str(ncols+1) + "=FreeR_flag",
                      "LABOUT FILE 1" + col_str + " E" + str(ncols+1) + "=" + freeRColumn,
                      "END"
                    ])
                    self.close_stdin()
                    self.runApp ( "cad",["hklin1",freerPath,"hklout","__tmp.mtz"],
                                  logType="Service" )
                    os.remove ( freerPath )
                    os.rename ( "__tmp.mtz",freerPath )
                #cad hklin1 path_after_freerflag hklout path3 <<eof
                #LABIN  FILE 1 E1=... E2=...        E16=FreeR_flag
                #LABOUT FILE 1 E1=... E2=...        E16=freeRColumn
                #END
                #eof

        else:  # just use freeR-flag from the reference dataset
            freerPath = hklinPath
            self.putMessage (
                "Free R-flag is given at " + freer.getHighResolution() +\
                " &Aring; resolution in <b>\"" + freer.dname +\
                "\"</b> dataset;<br>" +\
                "-- no extension is required.<br>&nbsp;" )

        have_results = False

        if os.path.isfile(freerPath):

            if n0 >= 0:
                if freer:
                    self.putMessage (
                        "Free R-flag from <b>\"" + freer.dname +\
                        "\"</b> dataset is extended to " +\
                        "{0:.2f}".format(res0) + " &Aring; resolution.<br>&nbsp;" )
                else:
                    self.putMessage (
                        "Generate Free R-flag at " + "{0:.2f}".format(res0) +\
                        " &Aring; resolution.<br>&nbsp;"  )

            lablist = [ "Imean.value"    , "Imean.sigma"    ,
                        "Fmean.value"    , "Fmean.sigma"    ,
                        "Ipm.plus.value" , "Ipm.plus.sigma" ,
                        "Ipm.minus.value", "Ipm.minus.sigma",
                        "Fpm.plus.value" , "Fpm.plus.sigma" ,
                        "Fpm.minus.value", "Fpm.minus.sigma" ]

            self.resetFileImport()
            for i in range(len(hkl)):
                self.open_stdin()
                self.write_stdin ( "LABIN FILE 1 E1=" + freeRColumn + "\n" )
                self.write_stdin ( "LABIN FILE 2" )
                cnt = 1
                for name in lablist:
                    colname = hkl[i].getMeta ( name,"" )
                    if colname:
                        self.write_stdin ( " E" + str(cnt) + "=" + colname )
                        cnt += 1
                self.write_stdin ( "\nRESOLUTION OVERALL 100000000 "   +\
                                   str(hkl[i].getHighResolution(True)) +\
                                   "\nEND\n" )
                self.close_stdin()
                outFName = list(filter ( None,hkl[i].dname.split(" ")))[1]
                if not outFName.endswith(".freer"):
                    outFName += ".freer"
                outFName += ".mtz"

                cmd = [ "hklin1",freerPath,
                        "hklin2",hkl[i].getHKLFilePath(self.inputDir()),
                        "hklout",outFName ]

                # Start cad
                self.runApp ( "cad",cmd,logType="Service" )
                if os.path.isfile(outFName):
                    self.addFileImport ( outFName,import_filetype.ftype_MTZMerged() )
                    #files_all += [outFName]
                    self.putMessage ( "Free R-flag set to <b>\"" + hkl[i].dname +\
                                      "\"</b> dataset." )
                else:
                    self.putMessage ( "Failed to set Free R-flag to <b>\"" +\
                                      hkl[i].dname + "\"</b> dataset." )

            if len(self.files_all) > 0:

                self.putTitle ( "Output Data" )
                if len(self.files_all) > 1:
                    import_merged.run ( self,"Reflection datasets created",
                                             sectionOpen=True,importPhases="",
                                             freeRflag=True )
                else:
                    import_merged.run ( self,"",sectionOpen=False,importPhases="",
                                             freeRflag=True  )

                outhkl = self.outputDataBox.data[hkl[0]._type]
                if n0 >= 0:
                    for i in range(len(outhkl)):
                        if i != n0:
                            outhkl[i].freeRds = outhkl[n0]
                else:
                    for i in range(len(outhkl)):
                        outhkl[i].freeRds = freer

                for i in range(len(outhkl)):
                    outhkl[i].aimless_meta = hkl[i].aimless_meta

                have_results = True

            else:
                self.fail ( "<p>&nbsp;Setting free R-flag columns failed",
                            "Error in setting free R-flag" )
                return

        elif n0 >= 0:
            self.fail ( "<p>&nbsp;Free R-flag calculations failed",
                        "Free R-flag calculations failed" )
            return

        else:
            self.fail ( "<p>&nbsp;Precalculated free R-flag not found",
                        "Precalculated free R-flag not found" )
            return

        """

        1) Generate all new

           - for all hkl[i]:
           - calculate r0 = max(reso[0]) over all hkls
           - for leading hkl's mtz:
                freerflag hklin <mtz> hklout <mtz_free> <<eof
                  FREERFRAC  0.05 (from input)
                  SEED (if checkbox "SEED" is checked)
                  RESOL r0 (from above)
                  UNIQUE
                  END
                eof
            - for all hkl:
                cad hklin1 <mtz_free> hklin2 <mtz[hkl[i]]> hklout <mtz_out[i]> <<eof
                  LABIN FILE1 E1=<column name>
                  LABIN FILE2 E1=.... E2=.... (F/I/F±/I± + sigs)
                  RESOLUTION OVERALL 100000000 hkl[i].RESO[0]
                  END
                eof

        2) Extend:

           - for all hkl[i]:
           - calculate r0 = max(reso[0]) over all hkls
           - for leading hkl's mtz:
                freerflag hklin <mtz> hklout <mtz_free> <<eof
                  FREERFRAC  0.05 (from input)
                  SEED (if checkbox "SEED" is checked)
                  COMPLETE FREE=<column name>  (if selector "Extend/regenerate" is "extend")
                  RESOL r0 (from above)
                  UNIQUE
                  END
                eof
            - for all hkl:
                cad hklin1 <mtz_free> hklin2 <mtz[hkl[i]]> hklout <mtz_out[i]> <<eof
                  LABIN FILE1 E1=<column name>
                  LABIN FILE2 E1=.... E2=.... (F/I/F±/I± + sigs)
                  RESOLUTION OVERALL 100000000 hkl[i].RESO[0]
                  END
                eof

        """

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FreeRFlag ( "",os.path.basename(__file__) )
    drv.start()
