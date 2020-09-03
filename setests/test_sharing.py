
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

def doubleClickByXpath(driver, xpath):
    textEls = driver.find_elements_by_xpath(xpath)
    for textEl in textEls:
#        parentEl = textEl.find_element_by_xpath("..")
        if textEl.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", textEl)
            ActionChains(driver).move_to_element(textEl).double_click(textEl).perform()
            break


def loginToCloud(driver, cloudLogin, cloudPassword):
    # Shall return list of two elements for login and password
    print('Logging into cloud with username %s' % cloudLogin)
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


def logoutToRelogin(driver):
    print ('Logging out.')
    logoutImg = driver.find_element_by_xpath("//img[contains(@src,'images_png/logout.png')]")
    logoutImg.click()
    time.sleep(0.25)

    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Back to User Login')
    time.sleep(0.25)

    return ()


def removeProject(driver, testName):
    print('Deleting previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[normalize-space()='%s']" % testName)

    if len(textEls) > 0:
        clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
        time.sleep(0.25)

        clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
        time.sleep(0.25)

        textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Delete')
        textEls[-1].click()
        time.sleep(0.25)

    return ()


def unjoinProject(driver, testName):
    print('Unjoining from previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[normalize-space()='%s']" % testName)

    if len(textEls) > 0:
        clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
        time.sleep(0.25)

        clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
        time.sleep(0.25)

        textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Unjoin')
        textEls[0].click()
        time.sleep(0.25)

    return ()


def areWeAtProjectList(driver):
    textEls = driver.find_elements_by_xpath("//div[normalize-space()='My Projects']")

    while len(textEls) < 1: # we are not at the project list
        try:
            menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
            menuButton.click()
            time.sleep(0.25)

            clickByXpath(driver, "//*[normalize-space()='%s']" % 'My Projects')
            time.sleep(0.25)
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
    time.sleep(0.25)

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

    time.sleep(0.25)
    # Now there are two 'Add' buttons and we want to click second one
    addButtons = driver.find_elements_by_xpath("//button[normalize-space()='Add']")
    addButtons[1].click()

    return()


def enterProject(driver, projectId):
    print ('Entering test project. ID: %s' % projectId)
    time.sleep(0.25)
    projectCell = driver.find_element_by_xpath("//*[contains(text(),'%s')]" % projectId )
    ActionChains(driver).double_click(projectCell).perform()
    return()


def importFromCloudWithTaskListOnScreen(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')

    # Clicking "Cloud Import"
    textEl = driver.find_element_by_xpath("//*[normalize-space()='%s']" % 'Cloud Import')
    ActionChains(driver).double_click(textEl).perform()
    time.sleep(0.25)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(0.25)

    listOfTextsToDoubleClick = [('a','rnase'),
                                ('a','rnase_model.pdb'),
                                ('button','Select more files'),
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
        time.sleep(0.25)

#    taskWindowTitle = driver.find_element(By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), '[0001]')]")
    try:
        wait = WebDriverWait(driver, waitShort)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently the task importFromCloudWithTaskListOnScreen has not been completed in time; terminating')
        sys.exit(1)
    time.sleep(0.25)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(0.25)

    return ()


def asymmetricUnitContentsAfterCloudImport(driver, waitShort):
    print ('Making Asymmetric Unit Contents after Cloud Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # 2 molecules in the ASU
    inputASU = driver.find_element_by_xpath("//*[@title='Specify stoichiometric coefficent for given sequence in the crystal']")
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
        wait = WebDriverWait(driver, waitShort) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0002]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task asymmetricUnitContentsAfterCloudImport has not been completed in time; terminating')
        sys.exit(1)
    time.sleep(1)

    # presing Close button
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def editRevisionStructure(driver, waitShort):
    print('Making structure revision')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(0.25)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(0.25)

    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Edit Revision: Structure')
    time.sleep(0.25)

    clickByXpath(driver, "//span[normalize-space()='%s']" % '[do not change]')
    time.sleep(0.25)

    clickByXpath(driver, "//div[contains(text(), '%s')]" % 'rnase_model /xyz/')
    time.sleep(0.25)

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
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)
    time.sleep(0.25)

    # presing Close button
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(0.25)

    return ()


def startRefmac(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(0.25)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(0.25)

    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Refinement with Refmac')
    time.sleep(0.25)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    # pressing Close button
#    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
#    closeButton.click()
#    time.sleep(1)

    return ()


def verifyRefmac(driver, waitLong, jobNumber, targetRwork, targetRfree):
        rWork = 1.0
        rFree = 1.0
        print('REFMAC5 verification, job ' + jobNumber)

        time.sleep(0.25)
        startTime = time.time()

        while (True):
            tasksText = driver.find_elements(By.XPATH,
                                             "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for taskText in tasksText:
                # Job number as string
                match = re.search('\[' + jobNumber +'\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
                    break
            if (rWork != 1.0) or (rFree != 1.0):
                break
            curTime = time.time()
            if curTime > startTime + float(waitLong):
                print('*** Timeout for REFMAC5 results! Waited for %d seconds.' % waitLong)
                break
            time.sleep(10)


        if (rWork == 1.0) or (rFree == 1.0):
            print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
        else:
            print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
        assert rWork < targetRwork
        assert rFree < targetRfree


def renameProject(driver, testName):
    print('Renaming succesfull test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'My Projects')
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Rename')
    time.sleep(0.25)

    # Shall return list of two elements for project creation
    projectInput = driver.find_element_by_xpath("//input[@value='%s']" % testName)
    projectInput.click()
    projectInput.clear()
    projectInput.send_keys('Successfull - %s' % testName)


    textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Rename')
    textEls[-1].click()
    time.sleep(0.25)

    return ()


def shareProject(driver, login):
    print('Sharing test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Share Project')
    time.sleep(0.25)

    projectSharing = driver.find_element_by_xpath("//input[@placeholder='%s']" % 'login1,login2,...')
    projectSharing.click()
    projectSharing.clear()
    projectSharing.send_keys(login)
    time.sleep(0.25)

    clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Share Project')
    time.sleep(0.25)


    clickByXpath(driver, "//button[normalize-space()='%s']" % 'Apply')
    time.sleep(0.25)

    clickByXpath(driver, "//button[normalize-space()='%s']" % 'Ok')
    time.sleep(0.25)


    return ()


def joinSharedProject(driver, testName):
    print('Getting shared project')
    clickByXpath(driver, "//div[normalize-space()='%s']" % 'Join')
    time.sleep(0.25)

    clickByXpath(driver, "//span[@class='ui-selectmenu-icon ui-icon ui-icon-triangle-1-s']")
    time.sleep(0.25)

    clickByXpath(driver, "//*[contains(text(), '%s')]" % testName)
    time.sleep(0.25)

    clickByXpath(driver, "//button[contains(@style, 'images_png/share.png')]")
    time.sleep(10)

    clickByXpath(driver, "//button[normalize-space()='%s']" % 'Close')
    time.sleep(0.25)

    return ()


def startSimbad(driver):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
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

    time.sleep(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()

def verifySimbad(driver, waitLong):

    solv = 0.0
    print('SIMBAD verification')

    time.sleep(0.25)
    startTime = time.time()

    while (True):
        tasksText = driver.find_elements(By.XPATH,
                                         "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
        for taskText in tasksText:
            match = re.search('\[0005\] simbad -- Solv=(.*)\%', taskText.text)
            if match:
                solv = float(match.group(1))
                break
        if (solv != 0.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SIMBAD results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (solv == 0.0):
        print('*** Verification: could not find Solv value after SIMBAD run')
    else:
        print('*** Verification: SIMBAD ' \
              'Solv is %0.1f %%(expecting >45.0 and <50.0), '  % (solv))
    assert solv < 50.0
    assert solv > 45.0

    return ()


def clickTaskInTaskTree(driver, taskName):
    time.sleep(1)
    tasksText = driver.find_elements(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-ancho')]")
    fullText = ''
    for taskText in tasksText:
        match = re.search(taskName, taskText.text)
        if match:
            print ('Clicking task "%s" in the task tree' % taskText.text)
            fullText = taskText.text
            break

    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    driver.execute_script("arguments[0].scrollIntoView();", taskElement)
    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    ActionChains(driver).move_to_element(taskElement).perform() #click(taskElement).perform()
    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    taskElement.click()

    return ()

def startMrbump(driver):

    print('Starting MrBUMP')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(0.25)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(0.25)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(0.25)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MrBump: Model Search & Preparation')
    time.sleep(0.25)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]")
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(0.25)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(0.25)

    return ()


def verifyMrBump(driver):

    rWork = 1.0
    rFree = 1.0
    compl = 0.0
    print('MRBUMP verification')

    time.sleep(0.25)
    startTime = time.time()

    while (True):
        tasksText = driver.find_elements(By.XPATH,
                                         "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
        for taskText in tasksText:
            match = re.search('\[0006\] mrbump -- Compl=(.*)\% R=(0\.\d*) Rfree=(0\.\d*)', taskText.text)
            if match:
                compl = float(match.group(1))
                rWork = float(match.group(2))
                rFree = float(match.group(3))
                break
        if (rWork != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + 600.0:
            print('*** Timeout for MRBUMP results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0) or (compl == 0.0):
        print('*** Verification: could not find compl or Rwork or Rfree value after MrBUMP run')
    else:
        print('*** Verification: MrBUMP ' \
              'Compl is %0.1f %%(expecting >90.0), ' \
              'Rwork is %0.4f (expecting <0.28), ' \
              'Rfree is %0.4f (expecing <0.31)' % (compl, rWork, rFree))
    assert rWork < 0.28
    assert rFree < 0.31
    assert compl > 90.0

    return ()



def test_sharingBasic(browser,
                      cloud,
                      nologin,
                      login,
                      password,
                      remote
                      ):


    if len(remote) > 1:  # Running on Selenium Server hub
        waitShort = 90  # seconds for quick tasks
        waitLong = 240  # seconds for longer tasks

        if browser == 'Chrome':
            options = webdriver.ChromeOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
            driver2 = webdriver.Remote(command_executor=remote, options=options)
        elif browser == 'Firefox':
            options = webdriver.FirefoxOptions()
            driver = webdriver.Remote(command_executor=remote, options=options)
            driver2 = webdriver.Remote(command_executor=remote, options=options)
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)
    else:  # Running locally
        waitShort = 90  # seconds for quick tasks
        waitLong = 240  # seconds for longer tasks

        if browser == 'Chrome':
            driver = webdriver.Chrome()
            driver2 = webdriver.Chrome()
        elif browser == 'Firefox':
            driver = webdriver.Firefox()
            driver2 = webdriver.Firefox()
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)

    driver.implicitly_wait(10)  # wait for up to 10 seconds for required HTML element to appear
    driver2.implicitly_wait(10)  # wait for up to 10 seconds for required HTML element to appear

    try:
        print('Opening URL driver 1: %s' % cloud)
        driver.get(cloud)
        assert "CCP4 Cloud" in driver.title
        if not nologin:
            loginToCloud(driver, login, password)


        print('Opening URL driver 2: %s' % cloud)
        driver2.get(cloud)
        assert "CCP4 Cloud" in driver2.title
        if not nologin:
            loginToCloud(driver2, login+'2', password)

        testName = 'sharingTest'

        removeProject(driver, testName)
        unjoinProject(driver2, '[' + login + ']:' + testName)

        makeTestProject(driver, testName, testName)
        enterProject(driver, testName)
        importFromCloudWithTaskListOnScreen(driver, waitShort)

        shareProject(driver, login+'2')
        joinSharedProject(driver2, testName)
        enterProject(driver2, testName)
        time.sleep(1)
        asymmetricUnitContentsAfterCloudImport(driver2, waitShort)
        time.sleep(1)

        clickTaskInTaskTree(driver, '\[0002\] asymmetric unit contents')
        time.sleep(1)
        editRevisionStructure(driver, waitShort)
        time.sleep(1)

        clickTaskInTaskTree(driver2, '\[0003\] edit revision structure')
        time.sleep(1)
        startRefmac(driver2, waitLong)
        time.sleep(1)
        clickTaskInTaskTree(driver, '\[0002\] asymmetric unit contents')
        time.sleep(2) # sensitive
        startSimbad(driver)

        # pressing Close button for REFMAC window
        closeButton = driver2.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        closeButton.click()
        time.sleep(0.25)
        clickTaskInTaskTree(driver2, '\[0002\] asymmetric unit contents')
        time.sleep(0.25)
        startMrbump(driver2)

        verifySimbad(driver2, waitLong)
        clickTaskInTaskTree(driver, '\[0005\] simbad')
        startRefmac(driver, waitLong)

        verifyRefmac(driver, waitLong, '0004', 0.17, 0.2)
        verifyRefmac(driver2, waitLong, '0007', 0.24, 0.27)

        verifyMrBump(driver)

        renameProject(driver, testName)

        driver.quit()
        driver2.quit()

    except:
        driver.quit()
        driver2.quit()
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

    test_sharingBasic(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
