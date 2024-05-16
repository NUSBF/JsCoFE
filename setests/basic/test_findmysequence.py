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


def  simbad(driver, waitLong):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    
    time.sleep(1)

    
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Lattice and Contaminants Search with Simbad')
    time.sleep(1)
    


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 10 minutes to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently the task simbad has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    print('SIMBAD verification')

    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0002\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break

    if (rWork != 1.0) and (rFree != 1.0):
        print('*** Verification: SIMBAD ' \
              'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.3027 and < 0.3055 ), '  % (rWork, rFree))
        assert rWork < 0.31
        assert rFree < 0.31

    return ()

def findmyseq(driver, waitLong):
    print('Running FindMySequence task')
    time.sleep(3)
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'FindMySequence')
    time.sleep(1)
    


    #Number of top hits to 1

    hits_number = driver.find_elements_by_xpath("//input[@placeholder='3']")
    hits_number[-1].click()
    hits_number[-1].clear()
    hits_number[-1].send_keys('1')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 5 minutes to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently FindMySequence task has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


    finished = False

    textEls = driver.find_elements_by_xpath( "//*[normalize-space()='%s']" % '1 sequences found')  or  driver.find_elements_by_xpath( "//*[normalize-space()='%s']" % '1 sequence found')
    for textEl in reversed(textEls):
        if textEl.is_displayed():
            finished = True 

    time.sleep(1)

    assert finished == True


    return()
def mordaAfterASU(driver, waitLong):
    print('Running MORDA')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automated Molecular Replacement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Auto-MR with MoRDa')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 20 minutes to the task to finish, normally takes 10 minutes
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0003]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently the task mordaAfterASU has not been completed in time; terminating')
        sys.exit(1)
    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0005\] morda -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find compl or Rwork or Rfree value after MORDA run')
    else:
        print('*** Verification: MORDA ' \
              'Rwork is %0.4f (expecting <0.2708), ' \
              'Rfree is %0.4f (expecting <0.3098)' % (rWork, rFree))
    assert rWork < 0.28
    assert rFree < 0.31

    return ()
    



def test_fms(browser,
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

    d.testName = 'findmysequence'

    isLocal = False
    if 'localhost' in d.cloud:
        isLocal = True

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_gamma_mtz(d.driver, d.waitShort) # 1
        simbad(d.driver, 1000) #2
        findmyseq (d.driver, 300) #3
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, 100, task='0004') #4
        mordaAfterASU (d.driver, 1200) #5
        sf.renameProject (d.driver, d.testName)





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

    test_fms(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
 

