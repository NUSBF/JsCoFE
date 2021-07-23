
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
                r'^auto-EP:\[0012\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate3AEP results! Waited for 50 minutes plus %d seconds.' % waitLong)
            break
        time.sleep(60)

#0 [aepWFTest] aepWFTest
#1 auto-EP:[0001] EP automatic workflow -- imported HKL (1), Sequences (1); workflow started
#2 auto-EP:[0002] asymmetric unit contents -- 1 molecule in ASU, Solv=64%
#3 auto-EP:[0003] EP with Crank2 -- R=0.2594 Rfree=0.2936
#4 auto-EP:[0004] refmac5 -- R=0.2576 Rfree=0.3012
#5 auto-EP:[0005] refmac5 -- R=0.2609 Rfree=0.2996
#6 auto-EP:[0006] fit waters -- Nwaters=108
#7 auto-EP:[0007] refmac5 -- R=0.2205 Rfree=0.2610
#8 auto-EP:[0008] refmac5 -- R=0.2144 Rfree=0.2574
#9 auto-EP:[0009] refmac5 -- R=0.2163 Rfree=0.2585
#10 auto-EP:[0010] refmac5 -- R=0.2191 Rfree=0.2595
#11 auto-EP:[0011] deposition -- package prepared, pdb report obtained
#12 auto-EP:[0012] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)
    #1 auto-EP:[0001] EP automatic workflow -- imported HKL (1), Sequences (1); workflow started
    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'auto-EP:[0001] EP automatic workflow -- imported HKL (1), Sequences (1); workflow started'

    #3 auto-EP:[0003] EP with Crank2 -- R=0.2594 Rfree=0.2936
    print('Verifying CRANK2 0003 Rfree < 0.31... ')
    match = re.search('\[0003\] EP with Crank2 --.*R=(0\.\d*) Rfree=(0\.\d*)', ttts[3])
    assert match
    assert float(match.group(2)) < 0.31

    #6 auto-EP:[0006] fit waters -- Nwaters=108
    print('Verifying fitwaters 0006 >90 ... ')
    match = re.search('\[0006\] fit waters -- Nwaters=(\d*)', ttts[6])
    assert match
    assert float(match.group(1)) > 90

    #10 auto-EP:[0010] refmac5 -- R=0.2191 Rfree=0.2595
    print('Verifying refmac5 0010 Rfree < 0.28... ')
    match = re.search('\[0010\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', ttts[10])
    assert match
    assert float(match.group(2)) < 0.28

    #11 auto-EP:[0011] deposition -- package prepared, pdb report obtained
    print('Verifying deposition 0011  ... ')
    assert ttts[11] == 'auto-EP:[0011] deposition -- package prepared, pdb report obtained'

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

        if not nologin:
            sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validate3AEP(d.driver, 600)
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
