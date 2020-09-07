
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


def importFromPDB(driver, waitShort):
    print ('Importing 2fx0 from the PDB')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Import from PDB')
    time.sleep(1)

    # 2FX0
    time.sleep(2)
    inputPDB = driver.find_element_by_xpath("//input[@title='Comma-separated list of PDB codes to import data from']")
    inputPDB.clear()
    inputPDB.send_keys('2fx0')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'reflection data')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'sequences')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'structure revision')
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

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Asymmetric Unit Contents') # looking by text
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

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Crank-2 Automated Experimental Phasing')
    time.sleep(1)


    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'peak')
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
    found = False

    # For some reason it can't simply find element and on line [0003] generates StaleElementReferenceException
    # This is code for several attempts to overcome it. Also, looks like just time.sleep() fixes it.
    for attempts in range (5):
        if found:
            break
        time.sleep(2) # just in case
        try:
            tasksText = driver.find_elements(By.XPATH, "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for taskText in tasksText:
                print(taskText.text)
                match = re.search(r'^\[0003\] EP with Crank2 \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
                    found = True
                    break
        except:
            print('Exception on attempt %d' % attempts + 1)
            pass

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Crank2 run')
    else:
        print('*** Verification: Crank2 Rwork is %0.4f (expecting <0.33), Rfree is %0.4f (expecting <0.38)' % (rWork, rFree))
    assert rWork < 0.33
    assert rFree < 0.38

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
            sf.loginToCloud(driver, login, password)

        testName = 'crank2Test'

        sf.removeProject(driver, testName)
        sf.makeTestProject(driver, testName, testName)
        sf.enterProject(driver, testName)
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
            sf.loginToCloud(driver, login, password)

        sf.enterProject(driver, testName)
        validateCrank2run(driver)
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

    test_Crank2Basic(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
