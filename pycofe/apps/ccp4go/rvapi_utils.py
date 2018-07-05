##!/usr/bin/python

#
# ============================================================================
#
#    04.12.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  RVAPI Utility Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

import pyrvapi

# ============================================================================


def __get_item ( itemName,dictionary,defValue ):
    if itemName in dictionary:
        return dictionary[itemName]
    return defValue


def makeTable ( tableDict, tableId,holderId, row,col,rowSpan,colSpan ):
#
#   Table dictionary example:
#
#   { title: "Table Title",        # empty string by default
#     state: 0,                    # -1,0,1, -100,100
#     class: "table-blue",         # "table-blue" by default
#     css  : "text-align:right;",  # "text-align:rigt;" by default
#     horzHeaders :  [  # either empty list or full header structures for all columns
#       { label: "Size"  , tooltip: "" },
#       { label: "Weight", tooltip: "" },
#       .....
#     ],
#     rows : [
#       { header: { label: "1st row", tooltip: "" }, # header may be missing
#         data  : [ "string1","string2", ... ]
#       },
#       ......
#     ]
#   }
#

    pyrvapi.rvapi_add_table ( tableId,
                    __get_item("title",tableDict,""),holderId,
                    row,col,rowSpan,colSpan,
                    __get_item("state",tableDict,0) )

    if ("class" in tableDict) or ("css" in tableDict):
        pyrvapi.rvapi_set_table_style ( tableId,
                    __get_item("class",tableDict,"table-blue"),
                    __get_item("css",tableDict,"text-align:right;") )

    if "horzHeaders" in tableDict:
        for i in range(len(tableDict["horzHeaders"])):
            header = tableDict["horzHeaders"][i]
            pyrvapi.rvapi_put_horz_theader ( tableId,header["label"],
                                                     header["tooltip"],i )

    if "rows" in tableDict:
        for i in range(len(tableDict["rows"])):
            trow = tableDict["rows"][i]
            if "header" in trow:
                pyrvapi.rvapi_put_vert_theader ( tableId,trow["header"]["label"],
                                                 trow["header"]["tooltip"],i )
            data = trow["data"]
            for j in range(len(data)):
                pyrvapi.rvapi_put_table_string ( tableId,data[j],i,j )

    return
