##!/usr/bin/python#

#
# ============================================================================
#
#    01.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.refmac jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Robert Nicholls,
#                Oleg Kovalevskiy 2017-2025
#
# ============================================================================
#

#  python native imports
import os
#import sys
import uuid
#import shutil

import gemmi

#  application imports
from . import basic
from   pycofe.dtypes    import dtype_template
from   pycofe.proc      import qualrep
from   pycofe.verdicts  import verdict_refmac
from   pycofe.auto      import auto,auto_workflow
from   pycofe.proc      import covlinks
from   pycofe.varut     import mmcif_utils

# ============================================================================
# Make Refmac driver

class Refmac(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return "refmac.script"

    # ------------------------------------------------------------------------

    def formStructure ( self,mmcifout,pdbout,subfile,mtzout,libin,hkl,istruct,maplabels,copyfiles ):
        structure = self.registerStructure ( 
                        mmcifout,
                        pdbout,
                        subfile,
                        mtzout,                     
                        libPath    = libin,
                        leadKey    = 1,
                        map_labels = maplabels,
                        copy_files = copyfiles,
                        refiner    = "refmac" 
                    )
        if structure:
            structure.copy_refkeys_parameters ( istruct )
            structure.copyAssociations   ( istruct )
            structure.addDataAssociation ( hkl.dataId     )
            structure.addDataAssociation ( istruct.dataId )  # ???
            structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
            if maplabels.startswith("FAN"):
                structure.FAN     = "FAN"
                structure.PHAN    = "PHAN"
                structure.DELFAN  = "DELFAN"
                structure.PHDELAN = "PHDELAN"
            if not subfile:
                # mmcifout = self.getMMCIFOFName()
                # if os.path.isfile(mmcifout):
                #     structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                structure.copySubtype  ( istruct )
                structure.copyLigands  ( istruct )
            structure.addPhasesSubtype ()
        return structure


    def merge_sites ( self,mmcifpath,pdbpath,hapath,hatype,outpath ):
        ha_type   = hatype.upper()
        is_substr = False
        st_xyz    = gemmi.read_structure ( mmcifpath )
        st_xyz.setup_entities()
        if os.path.exists(hapath):
            st_ha = gemmi.read_structure ( hapath  )
            st_ha.setup_entities()
            if len(st_ha)>0:
                for chain in st_ha[0]:
                    chain.name = "Z"
                    for res in chain:
                        #res.name     = ha_type
                        res.het_flag = "H"
                        for atom in res:
                            is_substr = True
                            atom.name    = ha_type
                            atom.element = gemmi.Element ( ha_type )
                    st_xyz[0].add_chain ( chain )
        st_xyz.make_mmcif_document().write_file ( outpath + ".mmcif" )
        if pdbpath:
            # st_xyz.write_pdb ( outpath + ".pdb" )
            mmcif_utils.translate_to_pdb ( st_xyz,pdb_outfile_path=outpath+".pdb" )
        return is_substr

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When refmac
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName() ):
            os.remove(self.getXYZOFName() )

        # Prepare refmac input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        hmodel = None
        if hasattr(self.input_data.data,"hmodel"):
            hmodel = self.input_data.data.hmodel
            for i in range(len(hmodel) ):
                hmodel[i] = self.makeClass ( hmodel[i] )

        phases = None
        if hasattr(self.input_data.data,"phases"):
            phases  = self.makeClass ( self.input_data.data.phases[0] )

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains
        sec3 = self.task.parameters.sec3.contains
        sec4 = self.task.parameters.sec4.contains
        sec5 = self.task.parameters.sec5.contains
        sec6 = self.task.parameters.sec6.contains

        #  protein:  hmodel[i].hasSubtype ( dtype_template.subtypeProtein() )
        #  dna:  hmodel[i].hasSubtype ( dtype_template.subtypeDNA() )
        #  rna:  hmodel[i].hasSubtype ( dtype_template.subtypeRNA() )

        external_restraint_files = []
        if hasattr(self.input_data.data,"hmodel"):
            homolog_protein_fpaths = []
            homolog_dnarna_fpaths = []
            use_protein = False
            use_dnarna = False
            for i in range(len(hmodel) ):
                if hmodel[i].hasSubtype ( dtype_template.subtypeProtein() ):
                    use_protein = True
                    homolog_protein_fpaths.append ( hmodel[i].getPDBFilePath(self.inputDir() ) )
                if hmodel[i].hasSubtype ( dtype_template.subtypeDNA() ) or hmodel[i].hasSubtype ( dtype_template.subtypeRNA() ):
                    use_dnarna = True
                    homolog_dnarna_fpaths.append ( hmodel[i].getPDBFilePath(self.inputDir() ) )

            if use_protein:
                prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_protein", "-p1", istruct.getPDBFilePath(self.inputDir() ), "-p2" ] + homolog_protein_fpaths
                if sec3.ALL_BEST.value == 'all':
                    prosmart_cmd += ['-restrain_all']
                else:
                    prosmart_cmd += ['-restrain_best']

                if sec3.SIDE_MAIN.value == 'main':
                    prosmart_cmd += ['-main']
                else:
                    prosmart_cmd += ['-side']

                if sec3.TOGGLE_ALT.value == 'yes':
                    prosmart_cmd += ['-alt']

                prosmart_cmd += ['-restrain_seqid', str(sec3.SEQID.value)]
                prosmart_cmd += ['-rmin', str(sec3.RMIN.value)]
                prosmart_cmd += ['-rmax', str(sec3.RMAX.value)]
                prosmart_cmd += ['-bfac_alpha', str(sec3.BFAC_RM.value)]
                prosmart_cmd += ['-occup', str(sec3.OCCUPANCY.value)]

                self.putMessage('Running ProSMART to generate external restraints for protein macromolecules')
                self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
                external_restraint_files.append(os.path.join('ProSMART_Output_protein',os.path.splitext(istruct.getPDBFileName() )[0]+'.txt') )

            if use_dnarna:
                prosmart_cmd = [ "-quick", "-dna_rna", "-o", "ProSMART_Output_dnarna", "-p1" ,istruct.getPDBFilePath(self.inputDir() ), "-p2" ] + homolog_dnarna_fpaths
                self.putMessage('Running ProSMART to generate external restraints for nucleic acid macromolecules')
                self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
                external_restraint_files.append(os.path.join('ProSMART_Output_dnarna',os.path.splitext(istruct.getPDBFileName() )[0]+'.txt') )

        if str(sec3.HBOND_RESTR.value) == 'yes':
            prosmart_cmd = [ "-quick", "-o", "ProSMART_Output_hbond", "-p1", istruct.getPDBFilePath(self.inputDir() )]
            self.runApp ( "prosmart",prosmart_cmd,logType="Main" )
            external_restraint_files.append(os.path.join('ProSMART_Output_hbond',os.path.splitext(istruct.getPDBFileName() )[0]+'.txt') )


        # Input

        stdin = []

        hkl_labels = []
        if (str(hkl.useHKLSet) == 'F') or (str(hkl.useHKLSet) == 'TF'):
            hkl_labels = [ hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma ]
            hkl_labin  = "LABIN FP=" + hkl_labels[0] + " SIGFP=" + hkl_labels[1]
            if hkl.isAnomalous() and (str(hkl.useHKLSet)!='TF') and (not phases):
                hkl_labin += " F+="    + hkl.dataset.Fpm.plus.value  +\
                             " SIGF+=" + hkl.dataset.Fpm.plus.sigma  +\
                             " F-="    + hkl.dataset.Fpm.minus.value +\
                             " SIGF-=" + hkl.dataset.Fpm.minus.sigma
                hkl_labels += [ 
                    hkl.dataset.Fpm.plus.value,  hkl.dataset.Fpm.plus.sigma,
                    hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma
                ]
                stdin.append ( "ANOM MAPONLY" )
        elif str(hkl.useHKLSet) == 'Fpm':
            hkl_labels = [ 
                hkl.dataset.Fpm.plus.value,  hkl.dataset.Fpm.plus.sigma,
                hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma 
            ]
            hkl_labin  = "LABIN F+=" + hkl_labels[0] + " SIGF+=" + hkl_labels[1] +\
                              " F-=" + hkl_labels[2] + " SIGF-=" + hkl_labels[3]
            stdin.append ( "ANOM" )
        else: # if str(hkl.useHKLSet) == 'TI':
            hkl_labels = [ hkl.dataset.Imean.value, hkl.dataset.Imean.sigma ]
            hkl_labin  =  "LABIN IP=" + hkl_labels[0] + " SIGIP=" + hkl_labels[1]

        hklin = hkl.getHKLFilePath ( self.inputDir() )

        if phases and (str(hkl.useHKLSet) != 'F'):
            self.putMessage ( "<b><i>Using external phases is incompatible with " +\
                              "twin and SAD refinement. External phases will be " +\
                              "ignored.</i></b>" )
            phases = None

        if phases:
            hkl_labels += [ hkl.dataset.FREE ]
            input_mtz   = "__hklin.mtz"
            labin_ph    = []
            if phases.HLA:
                labin_ph   = [ phases.HLA,phases.HLB,phases.HLC,phases.HLD ]
                hkl_labin += " HLA=" + phases.HLA + " HLB=" + phases.HLB +\
                             " HLC=" + phases.HLC + " HLD=" + phases.HLD
            else:
                labin_ph   = [ phases.PHI,phases.FOM ]
                hkl_labin += " PHIB=" + phases.PHI + " FOM=" + phases.FOM
            self.makePhasesMTZ ( hklin,hkl_labels,
                                 phases.getMTZFilePath(self.inputDir()),labin_ph,
                                 input_mtz )
            hklin = input_mtz

        stdin.append ( hkl_labin + " FREE=" + hkl.dataset.FREE )

        # Basic options

        stdin.append ( 'NCYC ' + str(sec1.NCYC.value) )

        if str(sec1.WAUTO_YES.value) == 'yes':
            if str(sec1.WAUTO_VAL_AUTO.value) == '':
               stdin.append ( 'WEIGHT AUTO' )
            else:
               stdin.append ( 'WEIGHT AUTO ' + str(sec1.WAUTO_VAL_AUTO.value) )
        else:
            stdin.append ( 'WEIGHT MATRIX ' + str(sec1.WAUTO_VAL.value) )

        vdwrestraints = ''
        if hasattr(sec1,"VDW_VAL"):
            vdwrestraints = self.getParameter(sec1.VDW_VAL)
            if vdwrestraints:
               stdin.append ( 'VDWRESTRAINTS ' + vdwrestraints )

        if str(sec6.EXPERIMENT.value) != 'neutron':
            stdin.append ( 'MAKE HYDR ' + str(sec1.MKHYDR.value)  )

        stdin.append ( 'MAKE LINK ' + str(sec3.MKLINKS.value) )

        isTwinning = False
        if (str(hkl.useHKLSet) == 'TI') or (str(hkl.useHKLSet) == 'TF'):
            isTwinning = True
            stdin.append ( 'TWIN' )

        # Parameters
        stdin.append ( 'REFI BREF ' + str(sec2.BFAC.value) )

        tlsin  = None
        tlsout = None
        if str(sec4.TLS.value) != 'none':
            stdin.append ( 'REFI TLSC ' + str(sec4.TLS_CYCLES.value) )
            if str(sec4.RESET_B_TLS.value) == 'yes':
                stdin.append ( 'BFAC SET ' + str(sec4.RESET_B_TLS_VAL.value) )
            if str(sec4.TLSOUT_ADDU.value) == 'yes':
               stdin.append ( 'TLSOUT ADDU' )
            if str(sec4.TLS.value) == 'explicit':
                tls_groups = self.getParameter(sec4.TLS_GROUPS).strip();
                if tls_groups:
                    tlsin  = "_in.tls"
                    tlsout = "_out.tls"
                    with open(tlsin,"w") as f:
                        f.write ( tls_groups +'\n' )
        elif str(sec4.RESET_B.value) == 'yes':
            stdin.append ( 'BFAC SET ' + str(sec4.RESET_B_VAL.value) )

        stdin.append ('SCALE TYPE ' + str(sec2.SCALING.value) )
        if str(sec2.SOLVENT_MASK.value) == 'no':
            stdin.append ( 'SOLVENT NO' )
        else:
            stdin.append ( 'SOLVENT YES' )
            if str(sec2.SOLVENT_CUSTOM.value) == 'yes':
                stdin += [
                    'SOLVENT VDWProb ' + str(sec2.SOLVENT_CUSTOM_VDW.value),
                    'SOLVENT IONProb ' + str(sec2.SOLVENT_CUSTOM_ION.value),
                    'SOLVENT RSHRink ' + str(sec2.SOLVENT_CUSTOM_SHRINK.value)
                ]

        # Restraints

        if str(sec3.NCSR.value) == 'yes':
            stdin.append ('NCSR ' + str(sec3.NCSR_TYPE.value) )

        if str(sec3.JELLY.value) == 'yes':
            stdin += [ 'RIDG DIST SIGM ' + str(sec3.JELLY_SIGMA.value),
                       'RIDG DIST DMAX ' + str(sec3.JELLY_DMAX.value) ]

        if len(external_restraint_files) > 0:
            stdin += [
                'EXTE WEIGHT SCALE ' + str(sec3.EXTE_WEIGHT.value),
                'EXTE ALPHA '        + str(sec3.EXTE_ALPHA.value),
                'EXTE DMAX '         + str(sec3.EXTE_MAXD.value)
            ]
            for i in range(len(external_restraint_files) ):
                stdin.append ( '@' + external_restraint_files[i] )

        # Output
        if str(sec5.RIDING_HYDROGENS.value) != 'DEFAULT':
           stdin.append ( 'MAKE HOUT ' + str(sec5.RIDING_HYDROGENS.value) )

        if str(sec5.MAP_SHARPEN.value) == 'yes':
           if str(sec5.MAP_SHARPEN_B.value) == 'default':
              stdin.append ( 'MAPC SHAR' )
           else:
              stdin.append ( 'MAPC SHAR ' + str(sec5.MAP_SHARPEN_B.value) )

        # Advanced
        if str(sec6.EXPERIMENT.value) == 'electron':
           if str(sec6.FORM_FACTOR.value) == 'mb':
              stdin.append ( 'SOURCE ELECTRON MB' )
           else:
              stdin.append ( 'SOURCE ELECTRON' )
        elif str(sec6.EXPERIMENT.value) == 'neutron':
           stdin.append ( 'SOURCE NEUTRON' )
           stdin.append ( 'MAKE HYDR ' + str(sec6.MKHYDR_NEUTRON.value) )
           if str(sec6.MKHYDR_NEUTRON.value) != 'NO':
              if str(sec6.H_REFINE.value) != 'NO':
                 stdin.append ( 'HYDROGEN REFINE ' + str(sec6.H_REFINE.value) )
              if str(sec6.H_TORSION.value) == 'yes':
                 stdin.append ( 'RESTRAINT TORSION HYDROGEN INCLUDE ALL' )
              if str(sec6.H_REFINE_HD.value) != 'NO':
                 stdin.append ( 'REFINEMENT DFRACTION' )
                 stdin.append ( 'HYDROGEN DFRACTION ' + str(sec6.H_REFINE_HD.value) )
              if str(sec6.MKHYDR_NEUTRON.value) == 'YES':
                 if str(sec6.H_INIT_HD.value) == 'alld':
                    stdin.append ( 'HYDROGEN DFRACTION INIT' )
                 elif str(sec6.H_INIT_HD.value) == 'mix':
                    stdin.append ( 'HYDROGEN DFRACTION INIT REFINEABLE 1 UNREFINEABLE 0' )  
              elif str(sec6.MKHYDR_NEUTRON.value) == 'ALL':
                 if str(sec6.H_INIT_HD_HALL.value) == 'alld':
                    stdin.append ( 'HYDROGEN DFRACTION INIT' )
                 elif str(sec6.H_INIT_HD_HALL.value) == 'mix':
                    stdin.append ( 'HYDROGEN DFRACTION INIT REFINEABLE 1 UNREFINEABLE 0' )                  

        stdin.append ( 'REFI RESO ' + str(hkl.res_low) + ' ' + str(hkl.res_high) )

        # Other keywords
        stdin.append ( 'MAKE NEWLIGAND EXIT' )
        if str(sec6.KEYWORDS.value) != '':
           stdin.append ( str(sec6.KEYWORDS.value) )

        stdin.append ( 'Pdbout keep true' )
        stdin.append ( 'END' )

        #self.file_stdout.write ( "keywords=" + self.task.parameters.sec1.contains.KEYWORDS.value )

        self.open_stdin  ()
        self.write_stdin ( stdin )
        self.close_stdin ()

        #self.file_stdin = 1 # a trick necessary because of using 'print' above

        # make command-line parameters for bare morda run on a SHELL-type node

        # xyzin  = istruct.getMMCIFFilePath ( self.inputDir() )
        # if not xyzin:
        #     self.stderrln ( " ***** mmCIF is not found" )
        #     xyzin  = istruct.getPDBFilePath ( self.inputDir() )

        xyzin  = istruct.getXYZFilePath ( self.inputDir() )

        mmcifout = self.getMMCIFOFName()
        xmlOutRefmac = self.getOFName (".xml")
        cmd = [ "hklin" ,hklin,
                "xyzin" ,xyzin,
                "hklout",self.getMTZOFName(),
                "xyzout",mmcifout,
                "xmlout",xmlOutRefmac
              ]
        if tlsin:
            cmd += [ "tlsin",tlsin,"tlsout",tlsout ]
        cmd += [ "scrref",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["libin",libin]

        if str(sec6.EXPERIMENT.value) == 'electron':
           if str(sec6.FORM_FACTOR.value) == 'gaussian':
              cmd += ["atomsf",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_electron.lib')]
        elif str(sec6.EXPERIMENT.value) == 'neutron':
           cmd += ["atomsf",os.path.join(os.environ["CCP4"], 'lib', 'data', 'atomsf_neutron.lib')]

        # Prepare report parser
        self.setRefmacLogParser ( self.refmac_report(),False )

        # Start refmac
        self.runApp ( "refmacat",cmd,logType="Main" )
        self.unsetLogParser()

        # check solution and register data
        have_results = False
        if os.path.isfile(mmcifout):

            #self.copyTaskMetrics ( "refmac","R_factor","rfactor" )
            #self.copyTaskMetrics ( "refmac","R_free"  ,"rfree"   )

            verdict_row = self.rvrow
            self.rvrow += 5

            self.putTitle ( "Output Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            substructure = None
            pdbout       = self.getXYZOFName()

            structure    = self.formStructure ( mmcifout,pdbout,
                                                None,self.getMTZOFName(),
                                                libin,hkl,istruct,
                                                "FWT,PHWT,DELFWT,PHDELWT",True )
            if structure:
                refkeys = []
                for line in stdin:
                    lineu = line.strip().upper()
                    if not lineu.startswith("LABI") and\
                       not lineu.startswith("PDBO") and\
                       not lineu.startswith("ANOM") and\
                       not lineu.startswith("END"):
                        refkeys.append ( line )
                structure.store_refkeys_parameters ( self.task._type,self.task.id,refkeys )
                self.putStructureWidget ( self.getWidgetId("structure_btn"),
                                          "Structure and electron density",
                                          structure )

                # make anomolous ED map widget
                if hkl.isAnomalous() and str(hkl.useHKLSet) not in {"TI", "TF"}:

                    self.putMessage ( "&nbsp;" )
                    anomsec_id = self.getWidgetId ( "anomsec" )
                    self.putSection ( anomsec_id,"Anomalous maps and scatterers",openState_bool=False )
                    self.setReportWidget ( anomsec_id )

                    mapfname = self.calcCCP4Maps ( self.getMTZOFName(),
                                        "refmac_ano",source_key="refmac_anom" )
                    hatype   = revision.ASU.ha_type.upper()
                    if not hatype:
                        hatype = "AX"

                    self.open_stdin()
                    self.write_stdin ([
                        "residue " + hatype,
                        "atname "  + hatype,
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

                        out_merged = self.getOFName ( "_ha" )
                        is_substr  = self.merge_sites ( 
                                            mmcifout,pdbout,subfile,
                                            hatype,out_merged 
                                        )

                        # self.putTitle ( "Structure with heavy-atom substructure and anomolous maps" )
                        self.putMessage ( "<h3>Output structure added with heavy-atom substructure, " +\
                                          "and anomolous maps</h3>" )
                        
                        struct_ano = self.formStructure ( 
                                            out_merged + ".mmcif",
                                            out_merged + ".pdb",
                                            None,self.getMTZOFName(),
                                            libin,hkl,istruct,
                                            "FAN,PHAN,DELFAN,PHDELAN",
                                            False 
                                        )
                        if struct_ano:
                            structure.setAnomMapLabels ( "FAN","PHAN",
                                                         DELFAN="DELFAN",PHDELAN="PHDELAN" )
                            nlst = struct_ano.dname.split ( " /" )
                            nlst[0] += " (anom maps)"
                            struct_ano.dname = " /".join(nlst)
                            self.putStructureWidget ( self.getWidgetId("struct_ano_btn"),
                                        "Structure, substructure and anomalous maps",
                                        struct_ano )
                            if is_substr:
                                substructure = self.formStructure ( None,None,subfile,
                                        structure.getMTZFilePath(self.outputDir()),
                                        libin,hkl,istruct,"FAN,PHAN,DELFAN,PHDELAN",
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
                        
                    self.resetReportPage()

                # self.stdoutln ( " >>>>> 5 " + str(revision.citations) )
                # self.stdoutln ( " >>>>> 6 " + str(self.citation_list) )

                # show link counts in revision inspector
                try:
                    cvl = covlinks.CovLinks(
                        structure.getLibFilePath(self.outputDir()),
                        structure.getPDBFilePath(self.outputDir()))
                    cvl.prep_lists()
                    link_counts = dict(cvl.counts(self.file_stdout))
                    structure.ligands     = link_counts['comps_usr']
                    structure.refmacLinks = link_counts['links_usr']
                    structure.links       = link_counts['links_std']
                    structure.links      += link_counts['links_unk']
                except:
                    self.file_stdout.write(">>> Link counter failed <<<\n")

                # update structure revision
                revision.setStructureData ( substructure )
                revision.setStructureData ( structure    )

                if tlsout:
                  with (open(tlsout,'r')) as f:
                      revision.tls_groups = f.read()

                self.registerRevision     ( revision     )
                have_results = True

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                try:
                    meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                    # self.stderr ( " META=" + str(meta) )
                    if "molp_score" in meta:
                        self.generic_parser_summary["refmac"]["molp_score"] = meta["molp_score"]
                except:
                    meta = None
                    self.stderr ( " *** validation tools or molprobity failure" )
                    self.rvrow = rvrow0 + 4

                suggestedParameters = {}

                if meta:
                    verdict_meta = {
                        "data"   : { "resolution" : hkl.getHighResolution(raw=True) },
                        "params" : {
                            "refmac" : {
                                "ncycles"    : int(sec1.NCYC.value),
                                "twinning"   : isTwinning,
                                "jellyBody"  : str(sec3.JELLY.value)  == 'yes',
                                "ncsRestr"   : str(sec3.NCSR.value)   == 'yes',
                                "tls"        : str(sec4.TLS.value)    != 'none',
                                "anisoBfact" : str(sec2.BFAC.value)   == "ANIS",
                                "hydrogens"  : str(sec1.MKHYDR.value) == "ALL",
                                "vdw_val"    : vdwrestraints
                            }
                        },
                        "molprobity" : meta,
                        "xyzmeta"    : structure.xyzmeta
                    }
                    suggestedParameters = verdict_refmac.putVerdictWidget (
                                                self,verdict_meta,verdict_row )
                    if suggestedParameters:
                        self.task.suggestedParameters = suggestedParameters
                        self.putCloneJobButton ( "Clone job with suggested parameters",
                                                 self.report_page_id(),verdict_row+3,0 )
 
                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision" : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : float(self.generic_parser_summary["refmac"]["R_factor"]),
                                "Rfree"    : float(self.generic_parser_summary["refmac"]["R_free"])
                            },
                            "suggestedParameters" : {
                                "TaskRefmac" : suggestedParameters
                            }
                    })
                    # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework

                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["refmac"]["R_free"],
                        "suggestedParameters" : suggestedParameters
                    }, log=self.file_stderr)

        else:
            self.putTitle ( "No Output Generated" )
            self.generic_parser_summary["refmac"] = {
              "summary_line" : "refinment failed"
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Refmac ( "",os.path.basename(__file__) )
    drv.start()
