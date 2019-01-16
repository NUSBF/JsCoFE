#!/bin/bash
#
# =============================================================================
#  Custom job launch in jsCoFE (CCP4 Cloud)
# =============================================================================
#
#  This script exemplifies custom job launch script for SGE engine and is
#  fully equivalent to 'SGE' exeType value in NC configuration file.
#
#  In order to use your own script:
#
#  - make a copy of this file and edit it accordingly
#  - modify the following fields in NC configuration:
#        .........
#        "exeType"          : "SCRIPT",
#        "exeData"          : "/path/to/nc_custom_launch.sh",
#        .........
#    for every NC machine where this script will be used
#
#  Command lines for using custom launch script:
#
#   Launch job:
#     > script-name.sh start file_stdout file_stderr job_name executable [parameters]
#
#   where [parameters] is an arbitrary-length array of parameters to be passed
#   to executable. MUST print JOB_ID in standard output
#
#   Count number if jobs waiting in the queue:
#     > script-name.sh check_waiting user_name
#
#   prints the number of jobs waiting in standard output
#
#   Delete jobs:
#     > script-name.sh kill JOB_ID_1 JOB_ID_2 ... JOB_ID_N
#
#   prints "found" or "not found" in standard output
#

case "$1" in

  start)
      # start job: script-name.sh start executable parameters
      qsub -cwd -V -b y -q all.q -notify -o "$2" -e "$3" -N "$4" "${@:5}" | cut -d " " -f 3
      ;;

  check_waiting)
      # prints the number of waiting jobs: script-name.sh check_waiting user_name
      qstat -u "$2" | grep "  qw  " | wc -l
      ;;

  kill)
      # kill jobs: script-name.sh kill JOB_ID_1 JOB_ID_2 ... JOB_ID_N
      qdel "${@:2}"
      ;;

  *)
      echo $"Usage: $0 {start|check_waiting|kill}"
      exit 1

esac
