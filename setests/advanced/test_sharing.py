
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
d2 = sf.driverHandler()


def logoutToRelogin(driver):
    print ('Logging out.')
    logoutImg = driver.find_element_by_xpath("//img[contains(@src,'images_png/logout.png')]")
    logoutImg.click()
    time.sleep(1.05)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Back to User Login')
    time.sleep(1.05)

    return ()


def unjoinProject(driver, testName):
    print('Unjoining from previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[normalize-space()='%s']" % testName)

    if len(textEls) > 0:
        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % testName)
        time.sleep(1.05)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
        time.sleep(1.05)
        textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Unjoin')
        textEls[0].click()   
        time.sleep(1.05)
     
        
        textEls = driver.find_elements_by_xpath("//button[normalize-space()='%s']" % 'Please unjoin')
        textEls[0].click()
        time.sleep(1.05)

    return ()


def startRefmac(driver):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1.05)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1.05)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(1.05)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(1.05)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    
    # try:
    #     wait = WebDriverWait(driver, 600) # 10 minutest wait
    #     # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
    #     wait.until(EC.presence_of_element_located
    #                ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'refmac5') and contains(text(), 'completed')]")))
    # except:
    #     print('Apparently the refmac task has not been completed in time!')

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(3)

    return ()


def verifyRefmac(driver, waitLong, jobNumber, targetRwork, targetRfree):
        rWork = 1.0
        rFree = 1.0
        print('REFMAC5 verification, job ' + jobNumber)

        time.sleep(1.05)
        startTime = time.time()

        while (True):
            ttts = sf.tasksTreeTexts(driver)
            for taskText in ttts:
                # Job number as string
                match = re.search('\[' + jobNumber +'\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
                if match:
                    rWork = float(match.group(1))
                    rFree = float(match.group(2))
                    break
            if (rWork != 1.0) or (rFree != 1.0):
                break
            curTime = time.time()
            if curTime > startTime + float(waitLong):
                print('*** Timeout for REFMAC5 results! Waited for %d seconds.' % waitLong)
                print ('\n')
                print (ttts)
                print ('\n')
                break
            time.sleep(20)


        if (rWork == 1.0) or (rFree == 1.0):
            print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
        else:
            print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
        assert rWork < targetRwork
        assert rFree < targetRfree


def shareProject(driver, login):
    print('Sharing test project')
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1.05)

    
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Work team & sharing')
    time.sleep(1.05)

    sf.clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Add team member')
    time.sleep(1.05)

    projectSharing = driver.find_element_by_xpath("//input[@placeholder='%s']" % 'CCP4 Cloud user login')
    projectSharing.click()
    projectSharing.clear()
    projectSharing.send_keys(login)
    time.sleep(1.05)
    sf.clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Yes, share')
    time.sleep(1.05)

    sf.clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Please share')
    time.sleep(1.05)
    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Ok')
    time.sleep(1.05)



    return ()
    
def unshareProject(driver):
    print('unsharing test project')
    
    menuButton = driver.find_element(By.XPATH, "//div[contains(@style, 'images_png/menu.png')]")
    menuButton.click()
    time.sleep(1.05)
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Work team & sharing')
    time.sleep(2.05)
    print('click on table (run and delete own jobs)')

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'run and delete own jobs')
    time.sleep(1.05)
    print('click unshare')
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'unshare')
    time.sleep(1.05)

    sf.clickByXpath(driver, "//button[contains(text(), '%s')]" % 'Yes, unshare')
    time.sleep(1.05)

    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Ok')
    time.sleep(1.05)



    return ()


def joinSharedProject(driver, testName):
    print('Getting shared project')
    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Join')
    time.sleep(1.05)

    sf.clickByXpath(driver, "//span[@class='ui-selectmenu-icon ui-icon ui-icon-triangle-1-s']")
    time.sleep(1.05)

    sf.clickByXpath(driver, "//*[contains(text(), '%s')]" % testName)
    time.sleep(1.05)

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/share.png')]")
    time.sleep(10)

    sf.clickByXpath(driver, "//button[normalize-space()='%s']" % 'Close')
    time.sleep(1.05)

    return ()


def startSimbad(driver):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)
    
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Lattice and Contaminants Search with Simbad')
    time.sleep(1)
    
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
    # for closeButton in closeButton:
    #     if closeButton.is_displayed():
    #         closeButton.click()
    #         break
    time.sleep(1)

    return ()


