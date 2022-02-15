#!/bin/bash

# Start script for jsCoFE
# This is a simple wrapper which selects a script to run from one of the config
# subdirectories. (In the long run it would be better for this script to pick
# up the correct config automatically and start node itself, rather than
# calling another script just to use some hard-coded paths.)

# starts config/ccp4/start-desktop.sh by default
# pass em as an argument to start ccp-em version instead
# any other argument will be used as the product name

suite='ccp4'
product='desktop'

until [[ -z $1 ]]; do
    case $1 in
        "em")
            suite="ccpem"
            ;;
        *)
            product=$1
            ;;
    esac
    shift
done

target="config/${suite}/start-${product}.sh"

echo "Calling ${target}"
${target}
