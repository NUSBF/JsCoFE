//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.form.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's html form module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function addForm ( formId,action,method,holderId,
                   row,col,rowSpan,colSpan )  {
// Puts a form into the specified grid position, and adds a grid to it

  if (document.getElementById(formId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  let form = element ( "form","id",formId,"" );
  form.setAttribute ( "action" ,action );
  form.setAttribute ( "method" ,method );
  form.setAttribute ( "enctype","multipart/form-data" );

  addGridItem    ( holderId,form,row,col,rowSpan,colSpan );
  addGridCompact ( formId );

}

function addFileUpload ( inpId,name,value,length,required,onChange,
                         holderId,row,col,rowSpan,colSpan )  {
// ADD_FILE_UPLOAD inpId name value length holderId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  let input = element ( "input","id",inpId,"" );
  input.setAttribute ( "type","file" );
  if (name.length>0)     input.setAttribute ( "name"    ,name     );
  if (value.length>0)    input.setAttribute ( "value"   ,value    );
  if (length>0)          input.setAttribute ( "size"    ,length   );
  if (required)          input.setAttribute ( "required","yes"    );
  if (onChange.length>0) input.setAttribute ( "onchange",onChange );

  addGridItem ( holderId,input,row,col,rowSpan,colSpan );

}

function addLineEdit ( inpId,name,text,size,holderId,
                       row,col,rowSpan,colSpan )  {
// ADD_LINE_EDIT inpId name value size formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  let input = element ( "input","id",inpId,"" );
  input.setAttribute ( "type","text" );
  if (name.length>0) input.setAttribute ( "name"     ,name );
  if (text.length>0) input.setAttribute ( "value"    ,text );
  if (size>0)        input.setAttribute ( "maxlength",size );

  addGridItem ( holderId,input,row,col,rowSpan,colSpan );

  if (size>0)
    input.style.width = input.offsetHeight*size/1.75 + "px";

}

function addHiddenText ( inpId,name,text,holderId,
                         row,col,rowSpan,colSpan )  {
// ADD_HIDDEN_TEXT inpId name value formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  let input = element ( "input","id",inpId,"" );
  input.setAttribute ( "type" ,"hidden" );
  input.setAttribute ( "name" ,name     );
  input.setAttribute ( "value",text     );

  addGridItem ( holderId,input,row,col,rowSpan,colSpan );

}


function submitForm ( form )  {
  _formSubmittedID = form.id;
  form.submit();
  disableForm ( _formSubmittedID,true );
  startTaskTimed();
}
