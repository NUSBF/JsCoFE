#!/usr/bin/env bash

# exit if a command returns non-zero
set -e

function setup() {
    local mode="$1"
    local prompt="$2"

    local cwd="$(pwd)"
    local setup="$SERVER_DIR/setup"

    if [[ "$SERVER_DIR" == "$cwd" ]]; then
        echo "Cannot setup from within $SERVER_DIR"
        echo "Please run from another folder"
        return 1
    fi

    if [[ "$prompt" != "-y" ]]; then
        # prompt user to confirm unless -y is passed in second argument
        echo "Are you sure you want to install the start script and configs in $cwd?"
        echo "Type Y/y to confirm."
        read -s -n 1 -r
        [[ ${REPLY,,} != "y" ]] && return
    fi

    # symlink setup to start-(fe|nc).sh and copy start.d folder
    if [[ ! -e "start-$mode.sh" || -h "start-$mode.sh" ]]; then
        ln -sfv "$SERVER_DIR/setup.sh" "start-$mode.sh"
    else
        echo "A file start-$mode.sh already exists in $cwd. Please rename/move file to install to this location."
        return 1
    fi

    # copy env.sh.example script
    cp -r "$setup/start.d" "$cwd/"
    # copy default configurations (without overwriting)
    cp -nv "$setup/pm2/$mode-ecosystem.config.js" "ecosystem.config.js"
    cp -nv "$setup/$mode-config.json" "$cwd/config.json"
    echo "Start up script and default configurations copied to $cwd"
    echo "Copy start.d/env.sh.dist to start.d/env.sh and edit accordingly."
    echo "If managing with pm2, please edit ecosystem.cfg as required."
    return 0
}

# launch the server
function launch_server() {
    local opt="$1"
    local params
    params=("$CONFIG_JSON")
    [[ "$MODE" == "nc" ]] && params+=(0)

    cd "$SERVER_DIR"
    if [[ "$opt" == "pm2" ]]; then
        node "$CMD" "${params[@]}"
    else
        set +e
        node "$CMD" "${params[@]}" >>"$LOG_DIR/node_$MODE.log" 2>>"$LOG_DIR/node_$MODE.err"
        echo
        echo "$LOG_DIR/node_$MODE.err"
        echo "--------------------"
        tail -10 "$LOG_DIR/node_$MODE.err"
        echo "$LOG_DIR/node_$MODE.log"
        echo "--------------------"
        tail -10 "$LOG_DIR/node_$MODE.log"
    fi
}

# resolve location of the script (following link to get SERVER_DIR)
SERVER_DIR="$(dirname -- "$(readlink -f "$BASH_SOURCE")")"

# resolve the location of the symlinked script for WORK_DIR
WORK_DIR="$( cd "$( dirname -- "$BASH_SOURCE" )" && pwd )"

# get parameter (fe or nc) from the script symlink
if [[ "$BASH_SOURCE" =~ /start-(fe|nc)\.sh$ ]]; then
    MODE="${BASH_REMATCH[1]}"
else
    # otherwise get it from the first argument
    MODE="${1,,}"
    # check if we are running setup
    if [[ "$MODE" =~ ^setup-(fe|nc)$ ]]; then
        setup "${BASH_REMATCH[1]}" "$2"
        exit $?
    fi
    # check if we are starting and set MODE to server type
    if [[ "$MODE" =~ ^start-(fe|nc)$ ]]; then
        MODE="${BASH_REMATCH[1]}"
    fi
fi

# error if no mode is set
if [[ $MODE != "fe" && $MODE != "nc" ]]; then
    echo "Use 'start-fe' or 'start-nc' to start FrontEnd or NumberCruncher"
    echo "Use 'setup-fe' or 'setup-nc' to install to current folder"
    exit 0
fi

# check for start.d script folder
if [[ ! -d "$WORK_DIR/start.d" ]]; then
    echo "No start.d script folder found"
    exit 1
fi

# process start.d scripts
while read CONF; do
    source $CONF
done < <(find "$WORK_DIR/start.d" -type f -name "*.sh")

# if $CCP4_DIR is a symlink, resolve it
CCP4_DIR="$(readlink -f "$CCP4_DIR")"

# check CCP4_DIR is set and source the ccp4.setup-sh
if [[ -n "$CCP4_DIR" && -f "$CCP4_DIR/bin/ccp4.setup-sh" ]]; then
    source "$CCP4_DIR/bin/ccp4.setup-sh"
else
    echo "CCP4_DIR environment variable is not set correctly (Currently: $CCP4_DIR)"
    exit 1
fi

if [[ "$USE_CDEMODATA" -eq 1 ]]; then
    # internal variable for mounting directory with CCP4(i2) demo data
    export CDEMODATA=`ccp4-python -c "import sysconfig; print(sysconfig.get_path('purelib'))"`/ccp4i2/demo_data
fi

# if BUSTER_DIR is set correctly, then source the BUSTER_DIR/setup.sh
[[ -n "$BUSTER_DIR" && -f "$BUSTER_DIR/setup.sh" ]] && source "$BUSTER_DIR/setup.sh"

# if LOG_DIR isn't set, default to WORK_DIR/logs
if [[ -z "$LOG_DIR" ]]; then
    LOG_DIR="$WORK_DIR/logs"
    mkdir -p "$LOG_DIR"
fi

# if CONFIG_DIR (for config.json) isn't set, default to WORK_DIR
if [[ -z "$CONFIG_DIR" ]]; then
    CONFIG_DIR="$WORK_DIR"
fi

CONFIG_JSON="$CONFIG_DIR/config.json"
# check if CONFIG_JSON can be found
if [[ ! -f "$CONFIG_JSON" ]]; then
    echo "No $CONFIG_JSON found"
    exit 1
fi

# set the required server
CMD="js-server/${MODE}_server.js"

if [[ ! -f "$SERVER_DIR/$CMD" ]]; then
    echo "No $CMD found"
    exit 1
fi

# if running from pm2 let pm2 handle logs and don't background
if [[ -n "$PM2_USAGE" ]]; then
    launch_server pm2
else
    launch_server &
fi

exit 0


