import gemmi

def add_one_comp(onein, libin, libout):
  ciflib = gemmi.cif.read_file(libin)
  lib_comp_list = ciflib.find_block('comp_list')

  cifone = gemmi.cif.read_file(onein)
  assert len(cifone) == 2
  one_comp_list = cifone[0]
  assert one_comp_list.name == 'comp_list'

  if lib_comp_list:
    lib_loop = lib_comp_list[0].loop
    one_loop = one_comp_list[0].loop
    one_dict = dict(zip(one_loop.tags, one_loop.values))
    one_row = []
    for tag in lib_loop.tags:
      val = one_dict.get(tag)
      one_row.append(val if val else '.')
    lib_loop.add_row(one_row)
    for ib in reversed(range(len(ciflib))):
      if ciflib[ib].name.startswith('comp_'):
        break
  else:
    for ib in range(len(ciflib)):
      if ciflib[ib].name.endswith('_list'):
        break
    ciflib.add_copied_block(one_comp_list, ib)
    for ib in reversed(range(len(ciflib))):
      if str(ciflib[ib].name).endswith('_list'):
        break
  ib += 1
  ciflib.add_copied_block(cifone[1], ib)
  ciflib.write_file(libout)

def main():
  import sys
  add_one_comp(sys.argv[1], sys.argv[2], sys.argv[3])

if __name__ == '__main__':
  main()

