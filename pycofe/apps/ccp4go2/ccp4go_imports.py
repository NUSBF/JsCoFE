##!/usr/bin/python

#
# ============================================================================
#
#    16.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go Combined Auto-Solver Importer class based on CCP4Cloud importers
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2021
#
# ============================================================================
#

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers
import gemmi
import os, shutil, sys

import basic
class CCP4GoImporter(basic.TaskDriver):

    def importDir(self): return ""  # in current directory ( job_dir )
    def outputDir(self): return ""  # in current directory ( job_dir )
    def import_summary_id (self): return None  #"import_summary_id"  # summary table id
    def reportDir         (self): return ""  # in current directory ( job_dir )
    def inputDir          (self): return ""   # in current directory ( job_dir )


    def importFiles(self):
        from proc import (import_xrayimages, import_unmerged, import_merged,
                          import_xyz, import_ligand, import_sequence, import_doc,
                          import_alignment)

        importers = [import_xrayimages, import_unmerged, import_merged,
                     import_xyz, import_ligand, import_sequence,
                     import_alignment]

        importerNames = ['import_xrayimages', 'import_unmerged', 'import_merged',
                     'import_xyz', 'import_ligand', 'import_sequence',
                     'import_alignment']



        os.chdir(self.workDir)

        sys.stdout.write("\nRunning CCP4Cloud importers... ")

        # initialise execution logs
        self.file_stdout  = open ( self.file_stdout_path (),'w' )
        self.file_stdout1 = open ( self.file_stdout1_path(),'w' )
        self.file_stderr  = open ( self.file_stderr_path (),'w' )

        importersWorked = []

        for importer in importers:
            data = importer.run (self)
            if data:
                for d in data:
                    if hasattr(d, 'files'):
                        i = importers.index(importer)
                        try:
                            self.currentData.startingParameters.hklpath = d.files['mtz']
                            importersWorked.append(importerNames[i])
                        except:
                            self.output_meta['error'] = '*** Importer ' + importerNames[i] + ' failed!'


        os.chdir(self.curDir)

        for name in importersWorked:
            sys.stdout.write(name + ' ')
        sys.stdout.write('...done!\n\n')
        meta = {}
        meta["nResults"] = 1
        meta["mtz"] = self.currentData.startingParameters.hklpath
        self.output_meta["results"][self.curDir] = meta

        return



    def __init__(self, currentData):
        self.currentData = currentData
        self.curDir = os.getcwd()
        self.workDir = os.path.join(self.currentData.startingParameters.workdir, 'output')
        if not os.path.exists(self.workDir):
            os.mkdir(self.workDir)

        self.output_meta = {}
        self.output_meta['results'] = {}
        self.output_meta['error'] = ''

        self.resetFileImport()

        if currentData.startingParameters.hklpath:
            cpFileName = os.path.join(currentData.startingParameters.outputdir, os.path.basename(currentData.startingParameters.hklpath))
            shutil.copy(currentData.startingParameters.hklpath, cpFileName) # bloody importer removes original copy of the file
            self.job_id = os.path.splitext(cpFileName)[0]
            self.addFileImport(cpFileName, baseDirPath=self.workDir)

        # if currentData.startingParameters.xyzpath:
        #     cpFileName = os.path.join(currentData.startingParameters.outputdir, os.path.basename(currentData.startingParameters.xyzpath))
        #     shutil.copy(currentData.startingParameters.xyzpath, cpFileName) # bloody importer removes original copy of the file
        #     self.addFileImport(cpFileName, baseDirPath=self.workDir)

        # this requires annotation.json
        # if currentData.startingParameters.seqpath:
        #     cpFileName = os.path.join(currentData.startingParameters.outputdir, os.path.basename(currentData.startingParameters.seqpath))
        #     shutil.copy(currentData.startingParameters.seqpath, cpFileName) # bloody importer removes original copy of the file
        #     self.addFileImport(cpFileName, baseDirPath=self.workDir)
