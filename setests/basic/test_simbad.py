
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


def simbadAfterImport(driver, waitLong):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
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

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 10 minutes to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently the task simbadAfterImport has not been completed in time; terminating')
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
        match = re.search('\[0002\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break

    if (rWork != 1.0) and (rFree != 1.0):
        print('*** Verification: SIMBAD ' \
              'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.29 and < 0.3 ), '  % (rWork, rFree))
        assert rWork < 0.29
        assert rFree < 0.3

    return ()

def aimless(driver, waitLong):
    print('Running Aimless after Xia-2')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Merging and Scaling with Aimless')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently the task xia2Processing has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    compl = 0.0
    cc12 = 0.0
    rAll = 1.0
    rAno = 1.0
    res1 = 50.0
    res2 = 1.0
    sg = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0003\] aimless -- Compl=(.*)\% CC1\/2=(.*) Rmeas_all=(.*) Rmeas_ano=(.*) Res=(.*)-(.*) SpG=(.*)', taskText)
        if match:
            compl = float(match.group(1))
            cc12 = float(match.group(2))
            rAll = float(match.group(3))
            rAno = float(match.group(4))
            res1 = float(match.group(5))
            res2 = float(match.group(6))
            sg = str(match.group(7))
            break
    if (compl == 0.0) or (cc12 == 0.0) or (sg == ''):
        print('*** Verification: could not find output values for Aimless run')
    else:
        print('*** Verification: Aimless ' \
              'Compl is %0.1f %%(expecting >70.0), ' \
              'cc1/2 is %0.3f (expecting >0.9), ' \
              'rAll is %0.3f (expecing <0.1), ' \
              'rAno is %0.3f (expecing <0.07), ' \
              'resHigh is %0.2f (expecing <1.26), ' \
              'resLow is %0.2f (expecing >60.0), ' \
              'SG is %s (expecting "P 61 2 2")'   % (compl, cc12, rAll, rAno, res1, res2, sg))
    assert compl > 70.0
    assert cc12 > 0.9
    assert rAll < 0.1
    assert rAno < 0.07
    assert res1 < 1.26
    assert res2 > 60.0
    assert sg == 'P 61 2 2'

    return ()


def simbad(driver, waitLong):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
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

    # try:
    #     wait = WebDriverWait(driver, waitLong) # allowing 10 minutes to the task to finish
    #     # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
    #     wait.until(EC.presence_of_element_located
    #                ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    # except:
    #     print('Apparently the task simbadAfterImport has not been completed in time; terminating')
    #     sys.exit(1)
    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    # rWork = 1.0
    # rFree = 1.0
    # ttts = sf.tasksTreeTexts(driver)
    # for taskText in ttts:
    #     match = re.search('\[0002\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
    #     if match:
    #         rWork = float(match.group(1))
    #         rFree = float(match.group(2))
    #         break

    # if (rWork != 1.0) and (rFree != 1.0):
    #     print('*** Verification: SIMBAD ' \
    #           'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.29 and < 0.3 ), '  % (rWork, rFree))
    #     assert rWork < 0.29
    #     assert rFree < 0.3

    return ()

def test_simbadBasic(browser,
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

    d.testName = 'simbadTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_mdm2(d.driver, d.waitShort)
        simbadAfterImport(d.driver, 1300)
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')


        aimless(d.driver, 1300)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, 100, task='0004')
        simbad (d.driver, 1300)

        # sf.renameProject(d.driver, d.testName)

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

    test_simbadBasic(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                     )
