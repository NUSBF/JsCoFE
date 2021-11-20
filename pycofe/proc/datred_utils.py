
#
# ============================================================================
#
#    01.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DATA REDUCTION UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

from future import *

import os, sys, re
from pyrvapi import *
import xml.etree.ElementTree as ET
import json
import subprocess as SP
from fractions import Fraction

showall = False
showall = True

class opmat(tuple):

  @staticmethod
  def from_point_str(e2):
    op_br = ''.join(e2.find('ReindexOperator').text.split())
    return opmat(re.match('\[(.+,.+,.+)\]', op_br).group(1))

  def __new__(cls, op):
    if type(op) is str:
      mat = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      ind_dict = dict(h=0, k=1, l=2)
      for mat_row, op_row in zip(mat, op.split(',')):
        for val, ind in re.findall('([+-]?(?:[0-9](?:/[0-9])?)?)([hkl])', op_row):
          mat_row[ind_dict[ind]] = int(val + '1') if val in ('', '+', '-') else Fraction(val)

    else:
      mat = op

    return tuple.__new__(cls, [tuple([fv for fv in mat_row]) for mat_row in mat])

  def __str__(self):
    op = ''
    ind_list = (('h', 0), ('k', 1), ('l', 2))
    for i in 0, 1, 2:
      op += ',' if i else ''
      plus = ''
      for ind, j in ind_list:
        frac = self[i][j]
        if frac:
          if frac == 1:
            op += plus + ind

          elif frac == - 1:
            op += '-' + ind

          elif frac > 0:
            op += plus + str(frac) + ind

          elif frac < 0:
            op += str(frac) + ind

          plus = '+'

    return op

  def __mul__(self, other):
    prod = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    for i in 0, 1, 2:
      for j in 0, 1, 2:
        fv = sum([self[i][k]* other[k][j] for k in (0, 1, 2)])
        iv = int(fv)
        prod[i][j] = iv if iv == fv else fv

    return opmat(prod)

  @staticmethod
  def test():
    op = '1/2h-1/2k+l,l,-1/2k+1/2h'
    op33 = opmat(op)
    print(repr(op33))
    print(op)
    print(op33)

    op = 'h,k,-h-l'
    op33 = opmat(op)
    print(repr(op33))
    print(op)
    print(op33)
    print(op33* op33)

sg_dict = {
  'P m -3 m': ('P 4 3 2', 'P 41 3 2', 'P 42 3 2', 'P 43 3 2',),
  'I m -3 m': ('I 4 3 2', 'I 41 3 2',),
  'F m -3 m': ('F 4 3 2', 'F 41 3 2',),
  'P m -3': ('P 2 3', 'P 21 3',),
  'I m -3': ('I 2 3', 'I 21 3',),
  'F m -3': ('F 2 3',),
  'P 4/m m m': ('P 4 2 2', 'P 4 21 2', 'P 41 2 2', 'P 41 21 2', 'P 42 2 2', 'P 42 21 2', 'P 43 2 2', 'P 43 21 2',),
  'P 4/m': ('P 4', 'P 41', 'P 42', 'P 43',),
  'I 4/m m m': ('I 4 2 2', 'I 41 2 2',),
  'I 4/m': ('I 4', 'I 41',),
  'P 6/m m m': ('P 6 2 2', 'P 61 2 2', 'P 62 2 2', 'P 63 2 2', 'P 64 2 2', 'P 65 2 2',),
  'P 6/m': ('P 6', 'P 61', 'P 62', 'P 63', 'P 64', 'P 65',),
  'P -3 m 1': ('P 3 2 1', 'P 31 2 1', 'P 32 2 1',),
  'P -3 1 m': ('P 3 1 2', 'P 31 1 2', 'P 32 1 2',),
  'P -3': ('P 3', 'P 31', 'P 32',),
  'R -3 m': ('R 3 2',),
  'R -3': ('R 3',),
  'H -3 m': ('H 3 2',),
  'H -3': ('H 3',),
  'P m m m': ('P 2 2 2', 'P 21 2 2', 'P 2 21 2', 'P 2 2 21', 'P 2 21 21', 'P 21 2 21', 'P 21 21 2', 'P 21 21 21',),
  'C m m m': ('C 2 2 2', 'C 2 2 21',),
  'I m m m': ('I 2 2 2', 'I 21 21 21',),
  'F m m m': ('F 2 2 2',),
  'P 1 2/m 1': ('P 1 2 1', 'P 1 21 1',),
  'C 1 2/m 1': ('C 1 2 1',),
  'I 1 2/m 1': ('I 1 2 1',),
  'P -1': ('P 1',),
}


