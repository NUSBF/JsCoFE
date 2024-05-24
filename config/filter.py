

#  14.09.2022

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
  os.chdir(os.path.abspath(os.path.join(__file__, '..', '..')))
  confin = os.path.join('config', 'conf.')
  confout = os.path.join('conf', 'conf.')

  dirout = os.path.dirname(confout)
  if not os.path.isdir(dirout):
    os.makedirs(dirout)

  for k0, k1 in ('desktop', 'local'), ('remote', 'remote'):
    json_obj = read_json(confin + k0 + '.json')
    json_obj['Emailer'] = dict(type = 'desktop')

    json_fe = json_obj['FrontEnd']
    if json_fe['host'] == 'localhost' or json_fe['host'] == '127.0.0.1':
      json_fe['ration']['storage'] = 0
      json_fe['externalURL'] = ''
      json_fe['stoppable'] = True
      json_fe['port'] = 0
      json_fe['fsmount'] = None

    else:
      json_fe['exclude_tasks'] = []

    json_mounts = json_fe.get('cloud_mounts')
    json_key = 'Demo projects'
    if json_mounts and json_key in json_mounts:
      del json_mounts[json_key]

    json_proxy = json_obj.get('FEProxy')
    if json_proxy:
      json_proxy['externalURL'] = ''
      json_fe['stoppable'] = True
      json_proxy['port'] = 0

    for json_nc in json_obj['NumberCrunchers']:
      #json_nc['jobRemoveTimeout'] = 3600000
      json_nc['externalURL'] = ''
      json_nc['stoppable'] = True
      json_nc['port'] = 0
      json_nc['fsmount'] = None
      if json_nc['name'] == 'client':
        json_nc['useRootCA'] = False

    write_json(json_obj, confout + k1 + '.json', 2)

if __name__ =='__main__':
  main()

