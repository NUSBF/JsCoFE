
=================================
Reference: Input Data Descriptors
=================================

Input Data Field (IDF) has the following structure ((*) marks mandatory items): ::

  { // input data types
    data_type   : {  // (*) data type(s) and subtype(s)
                    'type1':[subtype_list_1],
                    'type2':[subtype_list_2],
                    ...
                  },
    castTo      : 'dataType',      // all input types will be casted to the specified one
    cast        : 'cast_name',     // will replace data type names in input data comboboxes
    label       : 'label_text',    // (*) label for input dialog
    tooltip     : 'tooltip_text',  // tooltip to show on mouse hovering
    inputId     : 'id',            // (*) input Id for referencing input fields
    customInput : 'inpref',        // used to lay custom input fields below the selection
                                   // combobox
    version     : versionN,        // integer indicating the minimum data version allowed
    force       : forceN,          // integer specifying how many data instance to show
                                   // initially (from the range of [minN...maxN] and if
                                   // available
    min         : minN,            // (*) minimum acceptable number of data instances
    max         : maxN             // (*) maximum acceptable number of data instances
  }

**data_type**
  Describes data types and subtypes that are allowed for given IDF. An IDF may
  accept more than a single data type, however, usually they should be compatible.
  For example, an IDF can accept bare coordinates, data structures and ensembles,
  if task requires only coordinate part of the corresponding data objects. The
  following data types are currently implemented:

  ============== ================================== ===========================
  Type name        Description                      Subtypes
  ============== ================================== ===========================
  DataUnmerged     Unmerged reflections
  DataHKL          Merged and scaled reflections    anomalous
  DataSequence     Macromolecular sequence          protein, rna, dna
  DataXYZ          Macromolecular coordinates       protein, rna, dna
  DataEnsemble     Ensemble (models) for MR
  DataLigand       Ligand structure and dictionary
  DataStructure    XYZ, HKL, Ligand(s) and phases   seq, phases, anomalous, substructure, ligands, waters
  DataRevision     Structure and ASU contents       asu, hkl, seq, anomalous, xyz, substructure, phases, ligands, waters
  ============== ================================== ===========================
