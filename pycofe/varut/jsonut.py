#!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  JSON HANDLING CLASS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

import json

class __jobj__(object):

    def __init__(self, d=None):
        self.parse_json ( d )

    def parse_json ( self,d ):
        if d:
            for a, b in d.items():
                if isinstance(b, (list, tuple)):
                   setattr(self, a, [__jobj__(x) if isinstance(x, dict) else x for x in b])
                else:
                   setattr(self, a, __jobj__(b) if isinstance(b, dict) else b)

    def to_JSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=2)


class jObject(__jobj__):

    def __init__(self,json_str=""):
        self.read_json ( json_str )

    def read_json ( self,json_str ):
        if json_str:
            super(jObject,self).parse_json ( json.loads(json_str) )



def readjObject ( file_path ):
    try:
        file     = open ( file_path,"r" )
        json_str = file.read()
        file.close()
        return jObject(json_str)
    except:
        return None


#
#  ------------------------------------------------------------------
#   Use example
#  ------------------------------------------------------------------
#

if __name__ == "__main__":
    import sys
    A = jObject()
    A.name = "Onur"
    A.age = 35
    A.dog = jObject()
    A.dog.name = "Apollo"
    A.array1 = ['a']
    A.array2 = ['a','b','c']

    json_str = A.to_JSON()

    print json_str
    print "----------------------------------------------------------"

    B = jObject(json_str);
#    B = jObject("klklkl");
    print B.name
    print B.age
    print B.dog.name
    print B.array2[1]

    sys.exit(0)
