cmake_minimum_required(VERSION 2.8)
project(jscofe)

find_program(
  NPM
  NAMES npm.cmd npm
  HINTS
    ${CMAKE_INSTALL_PREFIX}/nodejs
    ${CMAKE_INSTALL_PREFIX}/bin
  NO_DEFAULT_PATH
)

add_custom_target(
  NODE_MODULES
  ALL ${NPM} install
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)

add_custom_target(
  COFE_BROWSER
  ALL ${NPM} install
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/cofe-browser
)

find_program(
  PYTHON
  NAMES ccp4-python
  HINTS ${CMAKE_INSTALL_PREFIX}/bin
  NO_DEFAULT_PATH
)

add_custom_target(
  CONFIG_DIR
  ALL ${PYTHON} config/filter.py
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
)

install(DIRECTORY
    bootstrap
    cofe-browser
    css
    html
    images_com
    images_png
    js-client
    js-common
    js-lib
    js-server
    js-utils
    manuals
    message_templates
    workflow_scripts
    node_modules
    pycofe
    conf
  DESTINATION
    share/jscofe
  USE_SOURCE_PERMISSIONS
)

install(
  FILES
    package.json
  DESTINATION
    share/jscofe
)

if(APPLE)
  set(
    FWDIR ${CMAKE_SOURCE_DIR}/cofe-browser/node_modules/
  )
  string(
    APPEND
    FWDIR electron/dist/Electron.app/Contents/Frameworks
  )
  foreach(
    FWNAME
      "Electron Framework"
      Mantle
      ReactiveObjC
      Squirrel
  )
    add_custom_target(
      ${FWNAME} ALL
        ln -sf Versions/A/* .
      DEPENDS
        COFE_BROWSER
        NODE_MODULES
      WORKING_DIRECTORY
        ${FWDIR}/${FWNAME}.framework
    )
  endforeach()
endif()

