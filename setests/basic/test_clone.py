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

def prepareMRmodelCOORD(driver, waitShort):
    print('Preparing MR model from coordinate')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Prepare Single-Chain MR Model(s) from Coordinate data')
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
        print('Apparently the task Prepare Single-Chain MR Model(s) from Coordinate data has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def startPhaser(driver):
    print('Running PHASER')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Molecular Replacement with Phaser')
    time.sleep(1)

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


def verifyPhaser(driver, waitLong, jobNumber):
    rWork = 1.0
    rFree = 1.0
    llg = 0
    tfz = 0.0
    print('Phaser verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] phaser MR -- Nsol=1 LLG=(\d*) TFZ=(\d*\.\d*) R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                llg = float(match.group(1))
                tfz = float(match.group(2))
                rWork = float(match.group(3))
                rFree = float(match.group(4))
                break
        if (rWork != 1.0) or (rFree != 1.0) or (llg != 0) or (tfz != 0.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Phaser results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0) or (llg == 0) or (tfz == 0.0):
        print('*** Verification: could not find Rwork or Rfree value after Phaser run')
    else:
        print('*** Verification: PHASER ' \
              'LLG is %d (expecting >1049), ' \
              'TFZ is %0.1f (expecting >34.0), ' \
              'Rwork is %0.4f (expecting <0.4681), ' \
              'Rfree is %0.4f (expecing <0.4575)' % (llg, tfz, rWork, rFree))
    assert llg > 1000
    assert tfz > 25.0
    assert rWork < 0.5
    assert rFree < 0.5

    return ()

def startModelCraft(driver, waitLong):
    print('Running ModelCraft')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Model Building')
    except:
        pass

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Automatic Model Building with ModelCraft')
    time.sleep(6)

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

def verifyModelcraft(driver, waitLong, jobNumber, targetRwork, targetRfree):

    rWork = 1.0
    rFree = 1.0
    print('Modelcraft verification, job ' + jobNumber)

    time.sleep(3)
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
        time.sleep(60)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Modelcraft run')
    else:
        print('*** Verification: Modelcraft Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def refmacAfterBuccaner(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
        time.sleep(1)
        sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
        time.sleep(1)
        sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    except:
        pass

    
    

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0006]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0006]')]")))
    except:
        print('Apparently tha task refmacAfterBuccaneer has not been completed in time; terminating')
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
        match = re.search('\[0006\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.5), Rfree is %0.4f (expecing <0.5)' % (rWork, rFree))
    assert rWork < 0.5
    assert rFree < 0.5

    return ()

def prepareMRensembleSEQ(driver, waitShort):
    print('Preparing MR ensemble from sequence')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Prepare MR Ensemble from Sequence')
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
        print('Apparently tha task prepareMRensembleSEQ has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def molrep(driver, waitLong):
    print('Running MOLREP')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Molecular Replacement with Molrep')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 60 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0004]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task molrepAfterMRmodel has not been completed in time; terminating')
        sys.exit(1)
        
    time.sleep(10)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] molrep -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after MOLREP run')
    else:
        print('*** Verification: MOLREP Rwork is %0.4f (expecting <0.4), Rfree is %0.4f (expecing <0.42)' % (rWork, rFree))
    assert rWork < 0.4
    assert rFree < 0.42

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

    d.testName = 'cloneTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.removeProject(d.driver, 'clonedTest')
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, "cloneTest")
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        sf.cloneProject(d.driver, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareMRmodelCOORD(d.driver, d.waitLong) 
        startPhaser(d.driver)
        verifyPhaser(d.driver, d.waitLong, '0004') 
        sf.startBuccaneer(d.driver)
        sf.exitProject (d.driver)
        sf.enterProject(d.driver, 'clonedTest')
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareMRmodelCOORD(d.driver, d.waitLong) 
        # prepareMRensembleSEQ(d.driver, d.waitLong)
        molrep(d.driver, d.waitLong)
        startModelCraft(d.driver, d.waitLong)
        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        sf.startBuccaneer(d.driver)
        sf.exitProject (d.driver)
        sf.enterProject(d.driver, d.testName)
        sf.verifyBuccaneer(d.driver, d.waitLong, '0005', 0.47, 0.47)
        sf.clickTaskInTaskTree(d.driver, '\[0005\]')
        refmacAfterBuccaner(d.driver, d.waitLong)
        sf.renameProject(d.driver, d.testName)

        sf.enterProject(d.driver, 'clonedTest')
        sf.verifyBuccaneer(d.driver, 900, '0006', 0.3, 0.35)
        verifyModelcraft(d.driver, 1500, '0005', 0.3, 0.3)
        sf.renameProject(d.driver, 'Cloned_cloneTest')

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
