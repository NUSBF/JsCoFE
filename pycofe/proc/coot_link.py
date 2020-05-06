
import os, sys, re
import shutil

class LinkRecord(object):

  def __init__(self, atom1, atom2, line, dist, link_id, kind):
    self.atom1 = atom1
    self.atom2 = atom2
    self.line = line
    self.dist = dist
    self.link_id = link_id
    self.kind = kind

  def _get(self):
    return self.atom1, self.atom2, self.line, self.dist, self.link_id, self.kind

  def _reverse(self):
    atom1 = self.atom1
    atom2 = self.atom2
    self.atom1 = atom2
    self.atom2 = atom1
    line = 'LINK '
    line += '       ' + ''.join(atom2) + ' '
    line += '       '
    line += '       ' + ''.join(atom1) + ' '
    line += self.line[len(line):]
    self.line = line

  def _set_id(self, link_id):
    self.link_id = link_id
    self.kind = 'LINKR'
    line = 'LINKR'
    line += '       ' + ''.join(self.atom1) + ' '
    line += '       '
    line += '       ' + ''.join(self.atom2) + ' '
    line += '              ' + link_id + '\n'
    self.line = line

  def _stripped_pairs(self, reversed=False):
    atom1 = self.atom2 if reversed else self.atom1
    atom2 = self.atom1 if reversed else self.atom2
    aa = atom1[0] + '-' + atom2[0]
    rr = atom1[2] + '-' + atom2[2]
    return aa.replace(' ', ''), rr.replace(' ', '')

