
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


remarkTitle1 = 'Based on CCP4 RNAse example. Open this remark for input data location'
remarkDetail1 = """The next step in this project is import of input data. You may use either "Data Import" or "Cloud Import" tasks for this step. Both tasks are available from Task List. Push "+" button to open it, and bear in mind that new tasks become children of task currently selected in Task Tree. Children can see data produced by their parents and all grand-parents up to the root of the Job Tree.

If you choose to use "Cloud Import" task, it will load data from CCP4 Cloud. You may find them at

tutorial-data/3_refinement/1_Ribonuclease/rnase.mtz
tutorial-data/3_refinement/1_Ribonuclease/rnase.seq

If you use "Data Import" task, it will load data from your machine, which are found in CCP4 package at

/path/to/ccp4/examples/rnase/rnase25F+F-.mtz
/path/to/ccp4/examples/rnase/rnase.seq 
"""


def importFromCloud(driver, waitShort):
    print ('Importing "rnase" project from the Cloud Import')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Cloud Import')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task importFromCloudWithTaskListOnScreen has not been completed in time; terminating')
        sys.exit(1)
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def asymmetricUnitContentsAfterCloudImport(driver, waitShort):
    print ('Making Asymmetric Unit Contents after Cloud Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task asymmetricUnitContentsAfterCloudImport has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


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


def mordaAfterASU(driver):
    print('Running MORDA')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Morda: Model Search & Preparation + MR')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 1200) # allowing 20 minutes to the task to finish, normally takes 10 minutes
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently the task mordaAfterASU has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] morda -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find compl or Rwork or Rfree value after MORDA run')
    else:
        print('*** Verification: MORDA ' \
              'Rwork is %0.4f (expecting <0.24), ' \
              'Rfree is %0.4f (expecting <0.27)' % (rWork, rFree))
    assert rWork < 0.24
    assert rFree < 0.27

    return ()


def sequenceAlignment(driver, wait):
    print('Running sequence alignment with ClustalW')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Sequence Alignment with ClustalW')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0006]')]")))
    except:
        print('Apparently the task ClustalW has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    seqid = 0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0006\] seqalign -- Seq\.Id=(\d*)\.\d%', taskText)
        if match:
            seqid = int(match.group(1))
            break
    if seqid == 0:
        print('*** Verification: could not find SeqId result value after ClustalW run')
    else:
        print('*** Verification: sequence identity is %d %% (expecting > 99 %%)' % seqid)
    assert seqid > 99

    return ()


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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0008]')]")))
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
        match = re.search('\[0008\] fit waters -- Nwaters=(\d*)', taskText)
        if match:
            nwat = int(match.group(1))
            break
    if nwat == 0:
        print('*** Verification: could not find Nwaters result value after FitWaters run')
    else:
        print('*** Verification: Nwaters is %d %% (expecting > 250 %%)' % nwat)
    assert nwat > 250

    return ()


def refmac_09(driver, waitLong):
    print('Running REFMAC5 0009')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    except:
        pass

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0009]')]")))
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
        match = re.search('\[0009\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.17), Rfree is %0.4f (expecing <0.22)' % (rWork, rFree))
    assert rWork < 0.17
    assert rFree < 0.22

    return ()


def depositionAfterRefmac_10(driver):
    print('Running Deposition task 10')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

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
        wait = WebDriverWait(driver, 900) # normally takes around 5 minutes giving 15 - takes longer to run recently
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0010]')]")))
    except:
        print('Apparently the task depositionAfterRefmac has not been completed in time!')

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    taskText = ''
    ttts = sf.tasksTreeTexts(driver)
    for task in ttts:
        match = re.search('\[0010\] deposition -- (.*)', task)
        if match:
            taskText = match.group(1)
            break
    if taskText == '':
        print('*** Verification: could not find text result value after deposition run')
    else:
        print('*** Verification: deposition result is "%s" (expecting "package prepared, pdb report obtained")' % taskText)

    assert taskText == 'package prepared, pdb report obtained'

    return ()


def comb_12(driver):
    print('Running comb')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    except:
        pass

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Comb Structure with Coot')
    time.sleep(2)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Ramachandran Plot')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'None')
    time.sleep(1)

    inputTitle = driver.find_element_by_xpath("//input[@title='Number of 2nd comb passes']")
    inputTitle.clear()
    inputTitle.send_keys('1')
    time.sleep(1)

    inputTitle = driver.find_element_by_xpath("//input[@title='Number of 3rd comb passes']")
    inputTitle.clear()
    inputTitle.send_keys('1')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 900)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0012]')]")))
    except:
        print('Apparently the task comb has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0012\] comb structure -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.18), Rfree is %0.4f (expecing <0.22)' % (rWork, rFree))
    assert rWork < 0.18
    assert rFree < 0.22

    return ()


def refmac_14(driver, waitLong):
    print('Running REFMAC5 0014')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement and Model Building')
    except:
        pass
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    except:
        pass

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(3)


    inputTitle = driver.find_elements_by_xpath("//input[@placeholder='refmac5']")
    inputTitle[-1].clear()
    inputTitle[-1].send_keys('Refinement with parameters to reduce clash score')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'No')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Yes')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Advanced')
    time.sleep(1)

    inputTitle = driver.find_element_by_xpath("//textarea[@title='Advanced keywords']")
    inputTitle.clear()
    inputTitle.send_keys('vdwrestr 2.0')
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
        match = re.search('\[0014\] Refinement with parameters to reduce clash score -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.18), Rfree is %0.4f (expecing <0.22)' % (rWork, rFree))
    assert rWork < 0.18
    assert rFree < 0.22

    return ()


def depositionAfterRefmac_15(driver):
    print('Running Deposition task 15')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

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
        wait = WebDriverWait(driver, 900) # normally takes around 5 minutes giving 15 - takes longer to run recently
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0015]')]")))
    except:
        print('Apparently the task depositionAfterRefmac has not been completed in time!')

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    taskText = ''
    ttts = sf.tasksTreeTexts(driver)
    for task in ttts:
        match = re.search('\[0015\] deposition -- (.*)', task)
        if match:
            taskText = match.group(1)
            break
    if taskText == '':
        print('*** Verification: could not find text result value after deposition run')
    else:
        print('*** Verification: deposition result is "%s" (expecting "package prepared, pdb report obtained")' % taskText)

    assert taskText == 'package prepared, pdb report obtained'

    return ()


def generate_01(browser,
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

    d.testName = '01.auto-mr'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password, nologin)


        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, 'Simple Auto-MR with MoRDa')
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)

        sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        time.sleep(1)

        addRemark(d.driver, remarkTitle1, remarkDetail1)
        importFromCloud(d.driver, d.waitShort)
        asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        mordaAfterASU(d.driver)

        time.sleep(3)
        d.driver.quit()
        time.sleep(3)
        (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(d.remote, d.browser)
        print('Opening URL: %s' % d.cloud)
        d.driver.get(d.cloud)
        # assert "CCP4 Cloud" in d.driver.title
        if not d.nologin:
            sf.loginToCloud(d.driver, d.login, d.password, d.nologin)
        sf.enterProject(d.driver, d.testName)
        time.sleep(3)
        sf.clickTaskInTaskTree(d.driver, '\[0004\] morda')
        time.sleep(1)

        addRemark(d.driver, 'Check sequence similarity of found solution and target protein', '')
        sequenceAlignment(d.driver, d.waitLong)
        addRemark(d.driver, 'Found solution does not need rebuilding. Add water, refine and deposit', '')

        sf.clickTaskInTaskTree(d.driver, '\[0004\] morda')
        time.sleep(1)
        fitWaters(d.driver, d.waitLong)
        refmac_09(d.driver, d.waitLong)
        depositionAfterRefmac_10(d.driver)
        addRemark(d.driver, 'Clash score and side chains outliers are a bit too high for given resolution', '', colour='Red')


        time.sleep(3)
        d.driver.quit()
        time.sleep(3)
        (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(d.remote, d.browser)
        print('Opening URL: %s' % d.cloud)
        d.driver.get(d.cloud)
        # assert "CCP4 Cloud" in d.driver.title
        if not d.nologin:
            sf.loginToCloud(d.driver, d.login, d.password, d.nologin)
        sf.enterProject(d.driver, d.testName)
        time.sleep(3)

        sf.clickTaskInTaskTree(d.driver, '\[0008\] fit waters')
        time.sleep(1)
        comb_12(d.driver)
        addRemark(d.driver, 'Combing of the structure shall improve side chains', '')

        time.sleep(1)
        refmac_14(d.driver, d.waitLong)
        depositionAfterRefmac_15(d.driver)
        addRemark(d.driver, 'Excellent overall statistics for deposition, although unmodelled blobs remain and few side chains are misplaced', '', colour='Green')

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

    generate_01(browser=parameters.browser,  # or 'Chrome'
                cloud=parameters.cloud,
                nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                login=parameters.login,  # Used to login into remote Cloud
                password=password,  # Used to login into remote Cloud
                remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                )
