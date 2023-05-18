

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

def startSMR_RNAse(driver, dirName, waitShort=90):
    print ('Starting aMR Workflow with RNAse. Dir name: %s' % (dirName))

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Workflows')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Simple Molecular Replacement')
    time.sleep(2)

    # test_data/rnase/rnase18_Nat_Complexes.mtz
    # rnase.fasta
    # rnase_model.pdb
    # rnase_polyala.pdb

    mtzFileName = os.path.join(dirName, 'rnase', 'rnase18_Nat_Complexes.mtz')
    seqFileName = os.path.join(dirName, 'rnase', 'rnase.fasta')
    pdbFileName = os.path.join(dirName, 'rnase', 'rnase_polyala.pdb')

    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads[]')]")

    # if d.cloud == "http://ccp4serv6.rc-harwell.ac.uk/jscofe-pre/":
    #     projectInputs[-3].send_keys(mtzFileName)
    #     projectInputs[-2].send_keys(pdbFileName)
    #     projectInputs[-1].send_keys(seqFileName)
    # else:
    projectInputs[-4].send_keys(mtzFileName)
    projectInputs[-3].send_keys(pdbFileName)
    projectInputs[-2].send_keys(seqFileName)
    
    time.sleep(2)

    sf.clickByXpath(driver, "//button[normalize-space()='Apply & Upload']")

    time.sleep(3)

    sf.clickByXpath(driver, "//button[normalize-space()='Run']")
    time.sleep(10)

    return()


def test_1Start_SMR_WF(browser,
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

    d.testName = 'smrWFTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)

        if sys.platform.startswith("win"):
            data_dir = '%userprofile%\\test_data'
        else:
            data_dir = '~/test_data'
        startSMR_RNAse(d.driver, data_dir)

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

    test_1Start_SMR_WF(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
