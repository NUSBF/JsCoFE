
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


remarkTitle1 = 'Based on CCP4 hen egg-white lysozyme example. Open this remark for input data location'
remarkDetail1 = """Data files for this project are stored in CCP4 Cloud and are available at

tutorial-data / 2_phasing / mr_sad
"""


def importData(driver, waitShort):
    print ('Importing data')
    time.sleep(1)

    # pressing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Cloud Import')
    time.sleep(1)


    listOfTextsToDoubleClick = [('a', 'tutorial-data'),
                                ('a', '2_phasing'),
                                ('a', 'mr_sad'),
                                ('a', '1fkq_prot.pdb'),
                                ('button', 'Select more files'),
                                ('a', 'lyso2001_scala1.mtz'),
                                ('button', 'Select more files'),
                                ('a', 'hewl.pir'),
                                ('button', 'Apply & Upload'),
                                ('button', 'Finish import')]

    for textToDoubleClick in listOfTextsToDoubleClick:
        textElements = driver.find_elements_by_xpath("//%s[contains(text(),'%s')]" % (textToDoubleClick[0], textToDoubleClick[1]))
        # It finds several elements with the same file name -> last one is the one we need
        driver.execute_script("arguments[0].scrollIntoView();", textElements[-1])
        ActionChains(driver).move_to_element(textElements[-1]).double_click(textElements[-1]).perform()
        time.sleep(1)

#    taskWindowTitle = driver.find_element(By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), '[0001]')]")
    try:
        wait = WebDriverWait(driver, waitShort)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task importFromCloudWithTaskListOnScreen has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def asymmetricUnitContentsAfterCloudImport(driver, waitShort, task='0003'):
    print ('Making Asymmetric Unit Contents after Cloud Import')

    # pressing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(2)

    inputASU = driver.find_elements_by_xpath("//input[@title='Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.), or leave blank if uncertain.']")
    inputASU[0].click()
    inputASU[0].clear()
    inputASU[0].send_keys('S')
    time.sleep(2)

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
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def startSHELXcd(driver):
    print('Starting SHELX-CD for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Substructure Search with SHELX-C/D')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(2)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


def validateSHELXcd(driver, waitLong):

    rWork = 1.0
    rFree = 1.0
    targetRwork = 0.65
    targetRfree = 0.65

    print ('SHELX CD verification - starting pulling job every 60 seconds')

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(r'^\[0005\] shelx-cd substructure search \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SHELX results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(60)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after SHELX run')
    else:
        print('*** Verification: SHELX Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def phaserEP_06(driver):
    print('Starting Phaser-EP for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing with Phaser')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0006]')]")))
    except:
        print('Apparently tha task Phaser-EP has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0006\] phaser EP \(SAD\) -- (.*)', taskText)
        if match:
            completed = match.group(1)
            break
    if completed == '':
        print('*** Verification: could not find completed value after Phaser EP run')
    else:
        print('*** Verification: Phaser EP completion message is %s (expecting "SpG=P 41 21 2")' % (completed))

    return()


def runParrot(driver, job, inverted=False):
    print('Running Parrot, job: ' + job)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Density Modification')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Density Modification with Parrot')
    time.sleep(2)

    if inverted:
        sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % 'original_hand')
        time.sleep(2)

        sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % 'inverted_hand')
        time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 300) # giving 5 minutes
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '["+job+"]')]")))
    except:
        print('Apparently tha task Parrot has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    fom = 0.0
    fcorr = 0.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\['+job+'\] parrot DM --\s(.*)', taskText)
        if match:
            completed = match.group(1)
            match2 = re.search('FOM=(\d\.\d*) Fcorr=(\d\.\d*)', match.group(1))
            if match2:
                fom = float(match2.group(1))
                fcorr = float(match2.group(2))
            break
    if completed == '':
        print('*** Verification: could not find completed value after Parrot run')
        assert completed == 'completed.'
    elif (completed != '') and (fom == 0.0) and (fcorr == 0.0):
        print('*** Verification: Parrot completion message in %s (expecting "completed.")' % (completed))
        assert completed == 'completed.'

    if (fom != 0.0) and (fcorr != 0.0):
        print('*** Verification: FOM %0.3f, Fcorr %0.3f (expecting >0.3, >0.6)' % (fom, fcorr))
        assert fom > 0.3
        assert fcorr > 0.6

    return ()


def startBuccaneer(driver):
    print('Running Buccaneer')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with Buccaneer')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Options')
    time.sleep(2)

    inputASU = driver.find_elements_by_xpath("//input[@title='Choose a value between 1 and 500']")
    inputASU[-1].click()
    inputASU[-1].clear()
    inputASU[-1].send_keys('10')
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


def verifyBuccaneer(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('Buccaneer verification, job ' + jobNumber)

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            if (targetRwork > 0.0) and (targetRfree > 0.0):
                # Job number as string
                match = re.search('\[' + jobNumber + '\].*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
                    break
            else:
                # Special case of failing buccaneer in the wrong spacegroup/hand/etc.
                # Job number as string
                match = re.search('\[' + jobNumber + '\].*--.*', taskText)
                rWork = 0.0
                rFree = 0.0
                if match:
                    break

        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Buccaneer results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Buccaneer run')
    else:
        print('*** Verification: Buccaneer Rwork is %0.4f (expecting <=%0.2f), Rfree is %0.4f (expecting <=%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork <= targetRwork
    assert rFree <= targetRfree

    return ()


def startCCP4Build(driver, inverted=False):
    print('Starting CCP4 build')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with CCP4Build')
    time.sleep(3)

    if inverted:
        sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % 'original_hand')
        time.sleep(2)

        sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % 'inverted_hand')
        time.sleep(2)

#    inputNcycles = driver.find_elements_by_xpath("//input[@title='Choose a value between 1 and 50 and not less than the minimum number of cycles']")
#    inputNcycles[-1].clear()
#    inputNcycles[-1].send_keys('3')
#    time.sleep(1)

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


def verifyCCP4Build(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    compl = 0.0
    print('CCP4Build verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            if (targetRwork > 0.0) and (targetRfree > 0.0):
                # Job number as string
                match = re.search('\[' + jobNumber + '\] ccp4build -- Compl=(.*)% R=(0\.\d*) Rfree=(0\.\d*)', taskText)
                if match:
                    compl = float(match.group(1))
                    rWork = float(match.group(2))
                    rFree = float(match.group(3))
                    break
            else:
                # Special case of failing ccp4build in the wrong spacegroup/hand/etc.
                # Job number as string
                match = re.search('\[' + jobNumber + '\].*--.*', taskText)
                rWork = 0.0
                rFree = 0.0
                if match:
                    break

        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for CCP4Build results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(59)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after CCP4Build run')
    else:
        print('*** Verification: CCP4Build Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork <= targetRwork
    assert rFree <= targetRfree

    return ()


def fitWaters(driver, wait):
    print('Fitting waters 0014')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0014]')]")))
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
        match = re.search('\[0014\] fit waters -- Nwaters=(\d*)', taskText)
        if match:
            nwat = int(match.group(1))
            break
    if nwat == 0:
        print('*** Verification: could not find Nwaters result value after FitWaters run')
    else:
        print('*** Verification: Nwaters is %d (expecting > 50 )' % nwat)
    assert nwat > 35

    return ()


def refmac_0015(driver):
    print('Running REFMAC5 0015')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='Number of refinement cycles']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('20')
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 300) # finish in ~3 minutes, let's give 5
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0015]')]")))
    except:
        print('Apparently tha task refmac_015 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0015\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.30), Rfree is %0.4f (expecing <0.33)' % (rWork, rFree))
    assert rWork < 0.30
    assert rFree < 0.33

    return ()


