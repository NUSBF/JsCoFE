#
# This is generic pyrvpai_ext parser (pyrvapi_ext.parsers.generic - developed by Andrey Lebedev),
# customised for BAVER by Oleg Kovalevskiy.
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

class baver_parser(object):

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
    #      18     22.3   0.0679     23.2   0.1162     22.8   2.2518   GLN A
    baverTableLine = '\s*?([+-]*\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+).*?\n'
    baver_line = RT.LogDataLine(baverTableLine)

    anyLine = '^.*?\n' # ? in .*? means not greedy
    baver_any = RT.LogDataLine(anyLine)

    baverStartTableLine = '\s*?\$\$.*?\n'
    baver_startTable = RT.LogDataLine(baverStartTableLine)

    baverFinalTableStart = '\s*?Chain\s*?Number of atoms\s*?Average B value\s*?\n'
    baver_finalTable = RT.LogDataLine(baverFinalTableStart)

    baverFinalTableLine = '\s*?(\S)\s+(\d+)\s+(\S+)\s*?\n'
    baver_tableLine = RT.LogDataLine(baverFinalTableLine)

    baver_any.add_next(baver_startTable, baver_line, baver_finalTable, baver_any)
    baver_startTable.add_next(baver_line, baver_startTable, baver_finalTable, baver_any)
    baver_line.add_next(baver_line, baver_startTable)
    baver_finalTable.add_next(baver_tableLine, baver_startTable)
    baver_tableLine.add_next(baver_tableLine, baver_startTable, baver_any)

    baver_line.add_action(self.displayGraph)
    baver_startTable.add_action(self.displayTable)
    baver_any.add_action(self.resetDollars)
    baver_tableLine.add_action(self.parseFinalTable)

    self.parser = RT.LogDataParser()
    self.parser.add_next(baver_any)
    self.parser.add_recovery_next(baver_any)
    self.parser.add_recovery_action(self.item_reset)


    self.table_final_panel = API.panel(self.sect, 1, 0, 1, 1)
    self.table_final = API.pyrvapi_table(self.table_final_panel, 1, 0, 1, 1,
                                         'Average B-factors for the chains', 1)
    self.widget = API.loggraph(self.sect, 2, 0, 1, 1)

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
    self.finalTable = []
    self.startDollars = False


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


  def resetDollars(self, groups):
    self.startDollars = False


  def parseFinalTable(self, groups):
    finTab = {'chain': groups[0],
              'numAtoms' : groups[1],
              'baver': groups[2]
    }
    self.finalTable.append(copy.deepcopy(finTab))

  def displayTable(self, groups):
    if len(self.finalTable) > 0:
      self.table_final.col_title(0, 'Chain')
      self.table_final.col_title(1, '# of atoms')
      self.table_final.col_title(2, 'Average B-fact')
      for i in range(len(self.finalTable)):
        self.table_final.body_cell(i, 0, self.finalTable[i]['chain'])
        self.table_final.body_cell(i, 1, self.finalTable[i]['numAtoms'])
        self.table_final.body_cell(i, 2, self.finalTable[i]['baver'])

    # End of table is two '$$' consecutive lines; start of the table - one such line
    if not self.startDollars:
      self.startDollars = True
      return


    self.flush()


  def displayGraph(self, groups):
    self.startDollars = False
    try:
      #      RES   MC_Bav RMS_MC_B   SC_Bav RMS_SC_B     Bav    RMS_B   Type Chain
      #      18     22.3   0.0679     23.2   0.1162     22.8   2.2518   GLN A
      #      0       1        2        3      4          5       6       7  8

      # sys.stderr.write('0: ' + str(groups[0]))
      # sys.stderr.write(' ,1: ' + str(groups[1]))
      # sys.stderr.write(' ,2: ' + str(groups[2]))
      # sys.stderr.write(' ,3: ' + str(groups[3]))
      # sys.stderr.write(' ,4: ' + str(groups[4]))
      # sys.stderr.write(' ,5: ' + str(groups[5]))
      # sys.stderr.write(' ,6: ' + str(groups[6]))
      # sys.stderr.write(' ,7: ' + str(groups[7]))
      # sys.stderr.write(' ,8: ' + str(groups[8]) + '\n')
      # sys.stderr.flush()
      chain = groups[8].strip()
      if self.curChain != chain:
        self.curChain = chain
        self.liveGraph = API.graph_data(self.widget, 'Chain '+ self.curChain)

        self.mcB = API.graph_dataset(self.liveGraph, 'Main chain B-fact', '', False)
        self.scB = API.graph_dataset(self.liveGraph, 'Side chain B-fact', '', False)
        self.avB = API.graph_dataset(self.liveGraph,  'Residue B-fact', '', False)

        self.liveResiduetN = API.graph_dataset(self.liveGraph, 'Residue Number', '', True)

        self.livePLT = API.graph_plot(self.widget, 'Main chain B-factors', 'Residue number', '')
        self.liveLineMCB = API.plot_line(self.livePLT, self.liveGraph, self.liveResiduetN, self.mcB)

        self.livePLT2 = API.graph_plot(self.widget, 'Side chain B-factors', 'Residue number', '')
        self.liveLineSCB = API.plot_line(self.livePLT2, self.liveGraph, self.liveResiduetN, self.scB)

        self.livePLT3 = API.graph_plot(self.widget, 'Residue average B-factors', 'Residue number', '')
        self.liveLineAVB = API.plot_line(self.livePLT3, self.liveGraph, self.liveResiduetN, self.avB)


        pyrvapi.rvapi_set_line_options(self.mcB.id, self.livePLT.id, self.liveGraph.id, self.widget.id, "blue", "bars",
                                 "off", 2.0, True)
        pyrvapi.rvapi_set_line_options(self.scB.id, self.livePLT2.id, self.liveGraph.id, self.widget.id, "green", "bars",
                                 "off", 2.0, True)
        pyrvapi.rvapi_set_line_options(self.avB.id, self.livePLT3.id, self.liveGraph.id, self.widget.id, "orange", "bars",
                                 "off", 2.0, True)

      resNum = int(groups[0])
      self.liveResiduetN.add_datum(resNum)

      if isfloat(groups[1]):
        mcB = float(groups[1]) # numeration starts from 0 (so -1 relative to regexp group numbering)
      else:
        mcB = 0.0

      if isfloat(groups[3]):
        scB = float(groups[3])
      else:
        scB = 0.0

      if isfloat(groups[5]):
        avB = float(groups[5])
      else:
        avB = 0.0

      self.mcB.add_datum(mcB)
      self.scB.add_datum(scB)
      self.avB.add_datum(avB)

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


