##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MTZ HANDLING UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

import os, sys, re
import struct
import math

class measured():
    value = sigma = None

    def __init__(self, v, s):
        self.value = v
        self.sigma = s

class bfpair():
    plus = minus = None

    def __init__(self, v, s):
        self.plus = measured(v[0], s[0])
        self.minus = measured(v[1], s[1])

class mtz_dataset(object):
    H = K = L = FREE = HM = None
    Ipm = Fpm = Imean = Fmean = None
    MTZ = PROJECT = CRYSTAL = DATASET = DCELL = DWAVEL = None
    RESO = None

    def __init__(self, columns, header, isunmerged=False):
        self.MTZ  = header.MTZ
        self.H    = header.H
        self.K    = header.K
        self.L    = header.L
        self.FREE = header.FREE
        self.HM   = header.HM
        for type in 'K', 'M', 'G', 'L':
            labs = columns.pop(type, None)
            if labs and len(labs) == 2:
                lab1, lab2 = labs
                if lab1.replace('+', '-') == lab2 and lab2.replace('-', '+') == lab1:
                    columns[type] = lab1, lab2

                elif lab1.replace('-', '+') == lab2 and lab2.replace('+', '-') == lab1:
                    columns[type] = lab2, lab1

                elif lab1.replace('plus', 'minus') == lab2 and lab2.replace('minus', 'plus') == lab1:
                    columns[type] = lab1, lab2

                elif lab1.replace('minus', 'plus') == lab2 and lab2.replace('plus', 'minus') == lab1:
                    columns[type] = lab2, lab1

        for vtype, stype, tag in (('K', 'M', 'Ipm'), ('G', 'L', 'Fpm')):
            vlabs = columns.pop(vtype, None)
            slabs = columns.get(stype, None)
            if vlabs and slabs:
                setattr(self, tag, bfpair(vlabs, slabs))

        slabs = columns.pop('Q', ())
        islabs = list()
        fslabs = list()
        remainder = list()
        for vtype, vslabs in (('J', islabs), ('F', fslabs)):
            vlabs = columns.get(vtype, ())
            for vlab in vlabs:
                slab = 'SIG' + vlab
                if slab in slabs:
                    vslabs.append((vlab, slab))

            for vlab, slab in vslabs:
                vlabs.remove(vlab)
                slabs.remove(slab)

            for vlab in vlabs:
                remainder.append((vslabs, vlab))

        if len(remainder) == 1 and len(slabs) == 1:
            vslabs, vlab = remainder[0]
            vslabs.append((vlab, slabs[0]))

        if isunmerged:
            if len(islabs) > 0:
                vlab, slab = islabs[0]
                setattr(self, 'Imean', measured(vlab, slab))

        else:
            for tag, vslabs in (('Imean', islabs), ('Fmean', fslabs)):
                if len(vslabs) == 1:
                    vlab, slab = vslabs[0]
                    setattr(self, tag, measured(vlab, slab))

    def prn(self):
        print 'MTZ =', self.MTZ
        print 'PROJECT/CRYSTAL/DATASET = %s/%s/%s' %(self.PROJECT, self.CRYSTAL, self.DATASET)
        print 'HM =', self.HM
        print 'RESO =', self.RESO
        print 'DCELL =', self.DCELL
        print 'DWAVEL =', self.DWAVEL
        print 'H =', self.H
        print 'K =', self.K
        print 'L =', self.L
        print 'FREE =', self.FREE
        if self.Ipm is None:
            print 'Ipm =', self.Ipm

        else:
            print 'Ipm.plus.value =', self.Ipm.plus.value
            print 'Ipm.plus.sigma =', self.Ipm.plus.sigma
            print 'Ipm.minus.value =', self.Ipm.minus.value
            print 'Ipm.minus.sigma =', self.Ipm.minus.sigma

        if self.Fpm is None:
            print 'Fpm =', self.Fpm

        else:
            print 'Fpm.plus.value =', self.Fpm.plus.value
            print 'Fpm.plus.sigma =', self.Fpm.plus.sigma
            print 'Fpm.minus.value =', self.Fpm.minus.value
            print 'Fpm.minus.sigma =', self.Fpm.minus.sigma

        if self.Imean is None:
            print 'Imean =', self.Imean

        else:
            print 'Imean.value =', self.Imean.value
            print 'Imean.sigma =', self.Imean.sigma

        if self.Fmean is None:
            print 'Fmean =', self.Fmean

        else:
            print 'Fmean.value =', self.Fmean.value
            print 'Fmean.sigma =', self.Fmean.sigma

        print

