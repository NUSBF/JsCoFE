##!/usr/bin/python

# ============================================================================
#
#    01.01.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  OPTIMIZES CHAIN ARRANGEMENT IN ASU
#
#  Copyright (C) Eugene Krissinel 2022-2023
#
# ============================================================================
#

#  python native imports
import math
import gemmi

def optimizeXYZ ( gemmi_st ):

    ops   = gemmi.SpaceGroup ( gemmi_st.spacegroup_hm ).operations()
    model = gemmi_st[0]
    p0    = model[0].calculate_center_of_mass()

    for n in range(len(model)):
        chain = model[n]
        cm0   = chain.calculate_center_of_mass()
        fp0   = gemmi_st.cell.fractionalize ( gemmi.Position(cm0[0],cm0[1],cm0[2]) )
        dmin  = 0.0
        opmin = None
        df    = [0,0,0]
        for op in ops:
            fp  = op.apply_to_xyz ( fp0.tolist() )
            f1  = [0,0,0]
            for i1 in range(5):
                f1[0] = (fp[0] % 1) + i1 - 2
                for i2 in range(5):
                    f1[1] = (fp[1] % 1)  + i2 - 2
                    for i3 in range(5):
                        f1[2] = (fp[2] % 1) + i3 - 2
                        d1 = p0.dist ( gemmi_st.cell.orthogonalize ( gemmi.Fractional(f1[0],f1[1],f1[2])) )
                        if not opmin or d1<dmin:
                            opmin = op
                            dmin  = d1
                            for i in range(3):
                                df[i] = f1[i] - fp[i]
        for res in chain:
            for atom in res:
                fxyz  = opmin.apply_to_xyz ( gemmi_st.cell.fractionalize(atom.pos).tolist() )
                for i in range(3):
                    fxyz[i] += df[i]
                atom.pos = gemmi_st.cell.orthogonalize ( gemmi.Fractional(fxyz[0],fxyz[1],fxyz[2]) )

    return


# ============================================================================

if __name__ == "__main__":
    import sys
    st = gemmi.read_structure ( sys.argv[1] )
    optimizeXYZ  ( st  ) 
    st.write_pdb ( "a.pdb" )
