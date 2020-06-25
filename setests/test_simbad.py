
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re


def clickByXpath(driver, xpath):
    textEls = driver.find_elements_by_xpath(xpath)
    for textEl in textEls:
#        parentEl = textEl.find_element_by_xpath("..")
        if textEl.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", textEl)
            ActionChains(driver).move_to_element(textEl).click(textEl).perform()
            break


def loginToCloud(driver, cloudLogin, cloudPassword):
    # Shall return list of two elements for login and password
    loginInputs = driver.find_elements_by_xpath("//input[contains(@id,'input')]")

    # First element in the list is login
    loginInputs[0].click()
    loginInputs[0].clear()
    loginInputs[0].send_keys(cloudLogin)

    # Second is password
    loginInputs[1].click()
    loginInputs[1].clear()
    loginInputs[1].send_keys(cloudPassword)

    # Login button
    loginButton = driver.find_element_by_xpath("//button[normalize-space()='Login']")
    loginButton.click()

    return ()


def removeProject(driver, testName):
    print('Deleting previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[normalize-space()='%s']" % testName)
    if len(textEls) > 0:
        try:
            clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
            time.sleep(1)

            clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
            time.sleep(1)

            textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Delete')
            textEls[-1].click()
            time.sleep(1)

        except:
            return ()


    return ()


def makeTestProject(driver, testProjectID, testProjectName):
    print ('Making test project. ID: %s, Name: %s' % (testProjectID, testProjectName))

    # click add button
    addButton = driver.find_element_by_xpath("//button[normalize-space()='Add']")
    ActionChains(driver).move_to_element(addButton).click(addButton).perform()
    time.sleep(1)

    # Shall return list of two elements for project creation
    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input')]")

    # Project id
#    projectInputs[0].click()
    projectInputs[0].clear()
    projectInputs[0].send_keys(testProjectID)

    # Project name
#    projectInputs[1].click()
    projectInputs[1].clear()
    projectInputs[1].send_keys(testProjectName)

    time.sleep(1)
    # Now there are two 'Add' buttons and we want to click second one
    addButtons = driver.find_elements_by_xpath("//button[normalize-space()='Add']")
    addButtons[1].click()

    return()


def enterProject(driver, projectId):
    print ('Entering test project. ID: %s' % projectId)
    time.sleep(1)
    projectCell = driver.find_element_by_xpath("//*[normalize-space()='%s']" % projectId )
    ActionChains(driver).double_click(projectCell).perform()
    return()


def importFromCloudWithTaskListOnScreen(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')

    # Clicking "Cloud Import"
    textEl = driver.find_element_by_xpath("//*[normalize-space()='%s']" % 'Cloud Import')
    ActionChains(driver).double_click(textEl).perform()
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','rnase'),
                                ('a','rnase18_Nat_Complexes.mtz'),
                                ('button','Select more files'),
                                ('a','rnase.fasta'),
                                ('button','Apply & Upload'),
                                ('button','Finish import')]

    for textToDoubleClick in listOfTextsToDoubleClick:
        textElements = driver.find_elements_by_xpath("//%s[normalize-space()='%s']" % (textToDoubleClick[0], textToDoubleClick[1]))
        # It finds several elements with the same file name -> last one is the one we need
        driver.execute_script("arguments[0].scrollIntoView();", textElements[-1])
        ActionChains(driver).move_to_element(textElements[-1]).double_click(textElements[-1]).perform()
        time.sleep(1)

#    taskWindowTitle = driver.find_element(By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), '[0001]')]")
    try:
        wait = WebDriverWait(driver, waitShort)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently tha task importFromCloudWithTaskListOnScreen has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def simbadAfterImport(driver, waitLong):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Lattice and Contaminants Search with Simbad')
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

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    solv = 0.0
    tasksText = driver.find_elements(By.XPATH, "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
    for taskText in tasksText:
        match = re.search('\[0002\] simbad -- Solv=(.*)\%', taskText.text)
        if match:
            solv = float(match.group(1))
            break
    if (solv == 0.0):
        print('*** Verification: could not find Solv value after SIMBAD run')
    else:
        print('*** Verification: SIMBAD ' \
              'Solv is %0.1f %%(expecting >45.0 and <50.0), '  % (solv))
    assert solv < 50.0
    assert solv > 45.0

    return ()


def renameProject(driver, testName):
    print('Renaming succesfull test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'My Projects')
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Rename')
    time.sleep(1)

    # Shall return list of two elements for project creation
    projectInput = driver.find_element_by_xpath("//input[@value='%s']" % testName)
    projectInput.click()
    projectInput.clear()
    projectInput.send_keys('Successfull - %s' % testName)


    textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Rename')
    textEls[-1].click()
    time.sleep(1)

    return ()


def test_simbadBasic(browser,
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
            loginToCloud(driver, login, password)

        testName = 'simbadTest'

        removeProject(driver, testName)
        makeTestProject(driver, testName, testName)
        enterProject(driver, testName)
        importFromCloudWithTaskListOnScreen(driver, waitShort)
        simbadAfterImport(driver, waitLong)
        renameProject(driver, testName)

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

    test_simbadBasic(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                     )
