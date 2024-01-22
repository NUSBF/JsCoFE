#
# This is generic pyrvpai_ext parser (pyrvapi_ext.parsers.generic - developed by Andrey Lebedev),
# customised for REFMAC5 (dynamic live plots added, etc.) by Oleg Kovalevskiy.
# Copyright (c) 2020 CCP4


import re
import pyrvapi_ext as API
from pyrvapi_ext.parsers import regex_tree as RT
import time, sys
import math

class refmac_parser(object):

  def flush(self):
    if self.pause > 0:
      sys.stdout.write('sleepping\n')
      time.sleep(self.pause)

    API.flush()

  def __init__(
    self,
    rvapi_grid,
    show_progs = False,
    hide_refs = False,
    pause = 0,
    summary = None,
    graph_tables = True,
    **kwargs
  ):
    self.show_progs = show_progs
    self.prog_name = ''
    self.pause = pause
    self.summary = summary
    self.graph_tables = graph_tables

    re_numbers = (' *([+-]?[0-9]*.?[0-9]+) *',)* 4
    self.rec_limits = re.compile('%s\|%sx%s\|%s' %re_numbers)

    re_graphs = '\s*:([^:]+):([^:]+):([0-9]+(?:,[0-9]+)+):\s*'
    self.rec_graphs = re.compile(re_graphs)

    re_refs = '\A\s*:\s*Reference.*:\s*\Z(?i)' if hide_refs else '\Zz'
    self.rec_refs = re.compile(re_refs)


    dd = r'^\$\$'
    notd = r'(^[^\$]+)'
    skip_1 = r'^#CCP4I.*'
    skip = r'^[^#\$]+'
    bf = r'^#+'
    bs = r'^[\s\n]+'
    bc = r'^(\s*CCP4[^#]+)'

    weightLine = r'.*Weight matrix\s*(.*)'
    rFactLine = r'^Overall R factor\s*=\s*(\S*)'
    rFreeLine = r'^Free R factor\s*=\s*(\S*)'
    rmsBondLine = r'^Bond distances: refined atoms\s*\S*\s*(\S*)\s*\S*'
    rmsAnglesLine = r'^Bond angles  : refined atoms\s*\S*\s*(\S*)\s*\S*'
    ncycLine = r'.*Refinement cycles\s*:\s*(\d*)'
    tlsLine = r'.*REFI TLSC\s*(\d*)'
    tlsCycLine = r'.*TLS refinement cycle.*'

    ignored_1 = RT.LogDataLine(skip_1)                              # logs from i1
    ignored = RT.LogDataLine(skip)
    banner_f1 = RT.LogDataLine(bf)
    banner_s1 = RT.LogDataLine(bs)
    banner_f2 = RT.LogDataLine(bf)
    banner_content = RT.LogDataLine(bc)
    banner_f3 = RT.LogDataLine(bf)
    banner_s4 = RT.LogDataLine(bs)
    banner_f4 = RT.LogDataLine(bf)
    item_started = RT.LogDataLine('^\$(TABLE|TEXT|SUMMARY)')
    item_title = RT.LogDataLine(notd)
    item_graphs_started = RT.LogDataLine('^\$(GRAPHS|SCATTER)')
    item_graphs = RT.LogDataLine(notd)
    item_dd1 = RT.LogDataLine(dd)
    item_header = RT.LogDataLine(notd)
    item_dd2 = RT.LogDataLine(dd)
    item_message = RT.LogDataLine(notd)
    item_dd3 = RT.LogDataLine(dd)
    item_body = RT.LogDataLine(notd)
    item_dd4 = RT.LogDataLine(dd)
    ignored_dd = RT.LogDataLine(dd)                                 # refmac bug

    item_weight = RT.LogDataLine(weightLine)
    item_rFact = RT.LogDataLine(rFactLine)
    item_rFree = RT.LogDataLine(rFreeLine)
    item_rmsBond = RT.LogDataLine(rmsBondLine)
    item_rmsAngle = RT.LogDataLine(rmsAnglesLine)
    item_ncyc = RT.LogDataLine(ncycLine)
    item_tlsN = RT.LogDataLine(tlsLine)
    item_tlsCyc = RT.LogDataLine(tlsCycLine)


    ignored_1.add_next(item_rmsBond, item_rmsAngle, item_weight, item_rFact, item_rFree, item_ncyc, item_tlsCyc, item_tlsN, ignored_1, ignored, item_started, banner_f1) # logs from i1
