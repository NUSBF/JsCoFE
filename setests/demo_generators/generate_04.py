
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

details1 = """
The next step in this project is import of input data. You may use either "Data Import" or "Cloud Import" tasks for this step. Both tasks are available from Task List. Push "+" button to open it, and bear in mind that new tasks become children of task currently selected in Task Tree. Children can see data produced by their parents and all grand-parents up to the root of the Job Tree.

If you choose to use "Cloud Import" task, it will load data from CCP4 Cloud. You may find them at

tutorial-data / 2_phasing/mdm2 / mdm2_unmerged.mtz
tutorial-data / 2_phasing/mdm2 / 4hg7.seq
tutorial-data / 2_phasing/mdm2 / 4qo4.pdb

If you use "Data Import" task, it will load data from your machine, which are found in CCP4 package at

/path / to / ccp4 / share/ccp4i2 / demo_data / mdm2 / mdm2_unmerged.mtz
/path / to / ccp4 / share/ccp4i2 / demo_data / mdm2 / 4hg7.seq
/path / to / ccp4 / share/ccp4i2 / demo_data / mdm2 / 4qo4.pdb

"""


def importREADME(driver, waitShort):
    print ('Importing README ')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2'),
                                ('a','README.html'),
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
        print('Apparently tha task importing README has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud(driver, waitShort):
    print ('Importing mdm2 from the Cloud Import')

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/add.png')]")
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Cloud'))
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2'),
                                ('a','mdm2_unmerged.mtz'),
                                ('button','Select more files'),
                                ('a', '4qo4.pdb'),
                                ('button', 'Select more files'),
                                ('a', '4hg7.seq'),
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


def aimless_0004(driver, waitLong):
    print('Running Aimless after import 0004')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Reduction with Aimless')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently the task aimless_0006 has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    compl = 0.0
    cc12 = 0.0
    rAll = 1.0
    rAno = 1.0
    res1 = 50.0
    res2 = 1.0
    sg = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] aimless -- Compl=(.*)\% CC1\/2=(.*) Rmeas_all=(.*) Rmeas_ano=(.*) Res=(.*)-(.*) SpG=(.*)', taskText)
        if match:
            compl = float(match.group(1))
            cc12 = float(match.group(2))
            rAll = float(match.group(3))
            rAno = float(match.group(4))
            res1 = float(match.group(5))
            res2 = float(match.group(6))
            sg = str(match.group(7))
            break
    if (compl == 0.0) or (cc12 == 0.0) or (sg == ''):
        print('*** Verification: could not find output values for Aimless run')
    else:
        print('*** Verification: Aimless ' \
              'Compl is %0.1f %%(expecting >70.0), ' \
              'cc1/2 is %0.3f (expecting >0.9), ' \
              'rAll is %0.3f (expecing <0.1), ' \
              'rAno is %0.3f (expecing <0.1), ' \
              'resHigh is %0.2f (expecing <1.5), ' \
              'resLow is %0.2f (expecing >35.0), ' \
              'SG is %s (expecting "P 61 2 2")'   % (compl, cc12, rAll, rAno, res1, res2, sg))
    assert compl > 70.0
    assert cc12 > 0.9
    assert rAll < 0.1
    assert rAno < 0.1
    assert res1 < 1.5
    assert res2 > 35.0
    assert sg == 'P 61 2 2'

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def aimless_0006(driver, waitLong):
    print('Running Aimless after import 0006')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Reduction with Aimless')
    time.sleep(1)


    inputASU = driver.find_element_by_xpath("//input[@title='Available batches: 1-60']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('1-50')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Basic Options')
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='High resolution cut-off (&Aring;) for scaling, merging and output dataset(s). Leave blank to keep all high resolution data.']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('1.5')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0006]')]")))
    except:
        print('Apparently the task aimless_0006 has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    compl = 0.0
    cc12 = 0.0
    rAll = 1.0
    rAno = 1.0
    res1 = 50.0
    res2 = 1.0
    sg = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0006\] aimless -- Compl=(.*)\% CC1\/2=(.*) Rmeas_all=(.*) Rmeas_ano=(.*) Res=(.*)-(.*) SpG=(.*)', taskText)
        if match:
            compl = float(match.group(1))
            cc12 = float(match.group(2))
            rAll = float(match.group(3))
            rAno = float(match.group(4))
            res1 = float(match.group(5))
            res2 = float(match.group(6))
            sg = str(match.group(7))
            break
    if (compl == 0.0) or (cc12 == 0.0) or (sg == ''):
        print('*** Verification: could not find output values for Aimless run')
    else:
        print('*** Verification: Aimless ' \
              'Compl is %0.1f %%(expecting >70.0), ' \
              'cc1/2 is %0.3f (expecting >0.9), ' \
              'rAll is %0.3f (expecing <0.1), ' \
              'rAno is %0.3f (expecing <0.1), ' \
              'resHigh is %0.2f (expecing <1.6), ' \
              'resLow is %0.2f (expecing >35.0), ' \
              'SG is %s (expecting "P 61 2 2")'   % (compl, cc12, rAll, rAno, res1, res2, sg))
    assert compl > 70.0
    assert cc12 > 0.9
    assert rAll < 0.1
    assert rAno < 0.1
    assert res1 < 1.6
    assert res2 > 35.0
    assert sg == 'P 61 2 2'

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def prepareEnsemble_0008(driver, waitShort):
    print('Preparing MR ensemble 0008')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Ensemble from Coordinate Data')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0008]')]")))
    except:
        print('Apparently tha task prepareEnsemble_0008 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def prepareMRmodelCOORD_0008(driver, waitShort):
    print('Preparing MR model from coordinate 0008')

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0008]')]")))
    except:
        print('Apparently tha task prepareMRmodelCOORD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()




def makingLigand_0009(driver, waitLong):
    print ('Making Ligand 0009')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Ligands')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Make Ligand with Acedrg')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'SMILES string')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'SMILES string')
    time.sleep(3)

    inputASU = driver.find_element_by_xpath("//input[@title='SMILES string to define ligand structure']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('COc1ccc(c(OC(C)C)c1)C2=N[C@H]([C@H](N2C(=O)N3CCNC(=O)C3)c4ccc(Cl)cc4)c5ccc(Cl)cc5')
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='3-letter ligand code for identification']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('DR1')
    time.sleep(1)

