
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
            match = re.search(r'^simple-MR:\[0018\] Automated Workflow has finished succesfully \(look inside for comments\)', taskText)
            if match:
                finished = True
                break
        if finished:
            break
        curTime = time.time()
        if curTime > startTime + float(waitLong):
            print('*** Timeout for validate1AMR results! Waited for 50 minutes plus %d seconds.' % waitLong)
            break
        time.sleep(60)

#0 [smrWFTest] smrWFTest
#1 simple-MR:[0001] Simple MR workflow -- imported HKL (3), Sequences (1), XYZ (1); workflow started
#2 simple-MR:[0002] asymmetric unit contents -- 2 molecules in ASU, Solv=47.3%
#3 simple-MR:[0003] prepare MR model(s) from xyz -- 1 model(s) generated (molrep protocol)
#4 simple-MR:[0004] phaser MR -- Nsol=1 LLG=473 TFZ=24.9 R=0.5173 Rfree=0.5307
#5 simple-MR:[0005] phaser MR -- Nsol=1 LLG=1515 TFZ=40.0 R=0.4574 Rfree=0.4558
#6 simple-MR:[0006] refmac5 -- R=0.4034 Rfree=0.4241
#7 simple-MR:[0007] buccaneer -- Compl=100.0% R=0.2505 Rfree=0.2851
#8 simple-MR:[0008] Large parts of the structure are likely missing as Rfree is only 0.424 (click for more comments)
#9 simple-MR:[0009] ccp4build -- Compl=100.0% R=0.2299 Rfree=0.2601
#10 simple-MR:[0010] refmac5 -- R=0.2243 Rfree=0.2591
#11 simple-MR:[0011] refmac5 -- R=0.2201 Rfree=0.2591
#12 simple-MR:[0012] refmac5 -- R=0.2167 Rfree=0.2594
#13 simple-MR:[0013] refmac5 -- R=0.2207 Rfree=0.2589
#14 simple-MR:[0014] fit waters -- Nwaters=123
#15 simple-MR:[0015] refmac5 -- R=0.1766 Rfree=0.2216
#16 simple-MR:[0016] refmac5 -- R=0.1778 Rfree=0.2229
#17 simple-MR:[0017] deposition -- package prepared, pdb report obtained
#18 simple-MR:[0018] Automated Workflow has finished succesfully (look inside for comments)

    ttts = sf.tasksTreeTexts(driver)
    #1 simple-MR:[0001] Simple MR workflow -- imported HKL (3), Sequences (1), XYZ (1); workflow started
    print('Verifying WF task 0001 text... ')
    assert ttts[1] == 'simple-MR:[0001] Simple MR workflow -- imported HKL (3), Sequences (1), XYZ (1); workflow started'

    #4 simple-MR:[0004] phaser MR -- Nsol=1 LLG=473 TFZ=24.9 R=0.5173 Rfree=0.5307
    print('Verifying PHASER 0004 LLG > 400... ')
    match = re.search('\[0004\] phaser MR --.*LLG=(\d*).*R=(0\.\d*) Rfree=(0\.\d*)', ttts[4])
    assert match
    assert float(match.group(1)) > 400

    #5 simple-MR:[0005] phaser MR -- Nsol=1 LLG=1515 TFZ=40.0 R=0.4574 Rfree=0.4558
    print('Verifying PHASER 0005 LLG > 1300 and Rfree < 0.48... ')
    match = re.search('\[0005\] phaser MR --.*LLG=(\d*).*R=(0\.\d*) Rfree=(0\.\d*)', ttts[5])
    assert match
    assert float(match.group(1)) > 1300
    assert float(match.group(3)) < 0.48

    #7 simple-MR:[0007] buccaneer -- Compl=100.0% R=0.2505 Rfree=0.2851
    print('Verifying buccaneer 0007 Rfree < 0.31... ')
    match = re.search('\[0007\] buccaneer --.*R=(0\.\d*) Rfree=(0\.\d*)', ttts[7])
    assert match
    assert float(match.group(2)) < 0.31

    #9 simple-MR:[0009] ccp4build -- Compl=100.0% R=0.2299 Rfree=0.2601
    print('Verifying ccp4build 0006 Rfree < 0.28... ')
    match = re.search('\[0009\] ccp4build --.*R=(0\.\d*) Rfree=(0\.\d*)', ttts[9])
    assert match
    assert float(match.group(2)) < 0.28

    #14 simple-MR:[0014] fit waters -- Nwaters=123
    print('Verifying fitwaters 0014 >100 ... ')
    match = re.search('\[0014\] fit waters -- Nwaters=(\d*)', ttts[14])
    assert match
    assert float(match.group(1)) > 100

    #16 simple-MR:[0016] refmac5 -- R=0.1778 Rfree=0.2229
    print('Verifying refmac5 0016 Rfree < 0.25... ')
    match = re.search('\[0016\] refmac5 -- R=(0\.\d*) Rfree=(0\.\d*)', ttts[16])
    assert match
    assert float(match.group(2)) < 0.25


    #17 simple-MR:[0017] deposition -- package prepared, pdb report obtained
    print('Verifying deposition 0017  ... ')
    assert ttts[17] == 'simple-MR:[0017] deposition -- package prepared, pdb report obtained'

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

        if not nologin:
            sf.loginToCloud(d.driver, d.login, d.password)

        sf.enterProject(d.driver, d.testName)
        validate2SMR(d.driver, 600)
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
