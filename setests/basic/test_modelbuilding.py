

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


def refmacAfterRevision(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(2)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
   
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently the task refmacAfterRevision has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.17), Rfree is %0.4f (expecing <0.20)' % (rWork, rFree))
    assert rWork < 0.17
    assert rFree < 0.20

    return ()


def startBuccaneer(driver):
    print('Running Buccaneer')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with Buccaneer')
        time.sleep(1)
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with Buccaneer')
        time.sleep(1)
        
    except:
        pass

    

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


def startCCP4Build(driver):
    print('Starting CCP4 build')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with CCP4Build')
        time.sleep(1)
    except:
        pass
        
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with CCP4Build')
        time.sleep(1)
    except:
        pass


    inputNcycles = driver.find_elements_by_xpath("//input[@title='Choose a value between 1 and 50 and not less than the minimum number of cycles']")
    inputNcycles[-1].clear()
    inputNcycles[-1].send_keys('3')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    time.sleep(1)
    # Close button is out of screen on STFC Cloud VM, pressing cross instead
    # sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    # <button type="button" class="ui-button ui-corner-all ui-widget ui-button-icon-only ui-dialog-titlebar-close"
    # title="Close"><span class="ui-button-icon ui-icon ui-icon-closethick"></span><span class="ui-button-icon-space"> </span>Close</button>
    sf.clickByXpath(driver, "//button[@title='Close' and text()='Close' and @class='ui-button ui-corner-all ui-widget ui-button-icon-only ui-dialog-titlebar-close']")
    time.sleep(2)

    return()


def startModelcraft(driver):
    print('Starting Modelcraft')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with ModelCraft')
        time.sleep(3)
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with ModelCraft')
        time.sleep(3)
    except:
        pass

    

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    time.sleep(4)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(2)

    return()


def verifyBuccaneer(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('Buccaneer verification, job ' + jobNumber)

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] buccaneer -- Compl=(.*)% R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                compl = float(match.group(1))
                rWork = float(match.group(2))
                rFree = float(match.group(3))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Buccaneer results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Buccaneer run')
    else:
        print('*** Verification: Buccaneer Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def verifyCCP4Build(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    compl = 0.0
    print('CCP4Build verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] ccp4build -- Compl=(.*)% R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                compl = float(match.group(1))
                rWork = float(match.group(2))
                rFree = float(match.group(3))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for CCP4Build results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(59)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after CCP4Build run')
    else:
        print('*** Verification: CCP4Build Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def verifyModelcraft(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('Modelcraft verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] modelcraft -- Compl=(.*)%.*R=(0\.\d*).*Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(2))
                rFree = float(match.group(3))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Modelcraft results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(59)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Modelcraft run')
    else:
        print('*** Verification: Modelcraft Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def test_modelBuildingBasic(browser,
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

    d.testName = 'modelbuildingTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort) # 1
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort) # 2
        sf.editRevisionStructure_rnase(d.driver, d.waitShort) # 3
        refmacAfterRevision(d.driver, d.waitLong) # 4
        # startBuccaneer(d.driver) # 5
        # time.sleep(6)
        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        time.sleep(6)
        startCCP4Build(d.driver) # 6
        time.sleep(6)
        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        time.sleep(6)
        startModelcraft(d.driver) # 7
        verifyModelcraft(d.driver, 900, '0006', 0.2, 0.255) # 
        verifyCCP4Build(d.driver, 1000, '0005', 0.25, 0.28) # run takes long
        # verifyBuccaneer(d.driver, 10, '0005', 0.28, 0.3) # 
        
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

    test_modelBuildingBasic(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )

