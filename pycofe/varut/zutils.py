##!/usr/bin/python

#
# ============================================================================
#
#    04.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COMRESSING UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os
import gzip
import shutil

def gunzip ( source_filepath, dest_filepath=None, block_size=65536, baseDirPath="" ):

    dest_path = dest_filepath
    if not dest_path:
        dest_path = os.path.splitext ( source_filepath )[0]

    with gzip.open(os.path.join(baseDirPath,source_filepath),'rb') as sfile, \
              open(os.path.join(baseDirPath,dest_path),'wb') as dfile:
        shutil.copyfileobj ( sfile, dfile, block_size )

    return dest_path