#   ignored.add_next(ignored, item_started, banner_f1)              # refmac bug
    ignored.add_next(item_rmsBond, item_rmsAngle, item_weight, item_rFact, item_rFree, item_ncyc, item_tlsN, item_tlsCyc, ignored, item_started, banner_f1, ignored_dd)  # refmac bug

    item_weight.add_next(ignored, ignored_1)
    item_rFact.add_next(item_rFree, ignored, ignored_1)
    item_rFree.add_next(ignored, ignored_1)
    item_rmsBond.add_next(item_rmsAngle, ignored, ignored_1)
    item_rmsAngle.add_next(ignored, ignored_1)
    item_ncyc.add_next(ignored, ignored_1)
    item_tlsN.add_next(ignored, ignored_1)
    item_tlsCyc.add_next(ignored, ignored_1)


    ignored_dd.add_next(ignored, item_started)                      # refmac bug
    banner_f1.add_next(banner_s1, ignored)
    banner_s1.add_next(banner_s1, banner_f2, ignored)

    banner_f2.add_next(banner_content, ignored)
    banner_content.add_next(banner_f3, ignored)
    banner_f3.add_next(banner_s4, ignored)
    banner_s4.add_next(banner_s4, banner_f4, ignored)
    banner_f4.add_next(ignored)

    item_started.add_next(item_title)
    item_title.add_next(item_title, item_graphs_started, item_dd2)
    item_graphs_started.add_next(item_graphs)
    item_graphs.add_next(item_graphs, item_dd1)
    item_dd1.add_next(item_header, item_graphs_started)
    item_header.add_next(item_header, item_dd2, item_graphs_started)
    item_dd2.add_next(item_message)
    item_message.add_next(item_message, item_dd3)
    item_dd3.add_next(item_body)
