#!/usr/bin/python

import  sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__) ) )

import molrepTest
import refmacTest


def test_Molrep():
    molrepTest.runAllTests(browser='Firefox',
                           cloudURL = "https://cloud.ccp4.ac.uk/")

def test_Refmac():
    refmacTest.runAllTests(browser='Firefox',
                           cloudURL = "https://cloud.ccp4.ac.uk/")




if __name__ == "__main__":
    test_Molrep()
    test_Refmac()

