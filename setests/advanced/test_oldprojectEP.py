
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


def runShelxCloning(driver, waitLong):
    print('Running ShelX')

    #Cloning job - cloning button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/clonejob.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0039]')]")))
    except:
        print('Apparently tha task shelX has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(2)

    # rWork = 1.0
    # rFree = 1.0
    # ttts = sf.tasksTreeTexts(driver)
    # for taskText in ttts:
    #     match = re.search('\[0039\] shelx.*-- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
    #     if match:
    #         rWork = float(match.group(1))
    #         rFree = float(match.group(2))
    #         break
    # if (rWork == 1.0) or (rFree == 1.0):
    #     print('*** Verification: could not find Rwork or Rfree value after ShelX run')
    # else:
    #     print('*** Verification: ShelX Rwork is %0.4f (expecting <0.58), Rfree is %0.4f (expecing <0.60)' % (rWork, rFree))
    # assert rWork < 0.58
    # assert rFree < 0.60

    return ()


def runPhaserCloning(driver, waitLong):
    print('Running Phaser EP')

    #Cloning job - cloning button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/clonejob.png')]")
    addButton.click()
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0040]')]")))
    except:
        print('Apparently tha task shelX has not been completed in time; terminating')
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
        match = re.search('\[0040\] phaser EP \(SAD\) -- (.*)', taskText)
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
            print('*** Verification: Phaser EP LLG is %0.1f, FOM is %0.3f (expecting >1000, >0.45)' % (llg, fom))
            assert llg > 1000.0
            assert  fom > 0.45

    return ()


def startBuccaneerCloning(driver):
    print('Running Buccaneer by cloning of 0027')

    #Cloning job - cloning button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/clonejob.png')]")
    addButton.click()
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


def runParrot(driver, waitLong):
    print('Running Parrot')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Density Modification')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Density Modification with Parrot')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0042]')]")))
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
        match = re.search('\[0042\] parrot DM --\s(.*)', taskText)
        if match:
            completed = match.group(1)
            match2 = re.search('FOM=(.*)\sFcorr=(.*)', match.group(1))
            if match2:
                fom = float(match2.group(1))
                fcorr = float(match2.group(2))
            break
    if completed == '':
        print('*** Verification: could not find completed value after Parrot run')
        assert completed == 'completed.'
    else:
        if (fom == 0.0) and (fcorr == 0.0):
            print('*** Verification: Parrot completion message in %s (expecting "completed.")' % (completed))
            assert completed == 'completed.'
        else:
            print('*** Verification: Parrot Fcorr is %0.3f, FOM is %0.3f (expecting >0.8, >0.8)' % (fcorr, fom))
            assert fcorr > 0.8
            assert  fom > 0.8

    return ()


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



# def test_1oldProjectsEP(browser,
#                       cloud,
#                       nologin,
#                       login,
#                       password,
#                       remote
#                       ):

#     listOfExpectedTasks = ['[05.staged-ep] Staged solution of Insulin structure with EP on sulphur atoms',
#     '[0001] Based on CCP4 Insulin example. Open this remark for input data location',
#     '[0003] created datasets: Unmerged (2) HKL (1) -- completed.',
#     '[0004] imported: Sequence (2) -- completed.',
#     '[0005] asymmetric unit contents -- Solv=64.4%',
#     '[0006] shelx substructure search (SAD) -- R=0.5788 Rfree=0.5731',
#     '[0008] low value of CC suggests that solution is unlikely; try another space group',
#     '[0007] change space group (ASU) -- SpG=I 21 3',
#     '[0009] shelx substructure search (SAD) -- R=0.5643 Rfree=0.5922',
#     '[0010] phaser EP (SAD) -- completed.',
#     '[0011] original hand branch',
#     '[0021] parrot DM -- completed.',
#     '[0027] buccaneer -- Compl=100.0% R=0.2447 Rfree=0.2611',
#     '[0037] structure has been built - correct hand',
#     '[0030] fit waters -- Nwaters=66',
#     '[0034] refmac5 -- R=0.1527 Rfree=0.1886',
#     '[0036] deposition -- package prepared, pdb report obtained',
#     '[0038] needs more refinement',
#     '[0012] inverted hand branch',
#     '[0024] parrot DM -- completed.',
#     '[0025] buccaneer -- Compl=0.0%',
#     '[0026] structure cannot be built - wrong hand']


