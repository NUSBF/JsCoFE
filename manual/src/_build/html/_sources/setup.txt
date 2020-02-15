
====================
General (Server-based) |jsCoFE| Setup
====================

---------------------------------
Understanding |jsCoFE| architecture
---------------------------------

|jsCoFE| includes 3 types of web (http or https) servers:

#. *Front-End Server*
#. *Number Cruncher*
#. *Client-Side Server*

**Front-End Server (FE)**
  This server represent |jsCoFE|'s head node, exposed to end user as a specific
  URL. FE keeps user accounts, projects and data, and is responsible
  for most of data logistics in the system -- but not for actual calculations.

**Number Cruncher (NC)**
  This server represent |jsCoFE|'s compute node, not exposed to end users. NCs
  accept job descriptions and data from FE, conduct the needful calculations and
  push results back to FE.

**Client-side Server (CS)**
  This optional server is a type of NC that runs on client (users) machines
  for starting applications locally (on the client). The main purpose of CS is
  to start interactive (graphical) applications, which cannot be run remotely.
  CS communicates with FE and client's browser.

Each server may be seen as a logical machine, which may share physical
machine with another server, or, in case of NC, correspond to a set of physical
machines such as a computational cluster. Therefore, |jsCoFE| setups may vary
subject to purpose and hardware available. The most obvious configurations
include:

**Desktop Setup**
  All servers: FE+NC+CS, are placed on a single physical machine, e.g. a
  common laptop. All communication is done via ``localhost``, and no connection
  to the Internet is required.

