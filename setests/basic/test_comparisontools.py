
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.dirname(os.path.abspath(__file__))
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf

d = sf.driverHandler()


def gesamtAfterRevision(driver, waitLong):
    print('Running GESAMT')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Structure Alignment and Superposition with Gesamt')
    time.sleep(1)

    try:
        sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[do not use]')
        time.sleep(1)#
        sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % '[0003-01] editrevision')
        time.sleep(1)

    except:
        pass


    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % 'A (protein)')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'B (protein)')
    time.sleep(1)


    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0004]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task gesamtAfterRevision has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    q = 0.0
    rmsd = 1.0
    nalign = 0
    seqid = 0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] gesamt \(pairwise\) -- Q=(0\.\d*), r\.m\.s\.d\.=(0\.\d*)., Nalign=(\d*), seqId=(\d*)%', taskText)
        if match:
            q = float(match.group(1))
            rmsd = float(match.group(2))
            nalign = int(match.group(3))
            seqid = int(match.group(4))
            break
    if (q == 0.0) or (rmsd == 1.0):
        print('*** Verification: could not find Q or RMSD value after GESAMT run')
    else:
        print('*** Verification: GESAMT Q is %0.2f (expecting >0.9), rmsd is %0.2f (expecing >0.5, <0.6), ' \
              'Nalign is %d (expecting >90), seqId is %d %% (expecting >95%%)' % (q, rmsd, nalign, seqid))
    assert q > 0.9
    assert rmsd < 0.6
    assert rmsd > 0.5
    assert nalign > 90
    assert seqid > 95

    return ()


def lsqkabAfterGesamt(driver, wait):
    print('Running LSQKAB')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(3)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(3)
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Structure Superposition with LSQKab')
        time.sleep(1)
    except:
        pass
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Structure Superposition with LsqKab')
        time.sleep(1)
    except:
        pass


    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % 'A (protein)')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % 'B (protein)')
    time.sleep(1)

    firstResids = driver.find_elements_by_xpath("//input[@title='First number in the range']")
    for res in firstResids:
        if res.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", res)
            res.clear()
            res.send_keys('1')
            time.sleep(1)

    lastResids = driver.find_elements_by_xpath("//input[@title='Last number in the range']")
    for res in lastResids:
        if res.is_displayed():
            driver.execute_script("arguments[0].scrollIntoView();", res)
            res.clear()
            res.send_keys('95')
            time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, wait) # normally takes around 5 minutes giving 7
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently the task LSQKAB has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    taskRes = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0005\] lsqkab -- (.*)', taskText)
        if match:
            taskRes = match.group(1)
            break
    if taskRes == '':
        print('*** Verification: could not find text result value after LSQKAB run')
    else:
        print('*** Verification: LSQKAB result is "%s" (expecting "completed.")' % taskRes)
    assert taskRes == 'completed.'

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

    time.sleep(10)
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


def symmatch(driver, waitLong):
    print('Running csymmatch')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Toolbox')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Symmetry Match to Reference Structure with CSymMatch')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0004]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0007]')]")))
    except:
        print('Apparently tha task csymmatch has not been completed in time; terminating')
        sys.exit(1)
        
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rwork = 1.0
    rfree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0007\] symmatch -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rwork = float(match.group(1))
            rfree = float(match.group(2))
            break
    if (rwork == 1.0) or (rfree == 1.0):
        print('*** Verification: could not find r or Rfree value after csymmatch run')
    else:
        print('*** Verification: cSymmMatch R is %0.4f (expecting <0.3), rfree is %0.4f (expecing <0.3), ' % (rwork, rfree))
    assert rwork < 0.3
    assert rfree < 0.3

    return ()


def test_1comparisontoolsGesamt(browser,
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

    d.testName = 'alignmentToolsTest'

    try:
        print('Opening URL: %s' % d.cloud)
        d.driver.get(d.cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        sf.editRevisionStructure_rnase(d.driver, d.waitShort)
        gesamtAfterRevision(d.driver, d.waitShort)

    except:
        d.driver.quit()
        raise


def test_2comparisontoolsLSQkab():
    try:
        sf.clickTaskInTaskTree(d.driver, '\[0003\] edit structure revision ')
        lsqkabAfterGesamt(d.driver, d.waitShort)
    except:
        d.driver.quit()
        raise


def test_3comparisontoolsSeqAlign():

    try:

        sf.clickTaskInTaskTree(d.driver, '\[0003\] edit structure revision')
        sequenceAlignment(d.driver, d.waitShort)

    except:
        d.driver.quit()
        raise


def test_4comparisontoolsSymmatch():
    try:

        sf.clickTaskInTaskTree(d.driver, '\[0003\] edit structure revision')
        symmatch(d.driver, d.waitShort)

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

    test_1comparisontoolsGesamt (browser=parameters.browser,  # or 'Chrome'
                         cloud=parameters.cloud,
                         nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                         login=parameters.login,  # Used to login into remote Cloud
                         password=parameters.password,  # Used to login into remote Cloud
                         remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                         )
    test_2comparisontoolsLSQkab()
    test_3comparisontoolsSeqAlign()
    test_4comparisontoolsSymmatch()