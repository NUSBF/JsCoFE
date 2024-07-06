
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import time, sys, os, re

curPath = os.path.dirname(os.path.abspath(__file__))
curPath = curPath+os.sep+'..'+ os.sep
if curPath not in sys.path:
    sys.path.insert(0, curPath)
import setests_func as sf

d = sf.driverHandler()


remarkTitle1 = 'Based on CCP4 MDM2 example, including ligand fitting. Open this remark for input data location'
remarkDetail1 = """This tutorial uses automatic solver CCP4go. 
This task can be run at root of CCP4 Cloud projects, then it will have its own import. It is currently limited to only uploading files from user's machine.
Alternatively, it can be run after import (and ligand preparation, if applicable) task(s) (at least diffraction data from MTZ file and sequence should be imported).

For this tutorial, input data is:

/path/to/ccp4/share/ccp4i2/demo_data/mdm2/mdm2_unmerged.mtz
/path/to/ccp4/share/ccp4i2/demo_data/mdm2/4hg7.seq

"""

def importREADME(driver, waitShort):
    print ('Importing README - SAD')

    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(2)

    # Clicking "Cloud Import"
    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Cloud Import')
    time.sleep(1)

    textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'ccp4-examples')
    if len(textEl2) < 1:
        textEl2 = driver.find_elements_by_xpath("//a[normalize-space()='%s']" % 'CCP4 examples')
    if len(textEl2) < 1:
        print('Cant locate neither "CCP4 examples" nor "ccp4-examples"; terminating.')
        sys.exit(1)
    ActionChains(driver).move_to_element(textEl2[-1]).double_click(textEl2[-1]).perform()
    time.sleep(1)

    listOfTextsToDoubleClick = [('a','mdm2'),
                                ('a','README.html'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'finished') and contains(text(), '[0002]')]")))
    except:
        print('Apparently tha task importing README has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def importFromCloud_mdm2(driver, waitShort):
    print ('Importing mdm2 from the Cloud Import')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

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
                                ('a', '4hg7.fasta'),
                                ('button', 'Apply & Upload'),
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
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0003]')]")))
    except:
        print('Apparently tha task import gere SAD has not been completed in time; terminating')
        sys.exit(1)

    # presing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)

    return ()


def makingLigand(driver, waitLong):
    print ('Making Ligand')

    # presing Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Ligands')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'Make Ligand with Acedrg')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'SMILES string')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % 'SMILES string')
    time.sleep(3)

    inputASU = driver.find_element_by_xpath("//input[@title='SMILES string to define ligand structure']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('COc1ccc(c(OC(C)C)c1)C2=N[C@H]([C@H](N2C(=O)N3CCNC(=O)C3)c4ccc(Cl)cc4)c5ccc(Cl)cc5')
    time.sleep(1)

    inputASU = driver.find_element_by_xpath("//input[@title='3-letter ligand code for identification']")
    inputASU.click()
    inputASU.clear()
    inputASU.send_keys('NUT')
    time.sleep(1)

# There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break

    try:
        wait = WebDriverWait(driver, waitLong) # allowing 15 seconds to the task to finish
        # Waiting for the text 'completed' in the ui-dialog-title of the task [0002]
        wait.until(EC.presence_of_element_located
                   ((By.XPATH,"//*[@class='ui-dialog-title' and contains(text(), 'completed') and contains(text(), '[0004]')]")))
    except:
        print('Apparently tha task makingLigand_0004 has not been completed in time; terminating')
        sys.exit(1)

    time.sleep(1)
    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


def startCCP4go(driver):
    print('Starting CCP4go')

    # Add button
    addButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/add.png')]")
    addButton.click()
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'All tasks')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[starts-with(text(), '%s')]" % 'CCP4go auto-solver')
    time.sleep(1)

    sf.clickByXpath(driver, "//*[normalize-space()='%s']" % '[do not use]')
    time.sleep(1)

    sf.clickByXpath(driver, "//div[contains(text(), '%s')]" % '-01] NUT')
    time.sleep(1)

    # There are several forms - active and inactive. We need one displayed.
    buttonsRun = driver.find_elements_by_xpath("//button[contains(@style, 'images_png/runjob.png')]" )
    for buttonRun in buttonsRun:
        if buttonRun.is_displayed():
            buttonRun.click()
            break
    time.sleep(10)

    # presing Close button
    sf.clickByXpath(driver, "//button[contains(@style, 'images_png/close.png')]")
    time.sleep(1)

    return()


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

    # pressing Close button
    closeButton = driver.find_element(By.XPATH, "//button[contains(@style, 'images_png/close.png')]")
    closeButton.click()
    time.sleep(1)


def generate_03(browser,
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

    d.testName = '03.ccp4go'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        # assert "CCP4 Cloud" in d.driver.title

        if not nologin:
            sf.loginToCloud(d.driver, login, password, nologin)


        sf.removeProject(d.driver, d.testName)
        sf.makeTestProject(d.driver, d.testName, 'Fully automated solution with CCP4go pipeline')
        sf.enterProject(d.driver, d.testName)
        time.sleep(2)

        sf.clickByXpath(d.driver, "//button[normalize-space()='%s']" % 'Cancel')
        time.sleep(1)

        addRemark(d.driver, remarkTitle1, remarkDetail1) # 1
        importREADME(d.driver, d.waitShort) # 2
        sf.clickTaskInTaskTree(d.driver, '\[0001\]')
        importFromCloud_mdm2(d.driver, d.waitShort) # 3
        makingLigand(d.driver, d.waitLong) # 4
        startCCP4go(d.driver) # 5
        time.sleep(5)

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
    parser.add_argument('--login', action='store', dest='login', help=argparse.SUPPRESS, default='setests2') # Login
    parser.add_argument('--password', action='store', dest='password', help=argparse.SUPPRESS, default='') # password
    parser.add_argument('--nologin', action='store', dest='nologin', help=argparse.SUPPRESS, default=False) # login into Cloud or not

    parameters = parser.parse_args(sys.argv[1:])

    password = parameters.password
    if password == '':
        try:
            import os, sys, base64

            if sys.platform.startswith("win"):
                fileName = os.path.expanduser('%userprofile%\setest_pwd')
            else:
                fileName = os.path.expanduser('~/.setest_pwd')

            if os.path.exists(fileName):
                f = open(fileName, 'r')
                password = base64.b64decode(f.readline().decode('utf-8').strip() + '=')
                f.close()
        except:
            print('Something happend during attempt to read password from the pwd file')
            raise

    generate_03(browser=parameters.browser,  # or 'Chrome'
                cloud=parameters.cloud,
                nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
                login=parameters.login,  # Used to login into remote Cloud
                password=password,  # Used to login into remote Cloud
                remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
                )
