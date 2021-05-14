
/*
 *  =================================================================
 *
 *    12.04.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.utils.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Utils
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */


function mapExcludeKey ( map,exclKey )  {
  var m = {};
  for (var key in map)
    if (key!=exclKey)
      m[key] = map[key];
  return m;
}

function mapMaskIn ( map,mask_map )  {
  var m = {};
  for (var key in map)
    if (key in mask_map)
      m[key] = map[key];
  return m;
}

function mapMaskOut ( map,mask_map )  {
  var m = {};
  for (var key in map)
    if (!(key in mask_map))
      m[key] = map[key];
  return m;
}

function padDigits ( number,digits ) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

function round ( number,digits ) {
  try {
    return Number(Number(number).toFixed(digits));
  } catch (e)  {
    return 0;
  }
}

function padStringLeft ( S,char,n ) {
var L = S;
  while (L.length<n)
    L = char + L;
  return L;
}

function padStringRight ( S,char,n ) {
var L  = S;
var an = Math.abs(n)
  while (L.length<an)
    L += char;
  if ((n<0) && (L.length>an))
    return L.substring(0,an);
  return L;
}

var __regexp_int   = /^(-?[0-9]+\d*)$|^0$/;
var __regexp_float = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;

function isInteger ( value_str ) {
  return __regexp_int.test(value_str);
//  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

function isFloat ( value_str ) {
  return __regexp_float.test(value_str);
//  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

function isObject(obj) {
  return (Object.prototype.toString.call(obj).indexOf(' Object]')>=0);
//  return obj === Object(obj);
}

function shallowCopy ( object )  {
// returns copy of given object which does not contain object and array parameters
  if (!object)
    return object;
  var copy = {};
  for (var property in object)
    if (object.hasOwnProperty(property) && (!isObject(object[property])))
      copy[property] = object[property];
  return copy;
}

function replaceAll ( str,find,rep )  {
  return str.split(find).join(rep);
//  return str;
}

function strip_html_tags ( S )  {
  if (!S) return '';
  return S.toString().replace(/<[^>]*>/g, '');
  //return S.replace(/(<\?[a-z]*(\s[^>]*)?\?(>|$)|<!\[[a-z]*\[|\]\]>|<!DOCTYPE[^>]*?(>|$)|<!--[\s\S]*?(-->|$)|<[a-z?!\/]([a-z0-9_:.])*(\s[^>]*)?(>|$))/gi, '');
}

function startsWith ( str,substr )  {
  return (str.lastIndexOf(substr,0) === 0);  // for old JS engines (jsrview)
}

function endsWith ( str,suffix )  {
  return (str.indexOf(suffix, str.length-suffix.length) !== -1);  // for old JS engines (jsrview)
};


function getBasename ( path )  {
  return path.split(/[\\/]/).pop();
}

function getDateString()  {
  var d = new Date();
  var date_str = d.getDate().toString();
  if (date_str.length<2)  date_str = '0' + date_str;
  date_str = (d.getMonth()+1) + '-' + date_str;
  if (date_str.length<5)  date_str = '0' + date_str;
  return d.getFullYear() + '-' + date_str;
}

// ===========================================================================

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.mapExcludeKey  = mapExcludeKey;
  module.exports.mapMaskIn      = mapMaskIn;
  module.exports.mapMaskOut     = mapMaskOut;
  module.exports.padDigits      = padDigits;
  module.exports.padStringLeft  = padStringLeft;
  module.exports.padStringRight = padStringRight;
  module.exports.isInteger      = isInteger;
  module.exports.isObject       = isObject;
  module.exports.isFloat        = isFloat;
  module.exports.replaceAll     = replaceAll;
  module.exports.startsWith     = startsWith;
  module.exports.round          = round;
  module.exports.getDateString  = getDateString;
}