class LinkLists(object):
  _allow_multiple_links = True

  def __init__(self, pdbin):
    re_atom = '       (....)([ A-Z])(...)(.. *[0-9]+.) '
    re_link = '^LINK([ R])%s       %s(.+)$' %(re_atom, re_atom)
    re_tail = 2* ' ([ 0-9]{6})' + '( *[0-9]+\.[0-9]*)? *$'
    re_tailr = '              ([^ ]{1,8}) *$'
    rec_link = re.compile(re_link)
    rec_tail = re.compile(re_tail)
    rec_tailr = re.compile(re_tailr)

    self._all_links = list()
    with open(pdbin) as istr:
      for line in istr:
        if line.startswith('LINK'):
          added = False
          match_link = rec_link.match(line)
          if match_link:
            match_groups = match_link.groups()
            atom1 = match_groups[1:5]
            atom2 = match_groups[5:9]
            if len(atom1[3]) == 7 and len(atom2[3]) == 7:
              tail = match_groups[9]
              if match_groups[0] == 'R':
                match_tail = rec_tailr.match(tail)
                if match_tail:
                  link_id = match_tail.group(1)
                  link_obj = LinkRecord(atom1, atom2, line, None, link_id, 'LINKR')
                  self._all_links.append(link_obj)
                  added = True

              else:
                match_tail = rec_tail.match(tail)
                if match_tail:
                  sym1, sym2, dist = match_tail.groups()
                  sym1 = sym1.lstrip()
                  sym2 = sym2.lstrip()
                  err = dist and dist.lstrip().count(' ')
                  err = err or sym1.count(' ')
                  err = err or sym2.count(' ')
                  if not err:
                    kind = 'LINK' if sym1 == '1555' and sym2 == '1555' else 'SYMLINK'
                    link_obj = LinkRecord(atom1, atom2, line, dist, None, kind)
                    self._all_links.append(link_obj)
                    added = True

            if not added:
              link_obj = LinkRecord(atom1, atom2, line, None, None, 'TAILERR')
              self._all_links.append(link_obj)

          else:
            link_obj = LinkRecord(None, None, line, None, None, 'ATOMERR')
            self._all_links.append(link_obj)

        elif line.startswith('CRYST1'):
          break

    self.processed = False

  def add_coot_links(self, exe_obj, cootdir, cifin, pdbin, cifout, pdbout, using_libcheck=False):
    assert pdbout != pdbin
    assert cifout != cifin
    if cifin and os.path.isfile(cifin):
      shutil.copy(cifin, cifout)

    atompair_set = set()
    for select_kind in 'LINKR', 'LINK':
      for link_obj in self._all_links:
        atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
        if select_kind == kind:
          atompair12 = ''.join(atom1 + atom2)
          atompair21 = ''.join(atom2 + atom1)
          if atompair12 in atompair_set:
            link_obj.kind = 'DUPLICATE'

          else:
            atompair_set.add(atompair12)
            atompair_set.add(atompair21)

    respair_dict = dict()
    for link_obj in self._all_links:
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      if kind == 'LINKR' and link_id == atom1[2] + '-' + atom2[2]:
        a1a2, r1r2 = link_obj._stripped_pairs()
        if r1r2 not in respair_dict:
          respair_dict[r1r2] = a1a2

    self._link2linkr(respair_dict)

    fmt_file_ins = os.path.join(cootdir, 'acedrg-link-from-coot-%s-link-instructions.txt')
    fmt_hack_cif = os.path.join(cootdir, 'acedrg-link-from-coot-%s_link-hack.cif')
    fmt_file_cif = os.path.join(cootdir, 'acedrg-link-from-coot-%s_link.cif')
    re_ins = ' (RES|ATOM)-NAME-(1|2) +(\S+)'
    rec_ins = re.compile(re_ins)

    respair_set = set()
    respair_dict = dict()
    for link_obj in self._all_links:
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      if kind == 'LINK':
        a1a2, r1r2 = link_obj._stripped_pairs()
        a2a1, r2r1 = link_obj._stripped_pairs(True)
        if r1r2 not in respair_set:
          respair_set.add(r1r2)
          file_ins = fmt_file_ins % r1r2
          file_cif = fmt_hack_cif % r1r2
          if not os.path.isfile(file_cif):
            file_cif = fmt_file_cif % r1r2

          if os.path.isfile(file_cif) and os.path.isfile(file_ins):
            with open(file_ins) as istr:
              ins_str = istr.read()

            keys1, keys2, values = list(zip(*sorted(rec_ins.findall(ins_str))))
            if ' '.join(keys1 + keys2) == 'ATOM ATOM RES RES 1 2 1 2':
              a1, a2, r1, r2 = values
              if r1 + '-' + r2 == r1r2:
                if respair_dict.get(r2r1) != a2 + '-' + a1:
                  cifnew = self._merge(exe_obj, cifout, file_cif, using_libcheck)
                  if cifnew:
                    os.rename(cifnew, cifout)
                    respair_dict[r1r2] = a1a2

    self._link2linkr(respair_dict)

    key_set = set()
    for link_obj in self._all_links:
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      if kind == 'LINK':
        key12 = atom1[2] + atom1[0] + atom2[2] + atom2[0]
        key21 = atom2[2] + atom2[0] + atom1[2] + atom1[0]
        if key21 in key_set:
          link_obj._reverse()

        else:
          key_set.add(key12)

    try:
      with open(pdbin) as istr, open(pdbout, 'w') as ostr:
        for line in istr:
          if line.startswith('CRYST1'):
            for link_obj in self._all_links:
              atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
              if kind in ('LINK', 'LINKR', 'SYMLINK'):
                ostr.write(link_line)

            ostr.write(line)
            break

          elif not line.startswith('LINK'):
            ostr.write(line)

        for line in istr:
          ostr.write(line)

    except:
      os.rename(pdbin, pdbout)

    self.processed = True

  def _link2linkr(self, respair_dict):
    for link_obj in self._all_links:
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      if kind == 'LINK':
        found = False
        added = False
        a1a2, r1r2 = link_obj._stripped_pairs()
        a2a1, r2r1 = link_obj._stripped_pairs(True)
        if r1r2 in respair_dict:
          found = True
          if respair_dict[r1r2] == a1a2:
            link_obj._set_id(r1r2)
            added = True

        elif r2r1 in respair_dict:
          found = True
          if respair_dict[r2r1] == a2a1:
            link_obj._reverse()
            link_obj._set_id(r2r1)
            added = True

        if found and not added and not self._allow_multiple_links:
          link_obj.kind = 'MULTIPLE'

  def _merge(self, exe_obj, cifmain, cifadd, using_libcheck):
    if using_libcheck:
      cmd_exe = 'libcheck'
      cmd_args = []
      stdin_str = '\nfile_l ' + cifmain + '\nfile_l2 ' + cifadd + '\n\n'
      cifout = 'libcheck.lib'
      if not os.path.isfile(cifmain):
        with open(cifmain, 'w') as ostr:
          ostr.write('global_\n_lib_name ?\n_lib_version ?\n_lib_update ?\n')

    else:
      cmd_exe = sys.executable
      if os.path.isfile(cifmain):
        cmd_args = ['-m', 'acedrg.utils.dictionary_accumulator', cifmain, cifadd]

      else:
        cmd_args = ['-m', 'acedrg.utils.dictionary_accumulator', cifadd]

      stdin_str = ''
      cifout = 'output.cif'

    task_obj, args, kwargs = exe_obj
    task_obj.open_stdin()
    task_obj.write_stdin(stdin_str)
    task_obj.close_stdin()
    rc = task_obj.runApp(cmd_exe, cmd_args, *args, **kwargs)
    if not rc.msg and os.path.isfile(cifout):
      return cifout

  def prn(self, stdout=sys.stdout):
    reject_list = list()
    accept_list = list()
    cou = 0
    for link_obj in self._all_links:
      cou += 1
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      line = ' %3d  %s' %(cou, link_line)
      if kind in ('LINK', 'LINKR', 'SYMLINK'):
        accept_list.append(line)

      else:
        reject_list.append(line)

    if self.processed:
      msg_accepted = '# Link records accepted and possibly modified\n'
      msg_rejected = '# Link records rejected because of parsing error or duplication\n'

    else:
      msg_accepted = '# Link records understood and counted\n'
      msg_rejected = '# Link records not understood and not counted\n'

    if accept_list:
      stdout.write(msg_accepted)
      for line in accept_list:
        stdout.write(line)

    if reject_list:
      stdout.write(msg_rejected)
      for line in reject_list:
        stdout.write(line)

    select_list = (
      ('LINKR', 'LINKR\n'),
      ('LINK', 'LINK\n'),
      ('SYMLINK', 'LINK (symmetry related molecules)\n'),
    )

    if accept_list:
      stdout.write('# Link record formulas and counts\n')
      for key, title in select_list:
        formula_list = self.count_links((key,))
        if formula_list:
          stdout.write(title)
          for formula in formula_list:
            line = '  %s\n' %formula
            stdout.write(line)

    stdout.write('\n')
    stdout.flush()

  def count_links(self, kind_list):
    formula_dict = dict()
    for link_obj in self._all_links:
      atom1, atom2, link_line, dist, link_id, kind = link_obj._get()
      if kind in kind_list:
        formula = atom1[2] + '.' + atom1[0] + '-' + atom2[0] + '.' + atom2[2]
        formula_dict[formula] = formula_dict.get(formula, 0) + 1

    return sorted(['%s(%d)' %(k.replace(' ', ''), v) for k, v in list(formula_dict.items())])


