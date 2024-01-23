
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

# !!!
# PLEASE NOTE : IGNORING CLOUD PARAMETER AND ALWAYS TESTING MAIN CLOUD!!!
# !!!

def startRefmac(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1.05)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1.05)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(1.05)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    # pressing Close button
#    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
#    closeButton.click()
#    time.sleep(1)

    return ()


def verifyRefmac(driver, waitLong, jobNumber, targetRwork, targetRfree):
        rWork = 1.0
        rFree = 1.0
        print('REFMAC5 verification, job ' + jobNumber)

        time.sleep(1.05)
        startTime = time.time()

        while (True):
            ttts = sf.tasksTreeTexts(driver)
            for taskText in ttts:
                # Job number as string
                match = re.search('\[' + jobNumber +'\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
                    break
            if (rWork != 1.0) or (rFree != 1.0):
                break
            curTime = time.time()
            if curTime > startTime + float(waitLong):
                print('*** Timeout for REFMAC5 results! Waited for %d seconds.' % waitLong)
                break
            time.sleep(10)


        if (rWork == 1.0) or (rFree == 1.0):
            print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
        else:
            print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
        assert rWork < targetRwork
        assert rFree < targetRfree


def startSimbad(driver):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Lattice and Contaminants Search with Simbad')
    time.sleep(1)
 

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(10)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def verifySimbad(driver, waitLong):

    rWork = 1.0
    rFree = 1.0
    print('SIMBAD verification')

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            match = re.search('\[0007\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break

        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SIMBAD results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(20)

    if (rWork != 1.0) and (rFree != 1.0):
        print('*** Verification: SIMBAD ' \
              'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.29 and < 0.3 ), '  % (rWork, rFree))
        assert rWork < 0.29
        assert rFree < 0.3

    return ()

# Old one on main Cloud
def editRevisionStructure_rnase(driver, waitShort):
    print('Making structure revision')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Edit Revision: Structure')
    time.sleep(1)

    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[do not change]')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s') and contains(text(), '%s')]" % ('rnase_model', 'xyz'))
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitShort) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(1)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()



def test_mainCloud(browser,
                   cloud,
                   nologin,
                   login,
                   password,
                   remote
                   ):
# !!!
# PLEASE NOTE : IGNORING CLOUD PARAMETER AND ALWAYS TESTING MAIN CLOUD!!!
# !!!

    (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(remote, browser)
    d.browser = browser
    d.cloud = cloud
    d.nologin = nologin
    d.password = password
    d.remote = remote
    d.login = login

    d.testName = 'mainCloudTest'

    try:
        # !!!
        # PLEASE NOTE : IGNORING CLOUD PARAMETER AND ALWAYS TESTING MAIN CLOUD!!!
        # !!!
        print('Opening URL: %s' % 'https://cloud.ccp4.ac.uk/')
        d.driver.get('https://cloud.ccp4.ac.uk/')
        assert "CCP4 Cloud" in d.driver.title
        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        time.sleep(1)

        sf.editRevisionStructure_rnase(d.driver, d.waitShort)
        time.sleep(1)

        # Starting three REFMACs in parallel to make sure different number crunchers are employed
        startRefmac(d.driver, d.waitLong)
        time.sleep(10)
        # pressing Close button for REFMAC window
        closeButton = d.driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        closeButton.click()
        time.sleep(1)

        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        time.sleep(1)
        startRefmac(d.driver, d.waitLong)
        time.sleep(10)
        # pressing Close button for REFMAC window
        closeButton = d.driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        closeButton.click()
        time.sleep(1)

        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        time.sleep(1)
        startRefmac(d.driver, d.waitLong)
        time.sleep(10)
        # pressing Close button for REFMAC window
        closeButton = d.driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        closeButton.click()
        time.sleep(1)


        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        time.sleep(2) # sensitive
        startSimbad(d.driver)
        time.sleep(1)

        verifyRefmac(d.driver, d.waitLong, '0004', 0.17, 0.2)
        verifyRefmac(d.driver, d.waitLong, '0005', 0.17, 0.2)
        verifyRefmac(d.driver, d.waitLong, '0006', 0.17, 0.2)

        verifySimbad(d.driver, d.waitLong)

        sf.renameProject(d.driver, d.testName)

        d.driver.quit()


    except:
        d.driver.quit()
        raise

# !!!
# PLEASE NOTE : IGNORING CLOUD PARAMETER AND ALWAYS TESTING MAIN CLOUD!!!
# !!!
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

    # !!!
    # PLEASE NOTE : IGNORING CLOUD PARAMETER AND ALWAYS TESTING MAIN CLOUD!!!
    # !!!
    test_mainCloud(browser=parameters.browser,  # or 'Chrome'
                   cloud=parameters.cloud,
                   nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                   login=parameters.login,  # Used to login into remote Cloud
                   password=parameters.password,  # Used to login into remote Cloud
                   remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                   )