def verifySimbad(driver, waitLong):
    rWork = 1.0
    rFree = 1.0
    print('SIMBAD verification')

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            match = re.search('\[0005\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if rFree != 1.0: # to exit infinite loop before timeout
            break

        curTime = time.time() # exiting infinite loop due to timeout
        if curTime > startTime + float(waitLong):
            print('*** Timeout for SIMBAD results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(20)

    if (rWork != 1.0) and (rFree != 1.0):
        print('*** Verification: SIMBAD ' \
              'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.29 and < 0.3 ), '  % (rWork, rFree))
        assert rWork < 0.29
        assert rFree < 0.3

    return ()


def startMrbump(driver):

    print('Starting MrBUMP')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png') and @class='ui-button ui-corner-all ui-widget']")
    addButton.click()
    time.sleep(1.05)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(2.05)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Auto-MR with MrBump')
    time.sleep(3.05)

    inputNMod = driver.find_element_by_xpath("//input[@title='Maximum number of search models to test']")
    if inputNMod:
        inputNMod.click()
        inputNMod.clear()
        inputNMod.send_keys('3')
        time.sleep(2)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]")
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(10)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1.05)

    return ()


def verifyMrBump(driver):

    rWork = 1.0
    rFree = 1.0
    # compl = 0.0
    print('MRBUMP verification')

    time.sleep(1.05)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            match = re.search('\[0006\] mrbump --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                # compl = float(match.group(1))
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + 900.0:
            print('*** Timeout for MRBUMP results! Waited for %d seconds.' % 900)
            break
        time.sleep(30)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find compl or Rwork or Rfree value after MrBUMP run')
    else:
        print('*** Verification: MrBUMP Rwork is %0.4f (expecting <0.29), Rfree is %0.4f (expecing <0.31)' % (rWork, rFree))
    assert rWork < 0.29
    assert rFree < 0.31
    # assert compl > 90.0

    return ()



def test_sharingBasic(browser,
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

    (d2.driver, d2.waitLong, d2.waitShort) = sf.startBrowser(remote, browser)
    d2.browser = browser
    d2.cloud = cloud
    d2.nologin = nologin
    d2.password = password
    d2.remote = remote
    d2.login = login

    d.testName = 'sharingTest'
    d2.testName = 'sharingTest'

    try:
        print('Opening URL d.driver 1: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title
        sf.loginToCloud(d.driver, login, password, nologin)


        print('Opening URL d.driver 2: %s' % cloud)
        d2.driver.get(cloud)
        # assert "CCP4 Cloud" in d2.driver.title
        sf.loginToCloud(d2.driver, login+'2', password, nologin)
        try:
            unjoinProject(d2.driver, '[' + login + ']:' + d.testName)

            sf.removeProject(d.driver, d.testName)
        except:
            pass

        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, 300)

        shareProject(d.driver, login+'2')
        joinSharedProject(d2.driver, d.testName)
        sf.enterProject(d2.driver, d.testName)
        time.sleep(1)
        sf.asymmetricUnitContentsAfterCloudImport(d2.driver, 300)
        time.sleep(1)
        # #Refresh and push stalled jobs
        # sf.clickByXpath(d.driver, "//button[contains(@style, 'images_png/refresh.png')]")
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        time.sleep(1)
        sf.editRevisionStructure_rnase(d.driver, 300)
        time.sleep(1)
        


        sf.clickTaskInTaskTree(d2.driver, '\[0003\] edit structure revision')
        time.sleep(1)
        startRefmac(d2.driver)
        time.sleep(1)
        sf.clickTaskInTaskTree(d.driver, '\[0002\]')
        time.sleep(2) # sensitive
        # startSimbad(d.driver)
        # time.sleep(10)
        # # pressing Close button for REFMAC window
        # # closeButton = d2.driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
        # # closeButton.click()
        # time.sleep(1)
        # sf.clickTaskInTaskTree(d2.driver, '\[0002\]')
        # time.sleep(1)
        # # startMrbump(d2.driver)

        # verifySimbad(d2.driver, 100)
        # sf.clickTaskInTaskTree(d.driver, '\[0005\] simbad')
        # startRefmac(d.driver)

        verifyRefmac(d.driver, 300, '0004', 0.17, 0.2)
        # verifyRefmac(d2.driver, 300, '0006', 0.24, 0.27)

        # verifyMrBump(d.driver)
        unshareProject(d.driver)
        

        #cant rename shared projects anymore
        sf.renameProject(d.driver, d.testName)
        try:
            d.driver.quit()
        except: 
            d2.driver.quit()
        
        try: 
            d2.driver.quit()
        except:
            d.driver.quit()

    except:
        try:
            d.driver.quit()
        except: 
            d2.driver.quit()
        
        try: 
            d2.driver.quit()
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

    test_sharingBasic(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
