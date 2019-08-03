
===========================
Automated Installation
===========================

1. Automated Installation

Automated setup of |jsCoFE| is as easy as “download-and-run”. Automatically
installed |jsCoFE| may work in two modes: ``local`` and ``remote``. In ``local``
mode, |jsCoFE| runs on computer where it was installed, and no internet
connection is required apart from accessing PDB web-site for downloading PDB
entries and acquisition of PDB Validation Report. In the ``remote`` mode, tasks
will run on CCP4 web-server, with the exception of interactive graphics (e.g.,
``Coot``) and data processing (``Xia-2``). In either mode, |jsCoFE| runs in
a browser and has identical appearance and functionality.

The installation procedure is as follows.


------
Linux:
------

~~~~~~~~~~~~
Install CCP4
~~~~~~~~~~~~

#. Navigate to http://www.ccp4.ac.uk/download.
#. Download, unarchive and launch ``CCP4 Package Manager``, and follow the default procedure except for:
  * In the component page, select ``MoRDa``, which is initially unselected.
  * In the bottom left corner of the ``Choose Location`` page, check
    "modify global environment ..."

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Download |jsCoFE| package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Download
`ccp4cloud_lin64.tar.gz <http://ccp4serv7.rc-harwell.ac.uk/jscofe-alpha/downloads/ccp4cloud_lin64.tar.gz>`_.

~~~~~~~~~~~~~~~~
Install |jsCoFE|
~~~~~~~~~~~~~~~~

In the example below, ``ccp4cloud_lin64.tar.gz`` has been downloaded into
``~/Download`` directory and |jsCoFE| is being installed in
``~/ccp4cloud`` (where ``~`` stands for user's home directory): ::

  $ cd
  $ tar -xzf ~/Downloads/ccp4cloud_lin64.tar.gz
  $ ccp4cloud/SETUP.sh

If path to ``ccp4-7.0`` is not defined in shell initialisation script,
``SETUP.sh`` will complain that it cannot find it. Assuming that the path is
``/usr/opt/ccp4-7.0``, the following command will do the job: ::

  $ ccp4cloud/SETUP.sh /usr/opt/ccp4-7.0

To change |jsCoFE| storage directory from the default ``~/jscofe_storage`` to,
e.g., ``~/jscofe_test`` and default web-browser from ``Firefox`` to ``Opera``,
run ``ccp4cloud.sh`` in configuration mode: ::

  $ ccp4cloud/bin/ccp4cloud.sh config -b opera -d jscofe_test

|jsCoFE| alpha will not announce updates. Therefore it will be useful to run the
following command time from time: ::

  $ ~/ccp4cloud/UPDATE.sh


~~~~~~~~~~~~~~~~~
Desktop shortcuts
~~~~~~~~~~~~~~~~~

Successful installation should result in ``local`` (with airplane sign) and
``remote`` (WiFi sign) |jsCoFE| icons placed inside the installation folder.
Navigate to the installation folder using file browser and drag the icons to
the Desktop. Current icons may be unsuitable for latest Linuxes (e.g.
``Fedora 29``), or may require the execution permissions to be set manually,
through the context menu (e.g. ``Ubuntu 16``). In the former case, |jsCoFE|
can still be launched from the command line using one of the following
commands: ::

  $ /path/to/ccp4cloud/bin/ccp4cloud-desktop.sh
  $ /path/to/ccp4cloud/bin/ccp4cloud-remote.sh


---------
Mac OS X:
---------

~~~~~~~~~~~~
Install CCP4
~~~~~~~~~~~~

#. Navigate to http://www.ccp4.ac.uk/download.
#. Download and open the disk image with ``CCP4 Package Manager``; launch ``Package Manager`` and follow the default procedure except for:
  * In the component page, select ``MoRDa``, which is initially unselected.
  * In the bottom left corner of ``Choose Location`` page, check
  "modify global environment ..."

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Download |jsCoFE| package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Download
`ccp4cloud_osx64.tar.gz <http://ccp4serv7.rc-harwell.ac.uk/jscofe-alpha/downloads/ccp4cloud_osx64.tar.gz>`_.


~~~~~~~~~~~~~~~~
Install |jsCoFE|
~~~~~~~~~~~~~~~~

In the example below, ``ccp4cloud_osx64.tar.gz`` has been downloaded into
``~/Download`` directory and |jsCoFE| is being installed in
``~/Applications/ccp4cloud`` (where ``~`` stands for user's home directory): ::

  $ cd ~/Applications
  $ tar -xzf ~/Downloads/ccp4cloud_osx64.tar.gz
  $ ccp4cloud/SETUP.sh

If path to ``ccp4-7.0`` is not defined in shell initialisation script,
``SETUP.sh`` will complain that it cannot find it. Assuming that the path is
``/Applications/ccp4-7.0``, the following command will do the job: ::

  $ ccp4cloud/SETUP.sh /Applications/ccp4-7.0

To change |jsCoFE| storage directory from the default ``~/jscofe_storage`` to,
e.g., ``~/jscofe_test`` and default web-browser from ``Safari`` to ``Opera``,
run ``ccp4cloud.sh`` in configuration mode: ::

  $ ccp4cloud/bin/ccp4cloud.sh config -b opera -d jscofe_test

|jsCoFE| alpha will not announce updates. Therefore it will be useful to run the
following command time from time: ::

  $ ~/Applications/ccp4cloud/UPDATE.sh


~~~~~~~~~~~~~~~~~
Desktop shortcuts
~~~~~~~~~~~~~~~~~

Successful installation should result in ``local`` (with airplane sign) and
``remote`` (WiFi sign) |jsCoFE| icons placed inside the installation folder.
Navigate to the installation folder using file browser and drag the icons to
system's Dock. Usually, system's security does not allow to run applications
downloaded from the internet from first attempt. In order to bypass this problem,
right-click on |jsCoFE| icon and choose ``Open`` from the context menu. This
needs to be done only once for every icon.


--------
Windows:
--------

~~~~~~~~~~~~
Install CCP4
~~~~~~~~~~~~

#. Navigate to http://www.ccp4.ac.uk/download.
#. Download and run ``CCP4 Installer``.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Download |jsCoFE| package
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Download
`ccp4cloud_win64.exe <http://ccp4serv7.rc-harwell.ac.uk/jscofe-alpha/downloads/ccp4cloud_win64.exe>`_.


~~~~~~~~~~~~~~~~
Install |jsCoFE|
~~~~~~~~~~~~~~~~

* launch ``ccp4cloud_win64.exe`` in ``Downloads`` folder
* the installer has sensible defaults for storage directory and features and there is no need to change them.

~~~~~~~~~~~~~~~~~
Desktop shortcuts
~~~~~~~~~~~~~~~~~

Successful installation should result in ``local`` (with airplane sign) and
``remote`` (WiFi sign) |jsCoFE| icons on your desktop. You are ready to use
|jsCoFE| -- simply click on the respective icon.
