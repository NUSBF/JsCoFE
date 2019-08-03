
===================================
|jsCoFE| Task Development: Input Data
===================================

Most of *tasks* must have input facilities in order to receive data from other
tasks and various parameters set by user. We will now do modifications to the
*Hello World!* task we introduced in :doc:`dev_hello_world`, so that the task
will be able to accept both data objects and parameters.

-----------------------
Data exchange in |jsCoFE|
-----------------------

|jsCoFE| *tasks* exchange data in terms of *data objects*, rather than raw files.
*Data object* may be equivalent to file, but it may be also part of a file or
a combination of data from several files or their parts. Whenever a data exchange
is required, it is done on the level of metadata objects, represented by short
JSON-formatted files, which contain reference(s) to files with actual data.
Therefore, before running on a number cruncher, |jsCoFE|'s task must receive a
metadata object, describing a particular data type, and actual files it refers
to. By design, the metadata comes in the ``input_data`` field of task class, and
actual files are put automatically by |jsCoFE| framework in the job's ``input``
subdirectory on the Front-End server before sending all job directory to
number cruncher.

Most of technical details of data exchange in |jsCoFE| are hidden from task
developer, and knowing them should not be required for task development. We
will demonstrate handling task input data on he example of the *Hello World!*
task, introduced in :ref:`hello-world`.

.. _input-data:

-----------------------------------
Specifying input data in Task Class
-----------------------------------

Suppose we would like our task to deal with macromolecular coordinate data, and
the number of datasets that a user can give to task should vary from 0 (no input
data) to 20. This is achieved by putting the following construct: ::

  this.input_dtypes = [{      // input data types
     data_type : {'DataXYZ':[]},    // data type(s) and subtype(s)
     label     : 'XYZ Coordinates', // label for input dialog
     inputId   : 'xyz',       // input Id for referencing input fields
     force     : 1,           // show 1 dataset if few are available
     version   : 0,           // minimal version data acceptable
     min       : 0,           // minimum acceptable number of data instances
     max       : 20           // maximum acceptable number of data instances
   }
  ];

in :ref:`Task Class constructor <task-class>` (which is ``TaskHelloWorld()``
in this particular case). Detail description of all items in input construct is
given in :doc:`ref_input_data`.

You may now insert the above fragment in function ``TaskHelloWorld()`` in file
``js-common/tasks/common.helloworld.js`` and advance task version in function
``currentVersion()`` in the same file. Then restart all |jsCoFE| servers and
reload |jsCoFE| in your browser and go to your project with *Hello World!* tasks.

First, try to clone the previous job -- the framework should prevent you of doing
so because we have changed the interface version number. This is done in order
to prevent possible inconsistencies. For example, in this case, *Task Driver*
will look for input data constructs in the cloned job, and may crash because of
not finding any.

Second, create a new *Hello World!* task and open the job dialog. You may see
no changes, which will mean that there is no XYZ data in project, and, therefore,
the framework does not create any input fields. If this is the case, open
*Data Import* task from the task list and import one or a few PDB files, and then
add *Hello World!* task after data import. Then the corresponding input field
should appear.

Note that if we've put minimum number of datasets equal to 1, the job dialog
would not even open if there is no coordinate data in the project (try to imitate
this situation). Also note that if we omit ``force`` parameter or set it equal
to 0, then the input field appears without any data loaded and says *[do not use]*,
which is used in case of optional dataset. Also check how the input field
behaves when you have more than one coordinate dataset in the project -- it
should prompt inputting more dataset with additional fields appearing after
choosing a value in the current one up to the total number of 20.

Finally, note that if a task needs more than a single *data type* on input,
the corresponding constructs, similar to one sampled above, should be added
as items to the ``input_dtypes`` list. They will be laid out in *Job Dialog*
in order of their appearance in the list.

Full source code of the modified *Hello World!* Task Class may be downloaded
from :download:`here <examples/v1/common.tasks.helloworld.js>`.


---------------------------------
Getting input data in Task Driver
---------------------------------

Data objects, chosen by user, should be received in *Task Driver* (*cf.*
:ref:`task-driver`), and corresponding data passed to relevant application for
processing. |jsCoFE| framework works in such way that data objects arrive in
structure ``self.input_data.data``, where they appear under identifiers
corresponding to chosen ``inputId`` in their *Task Class* descriptions. For our
*Hello World!* example, the coordinate data objects are accessible in
*Task Driver* module as::

  xyz = self.input_data.data.xyz

Here, ``self.input_data.data`` is constant part, which will be the same in all
cases, and ``.xyz`` corresponds to the chosen value of ``inputId`` field of the
input data construct introduced :ref:`above <input-data>`. The framework passes
only python dictionaries, rather than the corresponding *Data Classes*. If
necessary, the dictionaries may be converted to *Data Classes* as::

  xyz = self.input_data.data.xyz
  for i in range(len(xyz)):
      xyz[i] = self.makeClass ( xyz[i] )

which is useful in many cases because *Data Classes* provide a number of
convenience functions for data manipulation.

We will now modify our *Hello World!'s* *Task Driver* such that it identifies
whether a user have selected input data or not, and if yes, prints the metadata
and raw data for all chosen data objects in standard output. The corresponding
*Task Driver's* code may look like the following:

.. literalinclude:: examples/v1/helloworld.py
  :language: python
  :linenos:

:download:`Download <examples/v1/helloworld.py>` this file and copy it in
``pycofe/tasks`` directories of all |jsCoFE| number crunchers, then create new
*Hello World!* task in a project with imported coordinate data. Run the task and
investigate which parts of *Task Driver* are responsible for which output
details. Note that this example is useful for learning actual metadata
structures of various data objects, while the present documentation may be
outdated or incomplete.
