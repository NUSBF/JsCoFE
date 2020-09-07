
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.dirname(os.path.abspath(__file__))
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf


def logoutToRelogin(driver):
    print ('Logging out.')
    logoutImg = driver.find_element_by_xpath("//img[contains(@src,'images_png/logout.png')]")
    logoutImg.click()
    time.sleep(0.25)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Back to User Login')
    time.sleep(0.25)

    return ()


def unjoinProject(driver, testName):
    print('Unjoining from previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[normalize-space()='%s']" % testName)

    if len(textEls) > 0:
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
        time.sleep(0.25)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
        time.sleep(0.25)

        textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Unjoin')
        textEls[0].click()
        time.sleep(0.25)

    return ()


def startRefmac(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Refinement with Refmac')
    time.sleep(0.25)

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

        time.sleep(0.25)
        startTime = time.time()

        while (True):
            tasksText = driver.find_elements(By.XPATH,
                                             "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for taskText in tasksText:
                # Job number as string
                match = re.search('\[' + jobNumber +'\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
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


def shareProject(driver, login):
    print('Sharing test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Share Project')
    time.sleep(0.25)

    projectSharing = driver.find_element_by_xpath("//input[@placeholder='%s']" % 'login1,login2,...')
    projectSharing.click()
    projectSharing.clear()
    projectSharing.send_keys(login)
    time.sleep(0.25)

    sf.clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Share Project')
    time.sleep(0.25)


    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Apply')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Ok')
    time.sleep(0.25)


    return ()


def joinSharedProject(driver, testName):
    print('Getting shared project')
    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Join')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//span[@class='ui-selectmenu-icon ui-icon ui-icon-triangle-1-s']")
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % testName)
    time.sleep(0.25)

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/share.png')]")
    time.sleep(10)

    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Close')
    time.sleep(0.25)

    return ()


def startSimbad(driver):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
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

    time.sleep(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()

def verifySimbad(driver, waitLong):

    solv = 0.0
    print('SIMBAD verification')

    time.sleep(0.25)
    startTime = time.time()

    while (True):
        try:
            tasksText = driver.find_elements(By.XPATH,
                                             "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for taskText in tasksText:
                match = re.search('\[0005\] simbad -- Solv=(.*)\%', taskText.text)
                if match:
                    solv = float(match.group(1))
                    break
# ugly hack with try/except to make second attempt in the case page was 'refreshed' - test fail with this nonsense regularly
        except:
            tasksText = driver.find_elements(By.XPATH,
                                             "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for taskText in tasksText:
                match = re.search('\[0005\] simbad -- Solv=(.*)\%', taskText.text)
                if match:
                    solv = float(match.group(1))
                    break


        if (solv != 0.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SIMBAD results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(20)

    if (solv == 0.0):
        print('*** Verification: could not find Solv value after SIMBAD run')
    else:
        print('*** Verification: SIMBAD ' \
              'Solv is %0.1f %%(expecting >45.0 and <50.0), '  % (solv))
    assert solv < 50.0
    assert solv > 45.0

    return ()



def startMrbump(driver):

    print('Starting MrBUMP')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(0.25)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MrBump: Model Search & Preparation')
    time.sleep(0.25)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]")
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(0.25)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(0.25)

    return ()


def verifyMrBump(driver):

    rWork = 1.0
    rFree = 1.0
    compl = 0.0
    print('MRBUMP verification')

    time.sleep(0.25)
    startTime = time.time()

    while (True):
        tasksText = driver.find_elements(By.XPATH,
                                         "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
        for taskText in tasksText:
            match = re.search('\[0006\] mrbump -- Compl=(.*)\% R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
            if match:
                compl = float(match.group(1))
                rWork = float(match.group(2))
                rFree = float(match.group(3))
                break
        if (rWork != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + 600.0:
            print('*** Timeout for MRBUMP results! Waited for %d seconds.' % 600)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0) or (compl == 0.0):
        print('*** Verification: could not find compl or Rwork or Rfree value after MrBUMP run')
    else:
        print('*** Verification: MrBUMP ' \
              'Compl is %0.1f %%(expecting >90.0), ' \
              'Rwork is %0.4f (expecting <0.28), ' \
              'Rfree is %0.4f (expecing <0.31)' % (compl, rWork, rFree))
    assert rWork < 0.28
    assert rFree < 0.31
    assert compl > 90.0

    return ()



def test_sharingBasic(browser,
                      cloud,
                      nologin,
                      login,
                      password,
                      remote
                      ):


    if len(remote) > 1:  # Running on Selenium Server hub
        waitShort = 90  # seconds for quick tasks
        waitLong = 240  # seconds for longer tasks

        if browser == 'Chrome':
            options = webdriver.ChromeOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
            driver2 = webdriver.Remote(command_executor=remote, options=options)
        elif browser == 'Firefox':
            options = webdriver.FirefoxOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
            driver2 = webdriver.Remote(command_executor=remote, options=options)
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)
    else:  # Running locally
        waitShort = 90  # seconds for quick tasks
        waitLong = 240  # seconds for longer tasks

        if browser == 'Chrome':
            driver = webdriver.Chrome()
            driver2 = webdriver.Chrome()
        elif browser == 'Firefox':
            driver = webdriver.Firefox()
            driver2 = webdriver.Firefox()
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)

    driver.implicitly_wait(10)  # wait for up to 10 seconds for required HTML element to appear
    driver2.implicitly_wait(10)  # wait for up to 10 seconds for required HTML element to appear

    try:
        print('Opening URL driver 1: %s' % cloud)
        driver.get(cloud)
        assert "CCP4 Cloud" in driver.title
        if not nologin:
            sf.loginToCloud(driver, login, password)


        print('Opening URL driver 2: %s' % cloud)
        driver2.get(cloud)
        assert "CCP4 Cloud" in driver2.title
        if not nologin:
            sf.loginToCloud(driver2, login+'2', password)

        testName = 'sharingTest'

        sf.removeProject(driver, testName)
        unjoinProject(driver2, '[' + login + ']:' + testName)

        sf.makeTestProject(driver, testName, testName)
        sf.enterProject(driver, testName)
        sf.importFromCloud_rnase(driver, waitShort)

        shareProject(driver, login+'2')
        joinSharedProject(driver2, testName)
        sf.enterProject(driver2, testName)
        time.sleep(1)
        sf.asymmetricUnitContentsAfterCloudImport(driver2, waitShort)
        time.sleep(1)

        sf.clickTaskInTaskTree(driver, '\[0002\] asymmetric unit contents')
        time.sleep(1)
        sf.editRevisionStructure_rnase(driver, waitShort)
        time.sleep(1)

        sf.clickTaskInTaskTree(driver2, '\[0003\] edit structure revision')
        time.sleep(1)
        startRefmac(driver2, waitLong)
        time.sleep(1)
        sf.clickTaskInTaskTree(driver, '\[0002\] asymmetric unit contents')
        time.sleep(2) # sensitive
        startSimbad(driver)

        # pressing Close button for REFMAC window
        closeButton = driver2.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        closeButton.click()
        time.sleep(1)
        sf.clickTaskInTaskTree(driver2, '\[0002\] asymmetric unit contents')
        time.sleep(1)
        startMrbump(driver2)

        verifySimbad(driver2, waitLong)
        sf.clickTaskInTaskTree(driver, '\[0005\] simbad')
        startRefmac(driver, waitLong)

        verifyRefmac(driver, waitLong, '0004', 0.17, 0.2)
        verifyRefmac(driver2, waitLong, '0007', 0.24, 0.27)

        verifyMrBump(driver)

        sf.renameProject(driver, testName)

        driver.quit()
        driver2.quit()

    except:
        driver.quit()
        driver2.quit()
        raise


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(add_help=False)
    parser.set_defaults(auto=False)
    parser.add_argument('--remote', action='store', dest='remote', help=argparse.SUPPRESS, default='') # run tests on Selenium Server hub. Contains hub URL
    parser.add_argument('--browser', action='store', dest='browser', help=argparse.SUPPRESS, default='Firefox') # Firefox or Chrome
    parser.add_argument('--cloud', action='store', dest='cloud', help=argparse.SUPPRESS, default='http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/') # Cloud URL
    parser.add_argument('--login', action='store', dest='login', help=argparse.SUPPRESS, default='setests') # Login
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='cloud8testS') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    test_sharingBasic(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
