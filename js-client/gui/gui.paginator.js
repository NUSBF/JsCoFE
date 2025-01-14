//
//  =================================================================
//
//    25.12.24   <--  Date of Last Modification.
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

function Paginator ( n_items,n_page,n_visible,n_start,paginate,callback_func )  {

  Grid.call ( this,'-compact' );

  let self = this;

  this.paginate     = paginate;
  this.onShowAllListener = null;
  this.__start_page = n_start;
  this.base         = new Widget ( 'ul' );
  this.addWidget ( this.base,0,0,1,1 );

  this.nPages   = Math.floor(n_items/n_page+1);
  this.options  = {
    totalPages             : this.nPages,
    visiblePages           : n_visible,
    startPage              : n_start,
    initiateStartPageClick : true,
    hideOnlyOnePage        : true,
    onPageClick : function ( event,pageNo ) {
      if (self.paginate)
            callback_func ( pageNo,n_page,self.paginate );
      else  callback_func ( 1,n_items,self.paginate );
      // alert ( 'page ' + page + ', n1=' + n_page*(page-1) );
    }
  };

  if (!paginate)  {
    this.options.totalPages = 1;
    this.options.startPage  = 1;
  }

  this.pagination = $(this.base.element).twbsPagination ( this.options );
  this.base.setVisible ( this.paginate );

  this.show_btn = this.addButton ( paginate ? 'Show all' : 'Paginate','',0,1,1,1 );

  $(this.show_btn.element).addClass('pagination-button');

  this.show_btn.addOnClickListener ( function(){
    if (self.paginate)  {
      self.paginate = false;
      self.__start_page = self.pagination.twbsPagination('getCurrentPage');
      self.pagination.twbsPagination ( 'destroy' );
      self.pagination.twbsPagination ( $.extend({}, self.options, {
        totalPages : 1,
        startPage  : 1
      }));
    } else  {
      self.paginate = true;
      self.pagination.twbsPagination ( 'destroy' );
      self.pagination.twbsPagination ( $.extend({}, self.options, {
        totalPages : self.nPages,
        startPage  : self.__start_page
      }));
    }
    self.show_btn.setText ( self.paginate ? 'Show all' : 'Paginate' );
    self.base.setVisible  ( self.paginate );
    if (self.onShowAllListener)
      self.onShowAllListener();
  });

}

Paginator.prototype = Object.create ( Grid.prototype );
Paginator.prototype.constructor = Paginator;

Paginator.prototype.showPage = function ( pageNo )  {
  this.pagination.twbsPagination ( 'show',pageNo );
}

Paginator.prototype.setOnShowAllListener = function ( listener_func )  {
// listener_func() - no parameters
  this.onShowAllListener = listener_func;
}