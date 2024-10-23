##!/usr/bin/python

#
# ============================================================================
#
#    23.10.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT SELECT DIRCTORY DIALOG FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

import sys
import os
import re
import json
os.environ['PATH'] = os.environ['PATH'].replace('WinCoot', '___Coot')
from   PyQt5 import QtWidgets
from   PyQt5 import QtCore


def dirpath2sectors(dirpath, sectors, file_list):
    '''
    indices for:
    c = block of didgits within a filename
    q = template with all didgits replaced with \0
    i = filenames belonging to a given q
    p = subtemplate with didgits replaced with \0
        within the most diverse block of didgits
    j = filenames belonging to a given p
    o = output file list with ranges merged
    values:
    f = filename (also used as a mapping key)
    l = left token (text)
    r = right token (didgits)
    k = kind of file (dir, seq, dat, unk) or
        the last file of the range
    '''
    fk_o = file_list
    rec_dat = re.compile('.+\.(?:pdb|mtz|cif)$(?i)')
    rec_seq = re.compile('.+\.(?:seq|fasta|pir)$(?i)')
    rec_img = re.compile('((?!$)[^0-9]*)([0-9]+|$)')
    t_q = []
    l_cq = []
    r_ciq = []
    for f in sorted(os.listdir(dirpath)):
        if os.path.isdir(os.path.join(dirpath, f)):
            fk_o.append((f, 'dir'))

        elif rec_seq.match(f):
            fk_o.append((f, 'seq'))

        elif rec_dat.match(f):
            fk_o.append((f, 'dat'))

        else:
            l_c, r_c = list(zip(*rec_img.findall(f)))
            if not r_c[0]:
                fk_o.append((f, 'unk'))

            else:
                t = re.sub('[0-9]', chr(0), f)
                q = len(t_q) - 1
                while q >= 0:
                    if t_q[q] == t:
                        break

                    q -= 1

                if q >= 0:
                    r_ciq[q].append(r_c)

                else:
                    t_q.append(t)
                    l_cq.append(l_c)
                    r_ciq.append([r_c])

    f_p = []
    t_f = {}
    rr_jf = {}
    for q in range(len(t_q)):
        l_c = l_cq[q]
        r_ci = r_ciq[q]
        r_ic = list(zip(*r_ci))
        c_c = list(range(len(r_ic)))
        u_max = 0
        for r_i, c in zip(r_ic, c_c):
          u = len(set(r_i))
          if u_max <= u:
            u_max = u
            c_max = c

        l_max = l_c[c_max]
        t_prev = None
        for r_c in r_ci:
            r_max = r_c[c_max]
            f = ''.join([l + r for l, r in zip(l_c, r_c)])
            h_c = list(r_c)
            h_c[c_max] = chr(0)
            t = ''.join([l + h for l, h in zip(l_c, h_c)])
            if t != t_prev:
                f_p.append(f)
                t_prev = t
                t_f[f] = t
                rr = [r_max, r_max]
                rr_j = [rr]
                rr_jf[f] = rr_j

            elif int(r_max) != int(rr[1]) + 1:
                rr = [r_max, r_max]
                rr_j.append(rr)

            else:
                rr[1] = r_max

    f_p.sort()
    for f in f_p:
        t = t_f[f]
        rr_j = []
        nn_j = []
        for r0, r1 in rr_jf[f]:
            f0 = t.replace(chr(0), r0)
            if r1 == r0:
                fk_o.append((f0, 'unk'))

            else:
                i0 = int(r0)
                i1 = int(r1)
                assert i1 >= i0
                rr_j.append([r0, r1])
                nn_j.append([i0, i1])
                f1 = t.replace(chr(0), r1)
                if i1 == i0 + 1:
                    fk_o.append((f0, 'unk'))
                    fk_o.append((f1, 'unk'))

                else:
                    fk_o.append((f0, f1))

        if rr_j:
            h = t.replace(chr(0), len(rr_j[0][0])* '#')
            sectors.append({'name': f, 'ranges': nn_j, 'template': h})

        rr_jf[f] = rr_j

    fk_o.sort()

def select ( title ):

    settings = QtCore.QSettings ( "CCP4","SelectDir" )
    startDir = str ( settings.value ( "last_path" ) )

    if not startDir and "HOME" in os.environ:
        startDir = os.environ["HOME"]

    app  = QtWidgets.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtWidgets.QFileDialog()
        dialog.setWindowTitle ( title )
        if startDir:
            dialog.setDirectory ( startDir )
    else:
        dialog = QtWidgets.QFileDialog ( None,title,startDir )
    dialog.setFileMode ( QtWidgets.QFileDialog.Directory)
    dialog.setOption   ( QtWidgets.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtWidgets.QFileDialog.ShowDirsOnly, True)
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
            dirpath2sectors(dirpath, sectors, [])
            meta["sectors"] = sectors

    return meta


if __name__ == '__main__':
    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Image Directory'
    print(json.dumps ( select(title) ))