sg_nsym = {
  'P m -3 m' : 24,
  'I m -3 m' : 48,
  'F m -3 m' : 96,
  'P m -3'   : 12,
  'I m -3'   : 24,
  'F m -3'   : 48,
  'P 4/m m m': 8,
  'P 4/m'    : 4,
  'I 4/m m m': 16,
  'I 4/m'    : 8,
  'P 6/m m m': 12,
  'P 6/m'    : 6,
  'P -3 m 1' : 6,
  'P -3 1 m' : 6,
  'P -3'     : 3,
  'R -3 m'   : 6,
  'R -3'     : 3,
  'H -3 m'   : 18,
  'H -3'     : 9,
  'P m m m'  : 4,
  'C m m m'  : 8,
  'I m m m'  : 8,
  'F m m m'  : 16,
  'P 1 2/m 1': 2,
  'C 1 2/m 1': 4,
  'I 1 2/m 1': 4,
  'P -1'     : 1
}

def getNSym ( spaceGroup ):
    #  returns symmetry number for spacegroup 'spaceGroup' or 0 if spaceGroup
    #  is not found
    nsym = 0
    for sg in sg_dict:
        if spaceGroup in sg_dict[sg]:
            nsym = sg_nsym[sg]
            break;
    return nsym



class input_spcgrp(object):

  input_sg_defined = False

  def __init__(self, sg3):
    self._sg3 = sg3
    self._sg2 = None

  def set_input_sg(self, op):
    self._sg2 = self._sg3
    axes = re.match('P (21?) (21?) (21?)', self._sg3)
    if axes:
      perm_op = op.replace('-', '').split(',')
      perm_rec = list(zip(*sorted(list(zip(perm_op, tuple('hkl'))))))[1]
      self._sg2 = 'P %s %s %s' % list(zip(*sorted(list(zip(perm_rec, axes.groups()))))) [1]

class spacegroup(object):
  # A lazy solution, avoiding transformations where possible
  # (assuming that pointless always returns h,k,l if possible)

  _alt_list = (
    ('P 2 21 21', 'P 21 21 2', 'k,l,h',),
    ('P 21 2 21', 'P 21 21 2', '-h,l,k',),
    ('P 21 2 2', 'P 2 2 21', 'k,l,h',),
    ('P 2 21 2', 'P 2 2 21', '-h,l,k',),
    ('I 1 2 1', 'C 1 2 1', 'h,k,-h-l',),
  )

# _alt_dict = dict([(sg, (alt, op)) for sg, alt, op in _alt_list])

  @classmethod
  def get_alt(cls):
    return list(zip(*cls._alt_list))[:2]

  _alt_dict = {
    'P 2 21 21': ('P 21 21 2', 'k,l,h',),
    'P 21 2 21': ('P 21 21 2', '-h,l,k',),
    'P 21 2 2': ('P 2 2 21', 'k,l,h',),
    'P 2 21 2': ('P 2 2 21', '-h,l,k',),
    'I 1 2 1': ('C 1 2 1', 'h,k,-h-l',),
  }

  _pg_ops_dict = {
    '121': ('h,k,l', '-h,k,-l',),
    '222': ('h,k,l', 'h,-k,-l', '-h,k,-l', '-h,-k,l',),
  }

  _sep = ' ; '
  _sep = ':'
  input_sg = False
  input_setting = False
  alt = None

  def __init__(self, sgin, sg, op, score=0):
    self.sgin = sgin
    pg = ''.join(re.findall(' ([0-9])[0-9]?', sg))
    pg_ops = self._pg_ops_dict.get(pg)
    self.op = 'h,k,l' if pg_ops and op in pg_ops else op
    self.sg = sg
    self.score = score
    if sg in self._alt_dict:
      alt_sg, alt_op = self._alt_dict.get(sg)
      self.alt = spacegroup(self.sgin, alt_sg, str(opmat(alt_op)* opmat(op)))

  def _set_asis(self):
    self.input_sg = True
    self.input_setting = self.sg == self.sgin._sg3 and self.op == 'h,k,l'

  def setasis(self, force=False):
    if force or self.sg == self.sgin._sg2:
      assert not self.sgin.input_sg_defined
      self.sgin.input_sg_defined = True
      self._set_asis()
      if self.alt:
        self.alt._set_asis()

  @classmethod
  def fromstr(cls, sg_op):
    return cls(*sg_op.split(cls._sep))

  def __str__(self):
    return self._sep.join((self.sg, self.op))