#   item_body.add_next(item_body, item_dd4)                         # refmac bug
    item_body.add_next(item_body, item_dd4, item_started)           # refmac bug
    item_dd4.add_next(ignored)

    self.item_title_parts = list()
    self.item_graphs_parts = list()
    self.item_header_parts = list()
    self.item_message_parts = list()
    self.item_body_parts = list()

    self.banner_text = None
    self.item_kind = None
    self.graph_kind = None
    self.grid = rvapi_grid
    self.vpos = 0
    self.sect = rvapi_grid
    self.text_panel = None
    self.widget = None
    self.table_panel = None
    self.text_cou = -1
    self.table_cou = -1

    self.table_weight_panel = None
    self.table_weight = None
    self.weight_label = None
    self.vpos += 1
    try:
      self.weight_label = API.label(self.sect, '' , self.vpos, 0, 1, 1)
    except:
      self.vpos -= 1

    self.liveN = -1
    self.liveYmax = None
    self.liveYmin = None
    self.ncyc = 0

    # we want to guarantee creation of widgets before log file is actually parsed, so before .add_action
    self.vpos += 1
    self.widget = API.loggraph(self.sect, self.vpos, 0, 1, 1)
    self.liveGraph = API.graph_data(self.widget, 'Statistics per cycle')

    self.liveColumnRfact = API.graph_dataset(self.liveGraph, 'R-factor', '', False)
    self.liveColumnRfree = API.graph_dataset(self.liveGraph, 'R-free', '', False)
    self.liveColumnRfactN = API.graph_dataset(self.liveGraph, 'Cycles', '', True)

    self.liveRMSbonds = API.graph_dataset(self.liveGraph, 'RMS Bond Length', '', False)
    self.liveRMSbondsN = API.graph_dataset(self.liveGraph, 'Cycles', '', True)

    self.liveRMSangles = API.graph_dataset(self.liveGraph, 'RMS Bond Angle', '', False)
    self.liveRMSanglesN = API.graph_dataset(self.liveGraph, 'Cycles', '', True)

    self.livePLT = API.graph_plot(self.widget, 'R-factors per cycle', 'Cycle number', '')
    self.liveLineRfact = API.plot_line(self.livePLT, self.liveGraph, self.liveColumnRfactN, self.liveColumnRfact)
    self.liveLineRfree = API.plot_line(self.livePLT, self.liveGraph, self.liveColumnRfactN, self.liveColumnRfree)

    self.livePLT2 = API.graph_plot(self.widget, 'RMS Bond Length per cycle', 'Cycle number', '')
    self.liveLine2 = API.plot_line(self.livePLT2, self.liveGraph, self.liveRMSbondsN, self.liveRMSbonds)

    self.livePLT3 = API.graph_plot(self.widget, 'RMS Bond Angle per cycle', 'Cycle number', '')
    self.liveLine3 = API.plot_line(self.livePLT3, self.liveGraph, self.liveRMSanglesN, self.liveRMSangles)

    self.flush()

    banner_content.add_action(self.banner_content)
    banner_f4.add_action(self.banner_finished)
    item_started.add_action(self.item_started)
    item_title.add_action(self.item_title_parts.extend)
    item_graphs_started.add_action(self.graphs_started)
    item_graphs.add_action(self.item_graphs_parts.extend)
    item_header.add_action(self.item_header_parts.extend)
    item_message.add_action(self.item_message_parts.extend)
    item_body.add_action(self.item_body_parts.extend)
    item_dd4.add_action(self.item_finished)

    item_weight.add_action(self.displayWeight)
    item_rFact.add_action(self.displayLiveGraphRfact)
    item_rFree.add_action(self.displayLiveGraphRfree)
    item_rmsBond.add_action(self.displayLiveGraphRMSbond)
    item_rmsAngle.add_action(self.displayLiveGraphRMSangle)
    item_ncyc.add_action(self.setNcyc)
    item_tlsN.add_action(self.setTLScyc)
    item_tlsCyc.add_action(self.tlsNextCyc)
    #item_rmsBond.add_action(self.displayLiveGraph)

    self.parser = RT.LogDataParser()
    self.parser.add_next(ignored_1, ignored)
    self.parser.add_recovery_next(ignored)
    self.parser.add_recovery_action(self.item_reset)
    

  def parse_stream(self, istream, *args, **kwargs):
    self.parser.parse_stream(istream, *args, **kwargs)
    if self.sect is not self.grid:
      self.sect.set_state(False)

  def banner_content(self, groups):
    self.banner_text, = groups

  def banner_finished(self, groups):
    assert not groups
    ccp4_version, sep, prog_name_date = self.banner_text.partition(':')
    prog_name, sep, prog_date = prog_name_date.partition(':')
    if not sep:
      prog_name, sep, prog_date = prog_name_date.lstrip().partition(' ')

    self.prog_name = ' '.join(prog_name.split())
    sect_title = '%s (%s)' %(self.prog_name, ' '.join(prog_date.split()))
    self.banner_text = None
    if self.show_progs:
      self.vpos += 1
      if self.sect is not self.grid:
        self.sect.set_state(False)

      self.sect = API.pyrvapi_section(self.grid, sect_title, self.vpos, 0, 1, 1)
      self.text_panel = None
      self.widget = None
      self.table_panel = None
      self.text_cou = -1
      self.table_cou = -1
      self.flush()

  def item_reset(self):
    del self.item_title_parts[:]
    del self.item_graphs_parts[:]
    del self.item_header_parts[:]
    del self.item_message_parts[:]
    del self.item_body_parts[:]
    self.item_kind = None
    self.graph_kind = None

  def item_started(self, groups):
    self.item_reset()                                               # refmac bug
    self.item_kind, = groups

  def graphs_started(self, groups):
    self.graph_kind, = groups

  def setNcyc(self, groups):
    self.ncyc = self.ncyc + int(groups[0])
    self.livePLT.set_xrange(1, self.ncyc)
    self.livePLT2.set_xrange(1, self.ncyc)
    self.livePLT3.set_xrange(1, self.ncyc)

  def setTLScyc(self, groups):
    if self.ncyc == 0:
      self.ncyc = int(groups[0])
      self.livePLT.set_xrange(1, self.ncyc)
      self.livePLT2.set_xrange(1, self.ncyc)
      self.livePLT3.set_xrange(1, self.ncyc)

  def tlsNextCyc(self, groups):
    self.liveN += 1

  def displayLiveGraphRMSbond(self, groups):
    self.liveN += 1
    rmsBonds = float(groups[0])
    if self.liveN <= self.ncyc:
