

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


def refmacAfterRevision(driver, waitLong):
    print('Running REFMAC5')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

  
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Refinement with Refmac')
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task refmacAfterRevision has not been completed in time; terminating')
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
        match = re.search('\[0004\] refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', taskText)
        if match:
            rWork = float(match.group(1))
            rFree = float(match.group(2))
            break
    if (rWork == 1.0) or (rFree == 1.0):
        print('*** Verification: could not find Rwork or Rfree value after REFMAC5 run')
    else:
        print('*** Verification: REFMAC5 Rwork is %0.4f (expecting <0.17), Rfree is %0.4f (expecing <0.20)' % (rWork, rFree))
    assert rWork < 0.17
    assert rFree < 0.20

    return ()


def sendEmail(deposLog):
    import smtplib

    message = """
Dear Sirs, 

During testing of the Deposition task in CCP4Cloud, attempt to raise preliminary validation report via OneDep API have failed.
Please see extract from the log file below:

    
    """
    message += '\n'.join(deposLog)
    message += '\n\nThis is automatically generated message from CCP4Cloud test system.'

    toaddr = 'pdbdep@ebi.ac.uk'
    cc = ['ccp4_cloud@listserv.stfc.ac.uk', 'eugene.krissinel@stfc.ac.uk', 'deposit-help@mail.wwpdb.org']
    fromaddr = 'ccp4_cloud@listserv.stfc.ac.uk'
    message_subject = "OneDep API has failed - automated report from CCP4Cloud"

    messageToSend = "From: %s\r\n" % fromaddr
    messageToSend += "To: %s\r\n" % toaddr
    messageToSend += "CC: %s\r\n" % ",".join(cc)
    messageToSend += "Subject: %s\r\n" % message_subject
    messageToSend += "\r\n"
    messageToSend += message
    toaddrs = [toaddr] + cc
    server = smtplib.SMTP('lists.fg.oisin.rc-harwell.ac.uk')
    server.sendmail(fromaddr, toaddrs, messageToSend)
    server.quit()

    return()


def depositionAfterRefmac(driver):
    print('Running Deposition task')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Validation, Analysis and Deposition')
    time.sleep(1)

    try: 
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'PDB Validation Report')

        time.sleep(1)
    except: 
        pass
    
    try:
        sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Prepare data for PDB deposition')

        time.sleep(1)
    except:
        pass




    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, 1200) # normally takes around 5 minutes giving 20 - takes longer to run recently
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0005]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0005]')]")))
    except:
        print('Apparently the task depositionAfterRefmac has not been completed in time!')
        
    time.sleep(10)
    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(10)

    taskText = ''
    ttts = sf.tasksTreeTexts(driver)

    if d.cloud == "http://ccp4serv6.rc-harwell.ac.uk/jscofe-pre/":

        for task in ttts:
            match = re.search('\[0005\] prepare data for PDB deposition  -- (.*)', task)
            if match:
                taskText = match.group(1)
                print(taskText)
                break
        if taskText == '':
            print('*** Verification: could not find text result value after deposition run')
        else:
            print('*** Verification: deposition result is "%s" (expecting "package prepared, pdb report obtained")' % taskText)

    else:
        for task in ttts:
            match = re.search('\[0005\] PDB validation report -- (.*)', task)
            if match:
                taskText = match.group(1)
                print(taskText)
                break
        if taskText == '':
            print('*** Verification: could not find text result value after deposition run')
        else:
            print('*** Verification: deposition result is "%s" (expecting "package prepared, pdb report obtained")' % taskText)

    if not taskText == 'package prepared, pdb report obtained' or 'pdb report obtained':
        print('!!! Verification not passed!')

        # if not os.path.exists(os.path.expanduser('~/.setest_no_email')):
        #     print('Sending emails to OK, EK and pdbdep@ebi.ac.uk')
        #     time.sleep(1)
        #     sf.doubleClickTaskInTaskTree(driver, '\[0005\] prepare data for PDB deposition')
        #     time.sleep(2)
        #     driver.switch_to.frame(driver.find_element_by_xpath("//iframe[contains(@src, 'report/index.html')]"))
        #     sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Main Log')
        #     time.sleep(2)
        #     mainLog = driver.find_element(By.XPATH, "//pre[@id='log_page-0-0-pre']")
        #     logText = mainLog.text
        #     driver.switch_to.default_content()

        #     logStrings = logText.split('\n')
        #     isDeposLog = False
        #     deposLog = []
        #     for s in logStrings:
        #         if str(s).strip() == 'RUNNING DATA PREPARATION SCRIPT FROM EBI':
        #             isDeposLog = True
        #         if isDeposLog:
        #             deposLog.append(str(s))
        #     if len(deposLog) > 1:
        #         sendEmail(deposLog)

    assert taskText == 'package prepared, pdb report obtained' or 'pdb report obtained'

    return ()


def test_1RefmacBasic(browser,
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

    d.testName = 'refmacTest'


    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, login, password, nologin)

        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, d.testName)
        sf.enterProject(d.driver, d.testName)
        sf.importFromCloud_rnase(d.driver, d.waitShort)
        sf.asymmetricUnitContentsAfterCloudImport(d.driver, d.waitShort)
        sf.editRevisionStructure_rnase(d.driver, d.waitShort)
        refmacAfterRevision(d.driver, d.waitLong)

    except:
        d.driver.quit()
        raise


def test_2Deposition():

    try:
        depositionAfterRefmac(d.driver)
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

    test_1RefmacBasic(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_2Deposition()
