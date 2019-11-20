
import os
import collections
import json

def read_json(json_path):
  with open(json_path) as istream:
    return json.JSONDecoder(object_pairs_hook=collections.OrderedDict).decode(istream.read())

def write_json(json_obj, json_path, indent=4):
  with open(json_path, 'w') as ostream:
    json.dump(json_obj, ostream, indent=indent, separators=(',', ' : '))
    ostream.write('\n')

def main():
  confin = os.path.join('config', 'conf.')
# confout = os.path.join('config2', 'conf.')
  confout = 'w_conf.'

# dirout = os.path.dirname(confout)
# if not os.path.isdir(dirout):
#   os.makedirs(dirout)

  for key in 'desktop', 'remote':
    json_obj = read_json(confin + key + '.json')
    json_obj['Emailer'] = dict(type = 'desktop')

    json_fe = json_obj['FrontEnd']
    if json_fe['host'] == 'localhost':
      json_fe['ration']['storage'] = 0
      json_fe['externalURL'] = ''
      json_fe['stoppable'] = True
      json_fe['port'] = 0
      json_fe['fsmount'] = None

    else:
      json_fe['exclude_tasks'] = []

    json_proxy = json_obj.get('FEProxy')
    if json_proxy:
      json_proxy['externalURL'] = ''
      json_fe['stoppable'] = True
      json_proxy['port'] = 0

    for json_nc in json_obj['NumberCrunchers']:
      json_nc['jobRemoveTimeout'] = 3600000
      json_nc['externalURL'] = ''
      json_nc['stoppable'] = True
      json_nc['port'] = 0
      json_nc['fsmount'] = None
      if json_nc['name'] == 'client':
        json_nc['useRootCA'] = False

    write_json(json_obj, confout + key + '.json', 2)

if __name__ =='__main__':
  main()