# There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0002]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0009]')]")))
    except:
        print('Apparently tha task makingLigand_0009 has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def asymmetricUnitContents_0010(driver, waitShort):
    print ('Making Asymmetric Unit Contents 0010')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0010]')]")))
    except:
        print('Apparently tha task asymmetricUnitContents_0010 has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def molrep_0011(driver, waitLong):
    print('Running MOLREP 0011')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Molrep')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 60 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0004]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0011]')]")))
    except:
        print('Apparently tha task molrep_0011 has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0011\] molrep -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after MOLREP run')
    else:
        print('*** Verification: MOLREP Rwork is %0.4f (expecting <0.6), Rfree is %0.4f (expecing <0.6)' % (rWork, rFree))
    assert rWork < 0.6
    assert rFree < 0.6

    return ()


def refmac_0012(driver):
    print('Running REFMAC5 0012')

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
    time.sleep(1)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0012]')]")))
    except:
        print('Apparently tha task refmac_0012 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0012\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.6), Rfree is %0.4f (expecing <0.6)' % (rWork, rFree))
    assert rWork < 0.6
    assert rFree < 0.6

    return ()


def spaceGroup_0014(driver, waitShort):

    print ('Changing spacegoup')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Change ASU Space Group')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0014]')]")))
    except:
        print('Apparently tha task spaceGroup_0014 has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def molrep_0016(driver, waitLong):
    print('Running MOLREP 0016')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Molrep')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 60 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0004]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0016]')]")))
    except:
        print('Apparently tha task molrep_0011 has not been completed in time; terminating')
        sys.exit(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0016\] molrep -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after MOLREP run')
    else:
        print('*** Verification: MOLREP Rwork is %0.4f (expecting <0.6), Rfree is %0.4f (expecing <0.6)' % (rWork, rFree))
    assert rWork < 0.6
    assert rFree < 0.6

    return ()


def refmac_0017(driver):
    print('Running REFMAC5 0017')

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
    time.sleep(1)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0017]')]")))
    except:
        print('Apparently tha task refmac_0017 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0017\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.37), Rfree is %0.4f (expecing <0.42)' % (rWork, rFree))
    assert rWork < 0.37
    assert rFree < 0.42

    return ()


def sequenceAlignment_0020(driver, wait):
    print('Running sequence alignment with ClustalW 0020')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Sequence Alignment with ClustalW')
    time.sleep(3)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % '[0008-01] ensemble')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % '[0017-01] refmac')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0020]')]")))
    except:
        print('Apparently the task ClustalW 0020 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    seqid = 0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0020\] seqalign -- Seq\.Id=(\d*)\.\d%', taskText)
        if match:
            seqid = int(match.group(1))
            break
    if seqid == 0:
        print('*** Verification: could not find SeqId result value after ClustalW run')
    else:
        print('*** Verification: sequence identity is %d %% (expecting > 90 %%)' % seqid)
    assert seqid > 90

    return ()


