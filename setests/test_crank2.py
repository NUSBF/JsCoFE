
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


def areWeAtProjectList(driver):
    textEls = driver.find_elements_by_xpath("//div[normalize-space()='My Projects']")

    while len(textEls) < 1: # we are not at the project list
        try:
            menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
            menuButton.click()
            time.sleep(1)

            clickByXpath(driver, "//*[normalize-space()='%s']" % 'My Projects')
            time.sleep(1)
        except:
            try:
                cancelButtons = driver.find_elements(By.XPATH, "//button[normalize-space()='Cancel']")
                for cancelButton in cancelButtons:
                    if cancelButton.is_displayed():
                        cancelButton.click()

                closeButtons = driver.find_elements(By.XPATH, "//button[normalize-space()='Close']")
                for closeButton in closeButtons:
                    if closeButton.is_displayed():
                        closeButton.click()

            except:
                pass


        textEls = driver.find_elements_by_xpath("//div[normalize-space()='My Projects']")

    textEls[-1].click()
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


def importFromPDB(driver, waitShort):
    print ('Importing 2fx0 from the PDB')

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Import from PDB')
    time.sleep(1)

    # 2FX0
    time.sleep(2)
    inputPDB = driver.find_element_by_xpath("//input[@title='Comma-separated list of PDB codes to import data from']")
    inputPDB.clear()
    inputPDB.send_keys('2fx0')
    time.sleep(2)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'reflection data')
    time.sleep(2)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'sequences')
    time.sleep(2)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'structure revision')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently tha task importFromPDB has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def asymmetricUnitContentsAfterPDBImport(driver, waitShort):
    print ('Making Asymmetric Unit Contents after PDB Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # Se is main scatterer
    inputScaterer = driver.find_element_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputScaterer.click()
    inputScaterer.clear()
    inputScaterer.send_keys('Se')
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
        print('Apparently tha task asymmetricUnitContentsAfterPDBImport has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


def startCrank2(driver):
    print('Starting CRANK2 for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Crank-2 Automated Experimental Phasing')
    time.sleep(1)


    clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)

    clickByXpath(driver, "//div[contains(text(), '%s')]" % 'peak')
    time.sleep(1)

    # 3 Se atoms
    inputNatoms = driver.find_element_by_xpath("//input[@title='Optional number of substructure atoms in asymmetric unit. Leave blank for automatic choice.']")
    inputNatoms.clear()
    inputNatoms.send_keys('3')
    time.sleep(1)

    # Solvent content is 0.71
    inputSolvent = driver.find_element_by_xpath("//input[@title='Solvent content to be used in calculations (must be between 0.01 and 0.99). If left blank, solvent fraction from asymmetric unit definition will be used.']")
    inputSolvent.clear()
    inputSolvent.send_keys('0.71')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    # Logging out
    buttonsLogout = driver.find_elements_by_xpath("//img[contains(@src, 'images_png/logout.png')]" )
    for buttonLogout in buttonsLogout:
        if buttonLogout.is_displayed():
            buttonLogout.click()
            break
    time.sleep(2)

    return()


def validateCrank2run(driver):

    rWork = 1.0
    rFree = 1.0
    tasksText = driver.find_elements(By.XPATH, "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
    for taskText in tasksText:
        match = re.search(r'^\[0003\] EP with Crank2 \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Crank2 run')
    else:
        print('*** Verification: Crank2 Rwork is %0.4f (expecting <0.33), Rfree is %0.4f (expecting <0.38)' % (rWork, rFree))
    assert rWork < 0.33
    assert rFree < 0.38

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


def startBrowser(remote, browser):
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

    return (driver, waitLong, waitShort)


def test_Crank2Basic(browser,
                cloud,
                nologin,
                login,
                password,
                remote
                ):

    (driver, waitLong, waitShort) = startBrowser(remote, browser)

    try:
        print('Opening URL: %s' % cloud)
        driver.get(cloud)
        assert "CCP4 Cloud" in driver.title

        if not nologin:
            loginToCloud(driver, login, password)

        testName = 'crank2Test'

        removeProject(driver, testName)
        makeTestProject(driver, testName, testName)
        enterProject(driver, testName)
        importFromPDB(driver, waitShort)
        asymmetricUnitContentsAfterPDBImport(driver, waitShort)
        startCrank2(driver)

        # Logging off as Selenium become unstable with long connections
        driver.quit()
        print('Waiting for 1 hour 10 minutes until Crank2 is ready (shall finish in about 1 hour)...')
        time.sleep(4200) # Crank2 run takes around 1 hour and let's give it more time

        # Connecting again to check results
        (driver, waitLong, waitShort) = startBrowser(remote, browser)
        print('Opening URL: %s' % cloud)
        driver.get(cloud)
        assert "CCP4 Cloud" in driver.title

        if not nologin:
            loginToCloud(driver, login, password)

        enterProject(driver, testName)
        validateCrank2run(driver)
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

    test_Crank2Basic(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
