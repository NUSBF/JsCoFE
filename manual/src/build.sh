#!/bin/bash

jscofe_dir=/Users/eugene/Projects/|jsCoFE|

cd $jscofe_dir/manual/src

make html
rm -rf $jscofe_dir/manual/html
cp -r _build/html $jscofe_dir/manual
