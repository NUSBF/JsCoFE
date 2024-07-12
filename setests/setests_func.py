
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re


def clickByXpath(driver, xpath):
    textEls = driver.find_elements(By.XPATH, xpath)
    #print('clckByXpath - "%s", %d elements' % (xpath, len(textEls)))
    for textEl in reversed(textEls):
#        parentEl = textEl.find_element_by_xpath("..")
        if textEl.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", textEl)
            ActionChains(driver).move_to_element(textEl).click(textEl).perform()
            return True

    return False

def clickByID(driver, id):
    textEls = driver.find_elements(By.ID, id)
    #print('clckByXpath - "%s", %d elements' % (xpath, len(textEls)))
    for textEl in reversed(textEls):
#        parentEl = textEl.find_element_by_xpath("..")
        if textEl.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", textEl)
            ActionChains(driver).move_to_element(textEl).click(textEl).perform()
            return True

    return False


def clickByXpathMultiple(driver, xpath, n):
    textEls = driver.find_elements_by_xpath(xpath)
    i = 1
    for textEl in textEls:
        if textEl.is_displayed():
            if i == n: # I have no idea why it finds two times more elements, but multiplying by 2 works!
                driver.execute_script("arguments[0].scrollIntoView();", textEl)
                ActionChains(driver).move_to_element(textEl).click(textEl).perform()
                break
            else:
                i += 1


def doubleClickByXpath(driver, xpath):
    textEls = driver.find_elements_by_xpath(xpath)
    for textEl in textEls:
#        parentEl = textEl.find_element_by_xpath("..")
        if textEl.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", textEl)
            ActionChains(driver).move_to_element(textEl).double_click(textEl).perform()
            break


def loginToCloud(driver, cloudLogin, cloudPassword, nologin):
    # potential maintenance message
    if not nologin:
        time.sleep(1)
        msgButtons = driver.find_elements_by_xpath("//button[normalize-space()='Ok']")
        if len(msgButtons) > 0:
            msgButtons[-1].click()
            time.sleep(2)

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
    else:
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Go to your projects')
        time.sleep(2)

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

            textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Yes, delete')
            if len(textEls) > 0:
                textEls[-1].click()
                time.sleep(1)
            else:             
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

    if not clickByXpath(driver, "//*[normalize-space()='%s']" % 'Expert'):
        time.sleep(1)
        clickByXpath(driver, "//*[normalize-space()='%s']" % 'Standard')
    time.sleep(1)


    # Now there are two 'Add' buttons and we want to click second one
    addButtons = driver.find_elements_by_xpath("//button[contains(text(),'Add')]")
    addButtons[-1].click()

    return()


def importLocalProject(driver, testProjectName):
    print ('Importing local project. file name: %s' % (testProjectName))

    # click add button
    addButton = driver.find_element_by_xpath("//button[normalize-space()='Import']")
    ActionChains(driver).move_to_element(addButton).click(addButton).perform()
    time.sleep(1)

#    addButton = driver.find_element_by_xpath("//button[normalize-space()='Select project archive(s)']")
#    ActionChains(driver).move_to_element(addButton).click(addButton).perform()
#    time.sleep(1)


    # Shall return list of two elements for project creation
    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads')]")

    projectInputs[0].send_keys(testProjectName)
    time.sleep(120)

    clickByXpath(driver, "//button[normalize-space()='Close']")
    #clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def enterProject(driver, projectId):
    print ('Entering test project. ID: %s' % projectId)
# ugly hack with try/except to make second attempt - there are regular problems with stale element or rect undefined due to refresh
    try:
        time.sleep(1)
        doubleClickByXpath(driver, "//*[contains(text(),'%s')]" % projectId )
    except:
        time.sleep(1.7)
        doubleClickByXpath(driver, "//*[contains(text(),'%s')]" % projectId)

    time.sleep(1)
    return()


