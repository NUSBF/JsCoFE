
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


def prepareMRmodelCOORD(driver, waitShort):
    print('Preparing MR model from coordinate')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(3)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Model Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare Single-Chain MR Model(s) from Coordinate data')
    time.sleep(1)
   

    time.sleep(3)

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
        print('Apparently tha task prepareMRmodelCOORD has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def prepareMRmodelALIGN(driver, waitShort):
    print('Preparing MR model from alignment')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Model Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Model(s) from Alignment data')
    time.sleep(1)
    

    time.sleep(3)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently tha task prepareMRmodelALIGN has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def prepareMRensembleMODEL(driver, waitShort):
    print('Preparing MR ensemble from models')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Ensemble Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Ensemble from Models')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0007]')]")))
    except:
        print('Apparently tha task prepareMRensembleMODEL has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def prepareMRensembleSEQ(driver, waitShort):
    print('Preparing MR ensemble from sequence')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Ensemble Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Ensemble from Sequence')
    time.sleep(1)
    

    time.sleep(3)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0009]')]")))
    except:
        print('Apparently tha task prepareMRensembleSEQ has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def prepareMRensembleCOORD(driver, waitShort):
    print('Preparing MR ensemble from coordinates')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Ensemble Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare MR Ensemble from Coordinate Data')
    time.sleep(1)
    

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0011]')]")))
    except:
        print('Apparently tha task prepareMRensembleCOORD has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()

def prepareComplexModel(driver, waitShort):
    print('Prepare Multi-Chain MR Model')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Model Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare Multi-Chain MR Model')
    time.sleep(1)
    

    
    time.sleep(1)

    tasksInputs = driver.find_elements_by_xpath("//input[contains(@title, 'Comma-separated list of chains from template structure corresponding to given sequence; put * for all chains in the model (homomeric complexes only')]")

    tasksInputs[-1].click()
    tasksInputs[-1].clear()
    tasksInputs[-1].send_keys('*')

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitShort) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0013]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0013]')]")))
    except:
        print('Apparently tha task Prepare Multi-Chain MR Model has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

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

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Solvers')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Phaser')
    time.sleep(1)
    

    # 2 molecules in the ASU
    inputASU = driver.find_element_by_xpath("//*[@title='Specify the number of model copies to look for in asymmetric unit']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('2')
    time.sleep(2)

    #Search options
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Search options')
    time.sleep(1)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'off')
        time.sleep(1)
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'on')
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
    time.sleep(1)

    return ()

def startPhaser2(driver):
    print('Running PHASER')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Solvers')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Phaser')
    time.sleep(1)
    

    # # 2 molecules in the ASU 
    # inputASU = driver.find_element_by_xpath("//*[@title='Specify the number of model copies to look for in asymmetric unit']")
    # inputASU.click()
    # inputASU.clear()
    # inputASU.send_keys('2')
    # time.sleep(2)

    # #Search options
    # sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Search options')
    # time.sleep(1)
    # try:
    #     sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'off')
    #     time.sleep(1)
    #     sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'on')
    #     time.sleep(1)
    # except:
    #     pass
    

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
    time.sleep(1)

    return ()

def startPhaser1(driver):
            print('Running PHASER')

            addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
            addButton.click()
            time.sleep(1)

            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
            time.sleep(1)

            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
            time.sleep(1)

            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Solvers')
            time.sleep(1)
            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement with Phaser')
            time.sleep(1)

            inputASU = driver.find_element_by_xpath("//*[@title='Specify the number of model copies to look for in asymmetric unit']")
            inputASU.click()
            inputASU.clear()
            inputASU.send_keys('2')
            time.sleep(2)

            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Search options')
            time.sleep(1)
            try:
                sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'off')
                time.sleep(1)
                sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'on')
                time.sleep(1)
            except:
                pass  
            try:         
                packing = driver.find_element_by_xpath("//*[@value='10']")
                packing.click()
                packing.clear()
                packing.send_keys('5')
                time.sleep(2)
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
              'LLG is %d (expecting >3600), ' \
              'TFZ is %0.1f (expecting >50.0), ' \
              'Rwork is %0.4f (expecting <0.375), ' \
              'Rfree is %0.4f (expecing <0.385)' % (llg, tfz, rWork, rFree))
    assert llg > 3600
    assert tfz > 30.0
    assert rWork < 0.375
    assert rFree < 0.385

    return ()


def test_1MRModelCOORDPhaserStart(browser,
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

    d.testName = 'phaserTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)
        sf.importFromCloud_rnaseHHPRED(d.driver, d.waitShort) # 01
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort) # 02

        prepareMRmodelCOORD(d.driver, d.waitShort) # 03
        startPhaser1(d.driver) # 04

    except:
        d.driver.quit()
        raise


def test_2MRModelAlign():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareMRmodelALIGN(d.driver, d.waitLong) # 05
        startPhaser(d.driver) # 06
    except:
        d.driver.quit()
        raise

def test_3EnsembleModels():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0005\]')
        prepareMRensembleMODEL(d.driver, d.waitLong) # 07
        startPhaser(d.driver) # 08
    except:
        d.driver.quit()
        raise

def test_4EnsembleSEQ():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareMRensembleSEQ(d.driver, 300) # 09
        startPhaser(d.driver) # 10
    except:
        d.driver.quit()
        raise


def test_5EnsembleCOORD():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareMRensembleCOORD(d.driver, d.waitLong) # 11
        startPhaser(d.driver) # 12
    except:
        d.driver.quit()
        raise

def test_6ComplexModels():

    try:

        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        prepareComplexModel(d.driver, 300) # 13
        startPhaser2(d.driver)        
    except:
        d.driver.quit()
        raise


def test_7verifyPhasers():
    try:
        verifyPhaser(d.driver, d.waitLong, '0004')
        verifyPhaser(d.driver, d.waitLong, '0006')
        verifyPhaser(d.driver, d.waitLong, '0008')
        verifyPhaser(d.driver, d.waitLong, '0010')
        verifyPhaser(d.driver, d.waitLong, '0012')
        verifyPhaser(d.driver, d.waitLong, '0014')
        sf.renameProject(d.driver, d.testName)

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

    test_1MRModelCOORDPhaserStart(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_2MRModelAlign()
    test_3EnsembleModels()
    test_4EnsembleSEQ()
    test_5EnsembleCOORD()
    test_6ComplexModels()
    test_7verifyPhasers()
