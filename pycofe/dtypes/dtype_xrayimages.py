##!/usr/bin/python

#
# ============================================================================
#
#    31.10.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XRAY IMAGES DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
#import sys

#  application imports
from . import dtype_template

# ============================================================================

def dtype(): return "DataXRayImages"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "xrayimages"
            self.version += 0   # versioning increments from parent to children
        return