def importLocal_P9(driver, dirName, waitShort=90):
    print ('Importing P9 from local disk. Dir name: %s' % (dirName))


    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Upload', 'Import'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Upload', 'file(s)'))
    time.sleep(1)

    scaFileName = os.path.join(dirName, 'p9_sca', 'p9.sca')
    seqFileName = os.path.join(dirName, 'p9_sca', 'p9.seq')

    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads[]')]")
    projectInputs[-1].send_keys(scaFileName)
    inputWaveLength = driver.find_elements_by_xpath("//input[@type='text']")
    inputWaveLength[-1].click()
    inputWaveLength[-1].clear()
    inputWaveLength[-1].send_keys('1.2')
    time.sleep(1)

    clickByXpath(driver, "//button[normalize-space()='Apply & Upload']")
    time.sleep(5)
    clickByXpath(driver, "//button[normalize-space()='Upload more files']")
    time.sleep(2)

    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads[]')]")
    projectInputs[-1].send_keys(seqFileName)
    inputWaveLength = driver.find_elements_by_xpath("//input[@type='text']")
    inputWaveLength[-1].click()
    inputWaveLength[-1].clear()
    inputWaveLength[-1].send_keys('1.2')
    time.sleep(1)
    clickByXpath(driver, "//button[normalize-space()='Apply & Upload']")
    time.sleep(5)
    time.sleep(2)

    clickByXpath(driver, "//button[normalize-space()='Finish import']")
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, waitShort)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently tha task importFromFiles has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


    return()


