from lib2to3.pgen2 import driver
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


def addSlice(driver):
    print('Running Slice task')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR Model Preparation')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Split MR model with')
    time.sleep(1)



   
    
    time.sleep(6)
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(3)

    try:
        wait = WebDriverWait(driver, 600) # 10 minutest wait
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'slice') and contains(text(), 'completed')]")))
    except:
        print('Apparently the Slice task has not been completed in time!')

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(3)
    
    finished = False

    textEls = driver.find_elements_by_xpath( "//*[normalize-space()='%s']" % '1 model generated')   
    for textEl in reversed(textEls):
        if textEl.is_displayed():
            finished = True 

    time.sleep(1)

    assert finished == True


    return ()

def slicendiceVerification(driver, waitLong):
    print('Slice-n-Dice verification started')

    startTime = time.time()

    rWork = 1.0
    rFree = 1.0
    success = False

    while (True):

        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validateStructurePrediction results! Waited for long time plus %d seconds.' % waitLong)
            break
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            #LLG=1977.0 TFZ=45.7 R=0.2969 R
            match = re.search('\[.*\] slicendice -- LLG=(.*) TFZ=(.*) R=(0\.\d*) Rfree=(0\.\d*)', taskText)
            if match:
                rWork = float(match.group(3))
                rFree = float(match.group(4))
                # print(rWork)
                # print(rFree)
            
        if (rWork < 0.32) or (rFree < 0.34):

            print('*** Verification: Slice-n-Dice Rwork is %0.4f(expecting <0.32), Rfree is %0.5f (expecing <0.34)' % (rWork, rFree))
            success = True
            break
        else:
            print('*** Verification failed! Slice-n-Dice Rwork is %0.4f(expecting <0.32), Rfree is %0.5f (expecing <0.34)' % (rWork, rFree))

                
            

    time.sleep(2)
    assert success == True

    time.sleep(3)

    return ()

def validateStructurePrediction(driver, waitLong):

    print ('Structure Prediction task verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search('predicted', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validateStructurePrediction results! Waited for long time plus %d seconds.' % waitLong)
            break



    return ()

def addSliceNDice(driver):
    print('Running Slice-n-Dice task')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'MR with model splitting using')
    time.sleep(1)

    tasksInputs = driver.find_elements_by_xpath("//input[contains(@title, 'Maximum number of splits to try.')]")

    tasksInputs[-1].click()
    tasksInputs[-1].clear()
    tasksInputs[-1].send_keys('1')
    

    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    time.sleep(16)


    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def test_slicenDiceBasic(browser,
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

    d.testName = 'structurePrediction'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        
        sf.enterProject(d.driver, 'structurePrediction')
        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        validateStructurePrediction(d.driver, 1000)
        addSliceNDice(d.driver)
        sf.clickTaskInTaskTree(d.driver, '\[0003\]')
        addSlice(d.driver)
        # sf.clickTaskInTaskTree(d.driver, '\[0004\]')
        slicendiceVerification(d.driver, 1300)
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

    test_slicenDiceBasic(browser=parameters.browser,  # or 'Chrome'
                     cloud=parameters.cloud,
                     nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                     login=parameters.login,  # Used to login into remote Cloud
                     password=parameters.password,  # Used to login into remote Cloud
                     remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                     )
