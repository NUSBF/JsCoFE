#!/bin/bash
#
#  ============================================================================
#
#    07.03.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#  ----------------------------------------------------------------------------
#
#  **** Module  :  config/nc_launcher.sh
#       ~~~~~~~~~
#  **** Project :  jsCoFE - javascript-based Cloud Front End
#       ~~~~~~~~~
#  **** Content :  Custom job launcher in jsCoFE (CCP4 Cloud)
#       ~~~~~~~~~
#
#  (C) E. Krissinel, A. Lebedev 2016-2019
#
#  ============================================================================
#
#  This script exemplifies custom job launcher script for SLURM engine
#
#  In order to use your own custom launcher:
#
#  - make a copy of this file (e.g. "nc_custom_launcher.sh") and edit it
#    accordingly (see below)
#
#  - modify the following fields in NC configuration file:
#        .........
#        "exeType"          : "SCRIPT",
#        "exeData"          : "/path/to/nc_custom_launcher.sh",
#        .........
#    for every NC machine where this script will be used
#
#  - restart NC machine(s)
#
#  NOTE: this script is not used if "exeType" is set to "SHELL" or "SGE".
#
#
#  Functional launcher script must provide for the following command lines and
#  returns (which are done by printing return values in the standard output
#  stream):
#
#   1. Stage a job:
#
#     > script-name.sh start file_stdout file_stderr job_name ncores executable [parameters]
#
#   where [parameters] is an arbitrary-length array of parameters to be passed
#   to executable. MUST print JOB_ID of staged job in standard output but
#   nothing else
#
#   2. Count number of jobs waiting in the queue:
#
#     > script-name.sh check_waiting user_name
#
#   MUST print the number of jobs in waiting state, in standard output but
#   nothing else
#
#   3. Delete job(s):
#
#     > script-name.sh kill JOB_ID_1 JOB_ID_2 ... JOB_ID_N
#
#   no output is required but any should be harmless
#
#  ============================================================================
#

#  "$1" is the operational switch (start|check_waiting|kill)

case "$1" in

  start)
      # start job: script-name.sh start executable parameters
      # RETURNS JOB_ID of the staged job (3rd word from qsub output)
      #  "$2" is file path for qsub standard printout
      #  "$3" is file path for qsub error printout
      #  "$4" is job name (to identify the job in qsub queue)
      #  "$5" is number of cores spawned to report to the queuing system
      #  "$6" is path to executable script (usually ccp4-python)
      #  "$7" on are parameters to pass to the executable script
      #qsub -cwd -V -b y -q all.q -notify -o "$2" -e "$3" -N "$4" "${@:5}" | cut -d " " -f 3
      sbatch --export=ALL -o "$2" -e "$3" -J "$4" -c "$5" "${@:6}" | cut -d " " -f 4
      ;;

  check_waiting)
      # prints the number of waiting jobs: script-name.sh check_waiting user_name
      # "$2" is login name for account running jsCoFE (CCP4 Cloud) on NC machine
      #qstat -u "$2" | grep "  qw  " | wc -l
      squeue -u "$2" | egrep "^\s*[0-9]+\s" | wc -l
      ;;

  kill)
      # kill jobs: script-name.sh kill JOB_ID_1 JOB_ID_2 ... JOB_ID_N
      # "$2" on are JOB_ID(s) obtained at job staging (primary and secondary)
      #qdel "${@:2}"
      scancel "${@:2}"
      ;;

  *)
      echo $"Usage: $0 {start|check_waiting|kill}"
      exit 1

esac
