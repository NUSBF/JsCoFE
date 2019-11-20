
SEVERITY_WARNING = 2
SEVERITY_OK = 0

class CException(Exception):

  def __init__(self, *args, **kwdargs):
    pass

  def extend(self, *args, **kwdargs):
    pass

  def maxSeverity(self, *args, **kwdargs):
    return 0