def point_symm_selector(e0):
  tt1 = '''
    Symbols in brackets mean:
    (I) Patterson group in imported file,
    (B) Patterson group marked as the most likely one by Pointless at import and
    (*) symbolic Pointless score;
    square brackets show reindexing operation from setting in imported file to Patterson group setting
  '''
  tt2 = '''
    Symbols in brackets mean:
    (I) space group in imported file,
    (B) space group marked as the most likely one by Pointless at import and
    (*) symbolic Pointless score
  '''
  tt3a = '''
    These options would have an effect only if
    an automatically selected space group has alternative settings.
    Specifically, lattice-based settings %s correspond to symmetry-based settings %s.
  ''' %tuple([', '.join(lst[:-1]) + ' and ' + lst[-1] for lst in spacegroup.get_alt()])
  tt3b = '''
    Symbols in brackets mean:
    (I) setting in imported file,
    (S) space group-based setting and
    (C) cell-based setting
  '''
  tt1 = ' '.join(tt1.split())
  tt2 = ' '.join(tt2.split())
  tt3a = ' '.join(tt3a.split())
  tt3b = ' '.join(tt3b.split())
  t1 = ('Patterson group', tt1)
  t2 = ('Space group', tt2)
  t3a = ('Space group setting', tt3a)
  t3b = ('Space group setting', tt3b)

  l1 = []
  alt1 = False
  cou1 = 1
  e1 = e0.find('ReflectionFile')
  sg3 = ' '.join(e1.find('SpacegroupName').text.split())
  sgin = input_spcgrp(sg3)
  score = 2
  good_sgobj_list = list()
  e1 = e0.find('SpacegroupList')
  for e2 in e1.findall('Spacegroup'):
    op = str(opmat.from_point_str(e2))
    sg = ' '.join(e2.find('SpacegroupName').text.split())
    good_sgobj_list.append(spacegroup(sgin, sg, op, score))
    score = 1

  e1 = e0.find('LaueGroupScoreList')
  for e2 in e1.findall('LaueGroupScore'):
    id = e2.find('number').text.strip()
    assert int(id) == cou1
    cou1 += 1
    symbol = ' '.join(e2.find('LaueGroupName').text.split())
    assert symbol in sg_dict
    op = str(opmat.from_point_str(e2))
    stars = e2.find('LaueGroupScoreStars').text.strip()
    status = e2.find('LaueGroupScoreAccept').text.strip()
    assert status in ('Original', 'Accepted', 'OriginalRejected', 'NotAccepted')
    sg_list = sg_dict[symbol]
    sgobj_list = list()
    if status in ('Original', 'Accepted'):
      assert good_sgobj_list
      sg_list = list(sg_list)
      for sgobj in list(good_sgobj_list):
        if sgobj.sg in sg_list:
          good_sgobj_list.remove(sgobj)
          sg_list.remove(sgobj.sg)
          sgobj_list.append(sgobj)
          if sgobj.op != op:
            msg = 'Input XML-file is assumed to have been generated with SETTING LATTICE'
            #print(msg, file=sys.stderr)
            #print(sgobj.op, '?=?', op, file=sys.stderr)
            sys.stderr.write ( msg )
            sys.stderr.write ( sgobj.op + '?=?' + op )

    for sg in sg_list:
      sgobj_list.append(spacegroup(sgin, sg, op))

    asis1 = status in ('Original', 'OriginalRejected')
    if asis1:
      sgin.set_input_sg(op)
      if len(sgobj_list) == 1:
        sgobj_list[0].setasis(force=True)

      else:
        for sgobj in sgobj_list:
          sgobj.setasis()

    l2 = []
    alt2 = False
    for sgobj in sgobj_list:
      if sgobj.alt:
        suffix_latt = ' (LI)' if sgobj.input_setting else ' (L)'
        suffix_symm = ' (SI)' if sgobj.alt.input_setting else ' (S)'

      else:
        suffix_latt = ' (I)' if sgobj.input_setting else ''
        suffix_symm = ''

      lab3 = sgobj.sg + suffix_latt
      l3 = [dict(label=lab3, value='no')]
      if sgobj.alt:
        lab3 = sgobj.alt.sg + suffix_symm
        l3.append(dict(label=lab3, value=str(sgobj.alt)))

      lab2 = sgobj.sg
      if sgobj.score == 2:
        lab2 += ' (*BI)' if sgobj.input_sg else ' (*B)'

      elif sgobj.score == 1:
        lab2 += ' (*I)' if sgobj.input_sg else ' (*)'

      else:
        lab2 += ' (I)' if sgobj.input_sg else ''

      alt3 = bool(sgobj.alt)
      show3 = alt3 or showall
      w3 = dict(show=show3, select=0, title=t3b[0], tooltip=t3b[1], items=l3)
      val2 = str(sgobj)
      l2.append(dict(label=lab2, value=val2, next=w3))
      alt2 = alt2 or alt3

    l3 = []
    if alt2:
      l3.append(dict(label='lattice based', value='no'))
      l3.append(dict(label='symmetry based', value='yes'))

    else:
      l3.append(dict(label='unique', value='no'))

    show2 = alt2 or showall
    w3 = dict(show=show2, select=0, title=t3a[0], tooltip=t3a[1], items=l3)
    l2.insert(0, dict(label='Auto', value='no', next=w3))
    w2 = dict(show=True, select=0, title=t2[0], tooltip=t2[1], items=l2)
    lab1 = '%s [%s]' %(symbol, op)
    if stars or asis1:
      lab1 += ' (%s%s)' %(stars, 'I' if asis1 else '')

    l1.append(dict(label=lab1, value=id, next=w2))
    alt1 = alt1 or alt2

  l3 = []
  if alt1:
    l3.append(dict(label='lattice based', value='no'))
    l3.append(dict(label='symmetry based', value='yes'))

  else:
    l3.append(dict(label='unique', value='no'))

  show1 = alt1 or showall
  w3 = dict(show=show1, select=0, title=t3a[0], tooltip=t3a[1], items=l3)
  l2 = [dict(label='Auto', value='no', next=w3)]
  w2 = dict(show=True, select=0, title=t2[0], tooltip=t2[1], items=l2)
  l1.insert(0, dict(label='Auto', value='no', next=w2))
  w1 = dict(show=True, select=0, title=t1[0], tooltip=t1[1], items=l1)
  assert not good_sgobj_list
