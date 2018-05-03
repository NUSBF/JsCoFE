#!/bin/bash

server_dir=/Users/eugene/Projects/jsCoFE
ccp4_dir=/Users/eugene/Projects/ccp4jh/ccp4-dev

source $ccp4_dir/bin/ccp4.setup-sh

cd $server_dir

node ./fe_server.js config/ccp4/conf.local.fe.json
