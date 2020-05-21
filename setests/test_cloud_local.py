#!/usr/bin/python

import  sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__) ) )

import molrepTest
import refmacTest


def test_Molrep():
    molrepTest.runAllTests(browser='Firefox',
                           cloudURL = "http://localhost:8085/",
                           cloudLogin='devel',  # Used to login into remote Cloud
                           cloudPassword='devel',  # Used to login into remote Cloud
                           waitShort=15,  # seconds for quick tasks
                           waitLong=120  # seconds for longer tasks
                           )

def test_Refmac():
    refmacTest.runAllTests(browser='Firefox',
                           cloudURL = "http://localhost:8085/",
                           cloudLogin='devel',  # Used to login into remote Cloud
                           cloudPassword='devel',  # Used to login into remote Cloud
                           waitShort=15,  # seconds for quick tasks
                           waitLong=120  # seconds for longer tasks
                           )




if __name__ == "__main__":
    test_Molrep()
    test_Refmac()