def startCCP4build_0022(driver):
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
            # Job number as string
            match = re.search('\[' + jobNumber + '\] ccp4build -- Compl=(.*)% R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                compl = float(match.group(1))
                rWork = float(match.group(2))
                rFree = float(match.group(3))
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
    assert rWork < targetRwork
    assert rFree < targetRfree


def fitLigand_0023(driver, wait):
    print('Fitting ligand 0023')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    if not sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Full list'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Ligands')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Find and Fit Ligand')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0023]')]")))
    except:
        print('Apparently the task FitLigand has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    nlig = 0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0023\] fit ligand -- Nfitted=(\d*)', taskText)
        if match:
            nlig = int(match.group(1))
            break
    if nlig == 0:
        print('*** Verification: could not find Nfitted result value after FitWaters run')
    else:
        print('*** Verification: Nfitted is %d %% (expecting = 1)' % nlig)
    assert nlig == 1

    return ()


def refmac_0024(driver):
    print('Running REFMAC5 0024')

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
    time.sleep(1)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0024]')]")))
    except:
        print('Apparently tha task refmac_0024 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0024\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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


def fitWaters_0025(driver, wait):
    print('Fitting waters 0025')

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0025]')]")))
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
        match = re.search('\[0025\] fit waters -- Nwaters=(\d*)', taskText)
        if match:
            nwat = int(match.group(1))
            break
    if nwat == 0:
        print('*** Verification: could not find Nwaters result value after FitWaters run')
    else:
        print('*** Verification: Nwaters is %d %% (expecting > 50 %%)' % nwat)
    assert nwat > 50

    return ()


def refmac_0026(driver):
    print('Running REFMAC5 0026')

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
        wait = WebDriverWait(driver, 300) # finish in ~3 minutes, let's give 5
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0026]')]")))
    except:
        print('Apparently tha task refmac_0024 has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0026\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.26), Rfree is %0.4f (expecing <0.30)' % (rWork, rFree))
    assert rWork < 0.26
    assert rFree < 0.30

    return ()


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
        # colourButton = driver.find_element(By.XPATH, "//div[@class='menu-dropbtn' and contains(@style, 'images_png/task_remark_')]")
        # colourButton.click()

        sf.clickByXpath(driver, "//div[@class='menu-dropbtn' and contains(@style, 'images_png/task_remark_')]")
        time.sleep(1)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % colour)
        time.sleep(1)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


def generate_04(browser,
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

    d.testName = '04.mr-enant'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password, nologin)


        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, 'MR in enantiomorphic space groups with ligand fitting')
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)

        sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        time.sleep(1)

        addRemark(d.driver, 'Based on CCP4 MDM2 example. Open this remark for input data location', details1) # 1
        importREADME(d.driver, d.waitShort) # 2
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        time.sleep(1)
        importFromCloud(d.driver, d.waitShort) # 3
        aimless_0004(d.driver, d.waitLong) # 4
        addRemark(d.driver, 'Need to cut resolution and leave unsutable images out', '') # 5

        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        aimless_0006(d.driver, d.waitLong)  # 6
        addRemark(d.driver, 'Prepare MR model and ligand descriptoions', '')  # 7
        prepareMRmodelCOORD_0008(d.driver, d.waitShort) # 8
        makingLigand_0009(d.driver, d.waitLong) # 9
        asymmetricUnitContents_0010(d.driver, d.waitShort) # 10
        molrep_0011(d.driver, d.waitLong) # 11
        refmac_0012(d.driver) #12
        addRemark(d.driver, 'Does not refine and no TF peak', '', colour='Red')  # 13

        sf.clickTaskInTaskTree(d.driver, '\[0010\]')
        spaceGroup_0014(d.driver, d.waitLong) #14
        addRemark(d.driver, 'Change to enantiomorphic space group and try MR again', '')  # 15
        molrep_0016(d.driver, d.waitLong) # 16
        refmac_0017(d.driver) # 17
        addRemark(d.driver, 'R-factors down and good peak in TF', '', colour='Green')  # 18
        addRemarkCloning(d.driver, 'Check target and model sequence to see whether model should be rebuilt', '', colour='Lemon') #19
        sequenceAlignment_0020(d.driver, d.waitLong) # 20
        addRemark(d.driver, 'Need to rebuild', '')  # 21

        sf.clickTaskInTaskTree(d.driver, '\[0017\]')
        startCCP4build_0022(d.driver) # 22
        time.sleep(60)
        verifyCCP4Build(d.driver, 3600, '0022', 0.33, 0.36) # takes about 30 minutes
        fitLigand_0023(d.driver, d.waitLong) # 23
        refmac_0024(d.driver) # 24
        fitWaters_0025(d.driver, d.waitShort) # 25
        refmac_0026(d.driver) # 26
        addRemark(d.driver, 'Needs manual rebuilding with COOT to fix ligand and few side chains', '')  # 27

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

    generate_04(browser=parameters.browser,  # or 'Chrome'
                cloud=parameters.cloud,
                nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                login=parameters.login,  # Used to login into remote Cloud
                password=password,  # Used to login into remote Cloud
                remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                )
