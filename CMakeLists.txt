cmake_minimum_required(VERSION 2.8)

if(APPLE)
  project(jscofe C CXX)
else()
  project(jscofe)
endif()

if(WIN32)
  find_program(NPM NAMES npm.cmd HINTS ${CMAKE_INSTALL_PREFIX}/nodejs NO_DEFAULT_PATH)
else()
  find_program(NPM NAMES npm HINTS ${CMAKE_INSTALL_PREFIX}/bin NO_DEFAULT_PATH)
endif()

add_custom_target(NODE_MODULES ALL ${NPM} install WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})

find_program(PYTHON NAMES ccp4-python HINTS ${CMAKE_INSTALL_PREFIX}/bin NO_DEFAULT_PATH)
add_custom_target(CONFIG_DIR ALL ${PYTHON} pycofe/setup/config.py WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})

install(DIRECTORY
    bootstrap
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
  DESTINATION
    share/jscofe
  USE_SOURCE_PERMISSIONS
)

install(
  FILES
    w_conf.desktop.json
    w_conf.remote.json
    package.json
  DESTINATION
    share/jscofe
)

if(APPLE)
  EXEC_PROGRAM(uname ARGS -v  OUTPUT_VARIABLE DARWIN_VERSION)
  STRING(REGEX MATCH "[0-9]+" DARWIN_VERSION ${DARWIN_VERSION})
  MESSAGE(STATUS "DARWIN_VERSION=${DARWIN_VERSION}")
  IF(DARWIN_VERSION LESS 10)
    INCLUDE_DIRECTORIES (/Developer/Headers/FlatCarbon)
  ENDIF(DARWIN_VERSION LESS 10)
  find_library(CARBON_LIBRARY Carbon)
  find_library(COREFOUNDATION_LIBRARY CoreFoundation)
  mark_as_advanced(CARBON_LIBRARY)

  function(appfolder SUFFIX)
    set(APP_NAME ccp4cloud-${SUFFIX})
    set(ICON_FILE_NAME ccp4cloud_${SUFFIX}.icns)
    set(ICON_FILE_PATH ../../images_com/${ICON_FILE_NAME})

    set(MACOSX_BUNDLE_ICON_FILE ${ICON_FILE_NAME} PARENT_SCOPE)
    set(MACOSX_BUNDLE_SHORT_VERSION_STRING 1.0.0 PARENT_SCOPE)
    set(MACOSX_BUNDLE_VERSION 1.0 PARENT_SCOPE)
    set(MACOSX_BUNDLE_LONG_VERSION_STRING Version 1.0.0 PARENT_SCOPE)
    set(MACOSX_BUNDLE_BUNDLE_NAME ${APP_NAME} PARENT_SCOPE)

    set_source_files_properties(${ICON_FILE_PATH} PROPERTIES MACOSX_PACKAGE_LOCATION Resources)
    add_executable(${APP_NAME} MACOSX_BUNDLE ../appfolder.cc ${ICON_FILE_PATH})
    target_link_libraries(${APP_NAME} ${COREFOUNDATION_LIBRARY})
    install(TARGETS ${APP_NAME} DESTINATION .)
    install(CODE "
      include(BundleUtilities)
      set(BU_CHMOD_BUNDLE_ITEMS 1) # needed for libssl
      fixup_bundle(\"\$ENV{DESTDIR}${CMAKE_INSTALL_PREFIX}/${APP_NAME}.app\" \"\" \"\")
    ")
  endfunction(appfolder)

  add_subdirectory(macosx/desktop)
  add_subdirectory(macosx/remote)
  add_subdirectory(macosx/config)
endif()
