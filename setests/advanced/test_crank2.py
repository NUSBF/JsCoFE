
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


def startCrank2(driver):
    print('Starting CRANK2 for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Crank-2 Automated Experimental Phasing')
    time.sleep(1)


    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'peak')
    time.sleep(1)

    # 3 Se atoms
    inputNatoms = driver.find_element_by_xpath("//input[@title='Optional number of substructure atoms in asymmetric unit. Leave blank for automatic choice.']")
    inputNatoms.clear()
    inputNatoms.send_keys('3')
    time.sleep(1)

    # Solvent content is 0.71
    inputSolvent = driver.find_element_by_xpath("//input[@title='Solvent content to be used in calculations (must be between 0.01 and 0.99). If left blank, solvent fraction from asymmetric unit definition will be used.']")
    inputSolvent.clear()
    inputSolvent.send_keys('0.71')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(10)


    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    # Logging out
    buttonsLogout = driver.find_elements_by_xpath("//img[contains(@src, 'images_png/logout.png')]" )
    for buttonLogout in buttonsLogout:
        if buttonLogout.is_displayed():
            buttonLogout.click()
            break
    time.sleep(2)

    return()


def test_1Crank2start(browser,
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

    d.testName = 'crank2Test'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, d.login, d.password)
        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromPDB_2fx0(d.driver, d.waitShort)
        sf.asymmetricUnitContents_2fx0(d.driver, d.waitShort)
        startCrank2(d.driver)

        # Logging off as Selenium become unstable with long connections
        d.driver.quit()

    except:
        d.driver.quit()
        raise

    return ()

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

    test_1Crank2start(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
