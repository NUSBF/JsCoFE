##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    05.09.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PROXY DATA TYPE FOR MAKING [REMOVE] ITEMS IN INPUT DATA COMBOBOXES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
#import os
#import sys

#  application imports
from  pycofe.dtypes  import dtype_template


# ============================================================================

def dtype(): return "DataRemove"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "[remove]"
            self.subtype  = ["proxy"]
            self.version += 0  # versioning increments from parent to children
        return