def depositionAfterRefmac(driver):
    print('Running Deposition task')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Validation, Analysis and Deposition')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare data for deposition')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 1200) # normally takes around 5 minutes giving 20 - takes longer to run recently
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0016]')]")))
    except:
        print('Apparently the task depositionAfterRefmac has not been completed in time!')

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    taskText = ''
    ttts = sf.tasksTreeTexts(driver)
    for task in ttts:
        match = re.search('\[0016\] deposition -- (.*)', task)
        if match:
            taskText = match.group(1)
            break
    if taskText == '':
        print('*** Verification: could not find text result value after deposition run')
    else:
        print('*** Verification: deposition result is "%s" (expecting "package prepared, pdb report obtained")' % taskText)

    if not taskText == 'package prepared, pdb report obtained':
        print('!!! Verification not passed!')

    assert taskText == 'package prepared, pdb report obtained'

    return ()


def addRemark(driver, title, detail, colour=None):
    print('Adding remark: %s' % title)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/task_remark.png')]")
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


def cloneRemark(driver, title, detail, colour=None):
    print('Cloning remark: %s' % title)

    #Cloning job - cloning button
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


def prepareMRmodelCOORD(driver, waitShort):
    print('Preparing MR model from coordinate')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Model(s) from Coordinate data')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0020]')]")))
    except:
        print('Apparently tha task prepareMRmodelCOORD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def startPhaser(driver):
    print('Running PHASER')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Phaser')
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(2)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def verifyPhaser(driver, waitLong, jobNumber):
    rWork = 1.0
    rFree = 1.0
    llg = 0
    tfz = 0.0
    print('Phaser verification, job ' + jobNumber)

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\] phaser MR -- Nsol=1 LLG=(\d*) TFZ=(\d*\.\d*) R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                llg = float(match.group(1))
                tfz = float(match.group(2))
                rWork = float(match.group(3))
                rFree = float(match.group(4))
                break
        if (rWork != 1.0) or (rFree != 1.0) or (llg != 0) or (tfz != 0.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for Phaser results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0) or (llg == 0) or (tfz == 0.0):
        print('*** Verification: could not find Rwork or Rfree value after Phaser run')
    else:
        print('*** Verification: PHASER ' \
              'LLG is %d (expecting >50), ' \
              'TFZ is %0.1f (expecting >5.0), ' \
              'Rwork is %0.4f (expecting <0.65), ' \
              'Rfree is %0.4f (expecing <0.65)' % (llg, tfz, rWork, rFree))
    assert llg > 50
    assert tfz > 5.0
    assert rWork < 0.65
    assert rFree < 0.65

    return ()


def refmac_0022(driver):
    print('Running REFMAC5 0022')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='Number of refinement cycles']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('50')
    time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 300) # finish in ~3 minutes, let's give 5
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0022]')]")))
    except:
        print('Apparently tha task refmac_015 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0022\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.30), Rfree is %0.4f (expecing <0.33)' % (rWork, rFree))
    assert rWork < 0.55
    assert rFree < 0.55

    return ()


def phaserEP_29(driver):
    print('Starting Phaser-EP for experimental phasing 0029')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing with Phaser')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0029]')]")))
    except:
        print('Apparently tha task Phaser-EP has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0029\] phaser EP \(SAD\) -- (.*)', taskText)
        if match:
            completed = match.group(1)
            break

    return()