if __name__ == '__main__':

  import subprocess as SP

  class MockRetObj(object):

    def __init__(self, msg):
      self.msg = msg

  class MockTask(object):

    def __init__(self, stdout=sys.stdout, stderr=sys.stderr):
      self.stdout = stdout
      self.stderr = stderr
      self.stdin_str = ''

    def open_stdin(self):
      pass

    def write_stdin(self, stdin_str):
      self.stdin_str = stdin_str

    def close_stdin(self):
      pass

    def runApp(self, cmd_exe, cmd_args, *args, **kwargs):
      cmd = [cmd_exe]
      cmd += cmd_args
      proc = SP.Popen(cmd, stdin=SP.PIPE, stdout=self.stdout, stderr=self.stderr)
      proc.stdin.write(self.stdin_str)
      self.stdout.flush()
      self.stderr.flush()
      return MockRetObj('ERROR' if proc.wait() else '')

  def main(cootdir, cifin, pdbin, cifout, pdbout, using_libcheck=False):
    using_libcheck = bool(using_libcheck)
    exe_obj = MockTask(), tuple(), dict(logType='Main'), 
    links = LinkLists(pdbin)
    links.add_coot_links(exe_obj, cootdir, cifin, pdbin, cifout, pdbout, using_libcheck=using_libcheck)
    links.prn(sys.stdout)

  main(*sys.argv[1:])

