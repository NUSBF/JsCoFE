##!/usr/bin/python

#
# mmCif ready
#
# ============================================================================
#
#    29.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  OPTIMIZES CHAIN ARRANGEMENT IN ASU
#
#  Copyright (C) Eugene Krissinel 2022-2024
#
# ============================================================================
#

import gemmi

def optimizeXYZ ( gemmi_st,body=None ):

    if not gemmi_st.spacegroup_hm:
        return []

    ops   = gemmi.SpaceGroup ( gemmi_st.spacegroup_hm ).operations()
    model = gemmi_st[0]
    p0    = model[0].calculate_center_of_mass()

    log         = []
    polymers    = []
    nonpolymers = []
    cpos        = []

    for n in range(len(model)):

        chain = model[n]
        cpos.append ( None )

        # body.stderrln ( " >>>> chain=" + chain.name )

        water_chain = True
        for res in chain:
            if res.name not in ["HOH","WAT"]:
                water_chain = False

        if water_chain:
            nonpolymers.append ( n )
        else:
            polymers.append ( n )
            cm0   = chain.calculate_center_of_mass()
            # body.stderrln ( " >>>> cm0=" + str(cm0) )
            fp0   = gemmi_st.cell.fractionalize ( gemmi.Position(cm0[0],cm0[1],cm0[2]) )
            # body.stderrln ( " >>>> fp0=" + str(fp0) )
            dmin  = 0.0
            opmin = None
            df    = [0,0,0]
            for op in ops:
                # body.stderrln ( " >>>> op=" + str(op) )
                fp  = op.apply_to_xyz ( fp0.tolist() )
                # body.stderrln ( " >>>> fp=" + str(fp) )
                f1  = [0,0,0]
                for i1 in range(5):
                    f1[0] = (fp[0] % 1) + i1 - 2
                    for i2 in range(5):
                        f1[1] = (fp[1] % 1)  + i2 - 2
                        for i3 in range(5):
                            f1[2] = (fp[2] % 1) + i3 - 2
                            # body.stderrln ( " >>>> f1=" + str(f1) )
                            d1 = p0.dist ( gemmi_st.cell.orthogonalize ( gemmi.Fractional(f1[0],f1[1],f1[2])) )
                            if not opmin or d1<dmin:
                                opmin = op
                                dmin  = d1
                                for i in range(3):
                                    df[i] = round ( f1[i]-fp[i] )
            tran = [ 0,0,0 ]
            for i in range(3):
                tran[i] = opmin.tran[i] + gemmi.Op.DEN*df[i]
            opmin.tran = tran

            for res in chain:
                for atom in res:
                    fxyz  = opmin.apply_to_xyz ( gemmi_st.cell.fractionalize(atom.pos).tolist() )
                    # for i in range(3):
                    #     fxyz[i] += df[i]
                    atom.pos = gemmi_st.cell.orthogonalize ( gemmi.Fractional(fxyz[0],fxyz[1],fxyz[2]) )

            cm0     = chain.calculate_center_of_mass()
            cpos[n] = gemmi.Position ( cm0[0],cm0[1],cm0[2] )


            polymer = chain.get_polymer()
            t = polymer.check_polymer_type()
            ctype = "unknown"
            if t in (gemmi.PolymerType.PeptideL,gemmi.PolymerType.PeptideD):
                ctype = "Protein"
            elif t==gemmi.PolymerType.Dna:
                ctype = "DNA"
            elif t==gemmi.PolymerType.Rna:
                ctype = "RNA"
            elif t==gemmi.PolymerType.DnaRnaHybrid:
                ctype = "DNA-RNA Hybrid"
            else:
                ctype = str(t) + " (*)"

            log.append({
                "name" : chain.name,
                "type" : ctype,
                "op"   : opmin.triplet()
            })

    for n in nonpolymers:
        chain = model[n]
        for res in chain:
            fp0   = gemmi_st.cell.fractionalize ( res[0].pos )
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
                            p1 = gemmi_st.cell.orthogonalize ( gemmi.Fractional(f1[0],f1[1],f1[2]) )
                            for n1 in polymers:
                                d1 = cpos[n1].dist ( p1 )
                                if not opmin or d1<dmin:
                                    opmin = op
                                    dmin  = d1
                                    for i in range(3):
                                        df[i] = round ( f1[i]-fp[i] )
            tran = [ 0,0,0 ]
            for i in range(3):
                tran[i] = opmin.tran[i] + gemmi.Op.DEN*df[i]
            opmin.tran = tran

            for atom in res:
                fxyz     = opmin.apply_to_xyz ( gemmi_st.cell.fractionalize(atom.pos).tolist() )
                atom.pos = gemmi_st.cell.orthogonalize ( gemmi.Fractional(fxyz[0],fxyz[1],fxyz[2]) )

        log.append({
            "name" : chain.name,
            "type" : "Water",
            "op"   : "per residue"
        })


    return log


# ============================================================================

if __name__ == "__main__":
    import sys
    st = gemmi.read_structure ( sys.argv[1] )
    st.setup_entities()
    optimizeXYZ  ( st  ) 
    st.write_pdb ( "a.pdb" )