#     (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(remote, browser)
#     d.browser = browser
#     d.cloud = cloud
#     d.nologin = nologin
#     d.password = password
#     d.remote = remote
#     d.login = login

#     d.testName = '05.staged-ep'


#     try:
#         print('Opening URL: %s' % cloud)
#         d.driver.get(cloud)
#         # assert "CCP4 Cloud" in d.driver.title
#         if not nologin:
#             sf.loginToCloud(d.driver, login, password, nologin)

#         sf.removeProject(d.driver, d.testName)

#         if sys.platform.startswith("win"):
#             sf.importLocalProject(d.driver, '%userprofile%\old_cloud\05.ccp4cloud')
#         else:
#             sf.importLocalProject(d.driver, '~/old_cloud/05.ccp4cloud')
#         time.sleep(1)

#         sf.enterProject(d.driver, d.testName)

#         time.sleep(5)
#         listOfActualTasks = []
#         tasksText = d.driver.find_elements(By.XPATH,
#                                          "//a[contains(@id,'treenode') and contains(@class, 'jstree-ancho')]")
#         for e in tasksText:
#             txt = e.text
#             print(txt)
#             listOfActualTasks.append(txt)

#         assert len(listOfActualTasks) == len(listOfExpectedTasks)
#         assert listOfActualTasks == listOfExpectedTasks

#         sf.clickTaskInTaskTree(d.driver, '\[0009\] shelx')
#         time.sleep(2)
#         runShelxCloning(d.driver, d.waitLong)
#         time.sleep(2)

#     except:
#         d.driver.quit()
#         raise


# def test_2oldProjectsEP_PhaserEPandBuccaneer():
#     try:
#         sf.clickTaskInTaskTree(d.driver, '\[0010\] phaser EP')
#         time.sleep(2)
#         runPhaserCloning(d.driver, d.waitLong)
#         time.sleep(2)

#         sf.clickTaskInTaskTree(d.driver, '\[0027\] buccaneer')
#         time.sleep(2)
#         startBuccaneerCloning(d.driver)
#         time.sleep(2)

#     except:
#         d.driver.quit()
#         raise


# def test_3oldProjectsEP_ParrotAndBuccaneer():
#     try:

#         sf.clickTaskInTaskTree(d.driver, '\[0040\] phaser EP')
#         time.sleep(2)
#         runParrot(d.driver, d.waitLong)
#         time.sleep(2)

#         sf.clickTaskInTaskTree(d.driver, '\[0042\] parrot DM')
#         time.sleep(2)
#         startBuccaneer(d.driver)
#         time.sleep(2)

#     except:
#         d.driver.quit()
#         raise


# def test_4oldProjectsEP_Buccaneer():
#     try:
#         verifyBuccaneer(d.driver, 600, '0041', 0.37, 0.38) # run takes 6 minutes, giving 10
#         verifyBuccaneer(d.driver, 600, '0043', 0.37, 0.38) # run takes 6 minutes, giving 10

#         sf.renameProject(d.driver, 'Staged solution of Insulin structure with EP on sulphur atoms')
#         d.driver.quit()
#     except:
#         d.driver.quit()
#         raise


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

    test_1oldProjectsEP(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    test_2oldProjectsEP_PhaserEPandBuccaneer()
    test_3oldProjectsEP_ParrotAndBuccaneer()
    test_4oldProjectsEP_Buccaneer()