# assert sgin.input_sg_defined # pointless forget the input sg if tests higher pg
  return w1

def point_symm_datasets(xml_path, format='unknown'):
  e0 = ET.parse(xml_path).getroot()
  symm_selector = point_symm_selector(e0)
  e1 = e0.find('ReflectionData')
  reso = e1.find('ResolutionHigh').text.strip()
  cou = 0
  dset_list = list()
  for e2 in e1.findall('Dataset'):
    dset = dict()
    dset_list.append(dset)
    dset['symm'] = symm_selector
    dset['reso'] = reso
    e3 = e2.find('cell')
    dset['cell'] = tuple([e3.find(t).text.strip() for t in 'a b c alpha beta gamma'.split()])
    dset['wlen'] = e2.find('Wavelength').text.strip()
    name = e2.get('name').strip()
    dset['name'] = name
    dset['original_format'] = format
    runs = list()
    dset['runs'] = runs
    for e3 in e2.findall('Run'):
      cou += 1
      assert e3.find('Datasetname').text.strip() == name
      assert e3.find('number').text.strip() == str(cou)
      sweep = e3.find('BatchRange').text.split()
      sweep.insert(0, e3.find('BatchOffset').text.strip())
      runs.append(sweep)

  return dset_list

def combine_runs(dset_runs, runs):
    initial = set()
    for run in dset_runs:
      initial.update(list(range(int(run[1]), int(run[2]) + 1)))

    selected_runs = ''.join(runs.split()).replace(',',' ').split()
    if selected_runs:
      ifirst = min(initial)
      ilast = max(initial)
      selected = set()
      for run in selected_runs:
        re_obj = re.match('^([0-9]+)(?:-([0-9]+))?$', run)
        if re_obj:
          tfirst, tlast = re_obj.groups()
          if tlast:
            first = max(ifirst, int(tfirst))
            last = min(ilast, int(tlast))
            selected.update(list(range(first, last + 1)))

          else:
            selected.add(int(tfirst))

        else:
          raise Exception('ERROR in selection: "%s"' %run)

      no_selected = len(initial & selected)
      batch_list = sorted(initial - selected)

    else:
      no_selected = len(initial)
      batch_list = list()

    run_list = list()
    if batch_list:
      first = batch_list.pop(0)
      last = first
      while batch_list:
        next = batch_list.pop(0)
        if next - last > 1:
          run_list.append((first, last))
          first = next

        last = next

      run_list.append((first, last))

    return run_list, no_selected

