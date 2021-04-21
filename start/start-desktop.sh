#!/bin/bash

server_dir=/Users/eugene/Projects/jsCoFE
#ccp4_dir=$server_dir/cloudccp4
ccp4_dir=/Applications/ccp4-7.1
#ccp4_dir=/Users/eugene/Projects/ccp4jh/ccp4-dev
#morda_dir=/Users/eugene/Projects/MoRDa_DB
pdb_dir=/Users/eugene/pdb/pdb
gesamt_dir=/Users/eugene/pdb/gesamt_archive_s
xds_dir=/Applications/XDS
xdsgui_dir=/usr/local/bin

source $ccp4_dir/bin/ccp4.setup-sh
#source $morda_dir/morda_env_osx_sh
export PDB_DIR=$pdb_dir
export GESAMT_ARCHIVE=$gesamt_dir
#export JSPISA_CFG=$CCP4/share/pisa/jspisa.cfg
export XDS_home=$xds_dir
export XDSGUI_home=$xdsgui_dir
export DOCREPO=/Users/eugene/Projects/jsCoFE/trunk-doc

# custom plugin for Xia-2
export Xia2_durin=/path/to/durin-plugin.so

# comment out if buster is not installed
source /Applications/GPhL/Buster/setup.sh

cd $server_dir

echo $PATH
echo $PYTHONPATH
which ccp4-python
echo $XDS_home
echo $XDSGUI_home
echo $DOCREPO
echo $Xia2_durin
echo ""

#killall node

node ./js-server/desktop.js ./config/conf.desktop-tutorials.json
#while [ $? -eq 212 ]
#do
#    node ./js-server/desktop.js ./config/conf.desktop.json
#done
#node ./desktop.js ./config/conf.desktop.json -localuser 'Eugene Krissinel'
