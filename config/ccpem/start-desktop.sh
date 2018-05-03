#!/bin/bash

# Start script for CCP-EM version of jsCoFE in desktop mode

server_dir=/home/colin/code/jscofe/local-dev
ccp4_dir=/home/colin/workspaces/devtools/install
#morda_dir=/Users/eugene/Projects/MoRDa_DB
#pdb_dir=/Users/eugene/pdb/pdb
config_dir=$HOME/.config/jsCoFE

if [ ! -d $config_dir ]; then
  mkdir -p $config_dir
fi

source $ccp4_dir/bin/ccp4.setup-sh
#source $morda_dir/morda_env_osx_sh
#export PDB_DIR=$pdb_dir

cd $server_dir

node ./desktop.js ./config/ccpem/conf.desktop.json