def get_point_script(symm_select, mtzref, plist, mtzout, xmlout, separate_merge=False):
  dset_run_list = list()
  for dset, mtz_file, runs in plist:
    run_list, no_selected = combine_runs(dset.runs, runs)
    if no_selected:
      item = dset.name, mtz_file, run_list
      if mtz_file == mtzref:
        mtzref = None
        dset_run_list.insert(0, item)

      else:
        dset_run_list.append(item)

    else:
      raise Exception('ERROR no images selected for dataset ' + dset.name)

  stdi_list = list()
  stdi = list()
  cou = 0
  for dset_name, mtz_file, run_list in dset_run_list:
    cou += 1
    dname = re.sub('\s', '_', dset_name)
    names = re.match('^(.+)/(.+)/(.+)$', dset_name).groups()
    names = (names[0], names[1], str(cou))
    run_ind = 1
    if separate_merge or cou == 1:
      stdi.append('NAME PROJECT %s CRYSTAL %s DATASET %s' %names)
      run_ind = cou

    stdi.append('HKLIN %s' %mtz_file)
    for first, last in run_list:
      file_cou = 'FILE %d' %cou if len(dset_run_list) > 1 else ''
      stdi.append('EXCLUDE %s BATCH %d to %d' %(file_cou, first, last))

  if mtzref:
    stdi.append('HKLREF %s' %mtzref)
    stdi.append('ORIGINALLATTICE')

  else:
    stdi.append('LAUEGROUP HKLIN')
    stdi.append('SPACEGROUP HKLIN')

  if symm_select:
    stdi.append('HKLOUT joined_tmp.mtz')
    stdi.append('')
    stdi_list.append('\n'.join(stdi))
    stdi = list()
    stdi.append('HKLIN joined_tmp.mtz')
    lg_ind, sg_ind, alt_ind = symm_select
    if lg_ind == 'no':
      assert sg_ind == 'no'
      if alt_ind == 'yes':
        stdi.append('SETTING SYMMETRY-BASED')

    else:
      if sg_ind == 'no':
        stdi.append('CHOOSE SOLUTION %s' %lg_ind)
        if alt_ind:
          stdi.append('SETTING SYMMETRY-BASED')

      else:
        sg, op = (sg_ind if alt_ind == 'no' else alt_ind).split(':')
        stdi.append('REINDEX %s' %op)
        stdi.append("SPACEGROUP '%s'" %sg)

  stdi.append('HKLOUT %s' %mtzout)
  stdi.append('XMLOUT junk.xml')
  stdi.append('')
  stdi_list.append('\n'.join(stdi))
  stdi = list()
  stdi.append('HKLIN %s' %mtzout)
  stdi.append('HKLOUT junk.mtz')
  stdi.append('XMLOUT %s' %xmlout)
  stdi.append('')
  stdi_list.append('\n'.join(stdi))
  return stdi_list

