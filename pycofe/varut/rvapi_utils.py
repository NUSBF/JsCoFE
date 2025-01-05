##!/usr/bin/python

#
# ============================================================================
#
#    04.01.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  RVAPI Utility Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

import pyrvapi, os, re

# ============================================================================


def __get_item ( itemName,dictionary,defValue ):
    if itemName in dictionary:
        return dictionary[itemName]
    return defValue


def cleanhtml(raw_html):
  cleanr = re.compile ('<.*?>' )
  cleantext = re.sub ( cleanr, '', raw_html )
  return cleantext


def makeTable ( tableDict, tableId,holderId, row,col,rowSpan,colSpan ):
#
#   Table dictionary example:
#
#   { title: "Table Title",        # empty string by default
#     state: 0,                    # -1,0,1, -100,100
#     class: "table-blue",         # "table-blue" by default
#     css  : "text-align:right;",  # "text-align:right;" by default
#     alt_row_css : css_string,    # optional; "background:#EAF2D3;" by default
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
        alt_css = None
        if "alt_row_css" in tableDict:
            alt_css = tableDict["alt_row_css"]
            if not alt_css:
                alt_css = "background:#EAF2D3"
        for i in range(len(tableDict["rows"])):
            trow = tableDict["rows"][i]
            if "header" in trow:
                pyrvapi.rvapi_put_vert_theader ( tableId,trow["header"]["label"],
                                                 trow["header"]["tooltip"],i )
            data = trow["data"]
            for j in range(len(data)):
                pyrvapi.rvapi_put_table_string ( tableId,data[j],i,j )
                if alt_css and (i%2>0):
                    pyrvapi.rvapi_shape_table_cell ( tableId,i,j,"",alt_css,"",1,1 );

    return


def makeCSVTable ( tableDict ):
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
    csvTable = ''
    csvRecord = ''

    if "horzHeaders" in tableDict:
        if len(tableDict["horzHeaders"]) > 0:
            for i in range(len(tableDict["horzHeaders"])):
                header = tableDict["horzHeaders"][i]
                csvRecord += '"%s",' % header
            csvRecord = csvRecord[:-1] # removing last comma
            csvRecord += os.linesep
            csvTable += csvRecord

    if "rows" in tableDict:
        for i in range(len(tableDict["rows"])):
            trow = tableDict["rows"][i]
            if "header" in trow:
                csvRecord = '"%s",' % cleanhtml(trow["header"]['label'])
            else:
                csvRecord = ''

            data = trow["data"]
            for j in range(len(data)):
                csvRecord += '"%s",' % cleanhtml(data[j])
            csvRecord = csvRecord[:-1] # removing last comma
            csvRecord += os.linesep
            csvTable += csvRecord

    return csvTable



def makeRTFTable ( tableDict ):
# Very naive implementation and invention of a bicycle to minimise external dependencies
# Many limitations! Could be ugly. Tested only for two columns.


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


    rtfTable = r"""{\rtf1\ansi\ansicpg1252
{\fonttbl\f0\fswiss\fcharset0 Times-Bold;\f1\fswiss\fcharset0 Times;}
{\colortbl;\red255\green255\blue255;\red191\green191\blue191;}
{\*\expandedcolortbl;;\csgray\c79525;}
\paperw11905\paperh16837\margl1200\margr1200\margb1000\margt1000\vieww12520\viewh15620\viewkind1
\deftab720
\pard\pardeftab720\sb240\sa60\partightenfactor0

"""
    rtfTable += "\\f0\\b\\fs28 \\cf0 %s\\" % tableDict['title'] + os.linesep

    if "horzHeaders" in tableDict:
        if len(tableDict["horzHeaders"]) > 0:
            rtfTable += r"\itap1\trowd \taflags1 \trgaph108\trleft-108 \trbrdrl\brdrnil \trbrdrr\brdrnil" + os.linesep
            columnWidth = int(9505 / len(tableDict['horzHeaders']))
            for i in range(len(tableDict['horzHeaders'])):
                rtfTable += '\\clvertalc \\clshdrawnil \\clbrdrt\\brdrs\\brdrw20\\brdrcf2 \\clbrdrl\\brdrs\\brdrw20\\brdrcf2 \\clbrdrb\\brdrs\\brdrw20\\brdrcf2 \\clbrdrr\\brdrs\\brdrw20\\brdrcf2 \\clpadl100 \\clpadr100 \\gaph\\cellx%d' % int(columnWidth * (i+1)) + os.linesep

            for i in range(len(tableDict["horzHeaders"])):
                header = tableDict["horzHeaders"][i]
                # \sb60 or \sb240 ? God knows.
                rtfTable += os.linesep + r'\pard\intbl\itap1\pardeftab720\sb60\sa60\partightenfactor0' + os.linesep + os.linesep
                rtfTable += '\\f0\\b\\fs24 \\cf0 %s\\cell' % cleanhtml(header)
            rtfTable += ' \\row' + os.linesep + os.linesep

    if "rows" in tableDict:
        for i in range(len(tableDict["rows"])):
            trow = tableDict["rows"][i]
            data = trow["data"]

            rtfTable += r"\itap1\trowd \taflags1 \trgaph108\trleft-108 \trbrdrl\brdrnil \trbrdrr\brdrnil" + os.linesep
            ncols =len(data)
            if "header" in trow:
                ncols += 1
            columnWidth = int(9505 / ncols)
            for k in range(ncols):
                rtfTable += '\\clvertalc \\clshdrawnil \\clbrdrt\\brdrs\\brdrw20\\brdrcf2 \\clbrdrl\\brdrs\\brdrw20\\brdrcf2 \\clbrdrb\\brdrs\\brdrw20\\brdrcf2 \\clbrdrr\\brdrs\\brdrw20\\brdrcf2 \\clpadl100 \\clpadr100 \\gaph\\cellx%d' % int(columnWidth * (k+1)) + os.linesep

            if "header" in trow:
                rtfTable += os.linesep + r'\pard\intbl\itap1\pardeftab720\sb60\sa60\partightenfactor0' + os.linesep + os.linesep
                rtfTable += '\\f0\\b\\fs24 \\cf0 %s\\cell' % cleanhtml(trow["header"]['label'].replace("&nbsp;"," "))

            for j in range(len(data)):
                rtfTable += os.linesep + r'\pard\intbl\itap1\pardeftab720\sb60\sa60\partightenfactor0' + os.linesep + os.linesep
                rtfTable += '\\f1\\b0\\fs24 \\cf0 %s\\cell' % cleanhtml(data[j].replace("&nbsp;"," "))
            rtfTable += ' \\row' + os.linesep + os.linesep

    if len(rtfTable) > 7:
        rtfTable = rtfTable[:-6]
        rtfTable += '\\lastrow\\row' + os.linesep

    rtfTable += r"""\pard\pardeftab720\sb60\sa60\partightenfactor0
\cf0 Statistics for the last shell is given in parentheses (if unmerged data are available).\
"""
    rtfTable += r'}'+ os.linesep

    return rtfTable

