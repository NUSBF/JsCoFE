
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

def validate4DPL(driver, waitLong):
    print ('validate4DPL verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(
                r'^Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate4DPL results! Waited for long time plus %d seconds.' % waitLong)
            break
        time.sleep(60)

#0 [dplWFTest] dplWFTest
#1 auto-DPL:[0001] Dimple Refinement and Ligand Fitting Workflow -- HKL (1), Sequences (1), XYZ (1), Ligands (1); workflow started
#2 auto-DPL:[0002] dimple -- R=0.2978 Rfree=0.3307
#3 auto-DPL:[0003] fit ligand -- Nfitted=1
#4 auto-DPL:[0004] refmac5 -- R=0.2645 Rfree=0.2892
#5 auto-DPL:[0005] fit waters -- Nwaters=61
#6 auto-DPL:[0006] refmac5 -- R=0.2340 Rfree=0.2632
#7 auto-DPL:[0007] refmac5 -- R=0.2028 Rfree=0.2510
#8 auto-DPL:[0008] refmac5 -- R=0.2044 Rfree=0.2523
#9 auto-DPL:[0009] deposition -- package prepared, pdb report not obtained
#10 auto-DPL:[0010] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)
    #1 auto-DPL:[0001] Dimple Refinement and Ligand Fitting Workflow -- HKL (1), Sequences (1), XYZ (1), Ligands (1); workflow started
    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'auto-DPL:[0001] Dimple Refinement and Ligand Fitting Workflow -- HKL (1), Sequences (1), XYZ (1), Ligands (1); workflow started' or 'auto-DPLMR:[0001] Dimple Refinement and Ligand Fitting Workflow -- HKL (1), Sequences (1), XYZ (1), Ligands (1); workflow started'

    # #2 auto-DPL:[0002] dimple -- R=0.2978 Rfree=0.3307
    # print('Verifying DIMPLE  Rfree < 0.35... ')
    # match = False
    # for t in ttts:
    #     match = re.search('dimple --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
    #     if match:
    #         break
    # assert match
    # assert float(match.group(2)) < 0.35

    #3 auto-DPL:[0003] fit ligand -- Nfitted=1
    print('Verifying fitligand = 1 ... ')
    match = False
    for t in ttts:
        if 'fit ligand -- Nfitted=1' in t:
            match = True
            break
    assert match

    #5 auto-DPL:[0005] fit waters -- Nwaters=61
    print('Verifying fitwaters  >50 ... ')
    match = False
    for t in ttts:
        match = re.search('fit waters -- Nwaters=(\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(1)) > 50

    #8 auto-DPL:[0008] refmac5 -- R=0.2044 Rfree=0.2523
    print('Verifying refmac5 Rfree < 0.27... ')
    match = False
    for t in reversed(ttts):
        match = re.search('refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.27

    #9 auto-DPL:[0009] deposition -- package prepared, pdb report not obtained
    print('Verifying deposition ... ')
    match = False
    for t in ttts:
        if 'deposition -- package prepared, pdb report' or 'PDB validation report -- pdb report obtained' in t:
            match = True
            break
    assert match

    return ()


def test_4_DPL_Validation(browser,
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

    d.testName = 'dplWFTest'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validate4DPL(d.driver, 600)
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

    test_4_DPL_Validation(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )

