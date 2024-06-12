

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

def startDPL_mdm2(driver, dirName, waitShort=90):
    print ('Starting DPL Workflow with RNAse. Dir name: %s' % (dirName))

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Workflows')
    time.sleep(2)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Dimple Molecular Replacement')
    time.sleep(2)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'None')
    time.sleep(2)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'File')
    time.sleep(2)
    mtzFileName = os.path.join(dirName, 'mdm2_nolig', 'mdm2_merged.mtz')
    pdbFileName = os.path.join(dirName, 'mdm2_nolig', '4hg7_nolig.pdb')
    cifFileName = os.path.join(dirName, 'mdm2_nolig', 'nut.cif')
    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads[]')]")
    projectInputs[-5].send_keys(mtzFileName)
    projectInputs[-4].send_keys(pdbFileName)
    projectInputs[-1].send_keys(cifFileName)

    time.sleep(2)
    sf.clickByXpath(driver, "//button[normalize-space()='Apply & Upload']")
    time.sleep(3)

    sf.clickByXpath(driver, "//button[normalize-space()='Run']")
    time.sleep(10)

    return()


def test_1Start_DPL_WF_UNM(browser,
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

    d.testName = 'dplWFTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)

        if sys.platform.startswith("win"):
            data_dir = '%userprofile%\\test_data'
        else:
            data_dir = '~/test_data'
        startDPL_mdm2(d.driver, data_dir)

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

    test_1Start_DPL_WF_UNM(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
