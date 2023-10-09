
from gemmi import cif

class UsrLibUsage(object):

  @staticmethod
  def _get(tt, prefix, suffix, default):
    k1 = prefix + 'auth_' + suffix
    k2 = prefix + 'label_' + suffix
    return tt.get(k1 if k1 in tt else k2, default)

  def __init__(self, f1, f2 = None, vb = False):
    d1 = cif.read_file(f1)
    d2 = cif.read_file(f2)[0] if f2 else None

    liblnk = {}
    lnkmod_set = set()
    liblnk_set = set()
    stdlnk = {}
    unklnk = {}
    symlnk = {}

    tt = None
    if 'link_list' in d1:
      tt = d1['link_list'].get_mmcif_category('_chem_link.')
    if tt:
      kk = zip(
        tt['id'],
        tt['comp_id_1'],
        tt['mod_id_1'],
        tt['comp_id_2'],
        tt['mod_id_2'],
      )
      for k1, k2, k3, k4, k5 in kk:
        lnkmod_set.add((k3, k2))
        lnkmod_set.add((k5, k4))
        tt = d1['link_' + k1].get_mmcif_category('_chem_link_bond.')
        k6, k7, k8, k9 = list(zip(
          tt['atom_1_comp_id'],
          tt['atom_id_1'],
          tt['atom_2_comp_id'],
          tt['atom_id_2'],
        ))[0]
        if k6 == '2' and k8 == '1':
          kx = k6; k6 = k8; k8 = kx
          kx = k7; k7 = k9; k9 = kx
        fml = k2 + '.' + k7 + '-' + k9 + '.' + k4
        key = k1, fml
        liblnk[key] = []
        liblnk_set.add(k1)

    tt = d2.get_mmcif_category('_struct_conn.') if d2 else None
    if tt:
      n = len(list(tt.values())[0])
      vv0 = n* [None]
      vv1 = n* ['1_555']
      kk = zip(
        tt.get('ccp4_link_id', vv0),
        self._get(tt, 'ptnr1_', 'atom_id', vv0),
        self._get(tt, 'ptnr1_', 'comp_id', vv0),
        self._get(tt, 'ptnr1_', 'asym_id', vv0),
        self._get(tt, 'ptnr1_', 'seq_id', vv0),
        tt.get('ptnr1_symmetry', vv1),
        self._get(tt, 'ptnr2_', 'atom_id', vv0),
        self._get(tt, 'ptnr2_', 'comp_id', vv0),
        self._get(tt, 'ptnr2_', 'asym_id', vv0),
        self._get(tt, 'ptnr2_', 'seq_id', vv0),
        tt.get('ptnr2_symmetry', vv1),
      )
      for k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11 in kk:
        fml1 = k3 + '.' + k2 + '-' + k7 + '.' + k8
        fml2 = k8 + '.' + k7 + '-' + k2 + '.' + k3
        val1 = k3 + ':' + k4 + ':' + k5 + '-' + k8 + ':' + k9 + ':' + k10
        val2 = k8 + ':' + k9 + ':' + k10 + '-' + k3 + ':' + k4 + ':' + k5
        if k1 and k1 in liblnk_set:
          dl = liblnk
        elif k1:
          dl = stdlnk
        elif k6 != '1_555' or k11 != '1_555':
          dl = symlnk
        else:
          dl = unklnk
        key = k1, fml1
        val = val1
        l = dl.get(key)
        if l is None:
          key = k1, fml2
          val = val2
          l = dl.get(key)
          if l is None:
            key = k1, fml1
            val = val1
            l = []
            dl[key] = l
        l.append(val)

    if vb:
      print()
      print('liblnk')
      print(liblnk)
      print()
      print('unklnk')
      print(unklnk)
      print()
      print('stdlnk')
      print(stdlnk)
      print()
      print('symlnk')
      print(symlnk)

    libmod = {}

    tt = None
    if 'mod_list' in d1:
      tt = d1['mod_list'].get_mmcif_category('_chem_mod.')
    if tt:
      kk = zip(
        tt['id'],
        tt['comp_id'],
      )
      for k1, k2 in kk:
        key = k1, k2
        if key not in lnkmod_set:
          libmod[key] = []

      tt = d2.get_mmcif_category('_ccp4_struct_asym_mod.') if d2 else None
      if tt:
        n = len(list(tt.values())[0])
        vv0 = n* [None]
        kk = zip(
          tt['mod_id'],
          self._get(tt, '', 'comp_id', vv0),
          self._get(tt, '', 'asym_id', vv0),
          self._get(tt, '', 'seq_id', vv0),
        )
        for k1, k2, k3, k4 in kk:
          key = k1, k2
          val = k2 + ':' + k3 + ':' + k4
          if key in libmod:
            libmod[key].append(val)

      if vb:
        print()
        print('libmod')
        print(libmod)

    libcmp = {}

    tt = None
    if 'comp_list' in d1:
      tt = d1['comp_list'].get_mmcif_category('_chem_comp.')
    if tt:
      for k1 in tt['id']:
        libcmp[k1] = []

      tt = d2.get_mmcif_category('_atom_site.') if d2 else None
      if tt:
        n = len(list(tt.values())[0])
        vv0 = n* [None]
        kk = zip(
          self._get(tt, '', 'comp_id', vv0),
          self._get(tt, '', 'asym_id', vv0),
          self._get(tt, '', 'seq_id', vv0),
        )
        for k1, k2, k3 in kk:
          if k1 in libcmp:
            val = k1 + ':' + k2 + ':' + k3
            libcmp[k1].append(val)

      libcmp = dict([((k, k), sorted(set(v))) for k, v in libcmp.items()])

      if vb:
        print()
        print('libcmp')
        print(libcmp)

    self.kkkvv = (
      ('libcmp', libcmp),
      ('libmod', libmod),
      ('liblnk', liblnk),
      ('stdlnk', stdlnk),
      ('symlnk', symlnk),
      ('unklnk', unklnk),
    )
    if vb:
      print(self.importedComps())
      print(self.importedLinks())

  def jligandLocks(self, f3):
    with open(f3, 'w') as ostream:
      for k, kkvv in self.kkkvv:
        if k in ('libcmp', 'libmod', 'liblnk'):
          for kk in sorted(kkvv):
            k1, fml = kk
            ostream.write(k1 + '\n')
            for v in sorted(kkvv[kk]):
              ostream.write(' ' + v + '\n')

  def importedComps(self):
    kkvv = dict(self.kkkvv)['libcmp']
    return sorted([kk[0] for kk in kkvv])

  def importedLinks(self):
    kkvv = dict(self.kkkvv)['liblnk']
    return sorted(['%s (%s)' %kk for kk in kkvv])

  def structCounts(self, stdo, width = 80):
    kvv = dict([(k, sorted(['%s(%d)' %(kk[1], len(vv))
      for kk, vv in kkvv.items()])) for k, kkvv in self.kkkvv])
    stdo.write('Counts for revision summary\n')
    for k, vv in sorted(kvv.items()):
      if vv:
          stdo.write(k)
          sep = ': '
          nc = len(k)
          ne = nc + len(sep)
          for v in vv:
              w = sep + v
              nc += len(w)
              if nc + 1 > width:
                  w = ',\n' + ne* ' ' + v
                  nc = len(w) - 2
              stdo.write(w)
              sep = ', '
          stdo.write('\n')
    return kvv

if __name__ == '__main__':
  import sys
  clu = UsrLibUsage(sys.argv[1], sys.argv[2], True)
  clu.jligandLocks(sys.argv[3])
  clu.structCounts(sys.stdout, 48)

