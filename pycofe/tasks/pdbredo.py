##!/usr/bin/python#

#
# ============================================================================
#
#    17.11.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB-REDO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pdbredo jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
# import sys
# import uuid
import shutil
import json
import time
import requests
# from typing_extensions import Self

# import gemmi

#  application imports
from . import basic
from   pycofe.dtypes    import dtype_template
from   pycofe.proc      import qualrep
from   pycofe.proc      import PDBRedoAPIAuth
from   pycofe.verdicts  import verdict_refmac

# ============================================================================
# Make PDB-REDO driver

class Pdbredo(basic.TaskDriver):


    # redefine name of input script file

    #def file_stdin_path(self):  return "pdbredo.script"

    row0 = 0

    # ------------------------------------------------------------------------

    def formStructure ( self,xyzout,subfile,mtzout,libin,hkl,istruct,maplabels,copyfiles ):
        structure = self.registerStructure ( xyzout,subfile,mtzout,
                                             None,None,libin,leadKey=1,
                                             map_labels=maplabels,
                                             copy_files=copyfiles,
                                             refiner="pdbredo" )
        if structure:
            structure.copyAssociations   ( istruct )
            structure.addDataAssociation ( hkl.dataId     )
            structure.addDataAssociation ( istruct.dataId )  # ???
            structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
            if not subfile:
                mmcifout = self.getMMCIFOFName()
                if os.path.isfile(mmcifout):
                    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
            structure.addPhasesSubtype   ()
        return structure


        # Prepare  input


    PDBREDO_URI = 'https://services.pdb-redo.eu:443'
    token_id     = 204
    token_secret = "xGLbe2pVhF2POfNB0oqrw"

    def do_submit(self,xyzin,hklin,token_id,token_secret, PDBREDO_URI):
        
        # The token id and secret for a session at PDB-REDO    
        

        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)

        # The files to submit
        # xyzin = self.makeClass ( self.input_data.data.ixyz[0] )
        # hklin = self.makeClass ( self.input_data.data.hkl     [0] )
        # paired = True  # just a guess, to find out what is this!

        files = {
            'pdb-file': open(xyzin, 'rb'),
            'mtz-file': open(hklin, 'rb')
        }
        
        # if (restrains != None):
        #     files['restraints-file'] = open(restrains, 'rb')
        
        # if (sequence != None):
        #     files['sequence-file'] = open(sequence, 'rb')

        # Optional parameters, currently there's only one:
        # params = {
        #     'paired': paired
        # }
            
        # Create a new job/run
        # r = requests.post(args.url + "/api/session/{token_id}/run".format(token_id = token_id), auth = auth, files = files, data = {'parameters': json.dumps(params)})
        r = requests.post(PDBREDO_URI + "/api/session/{token_id}/run".format(token_id = token_id), auth = auth, files = files)
        r.raise_for_status()

        run_id = r.json()['id']
        self.rvrow = self.row0
        self.putWaitMessageLF( "Job submitted with id " + str(run_id) )

        return str(run_id)

    # def do_check():
    #     return True

    def do_status ( self, token_id, token_secret, PDBREDO_URI, run_id):
    # The token id and secret for a session at PDB-REDO  
        # self.stdoutln ( "test how it transfered " + str(run_id) )      
        # token_id = args.token_id
        # token_secret = args.token_secret

        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)

        # The job ID
        # run_id = args.job_id

        done = False


        while done == False: 

            time.sleep ( 60 )

            r = requests.get(PDBREDO_URI + "/api/session/{token_id}/run/{run_id}".format(token_id = token_id, run_id = run_id), auth = auth)
            r.raise_for_status()

            status = r.json()['status']
            self.rvrow = self.row0
            self.putWaitMessageLF ("Job status is "+ str(status))

            if status == 'stopped':
                # self.rvrow = self.row0
                # self.putWaitMessageLF ("Job status is "+ str(status))
                done == True
                # raise ValueError('The job somehow failed after submitting')
            
            if status == 'ended':
                # self.rvrow = self.row0
                # self.putWaitMessageLF ("Job status is "+ str(status))
                done == True

                
        # status = r.json()['status']
        time.sleep(5)

        return status

        

    def do_fetch(self, token_id, token_secret,run_id, PDBREDO_URI):
    # The token id and secret for a session at PDB-REDO    
        token_id = token_id
        token_secret = token_secret

        self.putWaitMessageLF ('do_fetch')


        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)
        
        # The job ID
        # run_id = args.job_id

        r = requests.get(PDBREDO_URI + "/api/session/{token_id}/run/{run_id}/output".format(token_id = token_id, run_id = run_id), auth = auth)

        if (not r.ok):
            raise ValueError("Failed to receive the output file list")

        for file in r.json():
            self.stdoutln (str(file))

        # Retrieve a single result file. Here you would probably like to retrieve more files
        r = requests.get(PDBREDO_URI + "/api/session/{token_id}/run/{run_id}/output/process.log".format(token_id = token_id, run_id = run_id), auth = auth)

        if (not r.ok):
            raise ValueError("Failed to receive the process log")

        self.stdoutln (str(r.text))

        return

        # Retrieve zip
        # r = requests.get(PDBREDO_URI + "/api/session/{token_id}/run/{run_id}/output/zipped".format(token_id = token_id, run_id = run_id), auth = auth)
        # r.raise_for_status()

        # output = output
        # if (output== None):
        #     output = '/tmp/result.zip'

        # with open(output, 'wb') as f:
        #     f.write(r.content)

        # xyzout = self.getXYZOFName()
        # mtzout = self.getMTZOFName()

        # return xyzout, mtzout

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. 
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName() ):
            os.remove(self.getXYZOFName() )

        # Prepare input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        

        xyzin = istruct.getXYZFilePath ( self.inputDir() )
        hklin = hkl.getHKLFilePath ( self.inputDir() )
        libin = istruct.getLibFilePath ( self.inputDir() )

        xyzout = self.getXYZOFName()
        mtzout = self.getMTZOFName()

        # self.pdbredo_token_id
        # self.pdbredo_token_secret

        token_id     = 221
        token_secret = "wD5sfnuBpU9iDJ1BetPn3w"

        PDBREDO_URI = 'https://services.pdb-redo.eu:443'

        # # imitate PDBREDO
        # #  ==================================
        # shutil.copyfile ( xyzin,xyzout )
        # shutil.copyfile ( istruct.getMTZFilePath(self.inputDir()),mtzout )
        # #  ==================================

        self.row0 = self.rvrow
        self.putWaitMessageLF ( "submitting to PDB REDO server " )

        run_id = self.do_submit(xyzin,hklin,token_id,token_secret, PDBREDO_URI)

        end_status = self.do_status(token_id, token_secret, PDBREDO_URI, run_id)
        #if status ended or stopped

        self.putWaitMessageLF ("after do_satus finished "+ str(end_status))

        self.do_fetch(token_id, token_secret,run_id, PDBREDO_URI)
        
        self.putWaitMessageLF ('do_fetch eneded')


        # result = do_submit()
        # if result is good:
          # done = False
          # t0 = time.now()
          # t1 = t0
          # while not done and (t1-t0)>3600*24:
          #     time.sleep(20)
          #     done = do_check()
          # if done:
          #     do_fetch()
          #     unzip output.zip
        # else:
        #   self.putTitle ( "NOT GOOD" )


        # check solution and register data
        have_results = False
        if os.path.isfile(xyzout):

            verdict_row = self.rvrow

            self.rvrow += 5

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            substructure = None

            structure = self.formStructure ( xyzout,None,mtzout,
                                             libin,hkl,istruct,
                                             "FWT,PHWT,DELFWT,PHDELWT",True )
            if structure:
                self.putStructureWidget ( "structure_btn",
                                          "Structure and electron density",
                                          structure )

                # make anomolous ED map widget
                if hkl.isAnomalous() and str(hkl.useHKLSet)!="TI":

                    mapfname = self.calcCCP4Maps ( mtzout,
                                        "pdbredo_ano",source_key="pdbredo_anom" )
                    hatype   = revision.ASU.ha_type.upper()
                    if not hatype:
                        hatype = "AX"

                    self.open_stdin()
                    self.write_stdin ([
                        "residue " + hatype,
                        "atname " + hatype,
                        "numpeaks 100",
                        "threshold rms 4",
                        "output pdb",
                        "end"
                    ])
                    self.close_stdin()
                    subfile = "substructure.pdb"
                    try:
                        self.runApp ( "peakmax",[
                            "mapin" ,mapfname[0],
                            "xyzout",subfile
                        ],logType="Service" )
                        for fname in mapfname:
                            if os.path.exists(fname):
                                os.remove ( fname )

                        xyz_merged = self.getOFName ( "_ha.pdb" )
                        is_substr  = self.merge_sites ( xyzout,subfile,hatype,xyz_merged )

                        self.putTitle ( "Structure, substructure and anomolous maps" )
                        struct_ano = self.formStructure ( xyz_merged,None,mtzout,
                                                          libin,hkl,istruct,
                                                          "FAN,PHAN,DELFAN,PHDELAN",
                                                          False )
                        if struct_ano:
                            nlst = struct_ano.dname.split ( " /" )
                            nlst[0] += " (anom maps)"
                            struct_ano.dname = " /".join(nlst)
                            self.putStructureWidget ( "struct_ano_btn",
                                        "Structure, substructure and anomalous maps",struct_ano )
                            if is_substr:
                                substructure = self.formStructure ( None,subfile,
                                        structure.getMTZFilePath(self.outputDir()),
                                        libin,hkl,istruct,"FWT,PHWT,DELFWT,PHDELWT",
                                        False )
                                if not substructure:
                                    self.putMessage ( "<i>Substructure could not be " +\
                                                      "formed (possible bug)</i>" )
                        else:
                            self.putMessage ( "<i>Structure with anomalous maps " +\
                                              "could not be formed (possible bug)</i>" )
                    except:
                        self.putMessage ( "<i>Structure with anomalous maps " +\
                                          "could not be formed due to exception " +\
                                          " (possible bug)</i>" )

                # update structure revision
                revision.setStructureData ( substructure )
                revision.setStructureData ( structure    )
                self.registerRevision     ( revision     )
                have_results = True

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision )
                try:
                    # meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                    meta = qualrep.quality_report ( self,revision )
                except:
                    meta = None
                    self.stderr ( " *** validation tools or molprobity failure" )
                    self.rvrow = rvrow0 + 4

                # if meta:
                #     verdict_meta = {
                #         "data"   : { "resolution" : hkl.getHighResolution(raw=True) },
                #         "params" : {},
                #         "molprobity" : meta,
                #         "xyzmeta" : structure.xyzmeta
                #     }
                #     suggestedParameters = verdict_refmac.putVerdictWidget (
                #                                 self,verdict_meta,verdict_row )

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Pdbredo ( "",os.path.basename(__file__) )
    drv.start()
