##!/usr/bin/python

#
# ============================================================================
#
#    15.10.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT SELECT DIRCTORY DIALOG FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import sys
import os
import json
from PyQt4 import QtGui, QtCore

#from PyQt4 import QtCore

def select ( title ):

    settings = QtCore.QSettings ( "CCP4","SelectDir" );
    startDir = settings.value ( "last_path" ).toString()

    if not startDir and "HOME" in os.environ:
        startDir = os.environ["HOME"]

    app  = QtGui.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtGui.QFileDialog()
        dialog.setWindowTitle ( title )
        if startDir:
            dialog.setDirectory ( startDir )
    else:
        dialog = QtGui.QFileDialog ( None,title,startDir )
    dialog.setFileMode ( QtGui.QFileDialog.Directory)
    dialog.setOption   ( QtGui.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtGui.QFileDialog.ShowDirsOnly, True)
    dialog.show  ()
    dialog.raise_()

    meta = {"path":None}

    if dialog.exec_():

        if len(dialog.selectedFiles()) > 0:

            if dialog.selectedFiles()[0]:
                settings.setValue ( "last_path",dialog.selectedFiles()[0] )

            dirpath      = str ( dialog.selectedFiles()[0] )
            meta["path"] = dirpath
            dirlist = [f for f in os.listdir(dirpath) if os.path.isfile(os.path.join(dirpath,f))]
            dirlist.sort()

            meta["sectors"] = []
            i = 0
            while i<len(dirlist):
                lname = dirlist[i].split(".")
                ext   = lname.pop().lower()
                if not ext in ["seq","fasta","pir","pdb","mtz","cif"]:
                    # check for likely image files, looking for pattern
                    # [((a).)](a)(d).[((a).)].ext (a: letter, d: digit,
                    # []: optional, (): repeats)
                    k = -1
                    for j in range(len(lname)-1,-1,-1):
                        if lname[j][len(lname[j])-1].isdigit():
                            k = j
                            break
                    if k>=0:
                        n0 = 0
                        for j in range(len(lname[k])-1,-1,-1):
                            if lname[k][j].isdigit():
                                n0 = j
                            else:
                                break
                        ndigits = len(lname[k]) - n0
                        prefix  = ""
                        if k>0:
                            prefix = ".".join(lname[0:k]) + "."
                        prefix += lname[k][0:n0]
                        suffix  = "";
                        if k<len(lname)-1:
                            suffix = "." + ".".join ( lname[k+1:] )
                        suffix += "." + ext
                        nimage = int(lname[k][n0:]) + 1
                        j      = i + 1
                        while (j<len(dirlist)) and (prefix + str(nimage).zfill(ndigits) + suffix == dirlist[j]):
                            nimage += 1
                            j      += 1
                        j -= 1

                        if j>i:
                            template = prefix + "#"*ndigits + suffix
                            template_meta = None
                            for m in range(len(meta["sectors"])):
                                if meta["sectors"][m]["template"] == template:
                                    template_meta = meta["sectors"][m]
                                    break
                            if not template_meta:
                                template_meta = { "template" : template, "ranges" : [] }
                                meta["sectors"].append ( template_meta )
                            template_meta["ranges"].append ( (nimage-j+i-1,nimage-1) )
                            i = j

                i += 1


    return meta


if __name__ == '__main__':
    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Image Directory'
    print json.dumps ( select(title) )
