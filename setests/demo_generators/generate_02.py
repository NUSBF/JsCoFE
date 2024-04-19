
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.dirname(os.path.abspath(__file__))
curPath = curPath+os.sep+'..'+ os.sep
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf

d = sf.driverHandler()



def importREADME_SAD(driver, waitShort):
    print ('Importing README - SAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[starts-with(text(), '%s')]" % 'tutorial-data')
    if len(textEl2) < 1:
        print('Cant locate neither "tutorial-data"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','2_phasing'),
                                ('a', 'gere_SAD'),
                                ('a','Tutorial-Notes.html'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task importing README for SAD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importREADME_MAD(driver, waitShort):
    print ('Importing README - MAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'tutorial-data')
    if len(textEl2) < 1:
        print('Cant locate neither "tutorial-data"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','2_phasing'),
                                ('a', 'gere_MAD'),
                                ('a','Tutorial-Notes.html'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0007]')]")))
    except:
        print('Apparently tha task importing README for MAD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_SAD(driver, waitShort):
    print ('Importing gere SAD from the Cloud Import')

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/add.png')]")
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'tutorial-data')
    if len(textEl2) < 1:
        print('Cant locate neither "tutorial-data"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','2_phasing'),
                                ('a', 'gere_SAD'),
                                ('a','gere.mtz'),
                                ('button','Select more files'),
                                ('a', 'gere.fasta'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task import gere SAD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_MAD(driver, waitShort):
    print ('Importing gere MAD from the Cloud Import')

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/add.png')]")
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'tutorial-data')
    if len(textEl2) < 1:
        print('Cant locate neither "tutorial-data"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','2_phasing'),
                                ('a', 'gere_MAD'),
                                ('a','gere_scaled_data.mtz'),
                                ('button','Select more files'),
                                ('a', 'gere.fasta'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0008]')]")))
    except:
        print('Apparently tha task import gere MAD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def asymmetricUnitContents_SAD(driver, waitShort):
    print ('Making Asymmetric Unit Contents SAD')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('Se')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task asymmetricUnitContents_SAD has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def asymmetricUnitContents_MAD(driver, waitShort):
    print ('Making Asymmetric Unit Contents MAD')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % '[0008-01] gere_scaled_data [gere/gere/native] /hkl/') # looking by text
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % '[0008-03] gere_scaled_data [gere/gere3/peak] /hkl/anom/') # looking by text
    time.sleep(2)

    inputASU = driver.find_element_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('Se')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0009]')]")))
    except:
        print('Apparently tha task asymmetricUnitContents_MAD has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def startCrank2_SAD(driver):
    print('Starting CRANK2 SAD for experimental phasing')

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

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)


    return()


def startCrank2_MAD(driver):
    print('Starting CRANK2 MAD for experimental phasing')

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

    sf.clickByXpathMultiple(driver, "//*[contains(text(), '%s')]" % '[do not use]', 1)
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % '[0008-02] gere_scaled_data [gere/gere3/lrm] /hkl/anom/')
    time.sleep(1)
    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'low remote')
    time.sleep(1)

    sf.clickByXpathMultiple(driver, "//*[contains(text(), '%s')]" % '[do not use]', 1)
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % '[0008-05] gere_scaled_data [gere/gere3/hrm] /hkl/anom/')
    time.sleep(1)
    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'high remote')
    time.sleep(1)

    sf.clickByXpathMultiple(driver, "//*[contains(text(), '%s')]" % '[do not use]', 1)
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % '[0008-04] gere_scaled_data [gere/gere3/infl] /hkl/anom/')
    time.sleep(1)
    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)
    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'inflection')
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)


    return()


