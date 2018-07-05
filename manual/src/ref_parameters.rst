
==========================================
Reference: Description of Input Parameters
==========================================

Definition of task input parameter has the following structure: ::


  { type      : 'label',    // (*) parameter type
    label     : 'text',     // (*) label to be shown on left from parameter input field
    label2    : 'text',     // label to be shown on right from parameter input field
    keyword   : 'keyword',  // keyword that may be passed to python wrapper
    reportas  : 'text',     // to use in validation reports instead of label
    tooltip   : 'text',     // tooltip to show on mouse hovering
    align     : 'left|right|center', // label text alignment
    lwidth    : integer,    // width of the label, in pixels
    align2    : 'left|right|center', // label2 text alignment
    lwidth2   : integer,    // width of the label2, in pixels
    iwidth    : integer,    // width of parameter input field, in pixels
    maxlength : integer,    // maximal input length (for text input parameters)
    range     : [..],       // range of input values for the parameter
    value     : 'NNN',      // initial value for the parameter
    default   : 'DDD',      // default value shown in grey when input field is empty
    placeholder : text,     // placeholder (for textarea only)
    nrows     : integer,    // number of input rows (for textarea only)
    ncols     : integer,    // number of input columns (for textarea only)
    position  : [0,0,1,4],  // (*) position of parameter widget on grid
    emitting  : true/false, // flag to emit signal when input field changes
    showon    : {...}       // conditions on which parameter should be shown
    hideon    : {...}       // conditions on which parameter should be hidden
  }
