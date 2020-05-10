##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    13.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  THE DATABOX
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import sys
import os

#  application imports
from pycofe.varut import jsonut

#  seems to be necessary for __import__ calls below in the body
sys.path.append ( os.path.join(os.path.dirname(os.path.abspath(__file__)),os.pardir) )

# ============================================================================

class DataBox(jsonut.jObject):

    def __init__ ( self,json_str="" ):

        super(DataBox,self).__init__(json_str)

        self._type = "DataBox"  # must coincide with DataBox in JS layer
        self.data  = {}

        # The class keeps output data, represented by dtype_XXX classes, as
        # data[dtype] = [data11,data12,... ]

        return

    def putCitations ( self,citation_list ):
        for dtype in self.data:
            dlist = self.data[dtype]
            for i in range(len(dlist)):
                dlist[i].citations = citation_list
        return


    def add_data ( self,data_class ):

        if data_class._type not in self.data:
            self.data[data_class._type] = []

        self.data[data_class._type].append ( data_class );

        return


    def nDTypes ( self ):
        n = 0
        for dtype in self.data:
            n += 1
        return n


    def delete_data ( self,dataId ):
        ix = -1
        kx = -1
        for i in self.data:
            for k in range(len(self.data[i])):
                if self.data[i][k].dataId == dataId:
                    ix = i
                    kx = k
        if ix >= 0:
            del self.data[ix][kx]
            if len(self.data[ix]) <= 0:
                del self.data[ix]
        return


    def save ( self,dir_path ):
        if self.data:
            file = open ( os.path.join(dir_path,"databox.meta"),"w" )
            file.write ( self.to_JSON() )
            file.close ()
        return


def make_class ( obj ):
    if hasattr(obj,"_type"):
        json_str = obj.to_JSON()
        import_name = "dtype_" + obj._type[len("Data"):].lower()
        dt = __import__( "dtypes." + import_name )
        return getattr(dt,import_name).DType(-1,json_str)
    else:
        return obj


#import json

def readDataBox ( dir_path ):
    file     = open ( os.path.join(dir_path,"databox.meta"),"r" )
    json_str = file.read()
    file.close()
    #return json.loads(json_str)
    return jsonut.jObject(json_str)
    #obj = jsonut.jObject(json_str)
    #obj.data = json.loads ( obj.data.to_JSON() )
    #return obj
