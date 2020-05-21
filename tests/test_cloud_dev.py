#!/usr/bin/python

import  sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__) ) )

import molrepTest
import refmacTest


def test_Molrep():
    molrepTest.runAllTests(browser='Firefox',
                           cloudURL = "http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/")

def test_Refmac():
    refmacTest.runAllTests(browser='Firefox',
                           cloudURL = "http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/")




if __name__ == "__main__":
    test_Molrep()
    test_Refmac()

