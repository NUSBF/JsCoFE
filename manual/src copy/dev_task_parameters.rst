
=========================================
|jsCoFE| Task Development: Input Parameters
=========================================

|jsCoFE| can pass several types of parameters from *Job Dialog* to *Task Driver*:

* Strings
* Integer numbers
* Real numbers
* Checkbox states
* Selector (multiple choices) states

The general mechanism for passing parameters is the same as for input data.
Firstly, parameters need to be described (together with layout and visibility
instructions) in *Task Class*, after which they will be accessible for
*Task Driver* via a dedicated data structure.


.. _input-parameters:

-----------------------------------------
Specifying input parameters in Task Class
-----------------------------------------

All input parameters must be described in a hierarchical JSON object assigned
to class's variable ``parameters`` in :ref:`Task Class constructor <task-class>`,
for example: ::

  this.parameters = { // container for all input parameters
    NCLUST :          // unique key for fetching parameter value in Task Driver
         {  type      : 'integer',  // parameter type
            label     : 'Number of clusters',  // label to display in Job Dialog
            tooltip   : 'Specify the number of clusters between 1 and 50',
            range     : [1,50],   // for auto-validation by the framework
            value     : '10',
            default   : '10',
            position  : [0,0,1,1]
          }
  };

All items in the above construct should be self-explicable, apart from, possibly,
the last one. ``position`` is a mandatory parameter, specifying where in the
page the corresponding widget should be placed. The page should be viewed as
an infinite table, in which columns and rows are numbered starting from 0.
Then, the position is given with the list of 4 numbers as ``[row,col,rowSpan,colSpan]``
identically to positioning in standard HTML tables.

For clarity of presentation, parameters need to be grouped such as "Main options",
"Advanced options", "Expert options", "Developer's options" and similar. This
can be done with foldable Sections, each of which is a container for own
parameters, e.g.: ::

  this.parameters = { // container for all input parameters

    sec1  :  // unique Section ID used for fetching parameters in Task Driver
        { type     : 'section',      // widget type
          title    : 'Main options', // Section title
          open     : true,       // true for the section to be initially open
          position : [0,0,1,5],  // must span 5 columns
          contains : {           // container for Section's parameters

            NCLUST :  // unique key for fetching parameter value in Task Driver
                 {  type      : 'integer',  // parameter type
                    label     : 'Number of clusters',
                    tooltip   : 'Specify the number of clusters between 1 and 50',
                    range     : [1,50],   // for auto-validation by the framework
                    value     : '10',
                    default   : '10',
                    position  : [0,0,1,1] // numbering starts from 0 in all sections
                  }

          }
        }
  };


.. _inter-dependency:

-----------------------------------
Inter-dependent Data and Parameters
-----------------------------------

Quite often, task design requires hiding or showing certain parameters depending
on current values of other parameters or input data chosen. This is achieved
with ``showon`` or ``hideon`` terms in parameter descriptors. Consider the
following set of parameters: ::

  this.parameters = { // container for all input parameters

    sec1  :  // unique Section ID used for fetching parameters in Task Driver
        { type     : 'section',      // widget type
          title    : 'Main options', // Section title
          open     : true,       // true for the section to be initially open
          position : [0,0,1,5],  // must span 5 columns
          contains : {           // container for Section's parameters

            NCLUST :  // unique key for fetching parameter value in Task Driver
                 {  type      : 'integer',  // parameter type
                    label     : 'Number of clusters',
                    tooltip   : 'Specify the number of clusters between 1 and 50',
                    range     : [1,50],   // for auto-validation by the framework
                    value     : '10',
                    default   : '10',
                    position  : [0,0,1,1], // numbering starts from 0 in all sections
                    hideon    : {xyz:[-1,0]}
                  },

            HATOM :
                 {
                    type      : 'string',
                    label     : 'Atom type',
                    tooltip   : 'Substructure atom giving anomalous scattering',
                    value     : 'Se',
                    maxlength : 2,       // maximum input length
                    emitting  : true,    // allow to emit signals on change
                    position  : [1,0,1,1]
                  },

            PROGRAM :
                  {
                    type     : 'combobox',
                    label    : 'Substructure determination program',
                    tooltip  : 'The program that will be used for ' +
                               'substructure determination',
                    range    : ['_blank_|Auto',
                                'pgm_shelxd|ShelXD',
                                'pgm_prasa|Prasa'
                               ],
                    value    : '_blank_',
                    position : [2,0,1,1]
                  },

            HANDDET_DO :
                  {
                    type     : 'checkbox',
                    label    : 'Perform hand determination',
                    tooltip  : 'Unselect if you wish to skip the hand ' +
                               'determination and directly proceed with the ' +
                               'current hand',
                    value    : true,
                    position : [3,0,1,1],
                    showon   : {HATOM:['Se','Hg']},
                    hideon   : {PROGRAM:['pgm_prasa']}
                  }

          }
        }
  };

In this example, parameter ``NCLUST`` will be hidden if widget with identifier
``xyz`` has a value of either ``-1`` or ``0``. In our task, *Hello World!*,
``xyz`` corresponds to the widget for choosing input data (coordinate files).
In this case, the *value* of the widget is the number of chosen datasets; ``-1``
corresponds to the situation when datasets are not present in the project and
input data widget is not shown at all; ``0`` means that the widget shows
``[do not use]`` message. A value of ``N>0`` would mean that the widget shows
``N`` datasets chosen. Therefore, ``NCLUST`` will be hidden if either there is
no coordinate datasets in the project, or no dataset is chosen for input.

The checkbox ``HANDDET_DO`` will be shown if widget ``HATOM`` contains string
`Se` or `Hg`, and hidden if combobox ``PROGRAM`` shows ``Prasa``.

Full description of input widgets and inter-dependencies with complex logical
expressions is given in :doc:`ref_parameters`.

Download the full source code of the modified *Hello World!* Task Class, which
includes the above description of input parameters from
:download:`here <examples/v2/common.tasks.helloworld.js>`, substitute it in
|jsCoFE| source code, restart servers and browser and check functionality of
input widgets and interdependencies.


---------------------------------------
Getting input parameters in Task Driver
---------------------------------------

Input parameters arrive in the *Task Driver* in structure ``self.task.parameters``,
which is fully equivalent to JSON object ``this.parameters`` in the corresponding
*Task Class*. For example, the value of ``NCLUST`` parameter from the previous
Section will be accessible as ::

  self.task.parameters.sec1.contains.NCLUST.value

*Task Driver* may check whether a parameter was hidden due to inter-dependency
(*cf.* :ref:`above <inter-dependency>`) by reading the ``visible`` field of
the parameter: ::

  if not self.task.parameters.sec1.contains.NCLUST.visible:
      print "Parameter 'NCLUST' is hidden, do not read or use its value"

Now let's modify our *Hello World!'s* *Task Driver* from :doc:`dev_task_input`
such that it prints values of all input parameters, as well as some other
properties. The corresponding *Task Driver's* code may look like the following:

.. literalinclude:: examples/v2/helloworld.py
  :language: python
  :linenos:

:download:`Download <examples/v2/helloworld.py>` this file and copy it in
``pycofe/tasks`` directories of all |jsCoFE| number crunchers, then create new
*Hello World!* task in a project with imported coordinate data. Run the task and
investigate connection between parameters displayed in the *Input* tab of the
*Job Dialog*, and their properties, presented in the *Output* tab.
Note that this example is useful for learning actual parameters metadata,
while the present documentation may be outdated or incomplete. Also note making
tables with *PyRVAPI* library.
