

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


def asymmetricUnitContents(driver, waitShort):
    print ('Making Asymmetric Unit Contents ')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list'):
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # Se is main scatterer
    inputScaterer = driver.find_element_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputScaterer.click()
    inputScaterer.clear()
    inputScaterer.send_keys('S')
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
        print('Apparently tha task asymmetricUnitContents has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


def startSHELXcd(driver):
    print('Starting SHELX-CD for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list'):
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Substructure Search with SHELX-C/D')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


def validateSHELXcd(driver, waitLong):

    rWork = 1.0
    rFree = 1.0
    targetRwork = 0.65
    targetRfree = 0.65

    print ('SHELX CD verification - starting pulling job every 60 seconds')

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(r'^\[0003\] shelx-cd substructure search \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SHELX results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(60)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after SHELX run')
    else:
        print('*** Verification: SHELX Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def phaserEP(driver):
    print('Starting Phaser-EP for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list'):
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing with Phaser')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, 150) # normally takes under a minute
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task Phaser-EP has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    fom = 0.0
    llg = 0.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] phaser EP \(SAD\) -- (.*)', taskText)
        if match:
            completed = match.group(1)
            match2 = re.search('LLG=(.*)\sFOM=(.*)', match.group(1))
            if match2:
                llg = float(match2.group(1))
                fom = float(match2.group(2))
            break
    if completed == '':
        print('*** Verification: could not find completed value after Phaser EP run')
        assert completed == 'completed.'
    else:
        if (fom == 0.0) and (llg == 0.0):
            print('*** Verification: Phaser EP completion message in %s (expecting "completed.")' % (completed))
            assert completed == 'completed.'
        else:
            print('*** Verification: Phaser EP LLG is %0.1f, FOM is %0.3f (expecting >1000, >0.45)' % (llg, fom))
            assert llg > 1000.0
            assert  fom > 0.45



    return()


def runParrot(driver):
    print('Running Parrot')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    if not sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list'):
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Density Modification')
    time.sleep(2)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Density Modification with Parrot')
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 300) # giving 5 minutes
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently tha task Parrot has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    fom = 0.0
    fcorr = 0.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0005\] parrot DM --\s(.*)', taskText)
        if match:
            completed = match.group(1)
            match2 = re.search('FOM=(.*)\sFcorr=(.*)', match.group(1))
            if match2:
                fom = float(match2.group(1))
                fcorr = float(match2.group(2))
            break
    if completed == '':
        print('*** Verification: could not find completed value after Parrot run')
        assert completed == 'completed.'
    else:
        if (fom == 0.0) and (fcorr == 0.0):
            print('*** Verification: Parrot completion message in %s (expecting "completed.")' % (completed))
            assert completed == 'completed.'
        else:
            print('*** Verification: Parrot Fcorr is %0.3f, FOM is %0.3f (expecting >0.8, >0.8)' % (fcorr, fom))
            assert fcorr > 0.8
            assert  fom > 0.8

    return ()


def startBuccaneer(driver):
    print('Running Buccaneer')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list'):
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Automatic Model Building with Buccaneer')
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
            match = re.search('\[' + jobNumber + '\].*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
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


def test_1SHELXCD(browser,
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

    d.testName = 'shelxcdTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_insulin(d.driver, d.waitShort) # 1
        asymmetricUnitContents(d.driver, d.waitShort) # 2
        startSHELXcd(d.driver) # 3
        validateSHELXcd(d.driver, 1200) # 12-13 minutes normally, lets give 20
    except:
        d.driver.quit()
        raise


def test_2PhaserParrBucc():
    try:
        phaserEP(d.driver)  # 4
        runParrot(d.driver)  # 5
        startBuccaneer(d.driver)  # 6
        verifyBuccaneer(d.driver, 600, '0006', 0.35, 0.37)  # run takes 6 minutes, giving 10

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

    test_1SHELXCD(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_2PhaserParrBucc()
