# conftest.py

def pytest_addoption(parser):
    parser.addoption("--remote", action="store", default='') # run tests on Selenium Server hub. Contains hub URL
    parser.addoption("--browser", action="store", default="Firefox") # Firefox or Chrome
    parser.addoption("--cloud", action="store", default="http://ccp4serv6.rc-harwell.ac.uk/jscofe-dev/")  # Cloud URL
    parser.addoption("--login", action="store", default="setests") # Login
    parser.addoption("--password", action="store", default="cloud8testS")  # password
    parser.addoption("--nologin", action="store", default=False)  # login into Cloud or not


def pytest_generate_tests(metafunc):
    # This is called for every test. Only get/set command line arguments
    # if the argument is specified in the list of test "fixturenames".
    remote = metafunc.config.option.remote
    browser = metafunc.config.option.browser
    cloud = metafunc.config.option.cloud
    login = metafunc.config.option.login
    password = metafunc.config.option.password
    nologin = metafunc.config.option.nologin

    if 'remote' in metafunc.fixturenames and remote is not None:
        metafunc.parametrize("remote", [remote])

    if 'browser' in metafunc.fixturenames and browser is not None:
        metafunc.parametrize("browser", [browser])

    if 'cloud' in metafunc.fixturenames and cloud is not None:
        metafunc.parametrize("cloud", [cloud])

    if 'login' in metafunc.fixturenames and login is not None:
        metafunc.parametrize("login", [login])

    if 'password' in metafunc.fixturenames and password is not None:
        metafunc.parametrize("password", [password])

    if 'nologin' in metafunc.fixturenames and nologin is not None:
        metafunc.parametrize("nologin", [nologin])