def importFromCloud_rnase(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)


    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
        namesTestData = False
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
        namesTestData = False
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 Examples')
        namesTestData = False
    if len(textEl2) < 1:
        print('Cant locate neither "test-data", nor "CCP4 (E/e)xamples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a', 'rnase'),
                                ('a', 'rnase_model.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'rnase18_Nat_Complexes.mtz'),
                                ('button', 'Select more files'),
                                ('a', 'rnase.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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


def importFromCloud_insulin(driver, waitShort):
    print ('Importing insulin from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "test-data" nor "CCP4 examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','insulin'),
                                ('a','insulin.mtz'),
                                ('button','Select more files'),
                                ('a', 'insulin.seq'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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
        print('Apparently tha task import insulin has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()

def importFromCloud_gamma_mtz(driver, waitShort):
    print ('Importing gamma from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "test-data" nor "CCP4 examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','gamma_solved'),
                                ('a','gamma_solved.mtz'),
                                ('button', 'Finish import')]

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
        print('Apparently tha task import gamma has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_mdm2(driver, waitShort):
    print ('Importing mdm2 from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "test-data" nor "CCP4 examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2_nolig'),
                                ('a','mdm2_unmerged.mtz'),
                                ('button','Select more files'),
                                ('a', '4hg7.pdb'),
                                ('button', 'Select more files'),
                                ('a', '4hg7.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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
        print('Apparently tha task import has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_mdm2NoLigand(driver, waitShort):
    print ('Importing mdm2 from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "test-data" nor "CCP4 examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2_nolig'),
                                ('a','4hg7.mtz'),
                                ('button','Select more files'),
                                ('a', '4hg7_nolig.pdb'),
                                ('button', 'Select more files'),
                                ('a', '4hg7.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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
        print('Apparently tha task import has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_rnaseHHPRED(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)
    
    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)


    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
        namesTestData = False
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
        namesTestData = False
    if len(textEl2) < 1:
        print('Cant locate neither "test-data", nor "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a', 'rnase'),
                                ('a', '1sar.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'rnase_model.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'rnase.hhr'),
                                ('button', 'Select more files'),
                                ('a', 'rnase18_Nat_Complexes.mtz'),
                                ('button', 'Select more files'),
                                ('a', 'rnase.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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


def importFromCloud_rnaseNochains(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
        namesTestData = False
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
        namesTestData = False
    if len(textEl2) < 1:
        print('Cant locate neither "test-data", nor "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a', 'rnase'),
                                ('a', 'rnase_polyala.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'rnase18_Nat_Complexes.mtz'),
                                ('button', 'Select more files'),
                                ('a', 'rnase.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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


def importFromCloud_twin(driver, waitShort):
    print ('Importing "twin" project from the Cloud Import')

    # Clicking "Cloud Import"
    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Select', 'file(s)'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
        namesTestData = False
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
        namesTestData = False
    if len(textEl2) < 1:
        print('Cant locate neither "test-data", nor "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a', 'twin'),
                                ('a', 'twin.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'twin.mtz'),
                                ('button', 'Select more files'),
                                ('a', 'twin.fasta'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

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



def asymmetricUnitContentsAfterCloudImport(driver, waitShort, task='0002'):
    print ('Making Asymmetric Unit Contents after Cloud Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # 2 molecules in the ASU
#    inputASU = driver.find_element_by_xpath("//*[@title='Specify stoichiometric coefficent for given sequence in the crystal']")
#    inputASU.click()
#    inputASU.clear()
#    inputASU.send_keys('2')
#    time.sleep(1)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[%s]')]" % task)))
    except:
        print('Apparently tha task asymmetricUnitContentsAfterCloudImport has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(3)

    return()


def editRevisionStructure_rnase(driver, waitShort):
    print('Making structure revision')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Edit Structure Revision')
    time.sleep(1)

    clickByXpathMultiple(driver, "//span[normalize-space()='%s']" % '[do not change]', 6) # 6 = 3*2, I have no idea why there are two times more elements
    time.sleep(1)

    clickByXpath(driver, "//div[contains(text(), '%s') and contains(text(), '%s')]" % ('rnase', 'xyz'))
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def editRevisionStructure_any(driver, waitShort, name=''):
    print('Making structure revision')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Edit Structure Revision')
    time.sleep(1)

    clickByXpathMultiple(driver, "//span[normalize-space()='%s']" % '[do not change]', 6) # 6 = 3*2, I have no idea why there are two times more elements
    time.sleep(1)

    clickByXpath(driver, "//div[contains(text(), '%s') and contains(text(), '%s')]" % (name, 'xyz'))
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def editRevisionStructure_2fx0(driver, waitShort):
    print('Making structure revision 2fx0')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Edit Structure Revision')
    time.sleep(1)

    clickByXpathMultiple(driver, "//span[normalize-space()='%s']" % '[do not change]', 6) # 6 = 3*2, I have no idea why there are two times more elements
    time.sleep(1)

    clickByXpath(driver, "//div[contains(text(), '%s') and contains(text(), '%s')]" % ('2fx0', 'xyz'))
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def importFromPDB_2fx0(driver, waitShort):
    print ('Importing 2fx0 from the PDB')

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    clickByXpath(driver,"//*[starts-with(text(), '%s')]" % 'Import from PDB')
    time.sleep(3)
    
    try:
        inputPDB = driver.find_element_by_xpath("//input[@title='Comma-separated list of PDB and/or UniProt codes to import data from']")
        inputPDB.clear()
        inputPDB.send_keys('2fx0')
        time.sleep(2)
    except:
        inputPDB = driver.find_element_by_xpath("//input[@title='Comma-separated list of PDB codes to import data from']")
        inputPDB.clear()
        inputPDB.send_keys('2fx0')
        time.sleep(2)            
        


    # 2FX0

        

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'reflection data')
    time.sleep(2)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'sequences')
    time.sleep(2)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'structure revision')
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


def asymmetricUnitContents_2fx0(driver, waitShort):
    print ('Making Asymmetric Unit Contents after PDB Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
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

def exitProject(driver):
    print('exiting test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Project folder')


    time.sleep(3)



def cloneProject(driver, testName):
    print('cloning test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Project folder')

    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
    time.sleep(1)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Clone')
    time.sleep(1)
    cloneButton = driver.find_element_by_xpath("//button[normalize-space()='Clone']")
    ActionChains(driver).move_to_element(cloneButton).click(cloneButton).perform()
    time.sleep(1)

    projectInput = driver.find_elements_by_xpath("//input[contains(@value,'%s')]" % testName)
    projectInput[0].click()
    projectInput[0].clear()
    projectInput[0].send_keys('clonedTest')
    projectInput[-1].click()
    projectInput[-1].clear()
    projectInput[-1].send_keys('Cloned_%s' % testName)

    textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Clone')
    textEls[-1].click()
    time.sleep(6)
    # wait.until(EC.presence_of_element_located
    #                ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'CloneTest-clone')")))


    return ()

def renameProject(driver, testName):
    print('Renaming succesfull test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1)
    try:
        clickResult = clickByXpath(driver, "//*[normalize-space()='%s']" % 'Project folder')
        time.sleep(3)
    except: pass
    # try:
    #     clickResult = clickByXpath(driver, "//*[normalize-space()='%s']" % 'Back to Projects')
    # except: pass
    if not clickResult:
        clickByXpath(driver, "//*[normalize-space()='%s']" % 'Back to Projects')
    time.sleep(3)

    clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
    time.sleep(3)

    clickByXpath(driver, "//*[normalize-space()='%s']" % 'Rename')
    time.sleep(3)

    # Shall return list of two elements for project creation
    projectInput = driver.find_elements_by_xpath("//input[contains(@value,'%s')]" % testName)
    projectInput[-1].click()
    projectInput[-1].clear()
    projectInput[-1].send_keys('Successfull - %s' % testName)

    textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Rename')
    textEls[-1].click()
    time.sleep(1)

    return ()


def clickTaskInTaskTree(driver, taskName):
    time.sleep(1)
    fullText = ''
    ttts = tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search(taskName, taskText)
        if match:
            print ('Clicking task "%s" in the task tree' % taskText)
            fullText = taskText
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


def doubleClickTaskInTaskTree(driver, taskName):
    time.sleep(1)
    fullText = ''
    ttts = tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search(taskName, taskText)
        if match:
            print ('Double clicking task "%s" in the task tree' % taskText)
            fullText = taskText
            break

    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    driver.execute_script("arguments[0].scrollIntoView();", taskElement)
    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    ActionChains(driver).move_to_element(taskElement).perform()
    taskElement = driver.find_element(By.XPATH,
                                     "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor') and normalize-space()='%s']" % fullText)
    ActionChains(driver).double_click(taskElement).perform()
    return ()


def tasksTreeTexts(driver):
    # hack with try/except to make many attempts in the case page was 'refreshed' - tests fail with this nonsense regularly
    c = 1
    treeRead = False
    realTexts = []

    while not treeRead and c <= 5: # 5 attempts
        try:
            time.sleep(0.2)
            realTexts = []
            tasksText = driver.find_elements(By.XPATH,
                                             "//a[contains(@id,'treenode') and contains(@class, 'jstree-anchor')]")
            for t in tasksText:
                realTexts.append(t.text)

            treeRead = True

        except:
            c += 1

    return realTexts


def startBrowser(remote, browser):
    if len(remote) > 1:  # Running on Selenium Server hub
        waitShort = 90  # seconds for quick tasks
        waitLong = 240  # seconds for longer tasks

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
        waitShort = 30  # seconds for quick tasks
        waitLong = 180  # seconds for longer tasks

        if browser == 'Chrome':
            driver = webdriver.Chrome()
        elif browser == 'Firefox':
            driver = webdriver.Firefox()
        else:
            print('Browser "%s" is not recognised; shall be Chrome or Firefox.' % browser)
            sys.exit(1)

    driver.implicitly_wait(5)  # wait for up to 5 seconds for required HTML element to appear

    return (driver, waitLong, waitShort)


def startRefmac(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1.05)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
        time.sleep(1)
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
        time.sleep(1.05)
    except:
        pass
    
    try:
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
        time.sleep(1)
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
        time.sleep(1.05)
    except:
        pass

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(7)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def verifyRefmac(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('REFMAC5 verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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


def startModelcraft_basic(driver):
    print('Running Modelcraft in fast mode')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    
    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building')
    time.sleep(1)
    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with ModelCraft')
    time.sleep(1)

    clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full')
    time.sleep(1)

    try:
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Basic')
        time.sleep(1)
    except:
        pass    

    try:
        clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Fast')
        time.sleep(1)
    except:
        pass




    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(3)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(3)

    return ()


def verifystartModelcraft_basic(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('Modelcraft verification, job ' + jobNumber)

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\].*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Modelcraft results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Buccaneer run')
    else:
        print('*** Verification: Modelcraft Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


class driverHandler:
    driver = None
    testName = ''

    browser = ''
    cloud = ''
    nologin = None
    login = ''
    password = ''
    remote = ''

    waitShort = 0
    waitLong = 0

