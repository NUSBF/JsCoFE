
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..'))
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf

d = sf.driverHandler()


def startBuccaneer(driver):
    print('Running new Buccaneer')

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
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building')
    except:
        pass
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Model Building with Buccaneer')
    time.sleep(1)

    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % 'Options')
    time.sleep(1)

    inputNcycles = driver.find_element_by_xpath("//input[@title='Choose a value between 1 and 500']")
    inputNcycles.clear()
    inputNcycles.send_keys('10')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(10)

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
                # Job number as string
                match = re.search('\[' + jobNumber +'\].*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
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
            print('*** Verification: Buccaneer Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
        assert rWork < targetRwork
        assert rFree < targetRfree


def asymmetricUnitContents(driver, waitShort, task='0002'):
    print ('Making Asymmetric Unit Contents after Cloud Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit Contents') # looking by text
    time.sleep(1)

    # 1 molecule in the ASU
    inputASU = driver.find_element_by_xpath("//*[@title='Specify stoichiometric coefficent for given sequence in the crystal']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('1')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[%s]')]" % task)))
    except:
        print('Apparently tha task asymmetricUnitContentsAfterCloudImport has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def startSHELXss(driver, waitLong):
    print('Starting SHELX_sss for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Experimental Phasing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Substructure Search with SHELX via Crank-2')
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
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task 
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha Substructure Search with SHELX-C/D task has not been completed in time; terminating')
        sys.exit(1)

    driver.find_elements_by_xpath("//*[contains(text(), '[0003] Substructure Found')]")

    # driver.find_element (By.XPATH, "//div[text() = '[0003] Substructure Found')]")

    time.sleep(10)

        # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return()


def validateSHELXss(driver, waitLong):

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
            match = re.search(r'^\[0003\] shelx substructure search \(SAD\) -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after SHELX run')
    else:
        print('*** Verification: SHELX Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecting <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

    return ()


def phaserEP(driver, waitLong):
    print('Starting Phaser-EP for experimental phasing')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

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
        wait = WebDriverWait(driver, waitLong) # normally takes under a minute
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task Phaser-EP has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    completed = ''
    fom = 0.0
    llg = 0.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] phaser EP \(SAD\) -- (.*)', taskText)
        if match:
            completed = match.group(1)
            match2 = re.search('LLG=(.*)\sFOM=(.*)', match.group(1))
            if match2:
                llg = float(match2.group(1))
                fom = float(match2.group(2))
            break
    if completed == '':
        print('*** Verification: could not find completed value after Phaser EP run')
        assert completed == 'completed.'
    else:
        if (fom == 0.0) and (llg == 0.0):
            print('*** Verification: Phaser EP completion message in %s (expecting "completed.")' % (completed))
            assert completed == 'completed.'
        else:
            print('*** Verification: Phaser EP LLG is %0.1f, FOM is %0.3f (expecting >150, >0.2)' % (llg, fom))
            assert llg > 150.0
            assert  fom > 0.2

    return()


def runParrot(driver, job, inverted=False):
    print('Running Parrot, job: ' + job)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(2)

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

    time.sleep(10)

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


def verifyParrots(driver):
    parrotPass = False
    completed = []
    fom = []
    fcorr = []

    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('.*parrot DM --\s(.*)', taskText)
        if match:
            completed.append(match.group(1))
            match2 = re.search('FOM=(\d\.\d*) Fcorr=(\d\.\d*)', match.group(1))
            if match2:
                fom.append(float(match2.group(1)))
                fcorr.append(float(match2.group(2)))

    for c in completed:
        print('*** Verification: parrot completion message: %s' % c)

    for f in fom:
        print('*** Verification: parrot FOM: %0.3f' % f)
        if f >= 0.48:
            print('*** Verification: FOM from one of the hands %0.3f (expecting >=0.48)' % (f))
            parrotPass = True

    assert parrotPass


def importReplace_p9(driver, dirName, waitShort=90):
    print ('Importing and replacing p9 refined from local disk. Dir name: %s' % (dirName))

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[contains(text(), '%s') and contains(text(), '%s')]" % ('Import', 'Replace'))
    time.sleep(1)

    refFileName = os.path.join(dirName, 'p9_sca', 'p9_refmac.mtz')
    phaFileName = os.path.join(dirName, 'p9_sca', 'p9_refmac.mtz')
    cooFileName = os.path.join(dirName, 'p9_sca', 'p9_refmac.pdb')

    projectInputs = driver.find_elements_by_xpath("//input[contains(@id,'input') and @type='file' and contains(@name,'uploads[]')]")
    print (len(projectInputs))
    projectInputs[-4].send_keys(refFileName)
    time.sleep(1)

    projectInputs[-3].send_keys(phaFileName)
    time.sleep(1)

    projectInputs[-2].send_keys(cooFileName)
    time.sleep(1)

    sf.clickByXpath(driver, "//button[normalize-space()='Import']")
    time.sleep(2)

    try:
        wait = WebDriverWait(driver, waitShort)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0007]')]")))
    except:
        print('Apparently tha task importAndReplace has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    taskText = ''
    ttts = sf.tasksTreeTexts(driver)
    for task in ttts:
        match = re.search('\[0007\] imported and set\/replaced\: (.*)', task)
        if match:
            taskText = match.group(1)
            break
    if taskText == '':
        print('*** Verification: could not find text result value after deposition run')
    else:
        print('*** Verification: deposition result is "%s" (expecting "HKL, XYZ, Phases")' % taskText)
        assert taskText.strip() == 'HKL, XYZ, Phases'

    return()


def test_1importFiles(browser,
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

    d.testName = 'importTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title
        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)

        if sys.platform.startswith("win"):
            sf.importLocal_P9(d.driver, '%userprofile%\\test_data')
        else:
            sf.importLocal_P9(d.driver, '~/test_data')
        time.sleep(1)

        asymmetricUnitContents(d.driver, d.waitShort) # 2
        startSHELXss(d.driver, 1200) # 3
        # validateSHELXss(d.driver, 300) # 2 minutes normally, lets give 5
        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        phaserEP(d.driver, 1200) # 4
        runParrot(d.driver, '0005') # 5
        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        runParrot(d.driver, '0006', inverted=True)  # 6
        verifyParrots(d.driver)

    except:
        d.driver.quit()
        raise

def test_2importReplace():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        if sys.platform.startswith("win"):
            importReplace_p9(d.driver, '%userprofile%\\test_data')  # 7
        else:
            importReplace_p9(d.driver,'~/test_data')  # 7
        time.sleep(1)
        sf.startModelcraft_basic(d.driver) # 8
        sf.verifystartModelcraft_basic(d.driver, 600, '0008', 0.29, 0.32)

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
    parser.add_argument('--login', action='store', dest='login', help=argparse.SUPPRESS, default='setests') # Login
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    test_1importFiles(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    test_2importReplace()
