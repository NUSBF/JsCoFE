
/*
 *  ==========================================================================
 *
 *    03.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.analytics.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Analytics
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

//  load system modules
const path  = require('path');

//  load application modules
const conf  = require('./server.configuration');
const utils = require('./server.utils');

//  prepare log
const log = require('./server.log').newLog(25);

// ===========================================================================

const feAnalyticsFile = 'fe_analytics.meta';
var   feAnalytics     = null;
var   lastSaved       = 0;
const twindow_current = 60000;    // 1 minute
const twindow_recent  = 1800000;  // 30 minutes

// ===========================================================================

const countries = {
  'com': 'Generic COM',
  'org': 'Generic ORG',
  'net': 'Generic NET',
  'edu': 'United States EDU',
  'gov': 'United States GOV',
  'ac' : 'Ascension Island',
  'ad' : 'Andorra',
  'ae' : 'United Arab Emirates',
  'af' : 'Afghanistan',
  'ag' : 'Antigua and Barbuda',
  'ai' : 'Anguilla',
  'al' : 'Albania',
  'am' : 'Armenia',
  'an' : 'Netherlands Antilles',
  'ao' : 'Angola',
  'aq' : 'Antarctic',
  'ar' : 'Argentina',
  'as' : 'American Samoa',
  'at' : 'Austria',
  'au' : 'Australia',
  'aw' : 'Aruba',
  'ax' : 'Åland Islands',
  'az' : 'Azerbaijan',
  'ba' : 'Bosnia and Herzegovina',
  'bb' : 'Barbados',
  'bd' : 'Bangladesh',
  'be' : 'Belgium',
  'bf' : 'Burkina Faso',
  'bg' : 'Bulgaria',
  'bh' : 'Bahrain',
  'bi' : 'Burundi',
  'bj' : 'Benin',
  'bl' : 'Saint-Barthélemy',
  'bm' : 'Bermuda',
  'bn' : 'Brunei',
  'bo' : 'Bolivia',
  'br' : 'Brazil',
  'bq' : 'Bonaire, Saba, Sint Eustatius',
  'bs' : 'Bahamas',
  'bt' : 'Bhutan',
  'bv' : 'Bouvet Island',
  'bw' : 'Botswana',
  'by' : 'Belarus',
  'bz' : 'Belize',
  'ca' : 'Canada',
  'cc' : 'Cocos Islands',
  'cd' : 'Democratic Republic of the Congo',
  'cf' : 'Central African Republic',
  'cg' : 'Republic of the Congo',
  'ch' : 'Switzerland',
  'ci' : 'Côte d’Ivoire',
  'ck' : 'Cook Islands',
  'cl' : 'Chile',
  'cm' : 'Cameroon',
  'cn' : 'China',
  'co' : 'Colombia',
  'cr' : 'Costa Rica',
  'cs' : 'Czechoslovakia',
  'cu' : 'Cuba',
  'cv' : 'Cape Verde',
  'cw' : 'Curaçao',
  'cx' : 'Christmas Island',
  'cy' : 'Cyprus',
  'cz' : 'Czech Republic',
  'dd' : 'German Democratic Republic',
  'de' : 'Germany',
  'dj' : 'Djibuti',
  'dk' : 'Denmark',
  'dm' : 'Dominica',
  'do' : 'Dominican Republic',
  'dz' : 'Algeria',
  'ec' : 'Ecuador',
  'ee' : 'Estonia',
  'eg' : 'Egypt',
  'eh' : 'Western Sahara',
  'er' : 'Eritrea',
  'es' : 'Spain',
  'et' : 'Ethiopia',
  'eu' : 'European Union',
  'fi' : 'Finland',
  'fj' : 'Fiji',
  'fk' : 'Falkland Islands',
  'fm' : 'Micronesia',
  'fo' : 'Faroe',
  'fr' : 'France',
  'ga' : 'Gabon',
  'gb' : 'United Kingdom',
  'gd' : 'Grenada',
  'ge' : 'Georgia',
  'gf' : 'French Guiana',
  'gg' : 'Guernsey',
  'gh' : 'Ghana',
  'gi' : 'Gibraltar',
  'gl' : 'Greenland',
  'gm' : 'Gambia',
  'gn' : 'Guinea',
  'gp' : 'Guadeloupe',
  'gq' : 'Equatorial Guinea',
  'gr' : 'Greece',
  'gs' : 'South Georgia and the South Sandwich Islands',
  'gt' : 'Guatemala',
  'gu' : 'Guam',
  'gw' : 'Guinea-Bissau',
  'gy' : 'Guyana',
  'hk' : 'Hong Kong',
  'hm' : 'Heard Island and McDonald Islands',
  'hn' : 'Honduras',
  'hr' : 'Croatia',
  'ht' : 'Haiti',
  'hu' : 'Hungary',
  'id' : 'Indonesia',
  'ie' : 'Ireland',
  'il' : 'Israel',
  'im' : 'Isle of Man',
  'in' : 'India',
  'io' : 'British Indian Ocean Territory',
  'iq' : 'Iraq',
  'ir' : 'Iran',
  'is' : 'Iceland',
  'it' : 'Italy',
  'je' : 'Jersey',
  'jm' : 'Jamaica',
  'jo' : 'Jordan',
  'jp' : 'Japan',
  'ke' : 'Kenya',
  'kg' : 'Kyrgyzstan',
  'kh' : 'Cambodia',
  'ki' : 'Kiribati',
  'km' : 'Comoros',
  'kn' : 'St. Kitts and Nevis',
  'kp' : 'North Korea',
  'kr' : 'South Korea',
  'kw' : 'Kuwait',
  'ky' : 'Cayman Islands',
  'kz' : 'Kazakhstan',
  'la' : 'Laos',
  'lb' : 'Lebanon',
  'lc' : 'St. Lucia',
  'li' : 'Liechtenstein',
  'lk' : 'Sri Lanka',
  'lr' : 'Liberia',
  'ls' : 'Lesotho',
  'lt' : 'Lithuania',
  'lu' : 'Luxembourg',
  'lv' : 'Latvia',
  'ly' : 'Libya',
  'ma' : 'Marocco',
  'mc' : 'Monaco',
  'md' : 'Moldova',
  'me' : 'Montenegro',
  'mf' : 'Saint Martin',
  'mg' : 'Madagascar',
  'mh' : 'Marshall Islands',
  'mk' : 'Macedonia',
  'ml' : 'Mali',
  'mm' : 'Myanmar',
  'mn' : 'Mongolia',
  'mo' : 'Macau',
  'mp' : 'Northern Mariana Islands',
  'mq' : 'Martinique',
  'mr' : 'Mauritania',
  'ms' : 'Montserrat',
  'mt' : 'Malta',
  'mu' : 'Mauritius',
  'mv' : 'Maldives',
  'mw' : 'Malawi',
  'mx' : 'Mexico',
  'my' : 'Malaysia',
  'mz' : 'Mozambique',
  'na' : 'Namibia',
  'nc' : 'New Caledonia',
  'ne' : 'Niger',
  'nf' : 'Norfolk Island',
  'ng' : 'Nigeria',
  'ni' : 'Nicaragua',
  'nl' : 'Netherlands',
  'no' : 'Norway',
  'np' : 'Nepal',
  'nr' : 'Nauru',
  'nu' : 'Niue',
  'nz' : 'New Zealand',
  'om' : 'Oman',
  'pa' : 'Panama',
  'pe' : 'Peru',
  'pf' : 'French Polynesia',
  'pg' : 'Papua New Guinea',
  'ph' : 'Philippines',
  'pk' : 'Pakistan',
  'pl' : 'Poland',
  'pm' : 'Saint Pierre and Miquelon',
  'pn' : 'Pitcairn Islands',
  'pr' : 'Puerto Rico',
  'ps' : 'Palestine',
  'pt' : 'Portugal',
  'pw' : 'Palau',
  'py' : 'Paraguay',
  'qa' : 'Qatar',
  're' : 'Réunion',
  'ro' : 'Romania',
  'rs' : 'Serbia',
  'ru' : 'Russia',
  'rw' : 'Rwanda',
  'sa' : 'Saudi Arabia',
  'sb' : 'Solomon Islands',
  'sc' : 'Seychelles',
  'sd' : 'Sudan',
  'se' : 'Sweden',
  'sg' : 'Singapore',
  'sh' : 'St. Helena',
  'si' : 'Slovenia',
  'sj' : 'Svalbard and Jan Mayen',
  'sk' : 'Slovakia',
  'sl' : 'Sierra Leone',
  'sm' : 'San Marino',
  'sn' : 'Senegal',
  'so' : 'Somalia',
  'sr' : 'Suriname',
  'ss' : 'South Sudan',
  'st' : 'São Tomé and Príncipe',
  'su' : 'Soviet Union',
  'sv' : 'El Salvador',
  'sx' : 'Sint Maarten',
  'sy' : 'Syria',
  'sz' : 'Swaziland',
  'tc' : 'Turks and Caicos Islands',
  'td' : 'Chad',
  'tf' : 'French Southern and Antarctic Lands',
  'tg' : 'Togo',
  'th' : 'Thailand',
  'tj' : 'Tajikistan',
  'tk' : 'Tokelau',
  'tl' : 'Timor-Leste',
  'tm' : 'Turkmenistan',
  'tn' : 'Tunisia',
  'to' : 'Tonga',
  'tp' : 'Timor-Leste',
  'tr' : 'Turkey',
  'tt' : 'Trinidad and Tobago',
  'tv' : 'Tuvalu',
  'tw' : 'Taiwan',
  'tz' : 'Tanzania',
  'ua' : 'Ukraine',
  'ug' : 'Uganda',
  'uk' : 'United Kingdom',
  'um' : 'United States Minor Outlying Islands',
  'us' : 'United States',
  'uy' : 'Uruguay',
  'uz' : 'Uzbekistan',
  'va' : 'Vatican City',
  'vc' : 'St. Vincent and the Grenadines',
  've' : 'Venezuela',
  'vg' : 'Britische Virgin Islands',
  'vi' : 'United States Virgin Islands',
  'vn' : 'Vietnam',
  'vu' : 'Vanuatu',
  'wf' : 'Wallis and Futuna',
  'ws' : 'Samoa',
  'ye' : 'Yemen',
  'yt' : 'Mayotte',
  'yu' : 'Yugoslavia',
  'za' : 'South Africa',
  'zm' : 'Zambia',
  'zr' : 'Zaire',
  'zw' : 'Zimbabwe'
};

function getCountry ( code )  {
  if (!(code in countries))
    return 'Country not identified';
  return countries[code];
}

// ===========================================================================


function FEAnalytics()  {
  this.activity    = {};
  this.doclog      = {};
  this.performance = {};
}

FEAnalytics.prototype.userLogin = function ( userData )  {
  if (!(userData.login in this.activity))
    this.activity[userData.login] = {};
  let dlist = userData.email.toLowerCase().split('@')[1].split('.');
  let n = Math.min(2,dlist.length);
  if ((dlist.length>2) && (dlist[dlist.length-2]=='ac'))
    n = 3;
  this.activity[userData.login].domain    = dlist.slice(dlist.length-n).join('.');
  this.activity[userData.login].lastLogin = Date.now();
  this.activity[userData.login].lastSeen  = this.activity[userData.login].lastLogin;
}

FEAnalytics.prototype.lastSeen = function ( ulogin )  {
  if (ulogin in this.activity)
    return this.activity[ulogin].lastSeen;
}

FEAnalytics.prototype.logPresence = function ( ulogin,t )  {
  if (ulogin in this.activity)
    this.activity[ulogin].lastSeen = t;
}

FEAnalytics.prototype.logDocument = function ( fpath )  {
let fname = path.parse(fpath).base;
  // if (!(fname in this.doclog))  this.doclog[fname] = 1;
  //                         else  this.doclog[fname]++;
  if (!(fpath in this.doclog))  {  //code to repair existing stats
    if (fname in this.doclog)  {
      this.doclog[fpath] = this.doclog[fname] + 1;
      delete this.doclog[fname];
    } else if (utils.fileExists(fpath))
      this.doclog[fpath] = 1;
  } else
    this.doclog[fpath]++;
}

FEAnalytics.prototype.logPerformance = function ( title,time,weight )  {
  if (title in this.performance)  {
    this.performance[title].time   += time;
    this.performance[title].weight += weight;
  } else  {
    this.performance[title] = {
      time   : time,
      weight : weight
    };
  }
}

function add_to_uhash ( country,domain,uhash )  {
  if (!(country in uhash))  {
    uhash[country] = { 'domains' : {} };
    uhash[country].ucount = 0;
  }
  uhash[country].ucount++;
  if (!(domain in uhash[country].domains))
    uhash[country].domains[domain] = 0;
  uhash[country].domains[domain]++;
}

function uhash_to_geography ( uhash )  {
let geography = [];
let country   = 1;
  while (country) {
    country = null;
    let cnt = 0;
    for (let c in uhash)
      if (uhash[c].ucount>cnt)  {
        country = c;
        cnt     = uhash[c].ucount;
      }
    if (country)  {
      let item = {};
      item.country = getCountry ( country );
      item.ucount  = uhash[country].ucount;
      item.domains = [];
      for (let d in uhash[country].domains)
        item.domains.push({
          'domain' : d,
          'count'  : uhash[country].domains[d]
        });
      for (let i=0;i<item.domains.length-1;i++)
        for (let j=i+1;j<item.domains.length;j++)
          if (item.domains[j].count>item.domains[i].count)  {
            let di = item.domains[i];
            item.domains[i] = item.domains[j];
            item.domains[j] = di;
          }
      geography.push ( item );
      uhash[country].ucount = -1;
    }
  }
  return geography;
}


FEAnalytics.prototype.getReport = function()  {
let users_current  = [];
let users_per_week = [];  // cumulative unique users per week
let doc_stats      = [];  // web page hits
let uhash_recent   = {};
let uhash_year     = {};
let t0             = Date.now();
let t_current      = t0 - twindow_current;
let t_recent       = t0 - twindow_recent;
let tweek          = 3600000*24*7;    // milliseconds in a week
let t_year         = t0 - 3600000*24*365;  // milliseconds in an year
let tw0            = Math.ceil(t0/tweek)*tweek;

  for (let login in this.activity)  {
    if (this.activity[login].lastSeen>=t_year)  {
      let domain  = this.activity[login].domain;
      let country = domain.split('.').pop();
      add_to_uhash ( country,domain,uhash_year );
      if (this.activity[login].lastSeen>=t_recent)
        add_to_uhash ( country,domain,uhash_recent );
      if (this.activity[login].lastSeen>=t_current)
        users_current.push({
          login   : login,
          domain  : this.activity[login].domain,
          country : getCountry(country)
        });
    }
    let nweek = Math.floor ( (tw0-this.activity[login].lastSeen)/tweek );
    while (users_per_week.length<=nweek)
      users_per_week.push ( 0 );
    users_per_week[nweek]++;
  }

  // for (let i=1;i<users_per_week.length;i++)
  //   users_per_week[i] += users_per_week[i-1];

  let total = 0;
  for (let doc in this.doclog)  {
    doc_stats.push ({
      'name'  : doc,
      'count' : this.doclog[doc]
    });
    total += this.doclog[doc];
  }

  for (let i=0;i<doc_stats.length;i++)  {
    for (let j=i+1;j<doc_stats.length;j++)
      if (doc_stats[j].count>doc_stats[i].count)  {
        let dsi = doc_stats[i];
        doc_stats[i] = doc_stats[j];
        doc_stats[j] = dsi;
      }
    doc_stats[i].percent = 100.0*doc_stats[i].count/total;
  }

  return {
    users_current    : users_current,
    geography_recent : uhash_to_geography(uhash_recent),
    geography_year   : uhash_to_geography(uhash_year),
    users_per_week   : users_per_week,
    doc_stats        : doc_stats
  };

}


// ===========================================================================

function getAnalyticsFPath()  {
  return path.join ( conf.getFEConfig().storage,feAnalyticsFile );
}

function readFEAnalytics()  {
  if (!feAnalytics)  {
    let fpath = getAnalyticsFPath();
    let obj   = utils.readObject ( fpath );
    if (obj)  {
      feAnalytics = new FEAnalytics();
      for (let key in obj)
        if (key!='performance')
          feAnalytics[key] = obj[key];
      lastSaved = Date.now();
    } else
      writeFEAnalytics();
  }
}

function writeFEAnalytics()  {
let fpath = getAnalyticsFPath();
  if (!feAnalytics)
    feAnalytics = new FEAnalytics();
  utils.writeObject ( fpath,feAnalytics );
  lastSaved = Date.now();
}

function getFEAnalytics()  {
  return feAnalytics;
}

function logPresence ( ulogin )  {
  let t = Date.now();
  feAnalytics.logPresence ( ulogin,t );
  if (t-lastSaved>3600000)  // 1 hour
    writeFEAnalytics();
}

function logPerformance ( title,time,weight )  {
  feAnalytics.logPerformance ( title,time,weight );
}

// ==========================================================================
// export for use in node

module.exports.readFEAnalytics  = readFEAnalytics;
module.exports.writeFEAnalytics = writeFEAnalytics;
module.exports.getFEAnalytics   = getFEAnalytics;
module.exports.logPresence      = logPresence;
module.exports.logPerformance   = logPerformance;
