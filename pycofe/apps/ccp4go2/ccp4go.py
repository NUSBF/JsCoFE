#!/usr/bin/env ccp4-python

import sys, os
import copy

curPath = os.path.abspath(os.path.join(os.path.dirname( __file__ )))
if curPath not in sys.path:
    sys.path.insert(0, curPath)

def merge_two_dicts(x, y):
    z = x.copy()
    z.update(y)
    return z

class StartingParameters:
    trySimbad12   = True
    tryMR         = True
    tryEP         = True
    tryFitLigands = True
    workdir       = os.getcwd() # working in the current directory by default
    reportdir     = None # initialise once command line parameters are received
    outputdir     = None # initialise once command line parameters are received
    scriptsdir    = None # initialise once command line parameters are received
    outputname    = 'ccp4go'
    rvapi_prefix  = None
    rvapi_doc_path= None
    jobId         = ''
    queueName     = ''
    jobManager    = ''
    nSubJobs      = 1
    hklpath       = None
    seqpath       = None
    xyzpath       = None
    ha_type       = None
    ligands       = []


# ----------------------------------------------------------------------
class CurrentData:
    startingParameters = None
    modelPresent = False
    mtzPresent = False
    anomalousPresent = False


    hkl = None # mtz.mtz_dataset object with loads of useful info on MTZ from self.mtzpath
    mtzpath = None # path to the merged MTZ file
    altSG = {} # dictionary for alternative space groups

    # ----------------------------------------------------------------------
    def __init__(self, startingParameters):
        self.startingParameters = startingParameters

        if self.startingParameters.xyzpath is not None:
            if os.path.exists(self.startingParameters.xyzpath):
                self.modelPresent = True
        if self.startingParameters.hklpath is not None:
            if os.path.exists(self.startingParameters.hklpath) and \
                os.path.splitext(self.startingParameters.hklpath)[1].lower() == '.mtz':
                self.mtzPresent = True
        if self.startingParameters.ha_type != '': # ideally check for valid ha type
            self.anomalousPresent = True

        return




