
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


def validate1AMR(driver, waitLong):

    print ('validate1AMR UNM verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()


    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(r'^auto-MR:\[\d*\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate1AMR results! Waited for long time plus %d seconds.' % waitLong)
            break
        time.sleep(60)

# [amrWFTest_unm] amrWFTest_unm
# auto-MR:[0001] MR automatic workflow -- imported Unmerged, Sequences (1), Ligands (1); workflow started
# auto-MR:[0002] aimless -- Compl=75.8% CC1/2=0.998 Rmeas_all=0.070 Rmeas_ano=0.068 Res=1.25-61.93 SpG=P 61 2 2
# auto-MR:[0003] asymmetric unit contents -- 1 molecule in ASU, Solv=64.7%
# auto-MR:[0004] simbad -- best model: 4hg7, LLG=132.0 TFZ=13.7 R=0.3291 Rfree=0.3295 SpG=P 65 2 2
# auto-MR:[0005] buccaneer -- Compl=100.0% R=0.3219 Rfree=0.3336
# auto-MR:[0006] ccp4build -- Compl=100.0% R=0.3153 Rfree=0.3288
# auto-MR:[0007] refmac5 -- R=0.3115 Rfree=0.3286
# auto-MR:[0008] refmac5 -- R=0.3119 Rfree=0.3280
# auto-MR:[0009] make ligand -- ligand "00E" prepared
# auto-MR:[0010] fit ligand -- Nfitted=1
# auto-MR:[0011] refmac5 -- R=0.2773 Rfree=0.2970
# auto-MR:[0012] fit waters -- Nwaters=65
# auto-MR:[0013] refmac5 -- R=0.2443 Rfree=0.2649
# auto-MR:[0014] refmac5 -- R=0.2116 Rfree=0.2481
# auto-MR:[0015] refmac5 -- R=0.2136 Rfree=0.2491
# auto-MR:[0016] refmac5 -- R=0.2148 Rfree=0.2510
# auto-MR:[0017] deposition -- package prepared, pdb report obtained
# auto-MR:[0018] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)

    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'auto-MR:[0001] MR automatic workflow -- imported Unmerged, Sequences (1), Ligands (1); workflow started'

    # print('Verifying MRBUMP Rfree < 0.42... ')
    # match = False
    # for t in ttts:
    #     match = re.search('mrbump --.*R=(0\.\d*) Rfree=(0\.\d*).*', t)
    #     if match:
    #         break
    # assert match
    # assert float(match.group(2)) < 0.42

    print('Verifying modelcraft Rfree < 0.36... ')
    match = False
    for t in ttts:
        match = re.search('modelcraft --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.36

    # print('Verifying arpwarp Rfree < 0.31... ')
    # match = False
    # for t in ttts:
    #     match = re.search('arpwarp --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
    #     if match:
    #         break
    # assert match
    # assert float(match.group(2)) < 0.31

    print('Verifying fitligand = 1 ... ')
    match = False
    for t in ttts:
        if 'fit ligand -- Nfitted=1' in t:
            match = True
            break
    assert match

    print('Verifying fitwaters > 20 ... ')
    match = False
    for t in ttts:
        match = re.search('fit waters -- Nwaters=(\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(1)) > 20

    # print('Verifying refmac5  Rfree < 0.295... ')
    # match = False
    # for t in reversed(ttts):
    #     match = re.search('\[(\d*)\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', t)
    #     if match:
    #         if int(match.group(1)) > 15:
    #             break
    # assert match
    # assert float(match.group(3)) < 0.295

    return ()


def validate12AMR(driver, waitLong):
    print ('validate12AMR LYSO verification - starting pulling job every minute')

    finished = False

    time.sleep(1)
    startTime = time.time()

    while (True):
        ttts = sf.tasksTreeTexts(driver)
        for taskText in ttts:
            # Job number as string
            match = re.search(
                r'^auto-MR:\[\d*\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate1AMR results! Waited for long time plus %d seconds.' % waitLong)
            break
        time.sleep(60)

    # [amrWFTest_unm] amrWFTest_unm
    # auto-MR:[0001] MR automatic workflow -- imported Unmerged, Sequences (1), Ligands (1); workflow started
    # auto-MR:[0002] aimless -- Compl=75.8% CC1/2=0.998 Rmeas_all=0.070 Rmeas_ano=0.068 Res=1.25-61.93 SpG=P 61 2 2
    # auto-MR:[0003] asymmetric unit contents -- 1 molecule in ASU, Solv=64.7%
    # auto-MR:[0004] simbad -- best model: 4hg7, LLG=132.0 TFZ=13.7 R=0.3291 Rfree=0.3295 SpG=P 65 2 2
    # auto-MR:[0005] buccaneer -- Compl=100.0% R=0.3219 Rfree=0.3336
    # auto-MR:[0006] ccp4build -- Compl=100.0% R=0.3153 Rfree=0.3288
    # auto-MR:[0007] refmac5 -- R=0.3115 Rfree=0.3286
    # auto-MR:[0008] refmac5 -- R=0.3119 Rfree=0.3280
    # auto-MR:[0009] make ligand -- ligand "00E" prepared
    # auto-MR:[0010] fit ligand -- Nfitted=1
    # auto-MR:[0011] refmac5 -- R=0.2773 Rfree=0.2970
    # auto-MR:[0012] fit waters -- Nwaters=65
    # auto-MR:[0013] refmac5 -- R=0.2443 Rfree=0.2649
    # auto-MR:[0014] refmac5 -- R=0.2116 Rfree=0.2481
    # auto-MR:[0015] refmac5 -- R=0.2136 Rfree=0.2491
    # auto-MR:[0016] refmac5 -- R=0.2148 Rfree=0.2510
    # auto-MR:[0017] deposition -- package prepared, pdb report obtained
    # auto-MR:[0018] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)

    print('Verifying WF task 0001 text... ')
    assert ttts[
               1] == 'auto-MR:[0001] MR automatic workflow -- imported HKL (1), Sequences (1); workflow started'

    print('Verifying MRBUMP Rfree < 0.35... ')
    match = False
    for t in ttts:
        match = re.search('mrbump --.*R=(0\.\d*) Rfree=(0\.\d*).*', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.35

    print('Verifying modelcraft Rfree < 0.36... ')
    match = False
    for t in ttts:
        match = re.search('modelcraft --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.36

    # print('Verifying arpwarp Rfree < 0.27... ')
    # match = False
    # for t in ttts:
    #     match = re.search('arpwarp --.*R=(0\.\d*) Rfree=(0\.\d*)', t)
    #     if match:
    #         break
    # assert match
    # assert float(match.group(2)) < 0.27

    print('Verifying fitwaters >50 ... ')
    match = False
    for t in ttts:
        match = re.search('fit waters -- Nwaters=(\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(1)) > 50

    print('Verifying refmac5  Rfree < 0.26... ')
    match = False
    for t in reversed(ttts):
        match = re.search('refmacat -- R=(0\.\d*) Rfree=(0\.\d*)', t)
        if match:
            break
    assert match
    assert float(match.group(2)) < 0.26

    return ()


def test_1_AMR_Validation(browser,
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

    d.testName = 'amrWFTest_unm'

    try:
        print('Opening URL: %s' % cloud)
        d.driver.get(cloud)
        assert "CCP4 Cloud" in d.driver.title

        sf.loginToCloud(d.driver, d.login, d.password, d.nologin)

        sf.enterProject(d.driver, d.testName)
        validate1AMR(d.driver, 1800)
        sf.renameProject(d.driver, d.testName)

    except:
        d.driver.quit()
        raise

def test_1_2_AMR_Validation():

    d.testName = 'amrWFTest_lyso'

    try:
        sf.enterProject(d.driver, d.testName)
        validate12AMR(d.driver, 600)
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

    test_1_AMR_Validation(browser=parameters.browser,  # or 'Chrome'
               cloud=parameters.cloud,
               nologin=parameters.nologin,  # True for Cloud Desktop (no login page), False for remote server that requires login.
               login=parameters.login,  # Used to login into remote Cloud
               password=parameters.password,  # Used to login into remote Cloud
               remote=parameters.remote  # 'http://130.246.213.187:4444/wd/hub' for Selenium Server hub
               )
    test_1_2_AMR_Validation()
