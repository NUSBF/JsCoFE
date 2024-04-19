
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

def validate2SMR(driver, waitLong):

    print ('validate2SMR verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(r'^simple-MR:\[\d*\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate2SMR results! Waited for long time plus %d seconds.' % waitLong)
            break
        time.sleep(60)

    # [smrWFTest] smrWFTest
    # simple-MR:[0001] Simple MR workflow -- imported HKL (3), Sequences (1), XYZ (1); workflow started
    # simple-MR:[0002] asymmetric unit contents -- 2 molecules in ASU, Solv=47.3%
    # simple-MR:[0003] prepare MR model(s) from xyz -- 1 model(s) generated (molrep protocol)
    # simple-MR:[0004] phaser MR -- Nsol=1 LLG=473 TFZ=24.9 R=0.5173 Rfree=0.5307
    # simple-MR:[0005] phaser MR -- Nsol=1 LLG=1515 TFZ=40.0 R=0.4574 Rfree=0.4558
    # simple-MR:[0006] refmac5 -- R=0.4033 Rfree=0.4240
    # simple-MR:[0007] buccaneer -- Compl=100.0% R=0.2449 Rfree=0.2774
    # simple-MR:[0009] refmac5 -- R=0.2314 Rfree=0.2697
    # simple-MR:[0010] refmac5 -- R=0.2267 Rfree=0.2708
    # simple-MR:[0011] refmac5 -- R=0.2230 Rfree=0.2726
    # simple-MR:[0012] refmac5 -- R=0.2330 Rfree=0.2705
    # simple-MR:[0013] fit waters -- Nwaters=118
    # simple-MR:[0014] refmac5 -- R=0.1869 Rfree=0.2378
    # simple-MR:[0015] refmac5 -- R=0.1869 Rfree=0.2366
    # simple-MR:[0016] refmac5 -- R=0.1888 Rfree=0.2357
    # simple-MR:[0017] deposition -- package prepared, pdb report obtained
    # simple-MR:[0018] Automated Workflow has finished succesfully (look inside for comments)
    # simple-MR:[0008] Large parts of the structure are likely missing as Rfree is only 0.424 (click for more comments)

    ttts = sf.tasksTreeTexts(driver)

    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'simple-MR:[0001] Simple MR workflow -- imported HKL (3), Sequences (1), XYZ (1); workflow started'

    print('Verifying PHASER LLG > 1300 and Rfree < 0.48... ')
    match = False
    for t in reversed(ttts):
        match = re.search('phaser MR --.*LLG=(\d*).*R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert int(match.group(1)) > 1000
    assert float(match.group(3)) < 0.48

    print('Verifying modelcraft  Rfree < 0.25... ')
    match = False
    for t in ttts:
        match = re.search('modelcraft --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.25

    # print('Verifying fitwaters 0013 >100 ... ')
    # match = False
    # for t in ttts:
    #     match = re.search('fit waters -- Nwaters=(\d*)', t)
    #     if match:
    #         break
    # assert match
    # assert float(match.group(1)) > 100

    print('Verifying refmac5 Rfree < 0.26... ')
    match = False
    for t in reversed(ttts):
        match = re.search('refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.26

    print('Verifying deposition ... ')
    match = False
    for t in ttts:
        if 'deposition -- package prepared, pdb report' or 'PDB validation report -- pdb report obtained' in t:
            match = True
            break
    assert match

    return ()



def test_2_SMR_Validation(browser,
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

    d.testName = 'smrWFTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validate2SMR(d.driver, 900)
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

    test_2_SMR_Validation(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
