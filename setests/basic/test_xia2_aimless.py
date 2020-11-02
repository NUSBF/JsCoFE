
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


def xia2Processing(driver, isLocal):
    print('Running XIA-2 for Hg dataset')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Image Processing with Xia-2')
    time.sleep(1)

    if isLocal:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'local file system')
        time.sleep(1)

        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'cloud storage')
        time.sleep(1)

        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Browse')
        time.sleep(1)


        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'CCP4 examples')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hypF_images')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hg_001.mar1600')
        time.sleep(1)

    else:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Browse')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'test-data')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hypF_images')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hg_001.mar1600')
        time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 420) # allowing 7 minutes to the task to finish, normally takes 3 minutes, but 6 minutes locally
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently the task xia2Processing has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    found = False
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0001\] created datasets: Unmerged \(2\) HKL \(1\) -- completed', taskText)
        if match:
            found = True
            break
    if not found:
        print('*** Verification: could not find message about created datasets after xia-2 run')
    else:
        print('*** Verification: datasets created by XIA-2')
    assert found

    return ()


def aimlessAfterXia2(driver, waitLong):
    print('Running Aimless after Xia-2')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Reduction with Aimless')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently the task xia2Processing has not been completed in time; terminating')
        sys.exit(1)

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
        match = re.search('\[0002\] aimless -- Compl=(.*)\% CC1\/2=(.*) Rmeas_all=(.*) Rmeas_ano=(.*) Res=(.*)-(.*) SpG=(.*)', taskText)
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
              'Compl is %0.1f %%(expecting >90.0), ' \
              'cc1/2 is %0.3f (expecting >0.9), ' \
              'rAll is %0.3f (expecing <0.1), ' \
              'rAno is %0.3f (expecing <0.07), ' \
              'resHigh is %0.2f (expecing <2.5), ' \
              'resLow is %0.2f (expecing >35.0), ' \
              'SG is %s (expecting "H 3 2")'   % (compl, cc12, rAll, rAno, res1, res2, sg))
    assert compl > 90.0
    assert cc12 > 0.9
    assert rAll < 0.1
    assert rAno < 0.07
    assert res1 < 2.5
    assert res2 > 35.0
    assert sg == 'H 3 2'

    return ()



def test_1xia2(browser,
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

    d.testName = 'xia2AimlessTest'

    isLocal = False
    if 'localhost' in d.cloud:
        isLocal = True

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        xia2Processing(d.driver, isLocal)

    except:
        d.driver.quit()
        raise


def test_2aimless():
    try:
        aimlessAfterXia2(d.driver, d.waitLong)
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

    test_1xia2(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    test_2aimless()
