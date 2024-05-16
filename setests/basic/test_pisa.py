
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


def pisaAfterRevision(driver, waitLong):
    print('Running PISA')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Validation, Analysis and Deposition')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Surface, Interfaces and Assembly Analysis with PISA')
    time.sleep(1)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task pisaAfterRevision has not been completed in time; terminating')
        sys.exit(1)

    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))
    sf.clickByXpath(driver, "//a[@href='#jscofe_report-monomers_tab']" )
    time.sleep(1)

    tasksText = driver.find_elements(By.XPATH, "//td[@class='table-blue-td']")


    print('*** Verification: PISA monomer is  %s (expecting A), ' \
          'class is %s (expecting Protein), ' \
          'area is %0.1f (expecting >5500 and <5700), ' \
          'dG is %0.1f (expecting <-50 and >-90)' % (tasksText[13].text, tasksText[14].text, float(tasksText[19].text), float(tasksText[20].text)) )

    assert tasksText[13].text == 'A'
    assert tasksText[14].text == 'Protein'
    assert float(tasksText[19].text) > 5500.0
    assert float(tasksText[19].text) < 5700.0
    assert float(tasksText[20].text) < -50.0
    assert float(tasksText[20].text) > -90.0

    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


    return ()


def test_PisaBasic(browser,
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

    d.testName = 'pisaTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        sf.editRevisionStructure_rnase(d.driver, d.waitShort)
        pisaAfterRevision(d.driver, d.waitLong)
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

    test_PisaBasic(browser=parameters.browser,  # or 'Chrome'
                   cloud=parameters.cloud,
                   nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                   login=parameters.login,  # Used to login into remote Cloud
                   password=parameters.password,  # Used to login into remote Cloud
                   remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                   )
