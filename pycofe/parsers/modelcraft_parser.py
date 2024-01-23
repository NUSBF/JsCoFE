
import re
import pyrvapi_ext as API
from pyrvapi_ext.parsers import regex_tree as RT
import time, sys
import math

class modelcraft_parser(object):
  RworkKey = 'R-work'
  RfreeKey = 'R-free'
# RworkKey = 'rwork'
# RfreeKey = 'rfree'
  NResKey = 'Residues'
  NWatKey = 'Waters'

  def flush(self):
    if self.pause > 0:
      sys.stdout.write('sleepping\n')
      time.sleep(self.pause)

    API.flush()

  def __init__(
    self,
    rvapi_grid,
    show_progs = True,
    job_params = None,
    summary = None,
    pause = 0,
    **kwargs
  ):
    self.pause = pause

    keys = self.RworkKey, self.RfreeKey, self.NResKey, self.NWatKey
    re_data = r'^\s*"?(' + r'|'.join(keys) + r')"?:\s*([0-9.]+),?\s*\n'

    wait_1 = RT.LogDataLine(r'.*\n')
    head_1 = RT.LogDataLine(r'^# ModelCraft .*\n')
    skip_1 = RT.LogDataLine(r'.*\n')
    show_1 = RT.LogDataLine(r'^## (.*)\n')
    skip_2 = RT.LogDataLine(r'.*\n')
    data_1 = RT.LogDataLine(re_data)
    accept = RT.LogDataLine(r'\s*\(accepted\)\s*\n')
    term_1 = RT.LogDataLine(r'^--- Termination: ([^ ]+) ---.*\n')
# this is needed as show_1 to register Finalistion cycle:
#   term_1 = RT.LogDataLine(r'^## Best Model:.*\n')
    skip_3 = RT.LogDataLine(r'.*\n')

    wait_1.add_next(head_1, wait_1)
    head_1.add_next(show_1, skip_1)
    skip_1.add_next(show_1, skip_1)
    show_1.add_next(skip_2)
    skip_2.add_next(term_1, show_1, accept, data_1, skip_2)
    data_1.add_next(term_1, show_1, accept, data_1, skip_2)
    accept.add_next(term_1, show_1, accept, data_1, skip_2)
    term_1.add_next(skip_3)
    skip_3.add_next(skip_3)

    show_1.add_action(self.show1)
    data_1.add_action(self.data1)
    accept.add_action(self.accept)
    term_1.add_action(self.term1)

    self.parser = RT.LogDataParser()
    self.parser.add_next(head_1, wait_1)
    self.parser.add_recovery_next(skip_3)

    self.current = None
    self.summary = summary
    self.accepted = {}

    if job_params is None:
      job_params = {}
    mcyc = int(job_params.get('max_cycles', '2'))
    mres = int(job_params.get('max_init_residues', '-1'))
    maxr = float(job_params.get('max_init_r_factor', '-1'))

    if show_progs:
      section = API.pyrvapi_section(rvapi_grid, 'Results', 0, 0, 1, 1)
      self.table = API.pyrvapi_table(section, 0, 0, 1, 1, 'Best model', 0)
      self.table.row_title(0, 'Cycle', 'The cycle with lowest R-free')
      self.table.row_title(1, 'Residues', 'No of residues built')
      self.table.row_title(2, 'Waters', 'No of waters added')
      self.table.row_title(3, 'R-work', 'Crystallographic R-factor')
      self.table.row_title(4, 'R-free', 'Free R-factor')
      self.table.body_cell(0, 0, 'N/A')
      self.table.body_cell(1, 0, 'N/A')
      self.table.body_cell(2, 0, 'N/A')
      self.table.body_cell(3, 0, 'N/A')
      self.table.body_cell(4, 0, 'N/A')

    else:
      section = rvapi_grid
      self.table = None

    gwd = API.loggraph(section, 1, 0, 1, 1)
    gdt = API.graph_data(gwd, 'Building results vs. cycle')

    self.d1x = API.graph_dataset(gdt, 'x', 'argument')
    self.d1y1 = API.graph_dataset(gdt,
      'R-free', 'Crystallographic free R-factor', False)
    self.d1y2 = API.graph_dataset(gdt,
      'R-work', 'Crystallographic R-factor', False)
    plt = API.graph_plot(gwd, 'R-factors', 'Cycle', 'R')
#   not always it runs finalisation cycle
#   plt.set_xrange(0, mcyc + 1)
    plt.set_xrange(0, mcyc)
    if maxr > 0:
        plt.set_yrange(-0.02, maxr)
    else:
        plt.set_ymin(-0.02)
    pltline = API.plot_line(plt, gdt, self.d1x, self.d1y1)
    pltline = API.plot_line(plt, gdt, self.d1x, self.d1y2)

    self.d2x = API.graph_dataset(gdt, 'x', 'argument')
    self.d2y1 = API.graph_dataset(gdt,
      'Residues', 'No of residues in the model', False)
    self.d2y2 = API.graph_dataset(gdt,
      'Waters', 'No of water molecules in the model', False)
    plt = API.graph_plot(gwd, 'Model', 'Cycle', 'Built')
    plt.set_xrange(0, mcyc + 1)
    if mres:
        plt.set_yrange(0, mres)
    else:
        plt.set_ymin(0)
    pltline = API.plot_line(plt, gdt, self.d2x, self.d2y1)
    pltline = API.plot_line(plt, gdt, self.d2x, self.d2y2)

    self.flush()
    self.current = dict(Cycle = -1)

  def show1(self, groups):
    if self.table:
      self.table.body_cell(0, 0, self.accepted.get('Cycle', 'N/A'))
      self.table.body_cell(1, 0, self.accepted.get(self.NResKey, 'N/A'))
      self.table.body_cell(2, 0, self.accepted.get(self.NWatKey, 'N/A'))
      self.table.body_cell(3, 0, self.accepted.get(self.RworkKey, 'N/A'))
      self.table.body_cell(4, 0, self.accepted.get(self.RfreeKey, 'N/A'))

    x = self.current.get('Cycle')
    if x is not None:
      y1 = self.current.get(self.RfreeKey)
      y2 = self.current.get(self.RworkKey)
      if y1 is not None and y1 is not None:
        self.d1x.add_datum(x)
        self.d1y1.add_datum(y1)
        self.d1y2.add_datum(y2)
      y1 = self.current.get(self.NResKey)
      y2 = self.current.get(self.NWatKey)
      if y1 is not None and y1 is not None:
        self.d2x.add_datum(x)
        self.d2y1.add_datum(y1)
        self.d2y2.add_datum(y2)

    self.flush()
    self.current = dict(Cycle = self.current['Cycle'] + 1)

  def accept(self, groups):
    self.accepted = self.current

  def data1(self, groups):
    k, v = groups
    self.current[k] = float(v) if v.count('.') else int(v)

  def term1(self, groups):
    if self.summary is not None:
      self.summary['modelcraft'] = {
        'Residues': self.accepted.get(self.NResKey, 'N/A'),
        'Waters': self.accepted.get(self.NWatKey, 'N/A'),
        'R-work': self.accepted.get(self.RworkKey, 'N/A'),
        'R-free': self.accepted.get(self.RfreeKey, 'N/A'),
        'status': groups[0] }

  def parse_stream(self, istream, *args, **kwargs):
    self.parser.parse_stream(istream, *args, **kwargs)