**Single-Node Setup**
  FE and NC share one physical machine or a computational cluster (in which case
  FE should be placed on cluster's head node), and users connect to FE via
  a dedicated URL. CS may be installed on client machines if necessary.

**Multi-Node Setup**
  In this setup, FE(s) and NC(s) are installed on different machines. Every FE
  may be linked to any number of NCs, and every NC may accept jobs from
  any number of FEs. However, every FE will serve as own |jsCoFE| instance for
  the end user, so that user accounts and projects from one FE will not be
  visible on another.

In all cases where a |jsCoFE| setup should be accessible from outer world (i.e.
not only from the machine where |jsCoFE| is installed), it is advisable that all
external communications are done via a "proper" server such as
`Apache <https://httpd.apache.org/download.cgi>`_. This is achieved by
setting |jsCoFE| servers to listen to a particular localhost port number, and
configuring Apache to redirect all requests from chosen URL to that port (see
details below).

--------------------------
Common setup prerequisites
--------------------------

Node JS
~~~~~~~

All |jsCoFE| servers are built on Node JS platform, therefore, make sure that
Node JS is running on all machines, where any of |jsCoFE| servers will be
installed. Run ``node -v`` from the Terminal, and acceptable output will be
something like the following: ::

  $ node -v
  v4.4.3

where ``v4.4.3`` is the lowest acceptable version. If Node JS is not installed,
download and install it (together with the node package manager, ``npm``) from
https://nodejs.org (consider taking an LTS version rather than the current one).
In Linux operating systems, a suitable version of Node JS may be available from
OS repositories. For example, on Ubuntu: ::

  $ sudo apt-get update
  $ sudo apt-get install nodejs
  $ sudo apt-get install npm

On Centos: ::

  $ yum install nodejs

On Fedora: ::

  $ sudo dnf install nodejs
  $ sudo dnf install npm

After installation, verify it by running ``node -v`` and ``npm -v``. If installed
correctly, both commands should report the corresponding version numbers.

|jsCoFE| source code
~~~~~~~~~~~~~~~~~~

Every |jsCoFE| server must have access to the directory with |jsCoFE| source codes.
The code is obtainable from CCP4's Bazaar repositories: ::

  $ bzr checkout http://fg.oisin.rc-harwell.ac.uk/anonscm/bzr/jscofe/trunk /path/to/jscofe

If ``bzr`` is not installed on your system, download and install it from
http://bazaar.canonical.com, or get |jsCoFE| source code from GitLab: ::

  $ git clone https://gitlab.com/CCP4/|jsCoFE|.git


All |jsCoFE| servers: FE, NC and CS, use the same source code, and the source code
directory may be shared by any number and types of servers, if permitted by
the hardware setup. In the absence of shared file system, the source code
directory must be copied to every machine running a |jsCoFE| server. Make sure
that ``.bzr`` (or ``.git``) sub-directory is copied, too, for future updates.

After obtaining |jsCoFE| source code from CCP4 repositories, Node Package Manager
must be run in every source code directory: ::

  $ cd /path/to/jscofe
  $ npm install

In future, |jsCoFE| may be updated simply by updating the content of all source
directories: ::

  $ cd /path/to/jscofe
  $ bzr update
  $ npm install

or, if |jsCoFE| was originally checked out from GutLab: ::

  $ cd /path/to/jscofe
  $ git pull origin master
  $ npm install

and restarting |jsCoFE| servers.

.. _dependencies:

CCP4 Setup and other dependencies
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A fully functional CCP4 Setup must be available for every Number Cruncher and
Client-side Servers, which must run in CCP4-sourced environment. See
http://www.ccp4.ac.uk for CCP4 download and installation instructions.
CCP4 7.0 series needs to be complemented with `Gemmi` library. In order to install
it, type the following command in CCP4 sourced environment (use user account
in which CCP4 was originally installed, and ``sudo`` if necessary): ::

  $ ccp4-python -m pip install git+https://github.com/project-gemmi/gemmi.git

This will also require C++-11 compiler on your system, which can be normally
installed from system's repositories.

The wwPDB Deposition task also requires `oneDep API` for communication with
wwPDB validation report server. Install it with the following command, using
account in which CCP4 was originally installed, and ``sudo`` if necessary: ::

  $ ccp4-python -m pip install onedep_api

Some |jsCoFE| tasks also require access to PDB archive, obtainable from
https://www.wwpdb.org/download/downloads. AMPLE package for ab-initio MR
modelling also requires access to ROSETTA or QUARK software (see
http://www.ccp4.ac.uk/ample/). BALBES software needs a special database
installed (may be installed by
`CCP4 Package Manager <http://www.ccp4.ac.uk/downloads>`_). GESAMT software
needs access to *gesamt archive*, which is prepared from the PDB archive.
Having both CCP4 and PDB installed, run the following command (will take a
few hours): ::

  $ gesamt --make-archive /path/to/gesamt-archive -pdb /path/to/pdb-archive

where ``/path/to/gesamt-archive`` must exist. Run ``gesamt`` without
parameters for detail instructions and further options.

Web-server(s) for external communications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A convenient way to make |jsCoFE| servers to see each other and the Front End to
be visible from client machines, is to arrange for redirection of relevant http(s)
requests to localhost ports that jsCofe servers are configured to listen.
There may be several technical solutions for this part, which should be discussed
with Institute's IT support. Below we give a guidance for setting |jsCoFE| with
Apache server(s):

#. Install Apache on each machine where |jsCoFE| server(s) will be running. For
   doing this, consult either your Operating System documentation (Apache is
   commonly acceptable on UNIX platforms from systems repositories), or
   `Apache web-site <https://httpd.apache.org/download.cgi>`_.

#. Put the following file, named ``jscofe.conf``, in ``/etc/apache2/sites-enabled/``
   and ``/etc/apache2/sites-available``: ::

     <Proxy http://127.0.0.1:8081/*>
       Allow from all
     </Proxy>

     ProxyRequests Off
     ProxyPass /jscofe http://localhost:8081
     SetOutputFilter INFLATE;proxy-html;DEFLATE
     ProxyHTMLURLMap http://localhost:8081 /jscofe
     LogLevel Info
     ProxyPassReverse /jscofe http://localhost:8081

   Here, ``8081`` stands for the port number specified in |jsCoFE| configuration
   file (see below), and should be chosen from a set of free port numbers in the
   system.

#. Restart Apache. All requests from ``http(s)://www.my.server.com/jscofe/``
   should now be redirected to |jsCoFE| server listening port number ``8081``.

#.  Note that if a machine hosts several |jsCoFE| servers, each of them
    must listen to its own dedicated port on localhost, and the corresponding
    configuration files, each one with a unique URL path (*e.g.* ``/jscofe1``,
    ``/jscofe2`` *etc.*) must be all placed in ``/etc/apache2/sites-enabled``
    and ``/etc/apache2/sites-available`` directories.


--------------------
|jsCoFE| Configuration
--------------------

Before |jsCoFE| servers may be started, they must be configured using a special
Configuration File (CF) in `JSON format <http://www.json.org>`_. All servers in
given |jsCoFE| setup may use the same CF, however, for security reasons, you may
wish to use CF copies for individual servers, where unused configuration details
are altered or removed. For example, FE must have URLs of all NCs, but does not
need details of their file systems; similarly, and NC does not need to know
anything about FE or other NCs in the system.

The Configuration File has the following structure: ::

  {

    "_comment"  : [
      "This is a non-mandatory part of Configuration File, to be used",
      "only for placing annotation remarks"
    ],

    "Desktop"  : { ... Desktop configuration module ... },

    "FrontEnd" : { ... FE configuration module ... },

    "NumberCrunchers" : [
      { ... NC(1) configuration module ... },
      { ... NC(2) configuration module ... },
      .....................................
      { ... NC(n) configuration module ... }
    ],

    "Emailer" : { ... E-mailer configuration module ... }

  }

The Desktop Configuration Module is needed only for Desktop setups (*cf.*
:doc:`desktop`), when all |jsCoFE| servers run on the same machine, and may be
omitted in all other cases.

Configuration file for FE must include ``FrontEnd`` module, configuration modules
for all NCs, and E-mailer configuration. Configuration file for an NC must
contain only configuration for that NC and E-mailer configuration: ::

  {

    "_comment"  : [
      "Minimal Configuration File for a Number Cruncher Server"
    ],

    "NumberCrunchers" : [
      { ... NC configuration module ... }
    ],

    "Emailer" : { ... E-mailer configuration module ... }

  }

Yet, full configuration file may be used for all FE, NCs and CS, if that is
easier for any reason.

Consider configuration modules in more detail.


Front-End Configuration Module
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The FE Configuration Module represents the following JSON object: ::

  {
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8081,
    "externalURL"      : "http://www.my.server.com/jscofe",
    "exclusive"        : true,
    "stoppable"        : false,
    "exclude_tasks"    : ["TaskAmple"],
    "fsmount"          : "",
    "userDataPath"     : "./cofe-users",
    "projectsPath"     : "./cofe-projects",
    "facilitiesPath"   : "./cofe-facilities",
    "ICAT_wdsl"        : "https://icat02.diamond.ac.uk/ICATService/ICAT?wsdl",
    "ICAT_ids"         : "https://ids01.diamond.ac.uk/ids",
    "bootstrapHTML"    : "jscofe.html",
    "maxRestarts"      : 100,
    "fileCapSize"      : 500000
    "regMode"          : "admin",
    "sessionCheckPeriod" : 2000,
    "ration"           : {
        "storage"   : 3000,
        "cpu_day"   : 24,
        "cpu_month" : 240
    },
    "cloud_mounts"     : {
      "My Computer"    : "/",
      "Home"           : ["$HOME","$USERPROFILE"],
      "CCP4 examples"  : "$CCP4/share/ccp4i2/demo_data",
      "Demo projects"  : "./demo-projects"
    }
  }


**protocol**
  Communication protocol (``http`` or ``https``) for the front-end Node JS to
  use. A typical setup (see above) assumes that Node JS is running under
  ``localhost``, not accessible from the outer world, and only accepting
  redirections from a "proper" server such as Apache. In this case, the protocol
  should be set to ``http``.

**host**
  Web host name for the front-end Node JS to use. With the above remark,
  it will be ``localhost`` in most cases.

**port**
  Port number for the front-end Node JS to use. Avoid using standard ports
  such as 8080. If in doubts, run ::

    $ cd /path/to/jscofe
    $ node ./assign_ports.js conf.desktop.json config_ports.json

  where ``conf.desktop.json`` is |jsCoFE| Desktop configuration file (*cf.*
  :doc:`desktop`). This will print ports available and substitute them in
  ``conf.desktop.json``, writing the result in ``config_ports.json``. Note that
  the port chosen should be duly adjusted in Apache configuration (*cf* above).

  If port number is set to 0, it will be changed automatically for the number of
  one of free ports. While this is convenient for Desktop setups, this option
  should not be used if access to |jsCoFE| front-end server through a stable URL
  is required.

**externalURL**
  External URL under which the front-end Node JS is visible to the outer world
  and/or other |jsCoFE| servers. For the example of Apache setup given above,
  ``externalURL`` should be set as indicated.

  If external URL is set to empty string ``""``, it will be changed automatically
  for one made of given protocol, host and port number. While this is
  convenient for Desktop setups, this option should not be used if access to
  |jsCoFE| front-end server through a stable URL is required.

**exclusive**
  Specifies whether the port is in exclusive use of |jsCoFE| front-end server.
  There should be little need to set it to anything but ``true``.

**stoppable**
  Specifies whether |jsCoFE| front-end server should quit if a user logs off.
  This is a special option that may be used in individual Desktop setups, but
  in general it should be set to ``false``.

**fsmount**
  Specifies file system mount common for all |jsCoFE| servers, if such mount
  exists. This is an experimental option, allowing to avoid passing excessively
  large data volumes between the servers, currently not in use and should be
  always set to ``""``.

**userDataPath**
  Path to directory to keep users' data. The directory must exist before starting
  the front-end server. Both the relative (starting with ``./``) and absolute
  (starting with slash ``/``) paths may be given. Relative paths are calculated
  in respect to jscofe directory on the front-end server.

**projectsPath**
  Path to directory to keep user projects. The directory must exist before starting
  the front-end server. Both the relative (starting with ``./``) and absolute
  (starting with slash ``/``) paths may be given. Relative paths are calculated
  in respect to |jsCoFE| source code directory on the front-end server.

**facilitiesPath**
  Path to directory for caching data obtained from data producing facilities such
  as synchrotrons. The directory must exist before starting the front-end server.
  Both the relative (starting with ``./``) and absolute (starting with slash ``/``)
  paths may be given. Relative paths are calculated in respect to |jsCoFE| source
  code directory on the front-end server.

**ICAT_wdsl**
  URL to ICAT's WDSL catalogue (used to obtain data from ICAT).

**ICAT_ids**
  URL to ICAT's IDS data storage (used to obtain data from ICAT).

**bootstrapHTML**
  Relative path to |jsCoFE| bootstrap file, which is ``jscofe.html`` in the root
  of the |jsCoFE| source code directory. There is little need to move or rename
  this file.

**maxRestarts**
  Maximum number of server auto-restarts allowed (used to recover after errors
  and exceptions). If "-1" is given, auto-restarts will not be limited.

**fileCapSize**
  Size limit on particular type of files (such as log files) sent to client
  while job is running. If a file exceeds the cap size, it will be truncated
  in the middle with the corresponding message issued in client's browser.
  This configuration should be used in order to decrease the bandwidth
  requirements of |jsCoFE| setups. Note that the cap is not applied if job has
  finished.

.. _nc-config:

Configuration Module for Number Cruncher
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The NC Configuration Module represents the following JSON object: ::

  {
    "serNo"            : 0,
    "name"             : "local-nc",
    "in_use"           : true,
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8082,
    "externalURL"      : "http://www.nc0.server.com/jscofe",
    "exclusive"        : true,
    "stoppable"        : false,
    "fsmount"          : "/",
    "capacity"         : 4,
    "exclude_tasks"    : [],
    "fasttrack"        : 1,
    "storage"          : "./cofe-nc-storage",
    "jobs_safe"        : {
        "path"     : "./cofe-nc-storage/jobs_safe",
        "capacity" : 10
    },
    "exeType"          : "SHELL",
    "exeData"          : "",
    "jobCheckPeriod"   : 2000,
    "sendDataWaitTime" : 1000,
    "maxSendTrials"    : 10,
    "jobRemoveTimeout" : 10000,
    "maxRestarts"      : 100,
    "fileCapSize"      : 500000
  }

**serNo**
  Serial number of NC. All NCs in given Configuration File should be assigned
  sequential serial numbers starting from 0.

**name**
  NC's name to be displayed in relevant |jsCoFE|'s messages to user and log files.
  Any character string may be used as NC's name.

**in_use**
  Indicates whether NC is used by FE or not. This parameter helps to switch
  individual NCs on or off without excessive editing of the Configuration File.

**protocol**
  Communication protocol (``http`` or ``https``) for the NC's
  Node JS to use. A typical setup (see above) assumes that Node JS is running
  under ``localhost``, not accessible from the outer world, and only accepting
  redirections from a "proper" server such as Apache. In this case, the protocol
  should be set to ``http``.

**host**
  Web host name for the NC's Node JS to use. With the above remark,
  it will be ``localhost`` in most cases.

**port**
  Port number for the NC's Node JS to use. Avoid using standard
  ports such as 8080. If in doubts, run ::

    $ cd /path/to/jscofe
    $ node ./assign_ports.js conf.desktop.json config_ports.json

  where ``conf.desktop.json`` is |jsCoFE| Desktop configuration file (*cf.*
  :doc:`desktop`). This will print ports available and substitute them in
  ``conf.desktop.json``, writing the result in ``config_ports.json``. Note that
  the port chosen should be duly adjusted in Apache configuration (*cf* above).

  If port number is set to 0, it will be changed automatically for the number of
  one of free ports. While this is convenient for Desktop setups, this option
  should not be used if access to |jsCoFE|'s NC server through a stable
  URL is required.

**externalURL**
  External URL under which the NC's Node JS is visible to the outer
  world and/or other |jsCoFE| servers. For the example of Apache setup given above,
  ``externalURL`` should be set as indicated (save for difference in the URL).

  If external URL is set to empty string ``""``, it will be changed automatically
  for one made of given protocol, host and port number. While this is
  convenient for Desktop setups, this option should not be used if access to
  |jsCoFE|'s NC server through a stable URL is required.

**exclusive**
  Specifies whether the port is in exclusive use of |jsCoFE| NC server.
  There should be little need to set it to anything but ``true``.

**stoppable**
  Specifies whether |jsCoFE|'s NC server should quit if a user logs off.
  This is a special option that may be used in individual Desktop setups, but
  in general it should be set to ``false``.

**fsmount**
  Specifies file system mount common for all |jsCoFE| servers, if such mount
  exists. This is an experimental option, allowing to avoid passing excessively
  large data volumes between the servers, currently not in use and should be
  always set to ``""``.

**capacity**
  NC's computational capacity. |jsCoFE| monitors NC workload and
  tries to dispatch jobs such that all NCs are loaded uniformly. Capacity scores
  may require an adjustment, use number of CPUs in 1st approximation.

**exclude_tasks**
  List of tasks that must not be sent to the server. The tasks are identified by
  class task names as it is entered in the corresponding *.js and *.py files,
  *e.g.,* ``TaskAmple``, ``TaskSimbad`` and similar. This option should be used
  to filter out tasks that require custom setup or particular resources not
  available on given server.

**fasttrack**
  Key indicating whether *fast track* tasks may be sent to the server. Some
  tasks in |jsCoFE|, such as data import, may be flagged *fasttrack*, in which
  case they are executed immediately, without queuing either in |jsCoFE| or in
  local job dispatchers like SGE. Set ``1`` to indicate that the server will
  accept *fast track* jobs, and ``0`` otherwise. Note that if there are no
  NCs in the setup that are flagged for *fast track*, |jsCoFE| will choose
  NC for *fast track* jobs randomly and force *fasttrack* mode of execution.

**storage**
  Path to directory to host temporary working directories for running jobs.
  The directory must exist before starting the NC server. Both
  the relative (starting with ``./``) and absolute (starting with slash ``/``)
  paths may be used. Relative paths are calculated in respect to |jsCoFE| source
  code directory on the NC.

**exeType**
  Type of NC. Available options include

  * ``SHELL``. This type of NC corresponds to a plain machine that launches jobs
    via a shell command. This option is convenient for NC servers made of
    ordinary desktop PCs.
  * ``SGE``. This type of NC corresponds to a CPU cluster running
    `Sun Grid Engine <http://star.mit.edu/cluster/docs/0.93.3/guides/sge.html>`_
    for dispatching jobs. In this case, NC server should be run on cluster's
    head node or any other machine that can issue SGE instructions for the
    cluster.
  * ``CLIENT``. This is a version of ``SHELL`` type, intended to run specifically
    on user's machine. This NC is used only for certain running interactive jobs
    locally on the client machine. The corresponding job task must have the
    ``client`` flag to be dispatched by the Front End to client machine for
    execution.


**exeData**
  Any sort of data to be passed to NC for job launching. In case of ``SGE``,
  this may be something like ``["-cwd","-V","-b","y","-q","all.q","-notify"]``,
  which is a list of parameters to be included in ``bsub`` or ``qsub`` command.

**jobCheckPeriod**
  Time period, in milliseconds, for NC to check the status of running jobs.
  Setting a period that is too short may result in excessive CPU overhead,
  too long a period may have negative impact on user's experience by delivering
  results with a noticeable delay.

**sendDataWaitTime**
  Time period, in milliseconds, for NC to repeat sending job data back to the
  Front End server, if previous attempt has failed for any reason.

**maxSendTrials**
  The maximum number of attempts to send job data to the Front End server, that
  NC is allowed to make. If last attempt is not successful, connection error is
  issued to the user.

**jobRemoveTimeout**
  Time period, in milliseconds, for NC to delete job director after the the job
  has finished and all job data was delivered to the Front End server, or all
  delivery attempts have failed.

**maxRestarts**
  Maximum number of server auto-restarts allowed (used to recover after errors
  and exceptions). If "-1" is given, auto-restarts will not be limited.

**fileCapSize**
  Size limit on particular type of files (such as log files) sent to front end
  while job is running. If a file exceeds the cap size, it will be truncated
  in the middle with the corresponding message issued in client's browser.
  This configuration should be used in order to decrease the bandwidth
  requirements of |jsCoFE| setups. Note that the cap is not applied if job has
  finished.


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Configuration Module for |jsCoFE|'s E-mailer
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

|jsCoFE| send e-mails to users upon registration or changing details of their
accounts (such as passwords), or resetting their accounts in case of lost
password. |jsCoFE| also sends e-mails to the setup maintainer in case of
functional errors such as failure to write or read a file.

|jsCoFE| may send e-mails using either Node JS own facilities (*nodemailer*) or
*telnet* to the dedicated mail server, which should be installed separately.

Configuration module for *nodemailer* has the following description: ::

  {
    "type"               : "nodemailer",
    "emailFrom"          : "My Name <my.name@gmail.com>",
    "maintainerEmail"    : "my.name@gmail.com",
    "host"               : "smtp.gmail.com",
    "port"               : 465,
    "secure"             : true,
    "auth"               : {
      "user" : "my.name@gmail.com",
      "pass" : "***"
    }
  }

where all fields are filled with data for a fictitious *Gmail* account
``my.name@gmail.com``. Note that a real password should be given in ``pass``
field. Any other e-mail provider, supporting SMTP protocol, may be used --
consult provider's web-pages for smtp server URL and port number.

If using external provider is not desirable, a dedicated mail server should
be used, in which case the configuration module takes the following form: ::

  {
    "type"            : "telnet",
    "emailFrom"       : "my.name@my.address.com",
    "maintainerEmail" : "my.name@my.address.com",
    "host"            : "mail.server.com",
    "port"            : 25,
    "headerFrom"      : "|jsCoFE| <jscofe@mail.server.com>"
  }

Please contact your IT support for mail server URL and port number(s).

Finally, if |jsCoFE| is installed on a Desktop PC exclusively for local use, then
e-mail facility may be conveniently replaced with issuing the corresponding
messages directly to user via the web-browser. In this case, |jsCoFE|'s e-mailer
should be configured as follows: ::

  { "type" : "desktop" }


--------------------
|jsCoFE| start scripts
--------------------

|jsCoFE| setup is concluded by writing start scripts for all servers. Below we
give sample scripts that should be suitable in most, if not all, cases.

Start script for the Front End Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
::

  #!/bin/bash

  server_dir=/path/to/jscofe
  killall node
  cd $server_dir

  node ./fe_server.js /path/to/jscofe_config.json > /logdir/node_fe.log 2> /logdir/node_fe.err &

Here, ``/path/to/jscofe`` is |jsCoFE| source code directory,
``/path/to/jscofe_config.json`` is path to |jsCoFE| Configuration File,
and ``logdir`` is directory to host |jsCoFE|'s log files.


Start script for a Number Cruncher Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
::

  #!/bin/bash

  server_dir=/path/to/jscofe
  ccp4_dir=/path/to/ccp4
  serNo="0"

  source $ccp4_dir/bin/ccp4.setup-sh
  export BALBES_ROOT=/path/to/BALBES
  export PDB_DIR=/path/to/pdb
  export GESAMT_ARCHIVE=/path/to/gesamt_archive
  export JSPISA_CFG=$CCP4/share/pisa/jspisa.cfg

  killall node

  cd $server_dir

  node ./nc_server.js /path/to/jscofe_config.json $serNo > \
                    /logdir/node_nc_$serNo.log 2> /logdir/node_nc_$serNo.err &

Here, ``serNo`` stands for the NC serial number as in |jsCoFE| Configuration File
(*cf.* :ref:`nc-config`), ``/path/to`` variables point to CCP4 setup, BALBES
database, directory with PDB files and Gesamt archive (*cf.* :ref:`dependencies`);
``/path/to/jscofe_config.json`` is path to |jsCoFE| Configuration File,
and ``logdir`` is directory chosen to host |jsCoFE|'s log files.

The ``killall node`` statement is for stopping node instances that may remain
residual from previous starts of |jsCoFE|. This line should be removed in case
when NC is configured to run on the same machine as FE, otherwise node instance
that runs FE server, will be also killed.


Start script for a Client Number Cruncher
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Client Number Cruncher uses only standard CCP4 release, therefore the start
script may be simplified as follows: ::

  #!/bin/bash

  server_dir=/path/to/jscofe
  ccp4_dir=/path/to/ccp4
  serNo="0"

  source $ccp4_dir/bin/ccp4.setup-sh

  killall node

  cd $server_dir

  node ./nc_server.js /path/to/jscofe_config.json $serNo > \
                    /logdir/node_nc_$serNo.log 2> /logdir/node_nc_$serNo.err &


---------------
Starting |jsCoFE|
---------------

|jsCoFE| is started by invoking start scripts on the front-end machine and all
number crunchers.

If a user has local |jsCoFE| setup, they may start the client number cruncher first
and then connect to FE via FE's external url with command ``/?lsp=XXXX``, where
``XXXX`` stands for the client server port number (as specified in client server
configuration file). For example, on Linux: ::

  $ firefox http://www.my.server.com/jscofe/?lsp=53540

if ``53540`` is the CS port number.
