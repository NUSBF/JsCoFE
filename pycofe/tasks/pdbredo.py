##!/usr/bin/python


#
# ============================================================================
#
#    08.01.23   <--  Date of Last Modification.
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
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022-2023
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
from   zipfile import ZipFile

# from typing_extensions import Self

# import gemmi

#  application imports
from . import basic
from pycofe.dtypes import dtype_template
from pycofe.proc import qualrep
from pycofe.proc import PDBRedoAPIAuth
from pycofe.verdicts import verdict_refmac

# ============================================================================
# Make PDB-REDO driver


class Pdbredo(basic.TaskDriver):

    # redefine name of input script file

    # def file_stdin_path(self):  return "pdbredo.script"

    resultDir = "result"

    row0 = 0

    # ------------------------------------------------------------------------

    def formStructure(
        self, xyzout, subfile, mtzout, libin, hkl, istruct, maplabels, copyfiles
    ):
        structure = self.registerStructure(
            xyzout,
            subfile,
            mtzout,
            None,
            None,
            libin,
            leadKey=1,
            map_labels=maplabels,
            copy_files=copyfiles,
            refiner="pdbredo",
        )
        if structure:
            structure.copyAssociations(istruct)
            structure.addDataAssociation(hkl.dataId)
            structure.addDataAssociation(istruct.dataId)  # ???
            structure.setRefmacLabels(
                None if str(hkl.useHKLSet) in ["Fpm", "TI"] else hkl
            )
            if not subfile:
                mmcifout = self.getMMCIFOFName()
                if os.path.isfile(mmcifout):
                    structure.add_file(
                        mmcifout, self.outputDir(), "mmcif", copy_bool=False
                    )
                structure.copySubtype(istruct)
                structure.copyLigands(istruct)
            structure.addPhasesSubtype()
        return structure

    PDBREDO_URI = "https://services.pdb-redo.eu:443"
    token_id = 204
    token_secret = "xGLbe2pVhF2POfNB0oqrw"

    def do_submit(self, xyzin, hklin, token_id, token_secret, PDBREDO_URI):

        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)

        files = {"pdb-file": open(xyzin, "rb"), "mtz-file": open(hklin, "rb")}

        r = requests.post(
            PDBREDO_URI + "/api/session/{token_id}/run".format(token_id=token_id),
            auth=auth,
            files=files,
        )
        r.raise_for_status()

        run_id = r.json()["id"]
        self.rvrow = self.row0
        self.putWaitMessageLF("Job submitted to PDB REDO server with id " + str(run_id))

        return str(run_id)

    def do_status(self, token_id, token_secret, PDBREDO_URI, run_id):

        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)

        t0 = time.time()
        t1 = time.time() + 3600 * 24

        while True and (t0 < t1):

            time.sleep(60)

            r = requests.get(
                PDBREDO_URI
                + "/api/session/{token_id}/run/{run_id}".format(
                    token_id=token_id, run_id=run_id
                ),
                auth=auth,
            )
            r.raise_for_status()

            status = r.json()["status"]

            if status == "stopped":
                self.stderrln("The job failed after submitting")
                break

            if status == "ended":
                break

        # status = r.json()['status']
        time.sleep(5)

        return status

    def do_fetch(self, token_id, token_secret, run_id, PDBREDO_URI):
        # The token id and secret for a session at PDB-REDO
        token_id = token_id
        token_secret = token_secret

        # The authentication object, used by the requests module
        auth = PDBRedoAPIAuth.PDBRedoAPIAuth(token_id, token_secret)

        # The job ID
        # run_id = args.job_id

        r = requests.get(
            PDBREDO_URI
            + "/api/session/{token_id}/run/{run_id}/output".format(
                token_id=token_id, run_id=run_id
            ),
            auth=auth,
        )

        if not r.ok:
            self.stderrln("Failed to receive the output file list")

        # for file in r.json():
        #     self.stdoutln (str(file))

        # Retrieve a single result file. Here you would probably like to retrieve more files
        r = requests.get(
            PDBREDO_URI
            + "/api/session/{token_id}/run/{run_id}/output/process.log".format(
                token_id=token_id, run_id=run_id
            ),
            auth=auth,
        )

        if not r.ok:
            # self.stderrln (str(r.text))
            self.stderrln("Failed to receive the process log")

        pdbredo_log = str(r.text)

        self.stdoutln ( pdbredo_log )

        # Retrieve zip
        r = requests.get(
            PDBREDO_URI
            + "/api/session/{token_id}/run/{run_id}/output/zipped".format(
                token_id=token_id, run_id=run_id
            ),
            auth=auth,
        )
        r.raise_for_status()

        output = "result.zip"

        with open(output, "wb") as f:
            f.write(r.content)

        with ZipFile(output, "r") as zipObj:
            # Extract all the contents of zip file in different directory
            zipObj.extractall(self.resultDir)

        final_pdb = None
        final_mtz = None
        # final_lig = None

        for root, dir, files in os.walk(self.resultDir, topdown=False):
            for fname in files:
                if fname.endswith("_final.pdb"):
                    final_pdb = os.path.join(root, fname)
                if fname.endswith("_final.mtz"):
                    final_mtz = os.path.join(root, fname)

        xyzout = self.getXYZOFName()

        mtzout = self.getMTZOFName()

        os.rename(final_pdb, xyzout)

        os.rename(final_mtz, mtzout)

        return [xyzout, mtzout, pdbredo_log]

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file.
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare input
        # fetch input data
        revision = self.makeClass(self.input_data.data.revision[0])
        hkl      = self.makeClass(self.input_data.data.hkl[0])
        istruct  = self.makeClass(self.input_data.data.istruct[0])

        xyzin = istruct.getXYZFilePath(self.inputDir())
        hklin = hkl.getHKLFilePath(self.inputDir())
        libin = istruct.getLibFilePath(self.inputDir())

        # xyzout = self.getXYZOFName()
        # mtzout = self.getMTZOFName()

        # self.pdbredo_token_id
        # self.pdbredo_token_secret

        auth_fpath = os.path.join ( self.inputDir(),"authorisation.json" )
        if not os.path.isfile(auth_fpath):
            self.fail ( "<h3>No authorisation data.</h3>" +\
                "This task requires authorisation with PDB-REDO software provider, " +\
                "which was not found. Check CCP4 Cloud configuration.",
                "No authorisation data." )
            return

        token_id     = None
        token_secret = None
        # token_id = 221
        # token_secret = "wD5sfnuBpU9iDJ1BetPn3w"
        
        try:
            with open(auth_fpath) as f:
                auth_meta = json.loads ( f.read() )
                if auth_meta["status"]=="ok":
                    token_id     = auth_meta["auth_data"]["user_id"]
                    token_secret = auth_meta["auth_data"]["user_token"]
                elif auth_meta["status"]=="expired":
                    # self.putMessage ( "<h2>PDB-REDO authorisation expired</h2>" +\
                    #     "Please authorise with PDB-REDO service in \"My Account\"." )
                    self.fail ( "<h3>Authorisation expired.</h3>" +\
                        "This task requires authorisation with PDB-REDO software provider, " +\
                        "which has expired. Please authorise with PDB-REDO service in \"My Account\".",
                        "Authorisation expired." )
                    return
                else:
                    self.fail ( "<h3>Authorisation data not passed.</h3>" +\
                        "This task requires authorisation with PDB-REDO software provider, " +\
                        "which data was not passed to the task. Reported status: " + auth_meta["status"],
                        "No authorisation data." )
                    return
        except:
            self.fail ( "<h3>Corrupt authorisation data.</h3>" +\
                "This task requires authorisation with PDB-REDO software provider, " +\
                "which is corrupt. Check CCP4 Cloud configuration.",
                "Corrupt authorisation data." )
            return
  
        PDBREDO_URI = "https://services.pdb-redo.eu:443"

        # # imitate PDBREDO
        # #  ==================================
        # shutil.copyfile ( xyzin,xyzout )
        # shutil.copyfile ( istruct.getMTZFilePath(self.inputDir()),mtzout )
        # #  ==================================

        self.row0 = self.rvrow
        self.putWaitMessageLF("submitting to PDB REDO server ")
        if not self.have_internet():
            self.fail ( "<h3>No internet connection.</h3>" +\
                    "This task requires access to PDB REDO server, which is not " +\
                    "possible due to missing internet connection.",
                    "No internet connection" )

        run_id = self.do_submit(xyzin, hklin, token_id, token_secret, PDBREDO_URI)

        number_of_try = 0

        while True:
            try :
                status = self.do_status(token_id, token_secret, PDBREDO_URI, run_id)
                if status == "ended":
                    break
                if status == "stopped":
                    break

            except:
                if number_of_try < 100:
                    number_of_try +=1
                    time.sleep(120)
                    pass
                else:
                    self.stderrln ('Possible internet connection issues ' + '\n' , status)
                    break

        xyzout, mtzout, pdbredo_log = self.do_fetch ( token_id, token_secret, run_id, PDBREDO_URI )

        self.stdoutln(" final_pdb = " + str(xyzout))
        self.stdoutln(" final_mtz = " + str(mtzout))

        self.row0 = self.rvrow
        self.putMessage("")

        self.addCitations ( ['pdbredo'] )

        # check solution and register data
        have_results = False
        summary_line = "no output generated"
        if xyzout:
            # if os.path.isfile(final_pdb):

            verdict_row = self.rvrow

            self.rvrow += 5

            self.putTitle(
                "Output Structure"
                + self.hotHelpLink("Structure", "jscofe_qna.structure")
            )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.formStructure(
                xyzout,
                None,
                mtzout,
                libin,
                hkl,
                istruct,
                "FWT,PHWT,DELFWT,PHDELWT",
                True,
            )
            if structure:
                self.putStructureWidget(
                    "structure_btn", "Structure and electron density", structure
                )

                # update structure revision
                revision.setStructureData(structure)
                self.registerRevision(revision)
                have_results = True
                
                rfactor = 1.0
                rfree   = 1.0
                lines   = pdbredo_log.splitlines()
                for line in lines:
                    if line.startswith("Resulting R-factor:"):
                        rfactor = line.split(":")[1].strip()
                    elif line.startswith("Resulting R-free  :"):
                        rfree   = line.split(":")[1].strip()

                self.generic_parser_summary["refmac"] = {
                    "R_factor"   : rfactor,
                    "R_free"     : rfree
                }

                summary_line = ""

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision )
                try:
                    # meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                    meta = qualrep.quality_report(self, revision)
                    self.stdoutln ( str(meta) )
                    if "molp_score" in meta:
                        self.generic_parser_summary["refmac"]["molp_score"] = meta["molp_score"]

                except:
                    meta = None
                    self.stderr(" *** validation tools or molprobity failure")
                    self.rvrow = rvrow0 + 4

                # if meta:
                #     verdict_meta = {
                #         "data": {"resolution": hkl.getHighResolution(raw=True)},
                #         "params": {},
                #         "molprobity": meta,
                #         "xyzmeta": structure.xyzmeta,
                #     }
                #     suggestedParameters = verdict_refmac.putVerdictWidget(
                #         self, verdict_meta, verdict_row
                #     )

        else:
            self.putTitle ( "No Output Generated" )

        # shutil.rmtree(self.resultDir)
        # os.remove("result.zip")

        if summary_line:
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : summary_line
            }

        # close execution logs and quit
        self.success(have_results)
        return


# ============================================================================

if __name__ == "__main__":

    drv = Pdbredo("", os.path.basename(__file__))
    drv.start()
