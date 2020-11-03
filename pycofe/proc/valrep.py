#!/usr/bin/python2

import time

from onedep import __apiUrl__
from onedep.api.Validate import Validate

def checkStatus ( sD,logfile ):
    rc = ""
    if 'onedep_error_flag' in sD and sD['onedep_error_flag']:
        rc = "OneDep error: " + str(sD['onedep_status_text'])
    elif 'status' in sD:
        rc = "OneDep status: " + str(sD['status'])
    if rc:
        logfile.write ( rc + "\n" )
        logfile.flush()
    return rc


def getValidationReport ( modelFilePath,sfFilePath,repFilePath,logfile ):
    # Given:
    # modelFilePath contains the path to the model file
    # sfFilePath contains the path to the structure factor file
    val = Validate ( apiUrl=__apiUrl__ )
    rD  = val.newSession()
    rc  = checkStatus ( rD,logfile )
    msg = ""
    if not rc:

        logfile.write (
            "\n =================================================================="
            "\n OBTAIN VALIDATION REPORT FROM WWPDB"
            "\n =================================================================="
            "\n"
            "\n Session ID        : " + str(rD['session_id']) +
            "\n Model             : " + modelFilePath +
            "\n Structure Factors : " + sfFilePath +
            "\n \n"
        )
        logfile.flush()

        rD = val.inputModelXyzFile(modelFilePath)
        rc = checkStatus ( rD,logfile )
        if not rc:
            rD = val.inputStructureFactorFile ( sfFilePath )
            rc = checkStatus ( rD,logfile )
            if not rc:
                rD = val.run()
                rc = checkStatus ( rD,logfile )
                if not rc:
                    #
                    #   Poll for service completion -
                    #
                    it = 0
                    sl = 2
                    while (True):
                        #    Pause -
                        it += 1
                        pause = it * it * sl
                        time.sleep(pause)
                        rD = val.getStatus()
                        if rD['status'] in ['completed', 'failed']:
                            break
                        logfile.write ( "[%4d] Pausing for %4d (seconds)\n" % (it, pause) )
                        logfile.flush()

                    #lt = time.strftime("%Y%m%d%H%M%S", time.localtime())
                    #fnR = "xray-report-%s.pdf" % lt
                    #rD = val.getReport(fnR)
                    rD = val.getReport ( repFilePath )
                    rc = checkStatus ( rD,logfile )
                    if not rc:
                        msg = " --- success"

                else:
                    msg = " *** validation run failed"
            else:
                msg = " *** structure factors upload failed"
        else:
            msg = " *** model upload failed"
    else:
        msg = " *** cannot create validation session"

    if not rc:
        logfile.write ( " --- success\n" )
    else:
        logfile.write ( msg + "\n" )

    logfile.flush()

    return rc


# ============================================================================

def main():

    getValidationReport ( "1sar.cif","1sar-sf.cif",stdout )

    return

if __name__ == '__main__':
    main()
