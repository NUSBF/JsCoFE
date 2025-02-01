##!/usr/bin/python

#
# ============================================================================
#
#    01.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MACROMOLECULAR MODEL ANALYSIS
#
#  Calculates structure statistics for Table 1.
#
#  Copyright (C) Eugene Krissinel 2025
#
# ============================================================================
#

import gemmi

def analyze_structure ( file_path ):

    # Read the structure from the file
    structure = gemmi.read_structure(file_path)
    
    # Initialize counters and accumulators
    macromolecular_atoms = 0
    ligand_atoms         = {}
    water_atoms          = 0
    hydrogen_atoms       = 0
    n_chains             = 0
    n_models             = 0
    macro_b_factor       = 0.0
    ligand_b_factor      = {}
    water_b_factor       = 0.0
    
    # Iterate over models and chains in the structure
    for model in structure:
        n_models += 1
        for chain in model:
            n_chains +=1
            for residue in chain:
                if residue.entity_type==gemmi.EntityType.Polymer:
                    # Count macromolecular atoms
                    for atom in residue:
                        macromolecular_atoms += 1
                        macro_b_factor       += atom.b_iso
                        if atom.element==gemmi.Element('H') or atom.element==gemmi.Element('D'):
                            hydrogen_atoms += 1
                elif residue.is_water():
                    for atom in residue:
                        water_atoms    += 1
                        water_b_factor += atom.b_iso
                        if atom.element==gemmi.Element('H') or atom.element==gemmi.Element('D'):
                            hydrogen_atoms += 1
                else:
                    # Count ligand atoms
                    if not residue.name in ligand_atoms:
                        ligand_atoms   [residue.name] = 0
                        ligand_b_factor[residue.name] = 0.0
                    for atom in residue:
                        ligand_atoms   [residue.name] += 1
                        ligand_b_factor[residue.name] += atom.b_iso
                        if atom.element==gemmi.Element('H') or atom.element==gemmi.Element('D'):
                            hydrogen_atoms += 1

    # Compute average B-factors
    avg_macro_b = macro_b_factor  / macromolecular_atoms  if macromolecular_atoms  else 0
    avg_water_b = water_b_factor  / water_atoms           if water_atoms           else 0

    avg_b         = macro_b_factor       + water_b_factor
    overall_atoms = macromolecular_atoms + water_atoms
    ligand_atoms_list    = []
    ligand_b_factor_list = []
    for name in ligand_atoms:
        if ligand_atoms[name]>0:
            overall_atoms += ligand_atoms[name]
            avg_b         += ligand_b_factor[name]
            ligand_b_factor[name] = ligand_b_factor[name] / ligand_atoms[name]
            ligand_atoms_list   .append ( "%d "    % ligand_atoms[name]    + name )
            ligand_b_factor_list.append ( "%0.1f " % ligand_b_factor[name] + name )

    if overall_atoms>0:
        avg_b = avg_b / overall_atoms

    # Return the results
    return {
        "overall_atoms"        : overall_atoms,
        "macromolecular_atoms" : macromolecular_atoms,
        "ligand_atoms"         : ligand_atoms,
        "ligand_atoms_str"     : " / ".join(ligand_atoms_list),
        "water_atoms"          : water_atoms,
        "hydrogen_atoms"       : hydrogen_atoms,
        "n_chains"             : n_chains,
        "n_models"             : n_models,
        "avg_b"                : avg_b,
        "avg_macro_b"          : avg_macro_b,
        "avg_ligand_b"         : ligand_b_factor,
        "avg_ligand_b_str"     : " / ".join(ligand_b_factor_list),
        "avg_water_b"          : avg_water_b,
    }

"""
# Example usage
pdb_file = "gamma.mmcif"  # Replace with your file path
results = analyze_structure(pdb_file)
print("Results:")
print(f"Number of macromolecular atoms: {results['macromolecular_atoms']}")
print(f"Number of ligand atoms        : {results['ligand_atoms']}")
print(f"Number of water atoms         : {results['water_atoms']}")
print(f"Number of hydrogen atoms      : {results['hydrogen_atoms']}")
print(f"Average B-factor (macromolecules): {results['avg_macro_b']:.2f}")
print(f"Average B-factor (ligands)    : {results['avg_ligand_b']:.2f}")
print(f"Average B-factor (waters)     : {results['avg_water_b']:.2f}")
"""
