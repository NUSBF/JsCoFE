##!/usr/bin/python

#
# ============================================================================
#
#    22.10.18   <--  Date of Last Modification.
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
import re
import json
from PyQt4 import QtGui, QtCore

def dirlist2sectors(dirlist, sectors, file_list):
    rec_img = re.compile('([^.]*[^.0-9])([0-9]{2,})(.*)$')
    sector_dict = {}
    sector_lst1 = []
    for fname in dirlist:
        match_obj = rec_img.match(fname)
        if match_obj:
            prefix, cou_str, suffix = match_obj.groups()
            cou = int(cou_str)
            template = prefix + len(cou_str)* '#' + suffix
            range_lst1 = sector_dict.get(template)
            if range_lst1:
                range = range_lst1[-1]
                if range[1][0] + 1 == cou:
                    range[1] = cou, fname

                else:
                    range = [(cou, fname), (cou, fname)]
                    range_lst1.append(range)

            else:
                range_lst1 = [[(cou, fname), (cou, fname)]]
                sector_dict[template] = range_lst1
                sector_lst1.append([template, range_lst1])

        else:
            sector_lst1.append([fname, None])

    sector_lst2 = []
    for sector_meta in sector_lst1:
        range_lst1 = sector_meta[1]
        if range_lst1:
            range_lst2 = []
            for range in range_lst1:
                if range[1][0] > range[0][0]:
                    range_lst2.append(range)

            if range_lst2:
                sector_lst2.append([sector_meta[0], range_lst2])

    sector_lst3 = sectors
    for sector_meta in sector_lst2:
        range_lst2 = sector_meta[1]
        range_lst3 = []
        for range in range_lst2:
            range_lst3.append([range[0][0], range[1][0]])

        sector_lst3.append({
            'template': sector_meta[0],
            'name': range_lst2[0][0][1],
            'ranges': range_lst3
        })

    for sector_meta in sector_lst1:
        range_lst1 = sector_meta[1]
        if range_lst1:
            for range in range_lst1:
                cou = range[1][0] - range[0][0] + 1
                file_list.append([range[0][1], range[1][1], cou])

        else:
            file_list.append([sector_meta[0], sector_meta[0], 1])



def dump_meta(meta):
    dump_keyargs = dict(sort_keys=True, indent=4, separators=(',', ': '))
    with open('/tmp/jjjjjj', 'a') as jjj:
        print >>jjj, json.dumps(meta, **dump_keyargs)

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

    meta = {"path":""}

    if dialog.exec_():
        if len(dialog.selectedFiles()) > 0:
            if dialog.selectedFiles()[0]:
                settings.setValue ( "last_path",dialog.selectedFiles()[0] )

            dirpath      = str ( dialog.selectedFiles()[0] )
            meta["path"] = dirpath
            sectors = list()
            dirlist2sectors(sorted(os.listdir(dirpath)), sectors, [])
            meta["sectors"] = sectors

#   dump_meta(meta)
    return meta


if __name__ == '__main__':
    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Image Directory'
    print json.dumps ( select(title) )
