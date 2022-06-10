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

def movingProject(driver):
    print('moving project project and creating new folder')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % d.testName)
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Move')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Add folder')
    time.sleep(1)

    nameInput = driver.find_elements_by_xpath("//input[contains(@id,'input')]")
    nameInput[-1].click()
    nameInput[-1].clear()
    nameInput[-1].send_keys('test')
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Add')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Move')
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Please move')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % d.testName)
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Move')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'My Projects')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Move')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Please move')
    time.sleep(1)
    
def delelingFolder(driver):

    print('deleting test folder')

    sf.clickByXpath(driver, "//button[contains(@style, '/images_png/folder_projects.png')]")
    time.sleep(3)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'test')
    time.sleep(3)
    driver.find_elements_by_xpath("//input[contains(@value,'%s')]" % "project folders")
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Yes, delete')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Close')
    time.sleep(1)

def renameProject(driver, testName):
    print('Renaming succesfull test project')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
    time.sleep(3)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Rename')
    time.sleep(6)

    # Shall return list of two elements for project creation
    projectInput = driver.find_elements_by_xpath("//input[contains(@value,'%s')]" % testName)
    projectInput[-1].click()
    projectInput[-1].clear()
    projectInput[-1].send_keys('Successfull - %s' % testName)


    textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Rename')
    textEls[-1].click()
    time.sleep(1)

    return ()

def test_cloneBasic(browser,
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

    d.testName = 'foldersTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromPDB_2fx0(d.driver, d.waitShort)
        sf.exitProject (d.driver)

        movingProject(d.driver)
        delelingFolder(d.driver)
        renameProject(d.driver, d.testName)

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

    test_cloneBasic(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                     )
