#!/bin/bash

server_dir=/Users/eugene/Projects/jsCoFE
ccp4_dir=/Applications/ccp4-7.0
#ccp4_dir=/Users/eugene/Projects/ccp4jh/ccp4-dev
pdb_dir=/Users/eugene/pdb/pdb
gesamt_dir=/Users/eugene/pdb/gesamt_archive_s

source $ccp4_dir/bin/ccp4.setup-sh
export PDB_DIR=$pdb_dir
export GESAMT_ARCHIVE=$gesamt_dir
export JSPISA_CFG=$CCP4/share/pisa/jspisa.cfg

cd $server_dir

#killall node

# this will start desktop without user accounts
#node ./desktop.js config/ccp4/conf.desktop.json -localuser 'User Name'

# this will start local web-server with user accounts
node ./desktop.js config/ccp4/conf.desktop.json