def verifyCrank2(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('CRANK2 verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] EP with Crank2 \(...\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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


def addRemark(driver, title, detail, colour=None):
    print('Adding remark: %s' % title)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/task_remark.png')]")
    addButton.click()
    time.sleep(1)

    inputTitle = driver.find_elements_by_xpath("//input[@title='A single-line description of the job, which will appear in the Project Tree. The description can be changed before or after running the job.']")
    inputTitle[-1].clear()
    inputTitle[-1].send_keys(title)
    time.sleep(1)

    inputDetail = driver.find_elements_by_xpath("//textarea[@placeholder='Optional detail description may be placed here']")
    inputDetail[-1].clear()
    inputDetail[-1].send_keys(detail)
    time.sleep(1)

    if colour is not None:
        colourButton = driver.find_element(By.XPATH, "//div[@class='menu-dropbtn' and contains(@style, 'images_png/task_remark_s.png')]")
        colourButton.click()
        time.sleep(1)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % colour)
        time.sleep(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


def addRemarkCloning(driver, title, detail, colour=None):
    print('Adding remark by cloning: %s' % title)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/clonejob.png')]")
    addButton.click()
    time.sleep(1)

    inputTitle = driver.find_element_by_xpath("//input[@title='A single-line description of the job, which will appear in the Project Tree. The description can be changed before or after running the job.']")
    inputTitle.clear()
    inputTitle.send_keys(title)
    time.sleep(1)

    inputDetail = driver.find_element_by_xpath("//textarea[@placeholder='Optional detail description may be placed here']")
    inputDetail.clear()
    inputDetail.send_keys(detail)
    time.sleep(1)

    if colour is not None:
        colourButton = driver.find_element(By.XPATH, "//div[@class='menu-dropbtn' and contains(@style, 'images_png/task_remark_s.png')]")
        colourButton.click()
        time.sleep(1)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % colour)
        time.sleep(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


def fitWaters(driver, wait):
    print('Fitting waters')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Ligands')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Find and Fit Waters')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, wait) # normally takes around 5 minutes giving 7
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0006]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0013]')]")))
    except:
        print('Apparently the task FitWaters has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    nwat = 0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0013\] fit waters -- Nwaters=(\d*)', taskText)
        if match:
            nwat = int(match.group(1))
            break
    if nwat == 0:
        print('*** Verification: could not find Nwaters result value after FitWaters run')
    else:
        print('*** Verification: Nwaters is %d %% (expecting > 100 %%)' % nwat)
    assert nwat > 100

    return ()


def refmac_14(driver, waitLong):
    print('Running REFMAC5 0014')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0014]')]")))
    except:
        print('Apparently tha task refmacAfterRevision has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0014\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.25), Rfree is %0.4f (expecing <0.34)' % (rWork, rFree))
    assert rWork < 0.25
    assert rFree < 0.34

    return ()


def generate_02(browser,
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

    d.testName = '02.auto-ep'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password, nologin)


        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, 'Simple Auto-EP with Crank-2')
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)

        sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        time.sleep(1)

        addRemark(d.driver, 'Based on CCP4 Gere example - SAD phasing', '')
        importREADME_SAD(d.driver, d.waitShort)
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        time.sleep(1)
        importFromCloud_SAD(d.driver, d.waitShort)
        asymmetricUnitContents_SAD(d.driver, d.waitShort)
        startCrank2_SAD(d.driver)

        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        time.sleep(1)
        addRemarkCloning(d.driver, 'Based on CCP4 Gere example - MAD phasing', '')
        importREADME_MAD(d.driver, d.waitShort)
        sf.clickTaskInTaskTree(d.driver, '\[0006\]')
        time.sleep(1)
        importFromCloud_MAD(d.driver, d.waitShort)
        asymmetricUnitContents_MAD(d.driver, d.waitShort)
        startCrank2_MAD(d.driver)

        verifyCrank2(d.driver, 3000, '0005', 0.25, 0.34)
        verifyCrank2(d.driver, 3000, '0010', 0.32, 0.41)


        sf.clickTaskInTaskTree(d.driver, '\[0010\]')
        time.sleep(1)
        addRemark(d.driver, 'R-factors are higher than in SAD branch, giving up', '', colour='Red') # 11, after 10
        sf.clickTaskInTaskTree(d.driver, '\[0005\]')
        time.sleep(1)
        addRemark(d.driver, 'Better R-factors than in MAD branch, continue from here', '') # 12, after 5
        time.sleep(1)
        fitWaters(d.driver, d.waitShort) # 13 after 12
        time.sleep(1)
        refmac_14(d.driver, d.waitLong)
        addRemark(d.driver, 'R-factors are too high to deposit, further refinement is needed', '', colour='Red')  # 15
        time.sleep(2)

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
    parser.add_argument('--login', action='store', dest='login', help=argparse.SUPPRESS, default='setests2') # Login
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    password = parameters.password
    if password == '':
        try:
            import os, sys, base64

            if sys.platform.startswith("win"):
                fileName = os.path.expanduser('%userprofile%\setest_pwd')
            else:
                fileName = os.path.expanduser('~/.setest_pwd')

            if os.path.exists(fileName):
                f = open(fileName, 'r')
                password = base64.b64decode(f.readline().decode('utf-8').strip() + '=')
                f.close()
        except:
            print('Something happend during attempt to read password from the pwd file')
            raise

    generate_02(browser=parameters.browser,  # or 'Chrome'
                cloud=parameters.cloud,
                nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                login=parameters.login,  # Used to login into remote Cloud
                password=password,  # Used to login into remote Cloud
                remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                )
