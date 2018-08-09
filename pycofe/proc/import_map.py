##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MAP DATA IMPORT CLASS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi

try:
    import mrcfile
except:
    print "mrcfile not found in: " + sys.path
    raise

#  application imports
from dtypes import dtype_map


# ============================================================================
# import volume data function

def run(body):  # body is reference to the main Import class

    files_map = []
    for f in body.files_all:
        fl = f.lower();
        if fl.endswith(('.map', '.mrc')):
            files_map.append ( f )

    if len(files_map) <= 0:
        return

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  Map volume data\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    mapSecId = "map_sec_" + str(body.widget_no)
    body.widget_no += 1

    pyrvapi.rvapi_add_section ( mapSecId, "Map", body.report_page_id(),
                                body.rvrow, 0, 1, 1, False )
    k = 0
    for f in files_map:

        body.files_all.remove ( f )

        pyrvapi.rvapi_put_table_string ( body.import_summary_id(), f, body.summary_row, 0 )

        fpath = os.path.join ( body.importDir(), f );

        with mrcfile.mmap(fpath) as mrc:
            msg = "MAP {0} x {1} x {2}".format(mrc.header.nx, mrc.header.ny, mrc.header.nz)
            pyrvapi.rvapi_put_table_string ( body.import_summary_id(), msg, body.summary_row, 1 )

        map_ = dtype_map.DType ( body.job_id )
        map_.subtype = ['final_map']
        map_.setFile   ( f,"map" )
        body.dataSerialNo += 1
        map_.makeDName ( body.dataSerialNo )
        body.outputDataBox.add_data ( map_ )

        # Essential to rename uploaded file to put it in output directory
        # Might be better to use the standard register() method instead if possible?
        # Currently the file ends up remaining in the upload directory on the front end,
        # even though it's removed on the number cruncher...
        os.rename ( fpath, os.path.join(body.outputDir(), f) )

        body.file_stdout.write ( "... processed: " + f + "\n" )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return