# ----------------------------------------------------------------------
def getRunParameters(args):
    parameters = StartingParameters()
    narg = 0
    while narg < len(args):
        key = args[narg]
        narg += 1
        # if key=="--sge" or key=="--mp" : self.jobManager    = key
        if key == "--no-simbad12":
            parameters.trySimbad12 = False
        elif key == "--no-mr":
            parameters.tryMR = False
        elif key == "--no-ep":
            parameters.tryEP = False
        elif key == "--no-fitligands":
            parameters.tryFitLigands = False
        elif narg < len(args):
            value = args[narg]
            if key == "--wkdir":
                parameters.workdir = os.path.abspath(value)
            elif key == "--rdir":
                parameters.reportdir = os.path.abspath(value)
            elif key == "--outdir":
                parameters.outputdir = os.path.abspath(value)
            elif key == "--rvapi-prefix":
                parameters.rvapi_prefix = value
            elif key == "--rvapi-document":
                parameters.rvapi_doc_path = value
            elif key == "--jobid":
                parameters.jobId = value
            elif key == "--qname":
                parameters.queueName = value
            elif key == "--job-manager":
                parameters.jobManager = value
            elif key == "--njobs":
                parameters.nSubJobs = int(value)
            else:
                sys.stderr.write(" *** unrecognised command line parameter " + key)
            narg += 1

    # read data from standard input
    sys.stdout.write("\n INPUT DATA:" +
                "\n -----------------------------------------------")
    ilist = sys.stdin.read().splitlines()
    for i in range(len(ilist)):
        s = ilist[i].strip()
        if s.startswith("HKLIN"):
            parameters.hklpath = os.path.abspath(s.replace("HKLIN", "", 1).strip())
            sys.stdout.write("\n HKLIN " + parameters.hklpath)
        elif s.startswith("SEQIN"):
            parameters.seqpath = os.path.abspath(s.replace("SEQIN", "", 1).strip())
            sys.stdout.write("\n SEQIN " + parameters.seqpath)
        elif s.startswith("XYZIN"):
            parameters.xyzpath = os.path.abspath(s.replace("XYZIN", "", 1).strip())
            sys.stdout.write("\n XYZIN " + parameters.xyzpath)
        elif s.startswith("HATOMS"):
            parameters.ha_type = s.replace("HATOMS", "", 1).strip()
            sys.stdout.write("\n HATOMS " + parameters.ha_type)
        elif s.startswith("LIGAND"):
            lst = [_f for _f in s.replace("LIGAND", "", 1).split(" ") if _f]
            parameters.ligands.append(lst)
            sys.stdout.write("\n LIGAND " + lst[0])
            if len(lst) > 1:
                sys.stdout.write(" " + lst[1])
        elif s.startswith("LIGIN"):
            # make sure absolute paths are added
            lst = [_f.strip() for _f in s.replace("LIGIN", "", 1).split(";") if _f]
            if len(lst) >= 2:
                parameters.ligands.append(["LIGIN"] + lst)
                sys.stdout.write("\n " + s)
            else:
                sys.stderr.write(" *** unrecognised input line " + s + "\n")
        else:
            sys.stderr.write(" *** unrecognised input line " + s + "\n")
    sys.stdout.write("\n -----------------------------------------------\n")

    parameters.scriptsdir = os.path.abspath(os.path.join(parameters.workdir, "scripts"))
    if not os.path.isdir(parameters.scriptsdir):
        os.mkdir(parameters.scriptsdir)

    if parameters.outputdir is None:
        parameters.outputdir = os.path.abspath(os.path.join(parameters.workdir, "output"))
        if not os.path.isdir(parameters.outputdir):
            os.mkdir(parameters.outputdir)

    # if reportdir is empty, report will not be created
    # if parameters.reportdir is None:
    #     parameters.reportdir = os.path.abspath(os.path.join(parameters.workdir, "report"))
    #     if not os.path.isdir(parameters.reportdir):
    #         os.mkdir(parameters.reportdir)
    #

    if parameters.reportdir:
        if parameters.rvapi_doc_path is None:
            parameters.rvapi_doc_path = os.path.join(parameters.reportdir, "rvapi_document")
    else:
        if parameters.rvapi_doc_path is None:
            parameters.rvapi_doc_path = os.path.join(parameters.workdir, "rvapi_document")
    parameters.rvapi_doc_path = os.path.abspath(parameters.rvapi_doc_path)




    currentData = CurrentData(parameters) # main data structure passed between CCP4go components
    return currentData



