#!/bin/bash

server_dir=/Users/eugene/Projects/jsCoFE
ccp4_dir=/Applications/ccp4-7.1
#ccp4_dir=/Users/eugene/Projects/ccp4jh/ccp4-dev
#morda_dir=/Users/eugene/Projects/MoRDa_DB
pdb_dir=/Users/eugene/pdb/pdb
gesamt_dir=/Users/eugene/pdb/gesamt_archive_s

source $ccp4_dir/bin/ccp4.setup-sh
#source $morda_dir/morda_env_osx_sh
export PDB_DIR=$pdb_dir
export GESAMT_ARCHIVE=$gesamt_dir
export JSPISA_CFG=$CCP4/share/pisa/jspisa.cfg

cd $server_dir

killall node

#node ./js-server/nc_server.js ./config/conf.remote-s.json 0 &
#sleep 1
#node ./js-server/fe_proxy.js ./config/conf.remote-s.json &

node ./js-server/desktop.js ./config/conf.remote-s.json
