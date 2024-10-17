##!/usr/bin/python

#
# ============================================================================
#
#    25.12.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FILE TYPE DETECTION FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2023
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
from   gemmi       import  cif

#  application imports
from   pycofe.proc import  mtz


# ============================================================================

def ftype_Map          ():  return "map"
def ftype_MTZIntegrated():  return "mtz_integrated"
def ftype_XDSIntegrated():  return "xds_integrated"
def ftype_XDSScaled    ():  return "xds_scaled"
def ftype_XDSMerged    ():  return "xds_merged"
def ftype_MTZMerged    ():  return "mtz_merged"
def ftype_CIFMerged    ():  return "cif_merged"
def ftype_XYZ          ():  return "xyz"
def ftype_WScript      ():  return "wscript"
def ftype_Ligand       ():  return "ligand"
def ftype_Sequence     ():  return "sequence"
def ftype_Alignment    ():  return "alignment"
def ftype_Borges       ():  return "borges"
def ftype_MolGraph     ():  return "molgraph"
def ftype_HTML         ():  return "html"
def ftype_PDF          ():  return "pdf"
def ftype_TEXT         ():  return "text"
# def ftype_PPTX         ():  return "pptx"
def ftype_JPG          ():  return "jpg"
def ftype_JPEG         ():  return "jpeg"
def ftype_PNG          ():  return "png"
def ftype_GIF          ():  return "gif"
def ftype_Unknown      ():  return "unknown"

# ============================================================================

def getFileType ( fname,importDir,file_stdout ):

    fn,fext = os.path.splitext(fname.lower())

    if fext in ('.hkl','.mtz'):
        fpath = os.path.join ( importDir,fname )
        f_fmt = mtz.hkl_format ( fpath,file_stdout)
        if f_fmt in (ftype_MTZMerged    (),
                     ftype_XDSMerged    (),
                     ftype_MTZIntegrated(),
                     ftype_XDSIntegrated(),
                     ftype_XDSScaled    ()):
            return f_fmt
        return ftype_Unknown()

    if fext=='.cif':
        fpath = os.path.join ( importDir,fname )
        ftype = ftype_Unknown()
        try:
            #doc = cif.read ( fpath )
            doc = cif.Document()
            doc.source = fpath
            doc.parse_file ( fpath )
            doc.check_for_missing_values()
            #doc.check_for_duplicates()  <-- DO NOT CHECK HERE
            for block in doc:
                if block.find_values("_chem_comp_atom.type_energy"):
                    ftype = ftype_Ligand()
                    break
                ### libs containing only modifications or links
                if block.find_values("_chem_mod_atom.new_type_energy"):
                    ftype = ftype_Ligand()
                    break
                if block.find_values("_chem_comp.three_letter_code"):
                    ftype = ftype_Ligand()
                    break
            ### ftype_Ligand() is later converted to ftype_Library() if necessary
            ### continue because xyz-type cif-file may contain ligand descriptions
            for block in doc:
                if block.find_values("_atom_site.label_asym_id"):
                    ### jligand output: not ftype_XYZ but has xyzs in the block xyz
                    if block.name != "xyz":
                        ftype = ftype_XYZ()
                    break
                elif block.find_values("_refln.index_h"):
                    ftype = ftype_CIFMerged()
                    break
            ### ? extension of the mmcif-file with unmerged data produced by dials
        except:
            pass
        return ftype

    if fext=='.lib':                      return ftype_Ligand()
    if fext in ('.map','.mrc'):           return ftype_Map()
    if fext in ('.pdb','.mmcif','.ent'):  return ftype_XYZ()
    if fext in ('.seq','.fasta','.pir'):  return ftype_Sequence()
    if fext=='.hhr'   :                   return ftype_Alignment()
    if fext=='.borges':                   return ftype_Borges()
    if fext in ('.sdf','.mol2','.sml'):   return ftype_MolGraph()
    if fext=='.wscript':                  return ftype_WScript()

    if fext=='.txt' :
        fn1,fext1 = os.path.splitext(fn.lower())
        if fext1 in ('.seq','.fasta','.pir'):
            return ftype_Sequence()
        elif fext1.startswith('.s'):
            fext2 = os.path.splitext(fn1.lower())[1]
            if fext2 in ('.seq','.fasta','.pir'):
                return ftype_Sequence()
        return ftype_TEXT()

    if fext=='.html':  return ftype_HTML()
    if fext=='.pdf' :  return ftype_PDF ()
    # if fext=='.pptx':  return ftype_PPTX()
    if fext=='.jpg' :  return ftype_JPG ()
    if fext=='.jpeg':  return ftype_JPEG()
    if fext=='.png' :  return ftype_PNG ()
    if fext=='.gif' :  return ftype_GIF ()

    return ftype_Unknown()