class mtz_dataset_list(list):
    H = K = L = FREE = HM = CELL = RESO = MTZ = BRNG = None

    def __init__(self, fname, header_dict, vstream=None):
        self.MTZ = os.path.abspath(fname)
        batch_set = set()
        for data in header_dict.get('BATCH', ()):
            batch_set.update([int(bno) for bno in data.split()])

        b_list = sorted(batch_set)
        self.BRNG = list()
        if b_list:
            b1 = b_list.pop(0)
            b2 = b1 + 1
            while b_list:
                b3 = b_list.pop(0)
                if b3 == b2:
                    b2 += 1

                else:
                    self.BRNG.append((b1, b2))
                    b1 = b3
                    b2 = b1 + 1

            self.BRNG.append((b1, b2))

        columns_dict = dict()
        for data in header_dict['COLUMN']:
            words = data.split()
            label = words[0]
            type = words[1]
            index = words[4] if len(words) > 4 else '0'
            if type == 'H' and label in ('H', 'K', 'L'):
                if getattr(self, label, None):
                    raise Exception()

                else:
                    setattr(self, label, label)

            if type == 'I' and label.upper().find('FREE') >= 0:
                if not self.FREE:
                    self.FREE = label

            columns = columns_dict.get(index, None)
            if not columns:
                columns = dict()
                columns_dict[index] = columns

            labs = columns.get(type, None)
            if not labs:
                labs = list()
                columns[type] = labs

            labs.append(label)

        if 'SYMINF' in header_dict:
            data = header_dict['SYMINF'][0].replace("'", '"')
            lpos = data.find('"') + 1
            rpos = data.rfind('"')
            if 0 < lpos and lpos < rpos:
                self.HM = data[lpos:rpos]

            else:
                self.HM = header_dict['SYMINF'][0].split()[4]

        if 'CELL' in header_dict:
            self.CELL = tuple([float(datum) for datum in header_dict['CELL'][0].split()])

        if 'RESO' in header_dict:
            self.RESO = tuple([1/math.sqrt(float(datum)) for datum in header_dict['RESO'][0].split()])

        if not (self.H and self.K and self.L and self.HM):
            raise Exception()

        ds_dict = dict()
        for index, columns in columns_dict.items():
            if vstream:
                print >>vstream, columns

            ds_dict[index] = mtz_dataset(columns, self, bool(self.BRNG))

        for key in 'PROJECT', 'CRYSTAL', 'DATASET', 'DCELL', 'DWAVEL':
            if key in header_dict:
                for data in header_dict[key]:
                    words = data.split()
                    index = words[0]
                    obj = ds_dict.get(index, None)
                    if not obj:
                        obj = mtz_dataset(dict(), self)
                        ds_dict[index] = obj

                    if key == 'DCELL':
                        value = list()
                        for word in words[1:]:
                            value.append(float(word))

                        setattr(obj, key, tuple(value))

                    elif key == 'DWAVEL':
                        if len(words) > 1:
                            setattr(obj, key, float(words[1]))

                        else:
                            setattr(obj, key, 0.0 )

                    elif len(words) > 1:
                        setattr(obj, key, words[1] )

                    else:
                        setattr(obj, key, "" )

        for index in sorted(ds_dict):
            ds = ds_dict[index]
            if ds.Ipm or ds.Fpm or ds.Imean or ds.Fmean:
                setattr(ds, 'ID', index)
                self.append(ds)
                ds.RESO = self.RESO
                if not ds.DCELL:
                    ds.DCELL = self.CELL

    def prn(self):
        print
        print 'H =', self.H
        print 'K =', self.K
        print 'L =', self.L
        print 'FREE =', self.FREE
        print 'HM =', self.HM
        print 'CELL =', self.CELL
        print 'RESO =', self.RESO
        print 'BRNG =', self.BRNG
        print
        for ds in self:
            ds.prn()

    def is_merged(self):
        return not self.BRNG

