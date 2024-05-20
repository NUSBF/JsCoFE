##!/usr/bin/python

#
# ============================================================================
#
#    19.05.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Command-line:
#     ccp4-python editrevision.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.dtypes  import dtype_structure, dtype_template
from  pycofe.tasks   import asudef
from  pycofe.proc    import makelib
from   pycofe.auto     import auto


# ============================================================================
# Make EditRevision driver

class EditRevision(asudef.ASUDef):

    # ------------------------------------------------------------------------

    def add_change ( self,trow,tableId,item_name,action,description ):
        self.putTableString ( tableId,item_name  ,"",trow,0 )
        self.putTableString ( tableId,action     ,"",trow,1 )
        self.putTableString ( tableId,description,"",trow,2 )
        return trow+1

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )
        struct0   = None
        if hasattr(self.input_data.data,"struct0"):  # optional data parameter
            struct0 = self.makeClass ( self.input_data.data.struct0 [0] )

        #associated_data_list = []
        change_list = []  # receives a list of changes required
        remove_list = []  # receives a list of removals required

        hkl = None
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
            #associated_data_list.append ( hkl )
            change_list.append ( "hkl" )
        else:
            hkl = self.makeClass ( self.input_data.data.hkl0[0] )

        seq = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            for s in self.input_data.data.seq:
                seq.append ( self.makeClass(s) )
                #associated_data_list.append ( seq[-1] )
            change_list.append ( "seq" )
        else:
            for s in self.input_data.data.seq0:
                seq.append ( self.makeClass(s) )

        xyz = None
        if struct0 and struct0.hasXYZSubtype():
            xyz = struct0   # this is leading Structure/Substructure or None
        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            xyz = self.makeClass ( self.input_data.data.xyz[0] )
            #  note this may be XYZ, Structure or Substructure
            #associated_data_list.append ( xyz )
            if xyz._type=="DataRemove":
                remove_list.append ( "xyz" )
                xyz = None
            else:
                change_list.append ( "xyz" )

        phases = None
        if struct0 and struct0.hasPhasesSubtype():
            phases = struct0    # ground default
        #if xyz._type==dtype_structure.dtype():
        #    phases = xyz  # need to be in sync with xyz by default
        if hasattr(self.input_data.data,"phases"):  # optional data parameter
            phases = self.makeClass ( self.input_data.data.phases[0] )
            #  note this may be either Structure or Substructure, but not XYZ
            #associated_data_list.append ( phases )
            if phases._type=="DataRemove":
                remove_list.append ( "phases" )
                phases = None
            else:
                change_list.append ( "phases" )

        ligands = []
        if hasattr(self.input_data.data,"ligands"):  # optional data parameter
            for lig in self.input_data.data.ligands:
                ligands.append ( self.makeClass(lig) )
                #associated_data_list.append ( ligands[-1] )
            change_list.append ( "lig" )

        # --------------------------------------------------------------------

        xyz_fpath  = None
        sub_fpath  = None
        mtz_fpath  = None
        map_fpath  = None
        dmap_fpath = None
        lib_fpath  = None
        lig_codes  = None

        if xyz:
            xyz_fpath = xyz.getPDBFilePath ( self.inputDir() )
            if xyz._type==dtype_structure.dtype():
                sub_fpath = xyz.getSubFilePath ( self.inputDir() )
                lib_fpath = xyz.getLibFilePath ( self.inputDir() )
            # Either xyz_path or sub_path get defined here, which will
            # replace Structure or Substructure, respectively

        if phases:
            mtz_fpath  = phases.getMTZFilePath ( self.inputDir() )
            map_fpath  = phases.getMapFilePath ( self.inputDir() )
            dmap_fpath = phases.getDMapFilePath( self.inputDir() )
            if 'phases' in change_list:
                meanF_labels    = hkl.getMeanF()
                meanF_labels[2] = hkl.getFreeRColumn()
                phases_labels   = phases.getPhaseLabels()
                mtz_fname       = phases.lessDataId ( phases.getMTZFileName() )
                self.makePhasesMTZ (
                    hkl.getHKLFilePath(self.inputDir()),meanF_labels,
                    mtz_fpath,phases_labels,mtz_fname )
                mtz_fpath = mtz_fname
                struct_labels = meanF_labels + phases_labels
            # else phases are taken from leading Structure/Substructure

        if len(ligands)>0:
            if len(ligands)>1:
                lib_fpath = self.stampFileName ( self.dataSerialNo,self.getOFName(".dict.cif") )
                self.dataSerialNo += 1
                lig_codes = makelib.makeLibrary ( self,ligands,lib_fpath )
            else:
                lib_fpath = ligands[0].getLibFilePath ( self.inputDir() )
                if ligands[0]._type=="DataLigand":
                    lig_codes = [ligands[0].code]
                else:
                    lig_codes = ligands[0].codes


        tableId = self.getWidgetId('list_of_changes')
        self.putTable ( tableId,"<span style='font-size:1em'>" +
                                "List of changes</span>",
                                self.report_page_id(),self.rvrow,mode=0 )
        self.setTableHorzHeaders ( tableId,["Item","Action","Description"],["","",""] )
        self.rvrow += 1

        trow = 0
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            trow = self.add_change ( trow,tableId,"Reflection dataset","replace",hkl.dname )

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            desc = []
            for i in range(len(seq)):
                desc.append ( seq[i].dname )
            trow = self.add_change ( trow,tableId,"sequences","replace","<br>".join(desc) )

        if "xyz" in change_list:
            trow = self.add_change ( trow,tableId,"Atomic coordinates","replace",xyz.dname )
        elif "xyz" in remove_list:
            trow = self.add_change ( trow,tableId,"Atomic coordinates","remove","N/A" )

        if lig_codes:
            lig_list = lig_codes
            if type(lig_codes)==list:
                lig_list = ", ".join(lig_codes)
            trow = self.add_change ( trow,tableId,"Ligand definitions","replace",lig_list )

        if "phases" in change_list:
            trow = self.add_change ( trow,tableId,"Phases","replace",phases.dname )
        elif "phases" in remove_list:
            trow = self.add_change ( trow,tableId,"Phases","remove","N/A" )

        # --------------------------------------------------------------------

        revision = None
        rev      = None
        if (("hkl" in change_list) and (revision0.isASUData())) or ("seq" in change_list):
            #  redefine HKL and ASU
            self.putTitle ( "New Asummetric Unit Composition" )
            rev = asudef.makeRevision ( self,hkl,seq, None,"P","NR",1,1.0,"",
                                        revision0=revision0,resultTitle="" )
            if rev:
                revision = rev[0]
        else:
            revision = revision0
            if "hkl" in change_list:
                revision.setReflectionData ( hkl )

        have_results = False

        if revision:  # should be always True

            edit_list = change_list + remove_list
            if "xyz" in edit_list or "phases" in edit_list or "lig" in edit_list:
                # redefine structure

                if not xyz_fpath and not mtz_fpath and len(lig_codes)<=0:

                    self.putMessage  ( "<h3>Structure was removed</h3>" )
                    revision.removeStructure()

                else:

                    self.putTitle  ( "New Structure" )

                    lead_key = revision.leadKey
                    # lead_key = 1   #  XYZ lead (MR phases)
                    if ("phases" in change_list) or (phases and not struct0.getPDBFileName()):
                        lead_key = 2  #  Phase lead (EP phases)

                    refiner = ""
                    if struct0:
                        refiner = struct0.refiner
                    structure = self.registerStructure1 ( ###
                                    self.outputFName,
                                    None,
                                    xyz_fpath,
                                    sub_fpath,
                                    mtz_fpath,
                                    libPath    = lib_fpath,
                                    mapPath    = map_fpath ,
                                    dmapPath   = dmap_fpath,
                                    leadKey    = lead_key,
                                    copy_files = False,
                                    refiner    = refiner 
                                )

                    if structure:
                        if lig_codes:
                            structure.setLigands  ( lig_codes )
                        if xyz_fpath or sub_fpath:
                            hasPhases = structure.hasPhasesSubtype()
                            structure.addSubtypes ( xyz.getSubtypes() )
                            if not hasPhases:  # because xyz may be casted from structure
                                structure.removePhasesSubtype()
                        else:
                            if revision0.Structure:
                                structure.addSubtypes ( revision0.Structure.subtype )
                            elif revision0.Substructure:
                                structure.addSubtypes ( revision0.Substructure.subtype )
                                structure.adjust_dname()
                            if phases:
                                structure.copyCrystData ( phases )
                                #if not revision0.Structure and not revision0.Substructure:
                                #    structure.addSubtype ( dtype_template.subtypeSubstructure() )
                                #    structure.adjust_dname()
                        if phases:
                            structure.addSubtypes ( phases.getSubtypes() )
                            structure.copyLabels  ( phases )
                            if 'phases' in change_list:
                                structure.setHKLLabels ( hkl )
                        if not xyz_fpath:
                            structure.removeSubtype ( dtype_template.subtypeXYZ() )
                        if not sub_fpath:
                            structure.removeSubtype ( dtype_template.subtypeSubstructure() )

                        #if not sub_fpath:
                        #    # in case there was no substructure coordinates
                        #    structure.addSubtype ( dtype_template.subtypeSubstructure() )
                        #    structure.adjust_dname()

                        wtitle = "Structure and electron density"
                        if not xyz_fpath and not mtz_fpath:
                            wtitle = "Structure (ligand(s) only)"
                        elif not xyz_fpath:
                            wtitle = "Structure (electron density)"
                        else:
                            wtitle = "Structure (coordinates)"

                        self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                                  wtitle,structure )
                        revision.setStructureData ( structure )
                    else:
                        self.putMessage  ( "<b><i>Structure was not replaced (error)</i></b>" )

                    revision.addSubtypes  ( revision0.getSubtypes() )

            self.registerRevision ( revision  )
            have_results = True
            auto.makeNextTask ( self,{
                "revision" : revision0 
            })
            

            # this will go in the project tree line
            summary_line = ""
            if len(change_list)>0:
                summary_line = ", ".join(change_list) + " replaced"
            if len(remove_list)>0:
                if summary_line:
                    summary_line += "; "
                summary_line += ", ".join(remove_list) + " removed"
            #if "hkl" in change_list or "seq" in change_list:
            if rev:
                summary_line += "; asu recalculated:"
            self.generic_parser_summary["editrevision_struct"] = {
              "summary_line" : summary_line
            }

        else:
            self.putTitle   ( "Revision was not produced" )
            self.putMessage ( "This is likely to be a program bug, please " +\
                              "report to the maintainer" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevision ( "",os.path.basename(__file__) )
    drv.start()
