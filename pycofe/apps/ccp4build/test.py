##!/usr/bin/python

import gemmi

st = gemmi.read_structure ( "1_0_7.refmac.pdb" )
for model in st:
    for i in range(len(model)):
        chain = model[i]
        print dir(chain)
        #for res in chain:
        #    #print  dir(res)
        #    print  res.name+"-"+chain.name+"-"+ str(res.seqid)
        chain0 = chain
        #model.remove_chain(chain0.name)
        for j in reversed(range(len(chain))):
             res = chain[j]
             print  res.name+"-"+chain.name+"-"+ str(res.seqid)

