
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


def xyzutilsAfterImport(driver, waitLong):
    print('Running XYZutils sequence extract')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Coordinate Utilities')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Transform structure')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Extract sequences')
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
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Import rnase')
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


    if len(remote) > 1:  # Running on Selenium Server hub
        waitShort = 60  # seconds for quick tasks
        waitLong = 180  # seconds for longer tasks

        if browser == 'Chrome':
            options = webdriver.ChromeOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
        elif browser == 'Firefox':
            options = webdriver.FirefoxOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)
    else:  # Running locally
        waitShort = 15  # seconds for quick tasks
        waitLong = 120  # seconds for longer tasks

        if browser == 'Chrome':
            driver = webdriver.Chrome()
        elif browser == 'Firefox':
            driver = webdriver.Firefox()
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)

    driver.implicitly_wait(10)  # wait for up to 10 seconds for required HTML element to appear

    try:
        print('Opening URL: %s' % cloud)
        driver.get(cloud)
        assert "CCP4 Cloud" in driver.title

        if not nologin:
            sf.loginToCloud(driver, login, password)

        testName = 'xyzutilsTest'

        sf.removeProject(driver, testName)
        sf.makeTestProject(driver, testName, testName)
        sf.enterProject(driver, testName)
        sf.importFromCloud_rnase(driver, waitShort)

        xyzutilsAfterImport(driver, waitShort)

        sf.renameProject(driver, testName)

        driver.quit()

    except:
        driver.quit()
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

    test_xyzutilsBasic(browser=parameters.browser,  # or 'Chrome'
                       cloud=parameters.cloud,
                       nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                       login=parameters.login,  # Used to login into remote Cloud
                       password=parameters.password,  # Used to login into remote Cloud
                       remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                       )