def mtz_file(fname, vstream=None):
    header_dict = dict()
    with open(fname, mode='rb') as istream:
        line = None
        for fmt in ('<I', '>I'):
            istream.seek(4)
            n = struct.unpack(fmt, istream.read(4))[0]
            istream.seek(4* n - 4)
            h = istream.read(80)
            if h.startswith('VERS'):
                line = h
                break

        while line and not line.startswith('MTZBATS'):
            if vstream:
                print >>vstream, line

            key, sep, data = line.partition(' ')
            data_list = header_dict.get(key, None)
            if not data_list:
                data_list = list()
                header_dict[key] = data_list

            data_list.append(data)
            line = istream.read(80)

    if header_dict:
        return mtz_dataset_list(fname, header_dict, vstream)

rec_xds = re.compile('(?:%s|%s)' %(
  "^!FORMAT=XDS_ASCII +MERGE=(TRUE|FALSE) +FRIEDEL'S_LAW=(?:TRUE|FALSE)",
  '\n!Generated +by +INTEGRATE +',
))

def hkl_format(path, vstream=None):
    with open(path, 'rb') as istream:
        for fmt in ('<I', '>I'):
            istream.seek(4)
            n = struct.unpack(fmt, istream.read(4))[0]
            istream.seek(4* n - 4)
            line = istream.read(80)
            if line.startswith('VERS'):
                while line:
                    line = istream.read(80)
                    if line.startswith('MTZBATS'):
                        return 'mtz_integrated'

                return 'mtz_merged'

        istream.seek(0)
        rec_data = rec_xds.search(istream.read(256))
        if rec_data:
            merge = rec_data.group(1)
            if merge == 'TRUE':
                return 'xds_merged'

            elif merge == 'FALSE':
                return 'xds_scaled'

            else:
                assert merge is None
                return 'xds_integrated'

        return 'unknown'

def test_dir(dirpath, vstream=None):
    for root, dirs, files in os.walk(dirpath):
        for file in files:
            if os.path.splitext(file)[1].lower() in ('.mtz', '.hkl'):
                path = os.path.join(root, file)
                format = hkl_format(path, vstream)
                print '---------------------'
                print path
                print format
                if format in ('mtz_integrated', 'mtz_merged'):
                    mf = mtz_file(path, vstream)
                    mf.prn()
                    print mf.is_merged()

def test_default(vstream=None):
    ccp4 = os.environ['CCP4']
    mf = mtz_file(ccp4 + '/examples/tutorial/data/hg_a_1to84_h3_scala2.mtz', vstream)
    for ds in mf:
        ds.prn()

    mf = mtz_file(ccp4 + '/examples/toxd/toxd.mtz', vstream)
    for ds in mf:
        ds.prn()

    mf = mtz_file(ccp4 + '/share/ccp4i2/demo_data/mdm2/r4hg7sf_1.mtz', vstream)
    for ds in mf:
        ds.prn()

def test_file(filepath, vstream=None):
    mf = mtz_file(filepath, vstream)
    mf.prn()
    print mf.is_merged()

def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
        if os.path.isdir(path):
            test_dir(path)

        elif os.path.isfile(path):
            test_file(path, sys.stdout)

        else:
            assert None

    else:
        test_default(sys.stdout)

if __name__ == '__main__':
    main()
