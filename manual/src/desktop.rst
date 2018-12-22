
===========================
Manual Setup of |jsCoFE| Desktop
===========================

|jsCoFE| provides a nearly out-of-box solution for installation as a desktop
application.

#. *Install Node JS*
#. *Install CCP4*
#. *Checkout |jsCoFE| source code directory*
#. *Install Node JS modules*
#. *Adjust the desktop configuration file*
#. *Adjust the start shell script*
#. *Start |jsCoFE|.*
#. *|jsCoFE| client.*

**1. Install Node JS**
  The minimum required Node JS version is 4.4.3. Check if you have it on your
  system already. In Terminal, type `node -v`, and if Node JS is installed then
  the result will be similar to ::

    $ node -v
    v4.4.3

  Otherwise, download and install Node JS together with the Node Package Manager,
  ``npm``, from https://nodejs.org (consider taking an LTS version rather than
  the current one). In Linux operating systems, a suitable version of Node JS
  may be available from OS repositories. For example, on Ubuntu: ::

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

**2. Install CCP4**
  Download and install CCP4 from http://www.ccp4.ac.uk/download. Make sure that
  you download ``MoRDa`` database and link it to ``morda`` pipeline.

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


**3. Checkout CCP4 Cloud source code directory**
  The source code is obtainable from CCP4's Bazaar repositories: ::

    $ bzr checkout http://fg.oisin.rc-harwell.ac.uk/anonscm/bzr/jscofe/trunk /path/to/jscofe

  (if ``bzr`` is not installed on your system, download and install it from
  http://bazaar.canonical.com . On Linux, you may find ``bzr`` available from
  OS repositories).

  Alternatively, check out |jsCoFE| source code from GitLab: ::

    $ git clone https://gitlab.com/CCP4/|jsCoFE|.git


**4. Install Node JS modules**
  Run the Node Package Manager in the source code directory: ::

    $ cd /path/to/jscofe
    $ npm install

  In future, |jsCoFE| may be updated as following: ::

    $ cd /path/to/jscofe
    $ bzr update
    $ npm install

  or, if |jsCoFE| was originally checked out from GutLab: ::

      $ cd /path/to/jscofe
      $ git pull origin master
      $ npm install


**5. Adjust the desktop configuration file**
  Type the following in the Terminal: ::

    $ cd /path/to/jscofe
    $ vi config/conf.desktop.json

  (you may use any text editor of your choice). In the file, find and edit
  the following lines: ::

    "userDataPath" : "./cofe-users",
    "projectsPath" : "./cofe-projects",
    "storage"      : "./cofe-nc-storage",
    "storage"      : "./cofe-client-storage",

  These configuration lines refer to directories for keeping user data,
  user projects, temporary storage for non-interactive and interactive (like
  Coot) jobs, respectively. Either absolute or relative (to jscofe source code
  directory) paths and any names can be used, and the corresponding directories
  *must exist and be writable in the account that will run |jsCoFE|*. Expect large
  amounts of data (from tens of gigabytes to terabytes) in the projects directory.

  Then, specify your preferable browser in the following line: ::

    "args" : ["-c","open -a Firefox $feURL$clientURL"]

  The above line starts Firefox browser in Mac OSX. In Linux, you could use ::

    "args" : ["-c","firefox $feURL$clientURL"]

  Finally, configure |jsCoFE|'s e-mailer. This configuration is found in the end
  of configuration file, and initially should look like the following: ::

    "Emailer" : {
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

  If you can use GMail for this purpose, simply put your data (*my.name*) and
  password in the configuration. If you prefer to use another SMTP server,
  you will also need to adjust urls and port number.

  |jsCoFE| can also send e-mails via telnet, in which case the configuration
  should be replaced for the following template: ::

    "Emailer" : {
      "type"            : "telnet",
      "emailFrom"       : "my.name@my.server.uk",
      "maintainerEmail" : "maintainer.name@maintainer.address.uk",
      "host"            : "telnet.host.server.uk",
      "port"            : 25,
      "headerFrom"      : "My Name <my.name@my.server.uk>"
    }

  |jsCoFE| will run even with a misconfigured e-mailer. The only important effect
  will be then that, upon creation of user account, the temporary password is
  printed in standard output rather than e-mailed to user.

  You may find it more convenient in desktop setup, if |jsCoFE| does not send any
  e-mails and, instead, presents message boxes with same content. Then, e-mailer
  configuration may be reduced to ::

    "Emailer" : {
      "type" : "desktop"
    }

**6. Adjust the start shell script**
  Type the following in the Terminal: ::

    $ cd /path/to/jscofe
    $ vi ./start-desktop.sh

  In the file, assign correct paths to variables ``server_dir`` (the |jsCoFE| source
  directory) and ``ccp4_dir`` (CCP4 setup directory). It is useful to have PDB
  archive installed locally, in which case assign its path to ``pdb_dir``.
  ``gesamt_dir`` may specify path to GESAMT archive for fast structural queries.
  Run ``gesamt`` without parameters in CCP4-sourced environment in order to get
  instructions on generating GESAMT archive from the PDB archive installed.

**7. Start |jsCoFE|.**
  In Terminal, type::

    $ /path/to/jscofe/start-desktop.sh

  Note that you can copy the ``start-desktop.sh`` script to any other location
  and start |jsCoFE| from there.


**8. |jsCoFE| client.**
  |jsCoFE| client is used for running special CCP4 desktop applications, like Coot,
  CCP4mg and ViewHKL, while working with |jsCoFE| installed remotely (not on a
  local host). You may need to adjust the corresponding configuration file in
  exactly the same way as described above in Section 5 for the desktop
  configuration file): ::

      $ cd /path/to/jscofe
      $ vi config/conf.remote.json

  and further edit the corresponding start shell script: ::

      $ vi ./start-remote.sh

  Then just type type: ::

    $ /path/to/jscofe/start-remote.sh

  which will fire up your browser with remote |jsCoFE| web-site loaded, and local
  |jsCoFE| client ready for communication. Note that you can copy the
  ``start-remote.sh`` script to any other location and start |jsCoFE| from there.
