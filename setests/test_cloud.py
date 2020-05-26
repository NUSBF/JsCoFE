#!/usr/bin/python

import  sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__) ) )

import molrepTest
import refmacTest


def test_Molrep(remote,
                browser,
                cloud,
                login,
                password,
                nologin
                ):

    if len(remote) > 1:
        molrepTest.runAllTests(browser = browser,
                           cloudURL = cloud,
                           cloudLogin = login,
                           cloudPassword = password,
                           needToLogin = not nologin,
                           remote = True,
                           remoteURL = remote
                           )
    else:
        molrepTest.runAllTests(browser = browser,
                           cloudURL = cloud,
                           cloudLogin = login,
                           cloudPassword = password,
                           needToLogin = not nologin,
                           )


def test_Refmac(remote,
                browser,
                cloud,
                login,
                password,
                nologin
                ):

    if len(remote) > 1:
        refmacTest.runAllTests(browser = browser,
                           cloudURL = cloud,
                           cloudLogin = login,
                           cloudPassword = password,
                           needToLogin = not nologin,
                           remote = True,
                           remoteURL = remote
                           )
    else:
        refmacTest.runAllTests(browser = browser,
                           cloudURL = cloud,
                           cloudLogin = login,
                           cloudPassword = password,
                           needToLogin = not nologin,
                           )




if __name__ == "__main__":
    test_Molrep('',
                'Firefox',
                'http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/',
                'setests',
                'cloud8testS',
                False)
    test_Refmac('',
                'Firefox',
                'http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/',
                'setests',
                'cloud8testS',
                False)

