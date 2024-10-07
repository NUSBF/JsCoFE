
import os, sys
import gemmi
from collections import OrderedDict

def _find_covlink(link_dict, conn):
    cp1 = tuple(_side_6_names(conn.partner1))
    cp2 = tuple(_side_6_names(conn.partner2))
    key = cp1, cp2
    link = link_dict.get(key)
    print(key, link, link.link_id if link else None)
    if link is None:
      key = cp2, cp1
      link = link_dict.get(key)
      if link is None:
        key = cp1, cp2
    print(key, link, link.link_id if link else None)
    return key, link

def _corrected(mmcif_orig):
    with open(mmcif_orig) as f:
      d = f.read()
    if d.count('_struct_conn.ptnr'):
      d = d.replace(
        '_struct_conn.ptnr1_auth_atom_id',
        '_struct_conn.ptnr1_label_atom_id', 1)
      d = d.replace(
        '_struct_conn.ptnr1_auth_comp_id',
        '_struct_conn.ptnr1_label_comp_id', 1)
      d = d.replace(
        '_struct_conn.ptnr2_auth_atom_id',
        '_struct_conn.ptnr2_label_atom_id', 1)
      d = d.replace(
        '_struct_conn.ptnr2_auth_comp_id',
        '_struct_conn.ptnr2_label_comp_id', 1)
      mmcif_corr = mmcif_orig + '-tmp.mmcif'
      with open(mmcif_corr, 'w') as f:
        f.write(d)
      struct = gemmi.read_structure(mmcif_corr)
      os.unlink(mmcif_corr)
    else:
      struct = gemmi.read_structure(mmcif_orig)
    assert len(struct) == 1
    for cra in struct[0].all():
      cra.residue.segment = ''
    for conn in struct.connections:
      for cp in conn.partner1, conn.partner2:
        cp.atom_name = cp.atom_name.strip()
        cp.chain_name = cp.chain_name.strip()
        assert cp.altloc == chr(0) or cp.altloc in 'ABCDEF'
        assert cp.res_id.seqid.icode in 'ABCDEF '
        cp.res_id.name = cp.res_id.name.strip()
    return struct

def _conn_orig(mmcif_in):
    struct = _corrected(mmcif_in)
    old_dict = OrderedDict()
    pycmd_list = []
    print("AAAAA 0")
    for conn in struct.connections:
      key, link = _find_covlink(old_dict, conn)
      if link is None:
        old_dict[key] = conn
    return old_dict

def _side_5_names(cp):
    alt = cp.altloc if cp.altloc in 'ABCDEF' else ''
    return [cp.chain_name.strip(), cp.res_id.seqid.num,
      cp.res_id.seqid.icode.strip(),
      cp.atom_name.strip(), alt]

def _side_6_names(cp):
    alt = cp.altloc if cp.altloc in 'ABCDEF' else ''
    return [cp.chain_name.strip(), cp.res_id.seqid.num,
      cp.res_id.seqid.icode.strip(),
      cp.res_id.name.strip(),
      cp.atom_name.strip(), alt]

def conn_script(mmcif_orig, script):
    old_dict = _conn_orig(mmcif_orig)
    with open(script, 'a') as f:
      for conn in old_dict.values():
        if conn.asu == gemmi.Asu.Same:
          cp1, cp2 = conn.partner1, conn.partner2
          args = 0, _side_5_names(cp1), _side_5_names(cp2)
          args += conn.name, -1
          f.write('make_link' + str(args) + '\n')

def conn_correct(mmcif_orig, mmcif_coot, mmcif_out):
    old_dict = _conn_orig(mmcif_orig)
    print("AAAAA 1")
    struct = _corrected(mmcif_coot)
    new_dict = OrderedDict()
    for conn in struct.connections:
      key, link = _find_covlink(new_dict, conn)
      print('BBBBBBBBB 1', link)
      if not link:
        key, link = _find_covlink(old_dict, conn)
        print('BBBBBBBBB 2', link)
        new_dict[key] = link if link else conn
    print("AAAAA 2")
    struct.connections.clear()
    struct.connections.extend(new_dict.values())
    for conn in old_dict.values():
      if conn.asu != gemmi.Asu.Same:
        struct.connections.append(conn)
    for conn in struct.connections:
      print(conn, conn.link_id)
    print("AAAAA 3")
    struct.make_mmcif_document().write_file(mmcif_out)

if __name__ == '__main__':
  if len(sys.argv) == 3:
    conn_script(*sys.argv[1:3])
  else:
    conn_correct(*sys.argv[1:4])

