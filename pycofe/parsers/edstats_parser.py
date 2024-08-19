#
# This is generic pyrvpai_ext parser (pyrvapi_ext.parsers.generic - developed by Andrey Lebedev),
# customised for EDSTATS  by Oleg Kovalevskiy.
# Copyright (c) 2021 CCP4


import re
import pyrvapi_ext as API
import pyrvapi
from pyrvapi_ext.parsers import regex_tree as RT
import time, sys, copy
import traceback

def isfloat(value):
  try:
    float(value)
    return True
  except ValueError:
    return False

class edstats_parser(object):

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
    graph_tables = True):

    self.show_progs = show_progs
    self.prog_name = ''
    self.pause = pause
    self.summary = summary
    self.graph_tables = graph_tables
    self.item_kind = None
    self.graph_kind = None
    self.grid = rvapi_grid
    self.sect = rvapi_grid
    self.text_panel = None
    self.text_cou = -1

    # secret of these regexps - they parse stream, not lines. Therefore important to include full line.
    edstatTableLine = '(\S+)\s+(\S).+?(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+).*\n'
    edstat_line = RT.LogDataLine(edstatTableLine)

    anyLine = '^.*?\n' # ? in .*? means not greedy
    edstat_any = RT.LogDataLine(anyLine)

    edstatStartTableLine = '\$\$.*?\$\$.*\n'
    edstat_startTable = RT.LogDataLine(edstatStartTableLine)

    edstatEndTableLine = '\$\$.*\n'
    edstat_endTable = RT.LogDataLine(edstatEndTableLine)

    edstat_any.add_next(edstat_startTable, edstat_line, edstat_endTable, edstat_any)

    edstat_startTable.add_next(edstat_line)
    edstat_line.add_next(edstat_line, edstat_endTable)
    edstat_endTable.add_next(edstat_any)

    edstat_line.add_action(self.displayGraph)
    edstat_endTable.add_action(self.displayTable)

    self.parser = RT.LogDataParser()
    self.parser.add_next(edstat_any)
    self.parser.add_recovery_next(edstat_any)
    self.parser.add_recovery_action(self.item_reset)

    self.widget = API.loggraph(self.sect, 1, 0, 1, 1)
    self.liveGraph = None
    self.ZDmM = None
    self.ZDpM = None
    self.ZOM = None
    self.ZDmS = None
    self.ZDpS = None
    self.ZOS = None
    self.liveResiduetN = None
    self.livePLT = None
    self.liveLineZDmM = None
    self.liveLineZDpM = None
    self.livePLT2 = None
    self.liveLineZOM = None
    self.livePLT3 = None
    self.liveLineZDmS = None
    self.liveLineZDpS = None
    self.livePLT4 = None
    self.liveLineZOS = None
    self.curChain = ''
    self.mainChainOutliers = []
    self.sideChainOutliers = []

    tipText1 = """<br>The ZD scores are accuracy metrics, i.e. at least in theory they can be<br> 
improved by adjusting the model (by eliminating the obvious difference density).<br>
The ZO scores are precision metrics and will be strongly correlated with the Bisos<br>
(since that is also a precision metric), i.e. assuming you've fixed any issues with<br>
accuracy of that residue there's nothing you can do about the precision, short of<br>
re-collecting the data.<br>"""

    tipText2 = """The advisable rejection limits and indeed default values for this task are 
&lt; -3*sigma and &gt; 3*sigma for the residue ZD metrics respectively, 
and &lt; 1*sigma for the residue ZO metrics."""
    self.show_text(':EDSTATS Output:', tipText1, tipText2)

    self.flush()



    return


  def parse_stream(self, istream, ostream=None, verbose=False, pause=0, patches=None):
    self.parser.parse_stream(istream, ostream, verbose, pause, patches)
    if self.sect is not self.grid:
      self.sect.set_state(False)


  def item_reset(self):
    # del self.item_title_parts[:]
    # del self.item_graphs_parts[:]
    # del self.item_header_parts[:]
    # del self.item_message_parts[:]
    # del self.item_body_parts[:]
    self.item_kind = None
    self.graph_kind = None


  def displayTable(self, groups):
    # Data in the dictionary
    # rec = {'resN': resNum,
    #        'res': groups[0].strip(),
    #        'chain': groups[1].strip(),
    #        'zo': zoS,
    #        'zdm': zdmS,
    #        'zdp': zdpS
    #        }

    self.table_mainchain_outliers_panel = API.panel(self.sect, 2, 0, 1, 1)
    self.table_mainchain_outliers = API.pyrvapi_table(self.table_mainchain_outliers_panel, 2, 0, 1, 1, 'Main chain outliers', 1)
    self.table_mainchain_outliers.col_title(0, 'Chain')
    self.table_mainchain_outliers.col_title(1, 'Name')
    self.table_mainchain_outliers.col_title(2, 'Number')
    self.table_mainchain_outliers.col_title(3, 'ZO')
    self.table_mainchain_outliers.col_title(4, 'ZD+')
    self.table_mainchain_outliers.col_title(5, 'ZD-')
    for i in range(len(self.mainChainOutliers)):
      self.table_mainchain_outliers.body_cell(i, 0, self.mainChainOutliers[i]['chain'])
      self.table_mainchain_outliers.body_cell(i, 1, self.mainChainOutliers[i]['res'])
      self.table_mainchain_outliers.body_cell(i, 2, self.mainChainOutliers[i]['resN'])
      self.table_mainchain_outliers.body_cell(i, 3, self.mainChainOutliers[i]['zo'])
      self.table_mainchain_outliers.body_cell(i, 4, self.mainChainOutliers[i]['zdp'])
      self.table_mainchain_outliers.body_cell(i, 5, self.mainChainOutliers[i]['zdm'])

    self.table_sidechain_outliers_panel = API.panel(self.sect, 3, 0, 1, 1)
    self.table_sidechain_outliers = API.pyrvapi_table(self.table_sidechain_outliers_panel, 3, 0, 1, 1, 'Side chain outliers', 1)
    self.table_sidechain_outliers.col_title(0, 'Chain')
    self.table_sidechain_outliers.col_title(1, 'Name')
    self.table_sidechain_outliers.col_title(2, 'Number')
    self.table_sidechain_outliers.col_title(3, 'ZO')
    self.table_sidechain_outliers.col_title(4, 'ZD+')
    self.table_sidechain_outliers.col_title(5, 'ZD-')
    for i in range(len(self.sideChainOutliers)):
      self.table_sidechain_outliers.body_cell(i, 0, self.sideChainOutliers[i]['chain'])
      self.table_sidechain_outliers.body_cell(i, 1, self.sideChainOutliers[i]['res'])
      self.table_sidechain_outliers.body_cell(i, 2, self.sideChainOutliers[i]['resN'])
      self.table_sidechain_outliers.body_cell(i, 3, self.sideChainOutliers[i]['zo'])
      self.table_sidechain_outliers.body_cell(i, 4, self.sideChainOutliers[i]['zdp'])
      self.table_sidechain_outliers.body_cell(i, 5, self.sideChainOutliers[i]['zdm'])

    self.flush()


  def displayGraph(self, groups):
    try:
      chain = groups[1].strip()
      if self.curChain != chain:
        self.curChain = chain
        self.liveGraph = API.graph_data(self.widget, 'Chain '+ self.curChain)

        self.ZDmM = API.graph_dataset(self.liveGraph, 'ZD-', '', False)
        self.ZDpM = API.graph_dataset(self.liveGraph, 'ZD+', '', False)
        self.ZOM = API.graph_dataset(self.liveGraph, 'ZO', '', False)

        self.ZDmS = API.graph_dataset(self.liveGraph, 'ZD-', '', False)
        self.ZDpS = API.graph_dataset(self.liveGraph, 'ZD+', '', False)
        self.ZOS = API.graph_dataset(self.liveGraph, 'ZO', '', False)

        self.liveResiduetN = API.graph_dataset(self.liveGraph, 'Residue Number', '', True)

        self.livePLT = API.graph_plot(self.widget, 'Main Chain ZD+/- Scores', 'Residue number', '')
        self.liveLineZDpM = API.plot_line(self.livePLT, self.liveGraph, self.liveResiduetN, self.ZDpM)
        self.liveLineZDmM = API.plot_line(self.livePLT, self.liveGraph, self.liveResiduetN, self.ZDmM)

        self.livePLT2 = API.graph_plot(self.widget, 'Main Chain ZO Scores', 'Residue number', '')
        self.liveLineZOM = API.plot_line(self.livePLT2, self.liveGraph, self.liveResiduetN, self.ZOM)

        self.livePLT3 = API.graph_plot(self.widget, 'Side Chain ZD+/- Scores', 'Residue number', '')
        self.liveLineZDpS = API.plot_line(self.livePLT3, self.liveGraph, self.liveResiduetN, self.ZDpS)
        self.liveLineZDmS = API.plot_line(self.livePLT3, self.liveGraph, self.liveResiduetN, self.ZDmS)

        self.livePLT4 = API.graph_plot(self.widget, 'Side Chain ZO Scores', 'Residue number', '')
        self.liveLineZOS = API.plot_line(self.livePLT4, self.liveGraph, self.liveResiduetN, self.ZOS)

        pyrvapi.rvapi_set_line_options(self.ZDpM.id, self.livePLT.id, self.liveGraph.id, self.widget.id, "green", "bars",
                                 "off", 15.0, True)
        pyrvapi.rvapi_set_line_options(self.ZDmM.id, self.livePLT.id, self.liveGraph.id, self.widget.id, "#D8814C", "bars",
                                 "off", 15.0, True)
        pyrvapi.rvapi_set_line_options(self.ZOM.id, self.livePLT2.id, self.liveGraph.id, self.widget.id, "darkblue", "bars",
                                 "off", 15.0, True)

        pyrvapi.rvapi_set_line_options(self.ZDpS.id, self.livePLT3.id, self.liveGraph.id, self.widget.id, "green", "bars",
                                 "off", 15.0, True)
        pyrvapi.rvapi_set_line_options(self.ZDmS.id, self.livePLT3.id, self.liveGraph.id, self.widget.id, "#D8814C", "bars",
                                 "off", 15.0, True)
        pyrvapi.rvapi_set_line_options(self.ZOS.id, self.livePLT4.id, self.liveGraph.id, self.widget.id, "darkblue", "bars",
                                 "off", 15.0, True)

        pyrvapi.rvapi_set_bar_options(self.ZDpM.id, self.livePLT.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)
        pyrvapi.rvapi_set_bar_options(self.ZDmM.id, self.livePLT.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)
        pyrvapi.rvapi_set_bar_options(self.ZOM.id, self.livePLT2.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)

        pyrvapi.rvapi_set_bar_options(self.ZDpS.id, self.livePLT3.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)
        pyrvapi.rvapi_set_bar_options(self.ZDmS.id, self.livePLT3.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)
        pyrvapi.rvapi_set_bar_options(self.ZOS.id, self.livePLT4.id, self.liveGraph.id, self.widget.id,
                                      0, 1, 1, 2, 0.5, 135, True)


      resNum = int(groups[2])
      self.liveResiduetN.add_datum(resNum)

      if isfloat(groups[11]):
        zoM = float(groups[11]) # numeration starts from 0 (so -1 relative to regexp group numbering)
      else:
        zoM = 0.0

      if isfloat(groups[13]):
        zdmM = float(groups[13])
      else:
        zdmM = 0.0

      if isfloat(groups[14]):
        zdpM = float(groups[14])
      else:
        zdpM = 0.0

      self.ZOM.add_datum(zoM)
      self.ZDmM.add_datum(zdmM)
      self.ZDpM.add_datum(zdpM)

      if (zoM <= 1.0) or (zdmM <= -3.0) or (zdpM >= 3.0):
        if (zoM + zdmM + zdpM) != 0.0:
          rec = {'resN' : resNum,
                 'res' : groups[0].strip(),
                 'chain': groups[1].strip(),
                 'zo' : zoM,
                 'zdm' : zdmM,
                 'zdp' : zdpM
                }
          self.mainChainOutliers.append(copy.deepcopy(rec))

      if isfloat(groups[23]):
        zoS = float(groups[23]) # numeration starts from 0 (so -1 relative to regexp group numbering)
      else:
        zoS = 0.0

      if isfloat(groups[25]):
        zdmS = float(groups[25])
      else:
        zdmS = 0.0

      if isfloat(groups[26]):
        zdpS = float(groups[26])
      else:
        zdpS = 0.0

      self.ZOS.add_datum(zoS)
      self.ZDmS.add_datum(zdmS)
      self.ZDpS.add_datum(zdpS)

      if (zoS <= 1.0) or (zdmS <= -3.0) or (zdpS >= 3.0):
        if (zoS + zdmS + zdpS) != 0.0:
          rec = {'resN' : resNum,
                 'res' : groups[0].strip(),
                 'chain': groups[1].strip(),
                 'zo' : zoS,
                 'zdm' : zdmS,
                 'zdp' : zdpS
                }
          self.sideChainOutliers.append(copy.deepcopy(rec))

    # except:
    #   pass

    except Exception as inst:
      sys.stderr.write(str(type(inst)) + '\n')  # the exception instance
      sys.stderr.write(str(inst.args) + '\n')  # arguments stored in .args
      sys.stderr.write(str(inst) + '\n')  # __str__ allows args to be printed directly,
      tb = traceback.format_exc()
      sys.stderr.write(str(tb) + '\n\n')

    return


  #      if self.liveYmin is None or self.liveYmax is None:
  #        self.liveYmin = rFree
  #        self.liveYmax = rFree
  #      if (rFree > self.liveYmax) and (rFree > self.liveYmin):
  #        self.liveYmax = rFree

  #      self.livePLT.set_yrange(self.liveYmin - 0.02, self.liveYmax + 0.02)


  def show_text(self, title, message, body):
    if self.item_kind == 'SUMMARY':  # hack for refmac
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

    for i1 in range(len(body_lines) - 1, -1, -1):
      if body_lines[i1].strip():
        break

    body_text = '<pre>' + '<br>'.join(body_lines[i0:i1 + 1]) + '</pre>'
    table.body_cell(j, 0, body_text, style)
    self.flush()
