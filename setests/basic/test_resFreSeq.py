# coding=utf-8
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


def importFromCloud_mdm2(driver, waitShort):
    print ('Importing mdm2 from the Cloud Import')

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'test-data')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "test-data" nor "CCP4 examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2_nolig'),
                                ('a','mdm2_unmerged.mtz'),
                                ('button','Select more files'),
                                ('a', '4hg7.pdb'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0001]')]")))
    except:
        print('Apparently tha task import has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def sequenceCopyPaste(driver, waitShort):
    print('Sequence copy and paste')

    seq = """>4HG7
GPLGSSQIPASEQETLVRPKPLLLKLLKSVGAQKDTYTMKEVLFYLGQYIMTKRLYDAAQQHIVYCSNDLLGDLFGVPSFSVKEHRKIYTMIYRNLV    
    """

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Import')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Import Sequence(s) by Copy-Paste')
    time.sleep(1)

    sf.clickByXpath(driver, "//span[normalize-space()='%s']" % '[must be chosen]')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % ('Protein'))
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//textarea[contains(@placeholder,'Copy-paste your sequence(s) here, including title line(s)')]")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys(seq)
    time.sleep(2)

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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task sequenceCopyPaste has not been completed in time; terminating')
        sys.exit(1)
    # presing Close button
    time.sleep(2)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def aimless(driver, waitLong):
    print('Running Aimless ')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently the task aimless has not been completed in time; terminating')
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
        match = re.search('\[0003\] aimless -- Compl=(.*)\% CC1\/2=(.*) Rmeas_all=(.*) Rmeas_ano=(.*) Res=(.*)-(.*) SpG=(.*)', taskText)
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

    return ()


def changeASUsg(driver, waitShort):
    print('Changing dataset SG')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)


    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Change Dataset Space Group')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task changeASUsg has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    newsg = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0004\] change dataset space group -- SpG=(.*)', taskText)
        if match:
            newsg = match.group(1)
            break
    if newsg == '':
        print('*** Verification: could not find SG value after  run')
    else:
        print('*** Verification: SG is %s (expecing "P 65 2 2")' % (newsg))
    assert newsg == 'P 65 2 2'


    return ()


def changeReso(driver, waitShort):
    print('Changing dataset resolution')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)


    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Change Dataset Resolution')
    time.sleep(1)

    inputASU = driver.find_elements_by_xpath("//input[contains(@title,'Low resolution limit')]")
    inputASU[-1].click()
    inputASU[-1].clear()
    inputASU[-1].send_keys('40.0')
    time.sleep(1)

    inputASU = driver.find_elements_by_xpath("//input[contains(@title,'High resolution limit')]")
    inputASU[-1].click()
    inputASU[-1].clear()
    inputASU[-1].send_keys('3.0')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently tha task changeReso has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    newRes = ''
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0005\] change dataset resolution -- new resolution limits: Res=(.*)..', taskText)
        if match:
            newRes = match.group(1)
            break
    if newRes == '':
        print('*** Verification: could not find resolution value after  run')
    else:
        print(u'*** Verification: resolution is %s (expecing "3.0—40.0")' % (newRes))
    assert newRes == u'3.0—40.0'

    return ()


def freeRflag(driver, waitShort):
    print('Changing freeR set')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)


    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[starts-with(text(), '%s')]" % 'Free R-flag')
    time.sleep(1)

    inputASU = driver.find_elements_by_xpath("//input[@placeholder='0.05']")
    inputASU[-1].click()
    inputASU[-1].clear()
    inputASU[-1].send_keys('0.03')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0006]')]")))
    except:
        print('Apparently tha task freeRflag has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return ()


def editRevisionStructure_08(driver, waitShort):
    print('Making structure revision 0008')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'Full list')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Asymmetric Unit and Structure Revision')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[normalize-space()='%s']" % 'Edit Structure Revision')
    time.sleep(1)

    sf.clickByXpathMultiple(driver, "//span[normalize-space()='%s']" % '[do not change]', 6) # 6 = 3*2, I have no idea why there are two times more elements
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s') and contains(text(), '%s')]" % ('4hg7', 'xyz'))
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
        print('Apparently tha task editRevisionStructure has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    time.sleep(2)
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

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
            match = re.search('\[' + jobNumber + '\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
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
    assert (rFree - rWork) > 0.06 # specific effect of Rfree change


def test_1seqcopy(browser,
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

    d.testName = 'seqRfreeResTest'

    isLocal = False
    if 'localhost' in d.cloud:
        isLocal = True

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        importFromCloud_mdm2(d.driver, d.waitShort) # 1
        sequenceCopyPaste(d.driver, d.waitShort) # 2
    except:
        d.driver.quit()
        raise


def test_2resolution():
    try:
        aimless(d.driver, d.waitLong) # 3
        changeASUsg(d.driver, d.waitLong) # 4
        time.sleep(1)
        changeReso(d.driver, d.waitShort) # 5
    except:
        d.driver.quit()
        raise


def test_3freeRflag():
    try:
        freeRflag(d.driver, d.waitShort) # 6
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort, task='0007')  # 7
        editRevisionStructure_08(d.driver, d.waitShort)  # 08
        sf.startRefmac(d.driver, d.waitLong) # 09
        verifyRefmac(d.driver, d.waitLong, '0009', 0.2, 0.3)

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

    test_1seqcopy(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    test_2resolution()
    test_3freeRflag()