def test_ranges(runs):
  n = 3
  range_list = ['0-100', '10001-10100']
  for offset, first, last in runs:
    i0 = int(first)
    i1 = int(last) + 1
    id = (i1 - i0)/ n
    if id < 10:
      range_list.insert(0, ' %d- %d' %(0, i1 + 999))

    else:
      for k0, k1 in zip(list(range(i0, i1, id)), list(range(i0 + id, i1 + id, id))):
        range_list.insert(0, ' %d- %d' %(k0 + 4, k1 + 2))

  return ','.join(range_list)

class test_container(object):
  pass

#def sp2nbsp(t):
#  return '&nbsp;'.join(t.split())

table_list = (
  (
    'ElementScores', 'Element', 'Scores for each symmetry element',
    (
      ('number', 'No', 'Registration number of the operation', 'r'),
      ('Likelihood', 'Likelihood', 'tooltip', 'r'),
      ('ZCC', 'ZCC', 'tooltip', 'r'),
      ('CC', 'CC', 'tooltip', 'r'),
      ('NCC', 'NCC', 'tooltip', 'r'),
      ('R', 'R', 'tooltip', 'r'),
      ('ElementScoreStars', 'Goodness', 'tooltip', 'l'),
#     ('RotationOrder', 'Order', 'tooltip', 'r'),
#     ('Axis', 'Axis', 'tooltip', 'l'),
      ('SymmetryElementString', 'Operator', 'tooltip', 'l'),
    )
  ),
  (
    'LaueGroupScoreList', 'LaueGroupScore', 'Scores for each Laue group',
    (
      ('number', 'No', 'tooltip', 'r'),
#     ('LaueGroupScoreString', 'Accept', 'tooltip', 'l'),
      ('LaueGroupName', 'Group', 'tooltip', 'l'),
      ('LaueGroupScoreStars', 'Goodness', 'tooltip', 'l'),
      ('Likelihood', 'Lklhd', 'tooltip', 'r'),
      ('NetZCC', 'NetZ', 'tooltip', 'r'),
      ('ZCC_plus', 'ZCC+', 'tooltip', 'r'),
      ('ZCC_minus', 'ZCC-', 'tooltip', 'r'),
      ('CC', 'CC', 'tooltip', 'r'),
      ('R', 'R', 'tooltip', 'r'),
      ('CellDelta', 'Dcell', 'tooltip', 'r'),
      ('ReindexOperator', 'Reindex', 'tooltip', 'l'),
    )
  ),
  (
    'SpacegroupList', 'Spacegroup', 'Scores for possible space groups',
    (
      ('SpacegroupName', 'Spacegroup', 'tooltip', 'l'),
      ('SGnumber', 'IT No', 'tooltip', 'r'),
      ('TotalProb', 'TotalProb', 'tooltip', 'r'),
      ('SysAbsProb', 'SysAbsProb', 'tooltip', 'r'),
      ('ReindexOperator', 'Reindex', 'tooltip', 'l'),
#     ('Condition', 'Conditions', 'tooltip', 'l'),
#     ('ZoneNumbers', 'Zone Numbers', 'tooltip', 'r'),
    )
  ),
)

def parse_xmlout(xmlout):
  tab_list = list()
  e0 = ET.parse(xmlout).getroot()
  for key1, key2, title, table in table_list:
    col_list = list()
    tab_list.append((key2, title, col_list))
    for key3, ti, tt, ta in table:
      row_list = list()
      col_list.append((key3, ti, tt, ta, row_list))

    e1 = e0.find(key1)
    for e2 in e1.findall(key2):
      for key3, ti, tt, ta, row_list in col_list:
        e3 = e2.find(key3)
        t = '' if e3 is None else ' '.join(e3.text.split()).replace('( ', '(')
        row_list.append(t)

  return tab_list

