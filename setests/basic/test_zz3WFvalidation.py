
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


def validate3AEP(driver, waitLong):
    print ('validate3AEP verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(
                r'^auto-EP:\[\d*\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate3AEP results! Waited for long time plus %d seconds.' % waitLong)
            break
        time.sleep(60)

    # [aepWFTest] aepWFTest
    # auto-EP:[0001] EP automatic workflow -- imported HKL (1), Sequences (1); workflow started
    # auto-EP:[0002] asymmetric unit contents -- 1 molecule in ASU, Solv=64%
    # auto-EP:[0003] EP with Crank2 -- R=0.2541 Rfree=0.2874
    # auto-EP:[0004] refmac5 -- R=0.2525 Rfree=0.2912
    # auto-EP:[0005] refmac5 -- R=0.2530 Rfree=0.2921
    # auto-EP:[0006] fit waters -- Nwaters=126
    # auto-EP:[0007] refmac5 -- R=0.2095 Rfree=0.2472
    # auto-EP:[0008] refmac5 -- R=0.2047 Rfree=0.2438
    # auto-EP:[0009] refmac5 -- R=0.2066 Rfree=0.2451
    # auto-EP:[0010] deposition -- package prepared, pdb report obtained
    # auto-EP:[0011] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)

    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'auto-EP:[0001] EP automatic workflow -- imported HKL (1), Sequences (1); workflow started'

    print('Verifying CRANK2  Rfree < 0.31... ')
    match = False
    for t in ttts:
        match = re.search('EP with Crank2 --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.31

    print('Verifying fitwaters  >30 ... ')
    match = False
    for t in ttts:
        match = re.search('fit waters -- Nwaters=(\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(1)) > 30

    print('Verifying refmac5 Rfree < 0.28... ')
    match = False
    for t in reversed(ttts):
        match = re.search('refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.28

    print('Verifying deposition ... ')
    match = False
    for t in ttts:
        if 'deposition -- package prepared, pdb report' or 'PDB validation report -- pdb report obtained' in t:
            match = True
            break
    assert match

    return ()


def test_3_AEP_Validation(browser,
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

    d.testName = 'aepWFTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validate3AEP(d.driver, 1200)
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

    test_3_AEP_Validation(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
