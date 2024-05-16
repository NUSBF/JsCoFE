

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


def startLORESTRAfterRevision(driver):
    print('Starting LORESTR')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(3)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Low-Resolution Refinement with Lorestr')
    time.sleep(3)

    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Low-Resolution Refinement with Lorestr')
    time.sleep(3)

    # sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Add structural homologues from the PDB')
    # time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def verifyLORESTR(driver):
    compl = ''
    print('LORESTR verification')

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[0004\] lorestr -- (.*)', taskText)
            if match:
                compl = match.group(1)
                break
        if (compl != ''):
            break
        curTime = time.time()
        if curTime > startTime + float(3700): # 61 minutes, normally shall finish in 35, but slower with update
            print('*** Timeout for LORESTR results! Waited for %d seconds.' % 3700)
            break
        time.sleep(60)

    if (compl == ''):
        print('*** Verification: could not find completion statement after LORESTR run')
    else:
        match = re.search('R=(0\.\d*) Rfree=(0\.\d*)', compl)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            print('*** Verification: LORESTR Rwork=%0.3f, Rfree=%0.3f (expecting <0.18, <0.21) ' % (rWork, rFree))
            assert rWork < 0.18
            assert  rFree < 0.21
        else:
            print('*** Verification: LORESTR completion statement is "%s" (expecting "completed.") ' % compl)
            assert compl == 'completed.'

    sf.doubleClickTaskInTaskTree(driver, '\[0004\]')
    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))

    results = []

    #ugly hack for the second attempt to fight unexpected refresh
    try:
        tasksText = driver.find_elements(By.XPATH, "//td[@class='table-blue-td']")
        for t in tasksText:
            if len(t.text.strip()) > 0:
                results.append(t.text)
    except:
        results = []
        time.sleep(1.7)
        tasksText = driver.find_elements(By.XPATH, "//td[@class='table-blue-td']")
        for t in tasksText:
            if len(t.text.strip()) > 0:
                results.append(t.text)

    print('*** Verification: LORESTR Rfree before  %s (<0.33), ' \
          'Rfree after %s (expecting <0.21), ' \
          'Rama favoured before %s (>84.0), ' \
          'Rama favoured after %s (>95.0)' % (results[5], results[12], results[7], results[14]) )

    assert float(results[4]) < 0.33
    assert float(results[5]) < 0.33
    assert float(results[6]) < 4.0
    assert float(results[7]) > 84.0

    assert float(results[11]) < 0.18
    assert float(results[12]) < 0.21
    assert float(results[13]) < 0.5
    assert float(results[14]) > 95.0
    time.sleep (3)

    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    time.sleep (3)

    return ()




def test_1LORESTRBasic(browser,
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

    d.testName = 'lorestrTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        sf.editRevisionStructure_rnase(d.driver, d.waitShort)
        startLORESTRAfterRevision(d.driver)
        verifyLORESTR(d.driver)
        sf.renameProject(d.driver, d.testName)

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

    test_1LORESTRBasic(browser=parameters.browser,  # or 'Chrome'
                       cloud=parameters.cloud,
                       nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                       login=parameters.login,  # Used to login into remote Cloud
                       password=parameters.password,  # Used to login into remote Cloud
                       remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                       )