def tabs_as_dict(tab_list):
  l0 = list()
  for key2, title, col_list in tab_list:
    l1 = list()
    l0.append(dict(id=key2, title=title, columns=l1))
    for key3, ti, tt, ta, row_list in col_list:
      aln = 'left' if ta == 'l' else 'right' if ta == 'r' else 'center'
      stl = 'text-align:%s;' %aln
      l2 = list()
      l1.append(dict(id=key3, title=ti, tooltip=tt, stype=stl, data=l2))
      for t in row_list:
        l2.append(t.replace(' ', '&nbsp;'))

  return l0

def report(tab_list, secid):
  cou = - 1
  for key2, title, col_list in tab_list:
    cou += 1
    tableid = secid + '_table' + str(cou)
    rvapi_add_table(tableid, title, secid, cou, 0, 1, 1, 1)
    j = - 1
    for key3, ti, tt, ta, row_list in col_list:
      j += 1
      rvapi_put_horz_theader(tableid, ti, tt, j)
      sty = '' if ta == 'r' else 'text-align:%s;' %('left' if ta == 'l' else 'center')
      i = - 1
      for t in row_list:
        i += 1
        rvapi_put_table_string(tableid, t.replace(' ', '&nbsp;'), i, j)
        rvapi_shape_table_cell(tableid, i, j, '', sty, '', 1, 1)

  rvapi_flush()

def test():
  dump_keyargs = dict(sort_keys=True, indent=4, separators=(',', ': '))
  xmlout = sys.argv[1]
  if len(sys.argv) == 2:
    tab_list = parse_xmlout(xmlout)
    print(json.dumps(tabs_as_dict(tab_list), **dump_keyargs))
    jslib = os.path.join(os.environ['CCP4'], 'share', 'jsrview')
    jsdir = 'report'
    if not os.path.isdir(jsdir):
      os.mkdir(jsdir)

    rvapi_init_document('symmdoc', jsdir, 'Symm Summary', 1, 7, jslib, None, None, None, None)
    rvapi_add_tab('tab1', 'Symmetry', True)
    rvapi_add_section('sec1', 'Symmetry assignment', 'tab1', 0, 0, 1, 1, True)
    report(tab_list, 'sec1')
    return

  dset_list = point_symm_datasets(xmlout)
  symm = dset_list[0]['symm']
  if len(sys.argv) == 3:
    print()
    json_out = sys.argv[2]
    with open(json_out, 'w') as ostream:
        #print(json.dumps(symm, **dump_keyargs), file=ostream)
        ostream.write ( json.dumps(symm, **dump_keyargs) )

  else:
    mode = sys.argv[2]
    assert mode in ('separate', 'together')
    symm_select = None
    if sys.argv[3] != 'empty':
      symm_select = list()
      next = symm
      for ind in sys.argv[3].split('/'):
        item = next['items'][int(ind)]
        next = item.get('next')
        symm_select.append(item['value'])

    tc_dset_dict = dict()
    for dset in dset_list:
      tc_dset = test_container()
      tc_dset.runs = dset['runs']
      tc_dset.name = dset['name']
      tc_dset_dict[tc_dset.name] = tc_dset

    mtzref = sys.argv[4] + '.mtz'
    plist = list()
    for arg in sys.argv[5:]:
      mtzname, dname = re.match('(^.+)/([^/]+/[^/]+/[^/]+)$', arg).groups()
      tc_dset = tc_dset_dict[dname]
      plist.append((tc_dset, mtzname + '.mtz', test_ranges(tc_dset.runs)))

    args = symm_select, mtzref, plist, 'merged.mtz', 'pointless.xml', mode == 'separate'
    for script in get_point_script(*args):
      print(script)
      print()

if __name__ == '__main__':
  test()