import ccp4go_base
# ----------------------------------------------------------------------
class CCP4go(ccp4go_base.Base):

    def checkBasicInput(self):
        if self.currentData.startingParameters.hklpath is None:
            self.stderr ('HKLPATH has not been supplied; CCP4go requires diffraction data\n')
            self.stderr ( " *** reflection file not given -- stop.\n" )
            self.output_meta["retcode"] = "[02-001] hkl file not given"
            self.write_meta()
            self.finish()

        if self.currentData.startingParameters.seqpath is None:
            sys.stderr.write('SEQPATH has not been supplied; CCP4go requires sequence\n')
            self.stderr ( " *** sequence file not given -- stop.\n" )
            self.output_meta["retcode"] = "[02-002] hkl file not found"
            self.write_meta()
            self.finish()

        if not os.path.exists(self.currentData.startingParameters.hklpath):
            self.stderr ('HKLPATH %s does not exist; CCP4go requires diffraction data\n' % self.currentData.startingParameters.hklpath)
            self.stderr ( " *** reflection file does not exist -- stop.\n" )
            self.output_meta["retcode"] = "[02-002] hkl file not found"
            self.write_meta()
            self.finish()

        if not os.path.exists(self.currentData.startingParameters.seqpath):
            sys.stderr.write('SEQPATH %s does not exist; CCP4go requires sequence\n' % self.currentData.startingParameters.seqpath)
            self.stderr ( " *** sequence file does not exist -- stop.\n" )
            self.output_meta["retcode"] = "[02-002] hkl file not found"
            self.write_meta()
            self.finish()

        return


    def checkAnalyseInputData(self):
        # key result - initialise these variables
        # self.currentData.hkl - mtz.mtz_dataset object with loads of useful info on MTZ from merged self.mtzpath
        # self.currentData.mtzpath - path to the merged MTZ file

        self.checkBasicInput() # checking whether input files are present

        if self.currentData.mtzPresent:
            import ccp4go_mtz
            self.stdout('\nMTZ file supplied: checking data...\n')
            mtz = ccp4go_mtz.PrepareMTZ(currentData=self.currentData)
            mtz.set_parent_branch_id('')  # root task
            mtz.prepare_mtz() # merge if unmerged
            self.currentData = copy.deepcopy(mtz.currentData) # updating current data
            self.output_meta = merge_two_dicts(self.output_meta, mtz.output_meta) # updating meta data
            if mtz.output_meta["error"]:
                return False # fail
            # for RVAPI report: mtz.branch_data["pageId"]

        # figure out anomalous signal somewhere

        # paranoic check for key results
        if os.path.isfile(self.currentData.mtzpath) and self.currentData.hkl is not None:
            return True # succesfull initialisation
        else:
            return False  # fail


    def solveWithModel(self):
        pass
        return

    def solveWithSimbad(self):
        import ccp4go_simbad12
        self.stdout('\nRunning SIMBAD:\n')
        simbad = ccp4go_simbad12.Simbad12(currentData=self.currentData)
        simbad.set_parent_branch_id('') # root task
        simbad.run()
        self.currentData = copy.deepcopy(simbad.currentData) # updating current data
        self.output_meta = merge_two_dicts(self.output_meta, simbad.output_meta)  # updating meta data
        if simbad.output_meta["error"]:
            return False  # fail
        # for RVAPI report: mtz.branch_data["pageId"]

        # if simbad.output_meta["retcode"] == "sequence problem":
        #     self.putMessage("<h3><i>---- Sequence data does not match " +
        #                     "solution (too many sequences given). SIMBAD could not find solution.</i></h3>")
        #     self.write_meta()
        #     return False # not solved
        # elif simbad.output_meta["retcode"] == "sequence mismatch":
        #     self.putMessage("<h3><i>---- Sequence data does not match " +
        #                     "solution (too low homology). SIMBAD could not find solution.</i></h3>")
        #     self.write_meta()
        #     return False # not solved

        return True # Solved!

    def solveEP(self):
        pass
        return

    def solveMR(self):
        pass
        return


    def autoBuild(self):
        # Shall do ligand fitting if present
        # model building or rebuilding after MR?

        return

    def finish(self):
        # Shall treat correctly case when EP substructure found but nothing else built
        # Shall treat correctly situation when structure is solved by both EP and MR and return best

        if self.output_meta["error"]:
            self.write_meta()
            self.stderr('\n', mainLog=True)
            self.stderr(self.output_meta["error"], mainLog=True)
            self.stderr('\n\n', mainLog=True)
            os.chdir(self.startingDirectory)
            sys.exit(1)

        os.chdir(self.startingDirectory)
        sys.exit(0)

    def run(self):
        # initialise main object carrying data ready for downstream applications and some analysis results
        # The object sits in self.currentData and all downstream methods operate on it
        initialised = self.checkAnalyseInputData()
        if not initialised:
            self.finish()

        if self.currentData.modelPresent:
            solvedWithModel = self.solveWithModel()
            if solvedWithModel:
                self.autoBuild()
                self.finish() # finish pipeline with either success or error or unsolved
            else:
                self.finish() # finish pipeline with either success or error or unsolved

        solvedWithSimbad = self.solveWithSimbad()
        if solvedWithSimbad:
            self.autoBuild()
            self.finish()  # finish pipeline with either success or error or unsolved

        if self.currentData.anomalousPresent:
            solvedEP = self.solveEP()
            if solvedEP:
                self.autoBuild()
                self.finish()  # finish pipeline with either success or error or unsolved

        solvedMR = self.solveMR()
        if solvedMR:
            self.autoBuild()
            self.finish()  # finish pipeline with either success or error or unsolved

        self.finish()


# ============================================================================

def run():
    currentData = getRunParameters(sys.argv[1:]) # parameters is a dictionary containing ALL user's ccp4go input
    ccp4go = CCP4go(currentData = currentData)
    ccp4go.initRVAPI()
    ccp4go.run()
    return

if __name__ == '__main__':
    run()

