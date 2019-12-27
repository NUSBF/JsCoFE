#!/usr/bin/python

#
# ============================================================================
#
#    28.12.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  RAMACHANDRAN PLOT FUNCTIONS
#
#  Original version:
#  Written by Gabor Erdos, 2017
#  Contact info: gerdos[at]caesar.elte.hu
#  https://github.com/gerdos/PyRAMA
#
#  The preferences were calculated from the following artice:
#  Lovell et al. Structure validation by Calpha geometry: phi,psi and
#  Cbeta deviation. 2003. DOI: 10.1002/prot.10286
#
#  Reference data should be in 'rama_data' subdirectory relative to this file.
#
#  Adopted in present form by Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

from __future__ import division, print_function

import math
import os
import sys

import matplotlib.pyplot as plt
import numpy as np
from   Bio import PDB
from   matplotlib import colors

import matplotlib.colors as mplcolors

plt.switch_backend ( "agg" )

# ============================================================================

RAMA_PREFERENCES = {
    "General": {
        "file": os.path.join('rama_data', 'pref_general.data'),
        "cmap": mplcolors.ListedColormap(['#FFFFFF', '#B3E8FF', '#7FD9FF']),
        "bounds": [0, 0.0005, 0.02, 1],
    },
    "GLY": {
        "file": os.path.join('rama_data', 'pref_glycine.data'),
        "cmap": mplcolors.ListedColormap(['#FFFFFF', '#FFE8C5', '#FFCC7F']),
        "bounds": [0, 0.002, 0.02, 1],
    },
    "PRO": {
        "file": os.path.join('rama_data', 'pref_proline.data'),
        "cmap": mplcolors.ListedColormap(['#FFFFFF', '#D0FFC5', '#7FFF8C']),
        "bounds": [0, 0.002, 0.02, 1],
    },
    "PRE-PRO": {
        "file": os.path.join('rama_data', 'pref_preproline.data'),
        "cmap": mplcolors.ListedColormap(['#FFFFFF', '#B3E8FF', '#7FD9FF']),
        "bounds": [0, 0.002, 0.02, 1],
    }
}

#RAMA_PREF_VALUES = None


# ============================================================================

def _cache_RAMA_PREF_VALUES():
    #f_path = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
    f_path = os.path.realpath ( os.path.dirname ( __file__ ) )
    RAMA_PREF_VALUES = {}
    for key, val in RAMA_PREFERENCES.items():
        RAMA_PREF_VALUES[key] = np.full((360, 360), 0, dtype=np.float64)
        with open(os.path.join(f_path, val["file"])) as fn:
            for line in fn:
                if line.startswith("#"):
                    continue
                else:
                    x = int(float(line.split()[1]))
                    y = int(float(line.split()[0]))
                    RAMA_PREF_VALUES[key][x + 180][y + 180] \
                        = RAMA_PREF_VALUES[key][x + 179][y + 179] \
                        = RAMA_PREF_VALUES[key][x + 179][y + 180] \
                        = RAMA_PREF_VALUES[key][x + 180][y + 179] \
                        = float(line.split()[2])
    return RAMA_PREF_VALUES

RAMA_PREF_VALUES = _cache_RAMA_PREF_VALUES()



def calc_ramachandran ( file_name_list ):
    """
    Main calculation and plotting definition
    :param file_name_list: List of PDB files to plot
    :return: Nothing
    """
    global RAMA_PREF_VALUES

    if RAMA_PREF_VALUES is None:
        RAMA_PREF_VALUES = _cache_RAMA_PREF_VALUES()

    # Read in the expected torsion angles
    normals = {}
    outliers = {}
    for key, val in RAMA_PREFERENCES.items():
        normals[key] = {"x": [], "y": []}
        outliers[key] = {"x": [], "y": []}

    # Calculate the torsion angle of the inputs
    for inp in file_name_list:
        if not os.path.isfile(inp):
            continue
        structure = PDB.PDBParser().get_structure('input_structure', inp)
        for model in structure:
            for chain in model:
                polypeptides = PDB.PPBuilder().build_peptides(chain)
                for poly_index, poly in enumerate(polypeptides):
                    phi_psi = poly.get_phi_psi_list()
                    for res_index, residue in enumerate(poly):
                        res_name = "{}".format(residue.resname)
                        res_num = residue.id[1]
                        phi, psi = phi_psi[res_index]
                        if phi and psi:
                            if str(poly[res_index + 1].resname) == "PRO":
                                aa_type = "PRE-PRO"
                            elif res_name == "PRO":
                                aa_type = "PRO"
                            elif res_name == "GLY":
                                aa_type = "GLY"
                            else:
                                aa_type = "General"
                            if RAMA_PREF_VALUES[aa_type][int(math.degrees(psi)) + 180][int(math.degrees(phi)) + 180] < \
                                    RAMA_PREFERENCES[aa_type]["bounds"][1]:
                                outliers[aa_type]["x"].append(math.degrees(phi))
                                outliers[aa_type]["y"].append(math.degrees(psi))
                            else:
                                normals[aa_type]["x"].append(math.degrees(phi))
                                normals[aa_type]["y"].append(math.degrees(psi))
    return normals, outliers


