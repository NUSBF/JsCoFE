# Full list of CCP4Cloud tasks and tests

1. **Data Import**
   - TaskImport        
   - TaskImportSeqCP   
   - TaskImportPDB **<span style="color:green">- done</span>**
   - TaskFacilityImport
   - TaskCloudImport **<span style="color:green">- done</span>**

2. **Data Processing**
   - TaskXia2 **<span style="color:green">- done</span>**
   - TaskXDSGUI _- N/A_
   - TaskDUI _- N/A_
   - TaskIMosflm _- N/A_
   - TaskAimless **<span style="color:green">- done</span>**
   - TaskChangeSpGHKL
   - TaskChangeReso  
   - TaskFreeRFlag   

3. **Asymmetric Unit and Structure Revision**
   - TaskASUDef **<span style="color:green">- done</span>**
   - TaskChangeSpGASU      
   - TaskEditRevision **<span style="color:green">- done</span>**

4. **Automated Molecular Replacement**
   - Conventional Auto-MR
      * TaskMorda **<span style="color:green">- done</span>**
      * TaskMrBump **<span style="color:green">- done</span>**
      * TaskBalbes **<span style="color:green">- done</span>**
   - No-sequence methods
      * TaskSimbad **<span style="color:green">- done</span>**
   - No-model methods
      * TaskAmple

5. **Molecular Replacement <span style="color:green">- whole section done</span>**
   - MR model preparation
      * TaskModelPrepXYZ **<span style="color:green">- done</span>**
      * TaskModelPrepAlgn **<span style="color:green">- done</span>**
      * TaskEnsembler **<span style="color:green">- done</span>**
      * TaskEnsemblePrepSeq **<span style="color:green">- done</span>**
      * TaskEnsemblePrepXYZ **<span style="color:green">- done</span>**
      * TaskEnsemblePrepMG _- N/A_
   - Fundamental MR
      * TaskPhaserMR **<span style="color:green">- done</span>**
      * TaskMolrep **<span style="color:green">- done</span>**

6. **Experimental Phasing**
   - Automated EP
      * TaskCrank2 **<span style="color:green">- done</span>**
      * TaskShelxAuto  
   - Fundamental EP
      * TaskShelxSubstr **<span style="color:green">- done</span>**
      * TaskShelxCD    
      * TaskPhaserEP **<span style="color:green">- done</span>**

7. **Density Modification**
   - TaskParrot **<span style="color:green">- done</span>**
   - TaskAcorn 
   - TaskShelxEMR

8. **Refinement and Model Building <span style="color:green">- whole section done</span>**
   - TaskRefmac **<span style="color:green">- done</span>**
   - TaskBuster _- N/A_
   - TaskLorestr **<span style="color:green">- done</span>**
   - TaskCCP4Build **<span style="color:green">- done</span>**
   - TaskBuccaneer **<span style="color:green">- done</span>**
   - TaskArpWarp _- N/A_
   - TaskNautilus **<span style="color:green">- done</span>**
   - TaskDimple **<span style="color:green">- done</span>**
   - TaskCootMB _- N/A_
   - TaskCombStructure **<span style="color:green">- done</span>**

9. **Ligands <span style="color:green">- whole section done</span>**
   - TaskMakeLigand **<span style="color:green">- done</span>**
   - TaskFitLigand **<span style="color:green">- done</span>**
   - TaskFitWaters **<span style="color:green">- done</span>**

10. **Validation, Analysis and Deposition <span style="color:green">- whole section done</span>**
   - TaskZanuda **<span style="color:green">- done</span>**
   - TaskPISA **<span style="color:green">- done</span>**
   - TaskDeposition **<span style="color:green">- done</span>**

11. **Toolbox**
   - Reflection data tools
      * TaskAuspex  
      * TaskSRF     
      * TaskCrosSec 
   - Coordinate data tools
      * TaskXyzUtils **<span style="color:green">- done</span>**
      * TaskCootCE _- N/A_
      * TaskGemmi _- N/A_
   - Alignment and comparison tools
      * TaskGesamt **<span style="color:green">- done</span>**
      * TaskLsqKab **<span style="color:green">- done</span>**
      * TaskSeqAlign **<span style="color:green">- done</span>**
      * TaskSymMatch **<span style="color:green">- done</span>**

