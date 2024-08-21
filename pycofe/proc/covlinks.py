
import os, sys
import gemmi
from collections import namedtuple, OrderedDict

class CovLinks(object):
#
# empty = '_empty_mondir'
#

  def __init__(self, libin, xyzin):
#
#   if not os.path.isdir(self.empty + '/list'):
#     os.makedirs(self.empty + '/list')
#   with open(self.empty + '/list/mon_lib_list.cif', 'w') as ostream:
#     ostream.write('')
#   with open(self.empty + '/ener_lib.cif', 'w') as ostream:
#     ostream.write('data_energy')
#   self.monlib = gemmi.read_monomer_lib(self.empty, [], libin, False)
#
    self.struct = gemmi.read_structure(xyzin)
    assert len(self.struct) == 1
    for cra in self.struct[0].all():
      cra.residue.segment = ''
    self.indices1 = []
    self.indices2 = []
    self.libin = libin
    self.comp_dict = OrderedDict()
    self.mod_dict = OrderedDict()
    self.link_ddict = OrderedDict(
      links_usr = OrderedDict(),
      links_std = OrderedDict(),
      links_unk = OrderedDict(),
    )
    self._extend_side()

  def suggest_changes(self):
    model = self.struct[0]
    ind = 0
    for conn in self.struct.connections:
      conn.name = 'covale' + str(ind + 1)
      addr1, addr2 = conn.partner1, conn.partner2
#
      val = self.monlib_match_link.get((
        addr1.res_id.name, addr1.atom_name,
        addr2.res_id.name, addr2.atom_name,
      ))
      if val and not conn.link_id:
        link_id, inv = val[0]
        conn.link_id = link_id
        self.indices1.append(ind)
      ind += 1
#
#     cra1 = model.find_cra(addr1, ignore_segment = True)
#     cra2 = model.find_cra(addr2, ignore_segment = True)
#     link, inv, x1, x2 = self.monlib.match_link(
#       cra1.residue, cra1.atom.name, cra1.atom.altloc,
#       cra2.residue, cra2.atom.name, cra1.atom.altloc,
#     )
#     if link and not conn.link_id:
#       conn.link_id = link.id
#       self.indices1.append(ind)
#     ind += 1
#

    cs = gemmi.ContactSearch(2.5)
    cs.setup_atomic_radii(1.0, 1.5)
    cs.ignore = gemmi.ContactSearch.Ignore.AdjacentResidues
    cs.min_occupancy = 0.01

    self.struct.setup_entities()
    ns = gemmi.NeighborSearch(model, self.struct.cell, 5)
    ns = ns.populate(include_h = False)
    results = cs.find_contacts(ns)
    for pair in results:
      if pair.image_idx != 0:
        continue
      cra1, cra2 = pair.partner1, pair.partner2
#
      val = self.monlib_match_link.get((
        cra1.residue.name, cra1.atom.name,
        cra2.residue.name, cra2.atom.name,
      ))
      if val:
        link_id, inv = val[0]
        conn = gemmi.Connection()
        conn.link_id = link_id
#
#     link, inv, x1, x2 = self.monlib.match_link(
#       cra1.residue, cra1.atom.name, cra1.atom.altloc,
#       cra2.residue, cra2.atom.name, cra1.atom.altloc,
#     )
#     if link:
#       conn = gemmi.Connection()
#       conn.link_id = link.id
#
        conn.asu = gemmi.Asu.Same
        conn.type = gemmi.ConnectionType.Covale
        conn.name = 'covale' + str(ind + 1)
        addr1, addr2 = conn.partner1, conn.partner2
        for addr, cra in (addr1, cra1), (addr2, cra2):
          addr.altloc = cra.atom.altloc
          addr.atom_name = cra.atom.name
          addr.chain_name = cra.chain.name
          addr.res_id.name = cra.residue.name
          addr.res_id.segment = cra.residue.segment
          addr.res_id.seqid.icode = cra.residue.seqid.icode
          addr.res_id.seqid.num = cra.residue.seqid.num
        conn2 = self.struct.find_connection(addr1, addr2)
        if not conn2:
          self.struct.connections.append(conn)
          self.indices2.append(ind)
          ind += 1

    msg_list = []
    for ind in self.indices1 + self.indices2:
      txt = 'LINKR'
      conn = self.struct.connections[ind]
      for addr in conn.partner1, conn.partner2:
        txt += '   %3s %3s %s%4d' %(
          addr.atom_name,
          addr.res_id.name,
          addr.chain_name,
          addr.res_id.seqid.num,
        )
      txt += '   ' + conn.link_id
      msg_list.append(txt)
    len1 = len(self.indices1)
    return msg_list[:len1], msg_list[len1:]

  def update(self, xyzout = None, mode = -1):
    if mode < 0:
      mode = 3 if xyzout else 0

    if not (mode & 1):
      for ind in self.indices1:
        self.struct.connections[ind].link_id = ''
      del self.indices1[:]

    if not (mode & 2):
      for ind in range(len(self.indices2)):
        self.struct.connections.pop()
      del self.indices2[:]

    self.delete_atoms()

    if xyzout:
      indices = self.indices1 + self.indices2
      if indices or mode & 4:
        if xyzout.endswith('.pdb'):
          self.struct.write_pdb(xyzout, use_linkr = True)
        else:
          self.struct.make_mmcif_document().write_file(xyzout)

  def delete_atoms(self):
    ciflib = gemmi.cif.read_file(self.libin)
    del_dict = {}
    none_list = None, False, True, '', '.', '?'
    for mod_id in self.monlib_sides:
      kvv = ciflib['mod_' + mod_id].get_mmcif_category('_chem_mod_atom.')
      vv = zip(kvv['function'], kvv['atom_id'], kvv['new_atom_id'])
      atom_list = []
      cou = 0
      for fun, ao, an in vv:
        fun = fun.lower()
        if fun == 'add':
          ## better to keep refs to comp_atom
          if not (ao in none_list or ao.startswith('H')):
            cou += 1
        elif fun == 'change':
          ## change charge or energy type is OK
          ## change of atom symbol needs refs to comp_atom
          if not (an in none_list or an == ao):
            cou += 1
        elif fun == 'delete':
          atom_list.append(ao)
        else:
          cou += 1
      if cou > 0:
        atom_list = None
      del_dict[mod_id] = tuple(atom_list)

    model = self.struct[0]
    for ind in self.indices1 + self.indices2:
#     print()
      conn = self.struct.connections[ind]
      addr1, addr2 = conn.partner1, conn.partner2
#
      link_id, inv = self.monlib_match_link[(
          addr1.res_id.name, addr1.atom_name,
          addr2.res_id.name, addr2.atom_name,
      )][0]
      m1, m2 = self.monlib_links[link_id]
      dd1 = del_dict.get(m1)
      dd2 = del_dict.get(m2)
#
#     cra1 = model.find_cra(addr1, ignore_segment = True)
#     cra2 = model.find_cra(addr2, ignore_segment = True)
#     link, inv, x1, x2 = self.monlib.match_link(
#       cra1.residue, cra1.atom.name, cra1.atom.altloc,
#       cra2.residue, cra2.atom.name, cra1.atom.altloc,
#     )
#     dd1 = del_dict.get(link.side1.mod)
#     dd2 = del_dict.get(link.side2.mod)
#
      if dd1 is not None and dd2 is not None:
        if inv:
          dd1, dd2 = dd2, dd1
        for dd, addr in (dd1, addr1), (dd2, addr2):
#         print('-------------------')
          name_1 = addr.atom_name
          for name_2 in dd:
            addr.atom_name = name_2