#      if self.liveYmin is None or self.liveYmax is None:
#        self.liveYmin = rFree
#        self.liveYmax = rFree
#      if (rFree > self.liveYmax) and (rFree > self.liveYmin):
#        self.liveYmax = rFree
      self.liveRMSbonds.add_datum(rmsBonds)
      self.liveRMSbondsN.add_datum(self.liveN)
  #      self.livePLT.set_yrange(self.liveYmin - 0.02, self.liveYmax + 0.02)

  def displayLiveGraphRMSangle(self, groups):
    rmsAngles = float(groups[0])
    if self.liveN <= self.ncyc:
      #      if self.liveYmin is None or self.liveYmax is None:
      #        self.liveYmin = rFree
      #        self.liveYmax = rFree
      #      if (rFree > self.liveYmax) and (rFree > self.liveYmin):
      #        self.liveYmax = rFree
      self.liveRMSangles.add_datum(rmsAngles)
      self.liveRMSanglesN.add_datum(self.liveN)


  #      self.livePLT.set_yrange(self.liveYmin - 0.02, self.liveYmax + 0.02)

  def displayLiveGraphRfact(self, groups):
    rFact = float(groups[0])
    if self.liveN <= self.ncyc:
      self.liveColumnRfact.add_datum(rFact)
      self.liveColumnRfactN.add_datum(self.liveN)
      if self.liveYmin is None or self.liveYmax is None:
        self.liveYmin = rFact
        self.liveYmax = rFact
      if (rFact < self.liveYmin) and (rFact < self.liveYmax):
        self.liveYmin = rFact


  def displayLiveGraphRfree(self, groups):
    rFree = float(groups[0])
    if self.liveN <= self.ncyc:
      if self.liveYmin is None or self.liveYmax is None:
        self.liveYmin = rFree
        self.liveYmax = rFree
      if (rFree > self.liveYmax) and (rFree > self.liveYmin):
        self.liveYmax = rFree
      self.liveColumnRfree.add_datum(rFree)
      self.livePLT.set_yrange(self.liveYmin - 0.02, self.liveYmax + 0.02)
      self.flush()


  def displayWeight(self, groups):
    if self.weight_label:
      msg = 'Weight used for refinement: ' + groups[0]
      msg = '<font size="-1">' + msg + '</font>'
      self.weight_label.set_text(msg)
      self.flush()
    else:
      self.displayWeight2(groups)


  def displayWeight2(self, groups):
    if (self.table_weight_panel is None) or (self.table_weight is None):
      self.vpos += 1
      self.table_weight_panel = API.panel(self.sect, self.vpos, 0, 1, 1)
      self.table_weight = API.pyrvapi_table(self.table_weight_panel, 2, 0, 1, 1, 'Data-geometry weight', 1)
      self.table_weight.body_cell(0, 0, 'Weight used for refinement ')
    self.table_weight.body_cell(0, 1, groups[0])
    self.flush()


  def item_finished(self, groups):
    assert not groups
    title = ''.join(self.item_title_parts)
    graphs = ''.join(self.item_graphs_parts)
    header = ''.join(self.item_header_parts)
    message = ''.join(self.item_message_parts)
    body = ''.join(self.item_body_parts)
    if body.strip():
      if self.item_kind == 'TABLE':
        msg = message.strip().replace('loggraph', '') # phaser; is this right syntax?
#       assert not msg # msg field is actually for short column titles (see acorn log)
        self.show_table(title, graphs, msg, header, body)

      elif not self.rec_refs.match(title):
        assert self.item_kind in ('TEXT', 'SUMMARY')
        assert not (graphs or header)
#       self.show_text(title, message, body)
        try:
          self.evaluation_data(title, message, body)

        except:
          pass

    self.flush()
#   self.item_reset()                                               # refmac bug

  def show_table(self, title, graphs, msg, header, body):
    title_line = title.split(':')[1].strip()
    assert len(title_line) < 100

    if title_line == 'Rfactor analysis, stats vs cycle':
      return

    column_nick_list = []
    for column_nick in msg.split():
      column_nick = column_nick.replace('<', '&lt;').replace('>', '&gt;')
      column_nick_list.append(column_nick)

    column_name_list = []
    for column_name in header.split():
      column_name = column_name.replace('<', '&lt;').replace('>', '&gt;')
      if column_nick_list:
        column_name = column_name.replace('_', ' ')

      column_name_list.append(column_name)

    column_data_list = list(zip(*[line.split() for line in body.split('\n') if line.strip()]))
    assert len(column_data_list) == len(column_name_list)
    if column_nick_list:
      assert len(column_name_list) == len(column_nick_list)

    else:
      column_nick_list.extend(column_name_list)

    self.table_cou += 1
    if self.graph_tables:
      if self.table_cou == 0:
        assert self.table_panel is None
        self.table_panel = API.panel(self.sect, 2, 0, 1, 1)

      table = API.pyrvapi_table(self.table_panel, self.table_cou, 0, 1, 1, title_line, -1)
      for i in range(len(column_nick_list)):
        table.col_title(i, column_nick_list[i])
        column_data = column_data_list[i]
        for j in range(len(column_data)):
          table.body_cell(j, i, column_data[j])

    self.flush()
    graph_meta_list = self.rec_graphs.findall(graphs)
    if not graph_meta_list:
      return

#    if self.table_cou == 0:
#      assert self.widget is None
#      self.widget = API.loggraph(self.sect, 1, 0, 1, 1)

    column_list = list()
    column_numbers_list = list()
    gdtobj = API.graph_data(self.widget, title_line)
    for column_name, column_data in zip(column_name_list, column_data_list):
      isvalid = True
      isint = True
      column_numbers = list()
      for datum in column_data:
        try:
          number = int(datum)

        except:
          isint = False
          try:
            number = float(datum)
