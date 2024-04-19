


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

def importMRProject (driver):

    sf.doubleClickByXpath(driver, "//button[contains(@style, '/images_png/demoprj.png')]" )
    time.sleep(5)
    # sf.doubleClickByXpath(driver, "//button[contains(@style, 'images_png/folder_ccp4.png')]" )
    sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Demo projects')
    time.sleep(2)
    sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'D01. Simple Auto-MR with MoRDa')
    time.sleep(60)

    if driver.find_element(By.XPATH, "//table[contains(text(), '%s')]" % 'Demo Project "D01" is imported.'):
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Close')
    else:
        print ("Project wasn't imported")


    return ()

def removeProject(driver, testName):
    print('Deleting previous test project if exists')

    textEls = driver.find_elements_by_xpath("//*[starts-with(text(), '%s')]" % testName)
    if len(textEls) > 0:
        try:
            sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % testName)
            time.sleep(1)

            sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Delete')
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



def startRefmac(driver, waitLong):
    print('Running REFMAC5 by adding to Dimple')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1.25)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1.25)

    
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(1)
   
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(1)

    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/runjob.png')]" )

    # There are several forms - active and inactive. We need one displayed.
    #buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    #for buttonRun in buttonsRun:
        #if buttonRun.is_displayed():
            #buttonRun.click()
            #break
            
    time.sleep(6)

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(3)

    return ()


def startRefmacAniso(driver, waitLong):
    print('Running REFMAC5 by adding to comb')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1.25)

 
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
    time.sleep(2)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Basic options')
    time.sleep(1.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Model Parameterisation')
    time.sleep(1.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Isotropic')
    time.sleep(1.25)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Anisotropic')
    time.sleep(1.25)


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
    time.sleep(3)

    return ()


def startMordaCloning(driver, waitLong):
    print('Running MORDA by cloning of 0004-morda')

    #Cloning job - cloning button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/clonejob.png')]")
    addButton.click()
    time.sleep(1.25)

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



def verifyRefmac(driver, waitLong, jobNumber, targetRwork, targetRfree):
        rWork = 1.0
        rFree = 1.0
        print('REFMAC5 verification, job ' + jobNumber)

        time.sleep(1)
        startTime = time.time()

        while (True):
            ttts = sf.tasksTreeTexts(driver)
            for taskText in ttts:
                # Job number as string
                match = re.search('\[' + jobNumber +'\].*-- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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


def verifyMorda(driver, waitLong, jobNumber, targetRwork, targetRfree):
    rWork = 1.0
    rFree = 1.0
    print('MORDA verification, job ' + jobNumber)

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('\[' + jobNumber + '\].*-- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(1))
                rFree = float(match.group(2))
                break
        if (rWork != 1.0) or (rFree != 1.0):
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for MORDA results! Waited for %d seconds.' % waitLong)
            break
        time.sleep(10)

    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after MORDA run')
    else:
        print('*** Verification: MORDA Rwork is %0.4f (expecting <%0.2f), Rfree is %0.4f (expecing <%0.2f)' % (
            rWork, targetRwork, rFree, targetRfree))
    assert rWork < targetRwork
    assert rFree < targetRfree

# def test_1oldProjectsMR(browser,
#                       cloud,
#                       nologin,
#                       login,
#                       password,
#                       remote
#                       ):

#     listOfExpectedTasks = ['[01.auto-mr] Simple Auto-MR with MoRDa',
#     '[0001] Based on CCP4 RNase example. Open this remark for input data location',
#     '[0004] imported: HKL (1) Sequence (1) -- completed.',
#     '[0005] asymmetric unit contents -- Solv=47.6%',
#     '[0006] morda -- R=0.2475 Rfree=0.2617',
#     '[0007] Check sequence similarity of found solution and target protein',
#     '[0008] seqalign -- Seq.Id=100.0%',
#     '[0009] Found solution does not need rebuilding. Add water, refine and deposit',
#     '[0010] fit waters -- Nwaters=349',
#     '[0011] dimple -- R=0.1958 Rfree=0.2191',
#     '[0012] deposition -- package prepared, pdb report obtained R=0.1958 Rfree=0.2191',
#     '[0019] R-factors are a bit too high for given resolution',
#     '[0013] structure adjustments with coot (fit, refine, ramachandran) -- completed.',
#     '[0017] refine with anisotropic B-factors -- R=0.1532 Rfree=0.1954',
#     '[0018] deposition -- package prepared, pdb report obtained',
#     '[0020] R-factors may be still too high; unmodelled blobs remain']


#     (d.driver, d.waitLong, d.waitShort) = sf.startBrowser(remote, browser)
#     d.browser = browser
#     d.cloud = cloud
#     d.nologin = nologin
#     d.password = password
#     d.remote = remote
#     d.login = login

#     d.testName = 'D01'

    
#     try:
        
#         print('Opening URL: %s' % cloud)
#         d.driver.get(cloud)

#         assert "CCP4 Cloud" in d.driver.title
#         if not nologin:
#             sf.loginToCloud(d.driver, login, password, nologin)
        
        
#         removeProject(d.driver, d.testName)

#         # if sys.platform.startswith("win"):
#         #     sf.importLocalProject(d.driver, '%userprofile%\old_cloud\01.ccp4cloud')
#         # else:
#         #     sf.importLocalProject(d.driver, '~/old_cloud/01.ccp4cloud')
#         importMRProject(d.driver)
#         time.sleep(1)

#         sf.enterProject(d.driver, d.testName)

#         time.sleep(5)
#         # listOfActualTasks = []
#         # tasksText = d.driver.find_elements(By.XPATH,
#         #                                  "//a[contains(@id,'treenode') and contains(@class, 'jstree-ancho')]")
#         # for e in tasksText:
#         #     txt = e.text
#         #     print(txt)
#         #     listOfActualTasks.append(txt)

#         # assert len(listOfActualTasks) == len(listOfExpectedTasks)
#         # assert listOfActualTasks == listOfExpectedTasks

#         sf.clickTaskInTaskTree(d.driver, '\[0004\] morda')
#         startMordaCloning(d.driver, d.waitLong)
#         time.sleep(1)

#         sf.clickTaskInTaskTree(d.driver, '\[0009\] dimple')
#         time.sleep(1)
#         startRefmac(d.driver, d.waitLong)
#         time.sleep(1)

#         sf.clickTaskInTaskTree(d.driver, '\[0011\] comb structure')
#         time.sleep(1)
#         startRefmacAniso(d.driver, d.waitLong)
#         time.sleep(1)

#     except:
#         d.driver.quit()
#         raise

# def test_2oldProjectsMR_verifyNewRefmac():
#     try:
#         verifyRefmac(d.driver, d.waitLong, '0030', 0.2, 0.22)
#     except:
#         d.driver.quit()
#         raise

# def test_3oldProjectsMR_verifyCloneRefmac():
#     try:
#         verifyRefmac(d.driver, d.waitLong, '0031', 0.16, 0.22)
#     except:
#         d.driver.quit()
#         raise

# def test_4oldProjectsMR_verifyCloneMorda():
#     try:
#         verifyMorda(d.driver, 1200, '0029', 0.26, 0.28) # 1200 seconds to wait (20 minutes, takes ~15 on average)
#         sf.renameProject(d.driver, 'Simple Auto-MR with MoRDa')
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

    test_1oldProjectsMR(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    test_2oldProjectsMR_verifyNewRefmac()
    test_3oldProjectsMR_verifyCloneRefmac()
    test_4oldProjectsMR_verifyCloneMorda()
