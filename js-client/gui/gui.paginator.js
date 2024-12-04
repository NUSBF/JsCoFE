//
//  =================================================================
//
//    18.11.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  gui.paginator.js  <interface>
//       ~~~~~~~~~
//  **** Project :  Object-Oriented HTML5 GUI Toolkit
//       ~~~~~~~~~
//  **** Content :  Paginator module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2024
//
//  =================================================================
//

'use strict'; // *client*

function Paginator ( n_items,n_page,n_visible,n_start,callback_func )  {

  Widget.call ( this,'ul' );

  let nPages = Math.floor(n_items/n_page+1);

  this.pagination = $(this.element).twbsPagination({
    totalPages             : nPages,
    visiblePages           : n_visible,
    startPage              : n_start,
    initiateStartPageClick : true,
    hideOnlyOnePage        : true,
    onPageClick  : function ( event,pageNo ) {
      callback_func ( pageNo );
      // alert ( 'page ' + page + ', n1=' + n_page*(page-1) );
    }
  });

}

Paginator.prototype = Object.create ( Widget.prototype );
Paginator.prototype.constructor = Paginator;


Paginator.prototype.showPage = function ( pageNo )  {
  this.pagination.twbsPagination ( 'show',pageNo );
}