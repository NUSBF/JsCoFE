
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


def prepareMRmodelAfterASU(driver, waitShort):
    print('Preparing MR model')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Prepare MR Model(s) from Coordinate data')
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
        print('Apparently tha task premareMRmodelAfterASU has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def phaserAfterMRmodel(driver, waitLong):
    print('Running PHASER')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Molecular Replacement with Phaser')
    time.sleep(1)

    # 2 molecules in the ASU
    inputASU = driver.find_element_by_xpath("//*[@title='Specify the number of model copies to look for in asymmetric unit']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('2')
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

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    llg = 0
    tfz = 0.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] phaser MR -- Nsol=1 LLG=(\d*) TFZ=(\d*\.\d*) R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            llg = float(match.group(1))
            tfz = float(match.group(2))
            rWork = float(match.group(3))
            rFree = float(match.group(4))
            break
    if (rWork == 1.0) or (rFree == 1.0) or (llg == 0) or (tfz == 0.0):
        print('*** Verification: could not find Rwork or Rfree value after PHASER run')
    else:
        print('*** Verification: PHASER ' \
              'LLG is %d (expecting >3600), ' \
              'TFZ is %0.1f (expecting >50.0), ' \
              'Rwork is %0.4f (expecting <0.36), ' \
              'Rfree is %0.4f (expecing <0.37)' % (llg, tfz, rWork, rFree))
    assert llg > 3600
    assert tfz > 50.0
    assert rWork < 0.36
    assert rFree < 0.37

    return ()


def test_PhaserBasic(browser,
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

    d.testName = 'phaserTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        prepareMRmodelAfterASU(d.driver, d.waitShort)
        phaserAfterMRmodel(d.driver, d.waitLong)
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
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='cloud8testS') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    test_PhaserBasic(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