#           number = 0.0 if datum == 'nan' else float(datum)        # fixed in rvapi

          except:
            isvalid = False
            break

        column_numbers.append(number)

      if isvalid and not isint:
        for i in range(len(column_numbers)):
          column_numbers[i] = float(column_numbers[i])

      if isvalid:
        column_numbers_list.append(column_numbers)

      column = API.graph_dataset(gdtobj, column_name, '', isint)
      column_list.append(column)
      for number in column_numbers:
         column.add_datum(number)

    for item in graph_meta_list:
      axes = [int(a) - 1 for a in item[2].split(',')]
      axisx = axes[0]
      # title = ' '.join(item[0].split())
      # same as above:
      # title = re.sub('\s+', ' ', item[0])
      # keeps original spaces and only corrects for phaser's newlines:
      title = re.sub(' *[\t\n\r\f\v]+ *', ' ', item[0])
      rec_sq_reso_names = '1/d^2', 'M(4SSQ/LL)', '&lt;4SSQ/LL&gt;', '1/resol^2', '4(S/L)**2'
      x_is_reso = column_nick_list[axisx].strip() in rec_sq_reso_names
      column_name_x = column_name_list[axisx].strip()
      if x_is_reso:
        # Angstrem sign (8491):
        # encoded = b'\xe2\x84\xab'
        # A-ring letter (197):
        encoded = b'\xc3\x85'
        decoded = str(encoded) if sys.getdefaultencoding() == 'ascii' else encoded.decode()
        column_name_x = 'Resolution (' + decoded + ')'

      pltobj = API.graph_plot(self.widget, title, column_name_x, '')
      if x_is_reso:
        xtick_n = 5
        xmax = None
        if not 'NOUGHT'.startswith(item[1]) and not 'AUTO'.startswith(item[1]):
          data = self.rec_limits.match(item[1])
          if data:
            xmax = float(data.group(2))

        if xmax == None:
          xmax = max(column_numbers_list[axisx]) *1.025

        xtick_delta = xmax/ xtick_n
        xtick_values = [xtick_delta* cou for cou in range(1,1 + xtick_n)]
        xtick_labvals = [1/ math.sqrt(value) for value in xtick_values]
        pltobj.reset_xticks()
        pltobj.add_xtick(0.0, 'Infty')
        for value, labval in zip(xtick_values, xtick_labvals):
          label = "%4.2f" %labval
          pltobj.add_xtick(value, label)

        if 'NOUGHT':
          pltobj.set_ymin(0)

      elif 'NOUGHT'.startswith(item[1]):
        pltobj.set_xmin(0)
        pltobj.set_ymin(0)

      elif not 'AUTO'.startswith(item[1]):
        data = self.rec_limits.match(item[1])
        if data:
          xmin, xmax, ymin, ymax = [float(lim) for lim in data.groups()]
          pltobj.set_xrange(xmin, xmax)
          pltobj.set_yrange(ymin, ymax)

      for axisy in axes[1:]:
        pltline = API.plot_line(pltobj, gdtobj, column_list[axisx], column_list[axisy])
        if self.graph_kind == 'SCATTER':
          pltline.set_options(style=API.plot_line.RVAPI_LINE_Off)

        self.flush()

      self.flush()

  def show_text(self, title, message, body):
    if self.item_kind == 'SUMMARY': # hack for refmac
      return

    if self.text_cou < 0:
      assert self.text_panel is None
      self.text_panel = API.panel(self.sect, 0, 0, 1, 1)

    title_line = title.split(':')[1].strip()
    state = -1 if re.match('^(:?Reference|Script|MR Result)', title_line) else 1
    style = 'vertical-align:top;text-align:left;'
    self.text_cou += 1
    table = API.pyrvapi_table(self.text_panel, self.text_cou, 0, 1, 1, title_line, state)
    j = 0
    msg = ' '.join(message.split()).replace('Baubles Markup', '')
    if msg:
      message_line = '<pre>' + msg + '</pre>'
      table.body_cell(j, 0, message_line, style)
      j += 1

    body_lines = body.split('\n')
    for i0 in range(len(body_lines)):
      if body_lines[i0].strip():
        break
    
    for i1 in range(len(body_lines)-1,-1,-1):
      if body_lines[i1].strip():
        break
    
    body_text = '<pre>' + '<br>'.join(body_lines[i0:i1+1]) + '</pre>'
    table.body_cell(j, 0, body_text, style)
    self.flush()

  def evaluation_data(self, title, message, body):
    if self.summary is None:
      return

    if self.prog_name.lower().startswith('refmac'):
      if ' '.join(message.split()).lower() == "final results":
        data = re.findall('\s*(.*?)\s+([0-9.+-]+)\s+([0-9.+-]+)\s+', body)
        if data:
          lko, lvi, lvo = list(zip(*data))
          lko = [k.replace(' ', '_') for k in lko]
          lki = [k + '_ini' for k in lko]
          self.summary['refmac'] = dict(zip(lki + lko, lvi + lvo))

        '''
        re_fmt = '%s\s+[0-9.+-]+\s+([0-9.+-]+)\s+'
        re_extract = '\s+Initial\s+Final\s+'
        re_extract += re_fmt %'R +factor'
        re_extract += re_fmt %'R +free'
        data = re.match(re_extract, body)
        if data:
          self.summary['refmac'] = dict()
          self.summary['refmac']['R_factor'], self.summary['refmac']['R_free'] = data.groups()
        '''



