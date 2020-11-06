
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

def importFromPDB(driver, waitShort):
    print ('Importing 2fx0 from the PDB')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Import from PDB')
    time.sleep(1)

    # 2FX0
    time.sleep(2)
    inputPDB = driver.find_element_by_xpath("//input[@title='Comma-separated list of PDB codes to import data from']")
    inputPDB.clear()
    inputPDB.send_keys('2fx0')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'reflection data')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'sequences')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'structure revision')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently tha task importFromPDB has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def asymmetricUnitContentsAfterPDBImport(driver, waitShort):
    print ('Making Asymmetric Unit Contents after PDB Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # Se is main scatterer
    inputScaterer = driver.find_element_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputScaterer.click()
    inputScaterer.clear()
    inputScaterer.send_keys('Se')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitShort) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0002]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task asymmetricUnitContentsAfterPDBImport has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


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
    time.sleep(2)

    # Logging out
    buttonsLogout = driver.find_elements_by_xpath("//img[contains(@src, 'images_png/logout.png')]" )
    for buttonLogout in buttonsLogout:
        if buttonLogout.is_displayed():
            buttonLogout.click()
            break
    time.sleep(2)

    return()


def validateCrank2run(driver, waitLong):

    rWork = 1.0
    rFree = 1.0
    targetRwork = 0.33
    targetRfree = 0.38

    print ('CRANK2 verification - starting pulling job every minute')

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(r'^\[0003\] EP with Crank2 \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for CRANK2 results! Waited for 50 minutes plus %d seconds.' % waitLong)
            break
        time.sleep(60)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after CRANK2 run')
    else:
        print('*** Verification: CRANK2 Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def test_1Crank2start(browser,
                cloud,
                nologin,
                login,
                password,
                remote
                ):

    #d = sf.driverHandler() # MOVE TO THE BEGINNING OF THE FILE!!!
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

        if not nologin:
            sf.loginToCloud(d.driver, d.login, d.password)



        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        importFromPDB(d.driver, d.waitShort)
        asymmetricUnitContentsAfterPDBImport(d.driver, d.waitShort)
        startCrank2(d.driver)

        # Logging off as Selenium become unstable with long connections
        d.driver.quit()

    except:
        d.driver.quit()
        raise


def test_2Crank2veification():

    print('Waiting for 50 minutes until Crank2 is ready (shall finish in about 1 hour)...')
    time.sleep(3000)  # Crank2 run takes around 1 hour
    # Connecting again to check results
    (d.driver, waitLong, waitShort) = sf.startBrowser(d.remote, d.browser)

    try:
        print('Opening URL: %s' % d.cloud)
        d.driver.get(d.cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not d.nologin:
            sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validateCrank2run(d.driver, 1500)
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

    test_1Crank2start(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_2Crank2veification()
