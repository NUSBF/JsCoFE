
import collections
import json

def read_json(json_path):
  with open(json_path) as istream:
    return json.JSONDecoder(object_pairs_hook=collections.OrderedDict).decode(istream.read())

def write_json(pyobj, json_path, indent=4):
  with open(json_path, 'w') as ostream:
    json.dump(pyobj, ostream, indent=indent, separators=(',', ' : '))
    ostream.write('\n')

def main():
  for key in 'desktop', 'remote':
    pyobj = read_json('config/conf.' + key + '.json')
    pyobj['Emailer'] = dict(type = 'desktop')
    write_json(pyobj, 'w_conf.' + key + '.json', 2)

if __name__ =='__main__':
  main()

