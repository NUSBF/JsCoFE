
# Dummu files:
# ./core/CCP4ErrorHandling.py
# ./core/CCP4Utils.py

# Report class:
# $CCP4/share/ccp4i2/report/CCP4ReportParser.py

# Aimless piplene report:
# $CCP4/share/ccp4i2/wrappers/ctruncate/script/ctruncate_report.py
# $CCP4/share/ccp4i2/wrappers/pointless/script/pointless_report.py
# $CCP4/share/ccp4i2/wrappers/aimless/script/aimless_report.py
# $CCP4/share/ccp4i2/pipelines/aimless_pipe/script/aimless_pipe_report.py
# $CCP4/share/ccp4i2/pipelines/aimless_pipe/script/aimless_pipe_utils.py

import os, sys

ccp4 = os.environ['CCP4']
etree_top = os.path.join(ccp4, 'lib', 'python2.7', 'site-packages')
if etree_top not in sys.path:
  sys.path.append(etree_top)

i2top = os.path.join(ccp4, 'share', 'ccp4i2')
if not os.path.isdir(i2top):
  i2top += 'dev'

# for ccp4i2/devel
sys.path.append(i2top)

# for ccp4i2/trunk
sys.path.append(os.path.join(os.path.abspath(os.path.dirname(__file__)), 'core'))
sys.path.append(os.path.join(i2top, 'report'))
sys.path.append(os.path.join(i2top, 'wrappers', 'pointless', 'script'))
sys.path.append(os.path.join(i2top, 'wrappers', 'aimless', 'script'))
sys.path.append(os.path.join(i2top, 'wrappers', 'ctruncate', 'script'))
sys.path.append(os.path.join(i2top, 'pipelines', 'aimless_pipe', 'script'))

del ccp4, etree_top
import re
from xml.etree import ElementTree as ET
from aimless_pipe_report import aimless_pipe_report

def write_html(i2htmlbase, i2xml_dict, i2xml_tmp, i2html):
  root = ET.Element('AIMLESS_PIPE')
  root.text = '\n '
  root.tail = '\n'
  root.append(ET.parse(i2xml_dict['pointless']).getroot())
  root.append(ET.parse(i2xml_dict['aimless']).getroot())
  e1 = ET.SubElement(root, 'CTRUNCATES')
  for i2xml in i2xml_dict['ctruncate']:
    e1.append(ET.parse(i2xml).getroot())

  xmlstr = ET.tostring(root)
  with open(i2xml_tmp, 'w') as ostream:
    print >>ostream, xmlstr

  report = aimless_pipe_report(xmlFile=i2xml_tmp, jobStatus='Finished')
  htmlstr = report.as_html(htmlBase=i2htmlbase)
  htmlstr = re.sub('<object .*?</object>', '', htmlstr, flags=re.S)
  htmlstr = htmlstr.replace('><', '>\n<')
  with open(i2html, 'w') as ostream:
    print >>ostream, htmlstr,