#           print(addr)
            cra = model.find_cra(addr, ignore_segment = True)
            a_2 = cra.atom
            if a_2:
              cra.residue.remove_atom(a_2.name, a_2.altloc, a_2.element)
#             print(a_2)
          addr.atom_name = name_1

  def _extend_side(self):
    ciflib = gemmi.cif.read_file(self.libin)
    self.monlib_links = OrderedDict()
    self.monlib_sides = OrderedDict()
    if 'link_list' in ciflib:
      kuu = ciflib['link_list'].get_mmcif_category('_chem_link.')
      uu = zip(
        kuu['id'],
        kuu['comp_id_1'], kuu['mod_id_1'],
        kuu['comp_id_2'], kuu['mod_id_2'],
      )
      for l12, c1, m1, c2, m2 in uu:
        kvv = ciflib['link_' + l12].get_mmcif_category('_chem_link_bond.')
        vv = list(zip(
          kvv['atom_1_comp_id'], kvv['atom_id_1'],
          kvv['atom_2_comp_id'], kvv['atom_id_2'],
        ))
        i1, a1, i2, a2 = vv.pop()
        assert not vv
        if i1 == '2' and i2 == '1':
          a1, a2 = a2, a1
        else:
          assert i1 == '1' and i2 == '2'
        for lm, lc, la in (m1, c1, a1), (m2, c2, a2):
          side = self.monlib_sides.get(lm)
          if side:
            sc, sa = side
            assert lc == sc and la == sa
          else:
            self.monlib_sides[lm] = lc, la

        assert l12 not in self.monlib_links
        self.monlib_links[l12] = m1, m2

    self.monlib_mods = OrderedDict()
    if 'mod_list' in ciflib:
      mod_used = set(self.monlib_sides)
      kuu = ciflib['mod_list'].get_mmcif_category('_chem_mod.')
      uu = zip(kuu['id'], kuu['comp_id'])
      for m0, c0 in uu:
        if m0 in self.monlib_sides:
          sc, sa = self.monlib_sides[m0]
          assert sc == c0
          mod_used.remove(m0)
        else:
          assert m0 not in self.monlib_mods
          self.monlib_mods[m0] = c0
      assert not mod_used

    self.monlib_monomers = []
    if 'comp_list' in ciflib:
      kuu = ciflib['comp_list'].get_mmcif_category('_chem_comp.')
      self.monlib_monomers = kuu['id']

    self.monlib_match_link = OrderedDict()
    for link_id, val in self.monlib_links.items():
      m1, m2 = val
      ca1 = self.monlib_sides.get(m1)
      ca2 = self.monlib_sides.get(m2)
      for inv in False, True:
        key = ca1 + ca2
        id_list = self.monlib_match_link.get(key)
        if not id_list:
          id_list = []
          self.monlib_match_link[key] = id_list
        id_list.append((link_id, inv))
        ca1, ca2 = ca2, ca1

  def ambiguous_links(self):
    lines = []
    for key, val in self.monlib_match_link.items():
      if len(val) > 1 and not val[0][1]:
        line = '%s.%s-%s.%s' %(key[0], key[1], key[3], key[2])
        sep = ': '
        for link_id, inv in val:
          line += sep + '%s(%s)' %(link_id, '-' if inv else '+')
          sep = ', '
        lines.append(line)
    return lines

  def prep_lists(self):
    self.comp_dict.clear()
#
    for key in self.monlib_monomers:
#
#   for key in self.monlib.monomers:
#
      self.comp_dict[key] = []
    for chain in self.struct[0]:
      for residue in chain:
        key = residue.name
        if key in self.comp_dict:
          val = ':'.join((
            key, chain.name,
            str(residue.seqid.num) + residue.seqid.icode.strip()
          ))
          self.comp_dict[key].append(val)

    self.mod_dict.clear()
    for mod_id, comp_id in self.monlib_mods.items():
      key = mod_id, comp_id
      self.mod_dict[key] = []

    link_dict = OrderedDict()
    for link_id, val in self.monlib_links.items():
      m1, m2 = val
      c1, a1 = self.monlib_sides.get(m1)
      c2, a2 = self.monlib_sides.get(m2)
      key = link_id, c1, a1, c2, a2
      link_dict[key] = []
    for conn in self.struct.connections:
      p1, p2 = conn.partner1, conn.partner2
      key = (
        conn.link_id,
        p1.res_id.name, p1.atom_name,
        p2.res_id.name, p2.atom_name,
      )
      val = link_dict.get(key)
      if val is None:
        p1, p2 = p2, p1
        yek = key[0], key[3], key[4], key[1], key[2]
        val = link_dict.get(yek)
        if val is None:
          p1, p2 = p2, p1
          val = []
          link_dict[key] = val
      vv = []
      for p in p1, p2:
        vv.append(':'.join((
          p.res_id.name, p.chain_name,
          str(p.res_id.seqid.num) + p.res_id.seqid.icode.strip()
        )))
      val.append('-'.join(vv))
    iu = 0
    nu = len(self.monlib_links)
    for kk in 'links_usr', 'links_std', 'links_unk':
      self.link_ddict[kk].clear()
    for key, val in link_dict.items():
      if key[0] in self.monlib_links:
        kk = 'links_usr'
      elif key[0] in (None, False, True, '', '.', '?'):
        kk = 'links_unk'
      else:
        kk = 'links_std'
      self.link_ddict[kk][key] = val
      iu += 1

  def usage(self, ofile):
    with open(ofile, 'w') as ostream:
      for key in sorted(self.comp_dict):
        ostream.write(key + '\n')
        for v in sorted(self.comp_dict[key]):
          ostream.write(' ' + v + '\n')

      for key in sorted(self.mod_dict):
        ostream.write(key[0] + '\n')

      link_dict = self.link_ddict['links_usr']
      for key in sorted(link_dict):
        ostream.write(key[0] + '\n')
        for v in sorted(link_dict[key]):
          ostream.write(' ' + v + '\n')

  def counts(self, stdo = None, width = 80):
    vv = ['%s(%d)' %(n, len(v)) for n, v in self.comp_dict.items()]
    kvv = [('comps_usr', vv)]
    fmt = '%s.%s-%s.%s(%d)'
    for k, d in self.link_ddict.items():
      vv = [fmt %(n[1], n[2], n[4], n[3], len(v)) for n, v in d.items()]
      kvv.append((k, vv))
    if stdo:
      stdo.write('Counts for revision summary\n')
      for k, vv in kvv:
        if vv:
          stdo.write(k)
          sep = ': '
          nc = len(k)
          ne = nc + len(sep)
#         for v in vv:
          for v in sorted(vv):
            w = sep + v
            nc += len(w)
            if nc + 1 > width:
              w = ',\n' + ne* ' ' + v
              nc = len(w) - 2
            stdo.write(w)
            sep = ', '
          stdo.write('\n')
    return kvv

def main():
  cl = CovLinks(sys.argv[2], sys.argv[3])
  msg_list = cl.ambiguous_links()
  if msg_list:
    msg_list.insert(0, 'WARNING: ambiguous links:')
    print('\n'.join(msg_list) + '\n')

  msg_llist = cl.suggest_changes()
  msg_list = []
  if msg_llist[0]:
    msg_list.append('replace LINK record(s) with LINKR:')
    msg_list.extend(msg_llist[0])
  if msg_llist[1]:
    msg_list.append('add new LINKR record(s):')
    msg_list.extend(msg_llist[1])
  if msg_list:
    print('\n'.join(msg_list) + '\n')

  cl.update(
    mode = int(sys.argv[1]),
    xyzout = sys.argv[5] if len(sys.argv) > 5 else None)

  cl.prep_lists()
  cl.usage(sys.argv[4])
  cl.counts(sys.stdout, 48)

if __name__ == '__main__':
  main()