def plot_ramachandran ( normals,outliers ):
    global RAMA_PREF_VALUES

    if RAMA_PREF_VALUES is None:
        RAMA_PREF_VALUES = _cache_RAMA_PREF_VALUES()

    for idx, (key, val) in enumerate(sorted(RAMA_PREFERENCES.items(), key=lambda x: x[0].lower())):
        plt.subplot(2, 2, idx + 1)
        plt.title(key)
        plt.imshow(RAMA_PREF_VALUES[key], cmap=RAMA_PREFERENCES[key]["cmap"],
                   norm=colors.BoundaryNorm(RAMA_PREFERENCES[key]["bounds"], RAMA_PREFERENCES[key]["cmap"].N),
                   extent=(-180, 180, 180, -180))
        plt.scatter(normals[key]["x"], normals[key]["y"])
        plt.scatter(outliers[key]["x"], outliers[key]["y"], color="red")
        plt.xlim([-180, 180])
        plt.ylim([-180, 180])
        plt.plot([-180, 180], [0, 0], color="black")
        plt.plot([0, 0], [-180, 180], color="black")
        plt.locator_params(axis='x', nbins=7)
        plt.xlabel(r'$\phi$')
        plt.ylabel(r'$\psi$')
        plt.grid()

    plt.tight_layout()
    # plt.savefig("asd.png", dpi=300)
    plt.show()
    return


def plot_ramachandran1 ( key,title,normals,outliers,outimagepath ):
    global RAMA_PREF_VALUES

    if RAMA_PREF_VALUES is None:
        RAMA_PREF_VALUES = _cache_RAMA_PREF_VALUES()

    plt.figure  ( figsize=(5.5, 5.5) )
    plt.title   ( title, fontsize=18 )
    plt.imshow  ( RAMA_PREF_VALUES[key], cmap=RAMA_PREFERENCES[key]["cmap"],
                  norm=colors.BoundaryNorm(RAMA_PREFERENCES[key]["bounds"],
                                           RAMA_PREFERENCES[key]["cmap"].N),
                  extent=(-180, 180, 180, -180))
    plt.scatter ( normals[key]["x"], normals[key]["y"])
    plt.scatter ( outliers[key]["x"], outliers[key]["y"], color="red")
    plt.xlim ( [-180, 180] )
    plt.ylim ( [-180, 180] )
    plt.plot ( [-180, 180], [0, 0], color="black")
    plt.plot ( [0, 0], [-180, 180], color="black")
    plt.locator_params ( axis='x',nbins=7 )
    plt.xlabel ( r'$\phi$', fontsize=16 )
    plt.ylabel ( r'$\psi$', fontsize=16, labelpad=0 )
    plt.grid   ( color='#AAAAAA', linestyle='--' )
    if outimagepath:
        plt.savefig ( outimagepath, dpi=300 )  # dpi=70 for small images in docs
    else:
        plt.show()
    return


def make_ramaplot ( xyzpath ):
    normals, outliers = calc_ramachandran( [xyzpath] )
    plot_ramachandran ( normals,outliers )
    return

def make_ramaplot1 ( key,title,xyzpath,outimagepath ):
    normals, outliers = calc_ramachandran( [xyzpath] )
    plot_ramachandran1 ( key,title,normals,outliers,outimagepath )
    return


# ============================================================================

if __name__ == "__main__":

    make_ramaplot ( sys.argv[1] )
    sys.exit(0)
