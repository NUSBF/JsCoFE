# Selenium tests for the CCP4Cloud


0. Tests require Selenium and PyTest installed. Before running the tests, please do:
python -m pip install --upgrade pip
python -m pip install selenium
python -m pip install pytest

If you would like to generate local HTML reports, please also install pytest-html
python -m pip install pytest-html

Also, 'chromedriver' and 'geckodriver' shall be installed and available in the PATH for
running tests on Chrome and Firefox correspondingly


1. Typical local run via Firefox and developer's CCP4Cloud is easy and will run all available tests:
python -m pytest ./test_cloud.py

For verbose output during run (so you know what test script is doing):
python -m pytest -v -s ./test_cloud.py

To generate HTML reports, please do
python -m pytest ./test_cloud.py --html report.html

To generate JUNIT XML report (Jenkins integration, for instance):
python -m pytest ./test_cloud.py --junit-xml report.xml

You can specify a browser:
python -m pytest ./test_cloud.py --browser Chrome  # Chrome or Firefox, Firefox is default

You can test other CCP4Cloud installations:
python -m pytest ./test_cloud.py --cloud https://cloud.ccp4.ac.uk  # default is http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/

You can also provide user name and password to login into CCP4Cloud:
python -m pytest ./test_cloud.py --cloud https://cloud.ccp4.ac.uk --login dev --password dev  # default is setests

You can use any combination of all abovementioned parameters.
These tests will start browser (controlled by Selenium) at your computer; 
browser shall be on screen all the time or otherwise tests may fail.

2. Remote mode. It is possible to run browser on remote machine (Linux VM provided by STFC Cloud) running Selenium Server Hub.
All the tests will be run remotely, locally you will get the report (browser will not start on your local machine,
it will start on STFC Cloud VM).
python -m pytest ./test_cloud.py --remote http://130.246.213.187:4444/wd/hub

All parameters from (1) will also work in this remote mode, just add them as appropriate.

