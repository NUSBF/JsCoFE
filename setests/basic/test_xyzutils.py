
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


def xyzutilsAfterImport(driver, waitLong):
    print('Running XYZutils sequence extract')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Coordinate Utilities')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Transform structure')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Extract sequences')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task xyzutilsAfterImport has not been completed in time; terminating')
        sys.exit(1)

    #  CHANGING iframe!!! As it is separate HTML file with separate search!
    time.sleep(2)
    driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Macromolecular sequences')
    time.sleep(2)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Import rnase_model_A.fasta')
    time.sleep(2)

    tasksText = driver.find_elements(By.XPATH, "//td[@class='table-blue-td']")

    print('*** Verification: type is  %s (expecting protein), ' \
          'length is %s (expecting 96), ' \
          'sequence is %s (>rnase_model_A DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGEATQEDYYTGDHYATFSLIDQTC), '
           % (tasksText[2].text, tasksText[4].text, tasksText[3].text) )

    assert tasksText[2].text == 'protein'
    assert int(tasksText[4].text) == 96
    assert tasksText[3].text == """>rnase_model_A
DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITP
GARTRGTRRIICGEATQEDYYTGDHYATFSLIDQTC"""


    # SWITCHING FRAME BACK!
    driver.switch_to.default_content()
    
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


    return ()



def test_xyzutilsBasic(browser,
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

    d.testName = 'xyzutilsTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        xyzutilsAfterImport(d.driver, d.waitShort)
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

    test_xyzutilsBasic(browser=parameters.browser,  # or 'Chrome'
                       cloud=parameters.cloud,
                       nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                       login=parameters.login,  # Used to login into remote Cloud
                       password=parameters.password,  # Used to login into remote Cloud
                       remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                       )
