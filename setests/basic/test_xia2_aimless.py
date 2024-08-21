
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


def xia2Processing(driver, isLocal):
    print('Running XIA-2 for Hg dataset')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Automatic Image Processing with Xia-2')
    time.sleep(1)

    if isLocal:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'local file system')
        time.sleep(1)

        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'cloud storage')
        time.sleep(1)

        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Browse')
        time.sleep(1)


        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'CCP4 examples')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hypF_images')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hg_001.mar1600')
        time.sleep(1)

    else:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Browse')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'test-data')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hypF_images')
        time.sleep(1)

        sf.doubleClickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'hg_001.mar1600')
        time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 1200) # allowing 20 minutes to the task to finish, normally takes 3 minutes, but 6 minutes locally. Slower on dev
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0001]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0002]')]")))
    except:
        print('Apparently the task xia2Processing has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    # found = False
    # ttts = sf.tasksTreeTexts(driver)
    # for taskText in ttts:
    #     match = re.search('\[0002\] created datasets: Unmerged \(2\) HKL \(1\) -- completed', taskText)
    #     if match:
    #         found = True
    #         break
    #     match = re.search('\[0002\] created datasets: HKL \(1\) Unmerged \(2\) -- completed', taskText)
    #     if match:
    #         found = True
    #         break

    # if not found:
    #     print('*** Verification: could not find message about created datasets after xia-2 run')
    # else:
    #     print('*** Verification: datasets created by XIA-2')
    # assert found

    # return ()


def aimlessAfterXia2(driver, waitLong):
    print('Running Aimless after Xia-2')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Data Processing')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Merging and Scaling with Aimless')
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
        print('Apparently the task xia2Processing has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
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
              'Compl is %0.1f %%(expecting >90.0), ' \
              'cc1/2 is %0.3f (expecting >0.9), ' \
              'rAll is %0.3f (expecing <0.1), ' \
              'rAno is %0.3f (expecing <0.07), ' \
              'resHigh is %0.2f (expecing <2.5), ' \
              'resLow is %0.2f (expecing >35.0), ' \
              'SG is %s (expecting "H 3 2")'   % (compl, cc12, rAll, rAno, res1, res2, sg))
    assert compl > 90.0
    assert cc12 > 0.9
    assert rAll < 0.1
    assert rAno < 0.07
    assert res1 < 2.5
    assert res2 > 20.0
    assert sg == 'H 3 2'

    return ()


def simbad_05(driver, waitLong):
    print('Running SIMBAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0005]')]")))
    except:
        print('Apparently the task simbadAfterImport has not been completed in time; terminating')
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
        match = re.search('\[0005\] simbad --.*R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break

    if (rWork != 1.0) and (rFree != 1.0):
        print('*** Verification: SIMBAD ' \
              'Rwork/Rfree is %0.4f / %0.4f (expecting < 0.4 and < 0.42 ), '  % (rWork, rFree))
        assert rWork < 0.4
        assert rFree < 0.42

    return ()


def dimple_06(driver, waitLong):
    print('Running Dimple')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)


    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(1)
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Dimple refinement')
    time.sleep(1)



    

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong)
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0006]')]")))
    except:
        print('Apparently tha task dimple has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    rWork = 1.0
    rFree = 1.0
    ttts = sf.tasksTreeTexts(driver)
    for taskText in ttts:
        match = re.search('\[0006\] dimple -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after Dimple run')
    else:
        print('*** Verification: Dimple Rwork is %0.4f (expecting <0.35), Rfree is %0.4f (expecing <0.42)' % (rWork, rFree))
    assert rWork < 0.35
    assert rFree < 0.42

    return ()


def addRemark(driver, title, detail, colour=None):
    print('Adding remark: %s' % title)

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/task_remark.png')]")
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
        colourButton = driver.find_element(By.XPATH, "//div[@class='menu-dropbtn' and contains(@style, 'images_png/task_remark_s.png')]")
        colourButton.click()
        time.sleep(1)

        sf.clickByXpath(driver, "//*[normalize-space()='%s']" % colour)
        time.sleep(1)
        
    time.sleep(10)
    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


def removeBothRemarks(driver):
    print('Removing remark: 0001')

    sf.clickTaskInTaskTree(d.driver, '\[0001\]')
    time.sleep(2)

    rmButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/remove.png')]")
    rmButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//button[@class='ui-button ui-corner-all ui-widget' and normalize-space()='Yes']")
    time.sleep(2)

    sf.clickTaskInTaskTree(d.driver, '\[0004\]')
    time.sleep(2)

    rmButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/remove.png')]")
    rmButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//button[@class='ui-button ui-corner-all ui-widget' and normalize-space()='Yes']")
    time.sleep(2)



def test_1xia2(browser,
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

    d.testName = 'xia2AimlessRemarksTest'

    isLocal = False
    if 'localhost' in d.cloud:
        isLocal = True

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        try:
            sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        except:
            pass
        try:
            sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Close')
        except:
            pass
        time.sleep(1)

        addRemark(d.driver, 'Test1 remark as first task', 'test1 details') # 1

        xia2Processing(d.driver, isLocal) #2

    except:
        d.driver.quit()
        raise


def test_2aimless():
    try:
        aimlessAfterXia2(d.driver, d.waitLong) # 03
        addRemark(d.driver, 'Test2 remark in the middle', 'test2 details') # 4
    except:
        d.driver.quit()
        raise


def test_3simbad():
    try:
        simbad_05(d.driver, 600) # 05
    except:
        d.driver.quit()
        raise


def test_4remarksDimple():
    try:
        removeBothRemarks(d.driver)
        sf.clickTaskInTaskTree(d.driver, '\[0005\]')
        time.sleep(2)
        dimple_06(d.driver, 300) # 06

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

    test_1xia2(browser=parameters.browser,  # or 'Chrome'
                      cloud=parameters.cloud,
                      nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                      login=parameters.login,  # Used to login into remote Cloud
                      password=parameters.password,  # Used to login into remote Cloud
                      remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                      )
    # test_2aimless()
    # test_3simbad()