def generate_06(browser,
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

    d.testName = '06.mr-sad'

    isLocal = False
    if 'localhost' in d.cloud:
        isLocal = True

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, 'MR-SAD example (hen egg-white lysozyme)')
        sf.enterProject(d.driver, d.testName)

        sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        time.sleep(1)

        addRemark(d.driver, remarkTitle1, remarkDetail1) # 1
        importData(d.driver, d.waitShort) # 2
        asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort) # 3
        addRemark(d.driver, 'Trying SAD phasing', '')  # 4

        startSHELXcd(d.driver) # 5
        validateSHELXcd(d.driver, 1500) # 18 minutes normally
        phaserEP_06(d.driver) # 6

        addRemark(d.driver, 'Original hand', '') # 7
        cloneRemark(d.driver, 'Inverted hand', '') # 8

        sf.clickTaskInTaskTree(d.driver, '\[0007\]')
        startCCP4Build(d.driver) # 9
        sf.clickTaskInTaskTree(d.driver, '\[0007\]')
        runParrot(d.driver, '0010') # 10
        sf.startModelcraft_basic(d.driver) # 11

        sf.clickTaskInTaskTree(d.driver, '\[0008\]')
        startCCP4Build(d.driver, inverted=True) # 12
        sf.clickTaskInTaskTree(d.driver, '\[0008\]')
        runParrot(d.driver, '0013', inverted=True) # 13
        sf.startModelcraft_basic(d.driver) # 14

        sf.verifystartModelcraft_basic(d.driver, 1200, '0011', 0.0, 0.0)
        sf.verifystartModelcraft_basic(d.driver, 1200, '0014', 0.0, 0.0)
        verifyCCP4Build(d.driver, 1200, '0009', 0.0, 0.0)
        verifyCCP4Build(d.driver, 1200, '0012', 0.0, 0.0)

        sf.clickTaskInTaskTree(d.driver, '\[0009\]')
        addRemark(d.driver, 'Not a solution', '', colour='Red')  # 15
        sf.clickTaskInTaskTree(d.driver, '\[0011\]')
        addRemark(d.driver, 'Not a solution', '', colour='Red')  # 16
        sf.clickTaskInTaskTree(d.driver, '\[0012\]')
        addRemark(d.driver, 'Not a solution', '', colour='Red')  # 17
        sf.clickTaskInTaskTree(d.driver, '\[0014\]')
        addRemark(d.driver, 'Not a solution', '', colour='Red')  # 18

        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        cloneRemark(d.driver, 'Trying MR phasing','') # 19

        prepareMRmodelCOORD(d.driver, d.waitLong) # 20
        startPhaser(d.driver) # 21
        verifyPhaser(d.driver, 600, '0021')
        refmac_0022(d.driver) # 22
        addRemark(d.driver, 'Building directly into the map after MR', '')  # 23
        startBuccaneer(d.driver)  # 24
        sf.clickTaskInTaskTree(d.driver, '\[0023\]')
        startCCP4Build(d.driver)  # 25
        verifyBuccaneer(d.driver, 1200, '0024', 0.0, 0.0)
        verifyCCP4Build(d.driver, 1200, '0025', 0.0, 0.0)
        sf.clickTaskInTaskTree(d.driver, '\[0024\]')
        addRemark(d.driver, 'Structure is solved (R-factors < 0.4), but R-factors are still high - lets try to find better solution', '')  # 26

        sf.clickTaskInTaskTree(d.driver, '\[0025\]')
        addRemark(d.driver, 'R-factors are better - can we improve this further?', '')  # 27

        sf.clickTaskInTaskTree(d.driver, '\[0023\]')
        cloneRemark(d.driver, 'Running SAD phasing after MR (MR-SAD)', '')  # 28
        phaserEP_29(d.driver) # 29
        runParrot(d.driver, '0030') # 30
        startBuccaneer(d.driver) # 31
        sf.clickTaskInTaskTree(d.driver, '\[0030\]')
        startCCP4Build(d.driver) # 32
        verifyBuccaneer(d.driver, 1200, '0031', 0.0, 0.0)
        verifyCCP4Build(d.driver, 1200, '0032', 0.0, 0.0)
        sf.clickTaskInTaskTree(d.driver, '\[0031\]')
        addRemark(d.driver, 'Similar performance to MR only, better completness', '')  # 33
        sf.clickTaskInTaskTree(d.driver, '\[0032\]')
        addRemark(d.driver, 'Similar performance to MR only, a bit worse completness, best Rfree among all building runs', '')  # 34

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

    generate_06(browser=parameters.browser,  # or 'Chrome'
                cloud=parameters.cloud,
                nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                login=parameters.login,  # Used to login into remote Cloud
                password=password,  # Used to login into remote Cloud
                remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                )
