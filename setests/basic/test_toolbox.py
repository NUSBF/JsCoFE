

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


def auspex(driver):
    print('Starting Auspex')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Reflection data diagnostics with Auspex plots')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0004]')]")))
    except:
        print('Apparently task Auspex has not been completed in time; terminating')
        sys.exit(1)

    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))

    plot1 = driver.find_element(By.XPATH, "//img[@src='FSigF_plot.png']")
    size1 = plot1.size
    ratio1 = size1['width'] / size1['height']

    plot2 = driver.find_element(By.XPATH, "//img[@src='F_plot.png']")
    size2 = plot2.size
    ratio2 = size2['width'] / size2['height']

    print('*** Verification: Figure1 size is %0.1f x %0.1f (expecting >100, >50), '
          'Figure2 size is %0.1f x %0.1f (expecting >100, >50), '
          'ratios are %0.2f and %0.2f (expecting >1.7, <2.0)' %
          (size1['width'], size1['height'], size2['width'], size2['height'], ratio1, ratio2))

    assert size1['width'] > 100
    assert size1['height'] > 50
    assert size2['width'] > 100
    assert size2['height'] > 50
    assert ratio1 > 1.7
    assert ratio1 < 2.0
    assert ratio2 > 1.7
    assert ratio2 < 2.0

    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    return()


def srf(driver):
    print('Starting SRF')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Self-Rotation Function Analysis with Molrep')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]")
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, 150)  # normally takes under a minute
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,
                     "//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0003]')]")))
    except:
        print('Apparently task SRF has not been completed in time; terminating')
        sys.exit(1)

    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Self-Rotation Function')
    time.sleep(2)

    plot1 = driver.find_element(By.XPATH, "//object[@data='0001-01.pdf' and @type='application/pdf']")
    size1 = plot1.size
    ratio1 = size1['width'] / size1['height']

    print('*** Verification: Figure1 size is %0.1f x %0.1f (expecting >50, >100), ' \
          'ratio is %0.2f (expecting >0.4, <0.7)' % (size1['width'], size1['height'], ratio1))

    assert size1['width'] > 50
    assert size1['height'] > 100
    assert ratio1 > 0.4
    assert ratio1 < 1

    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    return ()


def crossec(driver):
    print('Starting CROSSEC')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'X-ray cross sections and anomalous scattering factors')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]")
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, 150)  # normally takes under a minute
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,
                     "//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0002]')]")))
    except:
        print('Apparently task CROSSEC has not been completed in time; terminating')
        sys.exit(1)

    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))

    plot1 = driver.find_element(By.XPATH, "//canvas[@class='jqplot-event-canvas']")
    size1 = plot1.size
    ratio1 = size1['width'] / size1['height']

    print('*** Verification: Figure1 size is %0.1f x %0.1f (expecting >100, >50), ' \
          'ratio is %0.2f (expecting >1.7, <2.0)' % (size1['width'], size1['height'], ratio1))

    assert size1['width'] > 100
    assert size1['height'] > 50
    assert ratio1 > 1.7
    assert ratio1 < 2.0

    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    return ()


def test_1crosssec(browser,
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

    d.testName = 'toolboxSFTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_insulin(d.driver, d.waitShort) # 1
        crossec(d.driver) # 2
    except:
        d.driver.quit()
        raise


def test_2srf():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        srf(d.driver) # 3

    except:
        d.driver.quit()
        raise


def test_3auspex():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        auspex(d.driver)  # 4


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

    test_1auspex(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_2srf()
    test_3crosssec()

