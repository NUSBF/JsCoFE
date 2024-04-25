from lib2to3.pgen2 import driver
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..'))
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf

d = sf.driverHandler()



def simbadFirst (driver):

  ttts = sf.tasksTreeTexts(driver)
  for taskText in ttts:
    match = re.search('\[0002\] simbad -- best model: (.*)', taskText)
    # print(match)
    if match:
      model = str(match.group(1))
      print ('Model 0002 = '+ model)
      break

    # else:
    #   print ("Failed to find 0002 Simbat results")


  if str(model) == "4hg7":
    print ('Model 0002 = '+ model)

  else:
     print ("Failed to find 0002 Simbat results")

  # sf.renameProject(d.driver, d.testName)


def simbadSecond (driver):

  ttts = sf.tasksTreeTexts(driver)
  for taskText in ttts:
    match = re.search('\[0005\] simbad -- best model: (.*)', taskText)
    # print(match)
    if match:
      model = str(match.group(1))
      print ('Model 0005 = '+ model)
      
      break

    # else:
    #   print ("Failed to find 0005 Simbat results")

  
  # assert str(model) == "4hg7"
  print ('Model 0005 = '+ model)
  sf.renameProject(d.driver, d.testName)


  return ()

def test_simbadValidationBasic(browser,
                     cloud,
                     nologin,
                     login,
                     password,
                     remote
                     ):

    (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(remote, browser)
    d.browser = browser
    d.cloud = cloud
    d.nologin = nologin
    d.password = password
    d.remote = remote
    d.login = login

    d.testName = 'simbadTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        
        sf.loginToCloud(d.driver, login, password, nologin)
        sf.enterProject(d.driver, d.testName)
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        simbadFirst (d.driver)
        simbadSecond (d.driver)


        d.driver.quit()

    except:
        d.driver.quit()
        raise


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(add_help=False)
    parser.set_defaults(auto=False)
    parser.add_argument('--remote', action='store', dest='remote', help=argparse.SUPPRESS, default='') # run tests on Selenium Server hub. Contains hub URL
    parser.add_argument('--browser', action='store', dest='browser', help=argparse.SUPPRESS, default='Firefox') # Firefox or Chrome
    parser.add_argument('--cloud', action='store', dest='cloud', help=argparse.SUPPRESS, default='http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/') # Cloud URL
    parser.add_argument('--login', action='store', dest='login', help=argparse.SUPPRESS, default='setests') # Login
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    test_simbadValidationBasic(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                     )
