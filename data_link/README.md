## Overview

Data Link is a web service with a REST API, that can retrieve raw x-ray diffraction images for temporary storage and processing in CCP4 Cloud.

It can currently retrieve data from the following public archives

- https://xrda.pdbj.org/ - The Xtal Raw Data Archive from the Protein Data Bank Japan.
- https://data.sbgrid.org/ - SBGrid Data Bank from the SBGrid consortium.
- https://proteindifftraction.org/ - Integrated Resource for Reproducibility in Macromolecular Crystallography from the National Institute of Health.

In the future it is planned to add support for linking to data storage and data producing facilities, such as ICAT @ STFC/SCD, synchrotrons and in-house X-ray instruments (e.g. Bruker diffractometers).

Currently the API can only pull data from external sources. The ability to push data to the API will be added later which should help with linking to data producing facilities. 

A commandline tool will also be added to communicate with the API.

## Installation and Usage

The web service is written in JS and runs on node [https://nodejs.org/](https://nodejs.org/). It is developed as part of CCP4 Cloud and resides in the `data_link` folder on the jsCoFE repository [https://gitlab.com/CCP4/jsCoFE](https://gitlab.com/CCP4/jsCoFE).

Data Link requires some additional node modules that can be installed with `npm`. Data Link currently uses express, cheerio, https, and pino npm modules. The dependencies are included as part of CCP4 Cloud (jsCoFE) and can be installed by running `npm install` from within the `jsCoFE` or `data_link` directory.

The default configuration `config-dist.json` should be copied to `config.json` and edited accordingly. 

The Data Link service is started by running `./dl_server.js` or `node dl_server.js`.

### Data storage and structure

Data needs to be stored in a dedicated file system, that can be accessed by both the CCP4 Cloud Frontend and Number Crunchers. It also needs be available for any computing resource that is utilised by the Number Crunchers.

CCP4 Cloud communicates with the Data Link service via a REST based API. The API returns JSON formatted data.

The Data Link service requires access to the CCP4 Cloud Front End user directory. It uses this to authenticate when acquiring data or managing existing data for users. The Data Link service checks if a user exists, and makes sure a valid Cloud Run ID is provided in the API request.

The data is stored in the following structure:

```txt
data/
  username/
    data_source/
      data_id/
```

Data is stored by `user`, then data `source`, and the `id` of the data.  . eg. `jools.wills/pdbj/8cqm`. A `catalog.json` file is stored in each users data directory, to keep track of the data present. The catalog files are loaded by the Data Link service on start-up.

When a request is sent to the API for data retrieval, it first checks if available disk space is above a configured threshold. If it is not, older data sets are removed as needed to make space. The oldest data will be removed first, but no data will be removed if it has been marked as in use.

Data source catalogs are stored in the configured `catalog_dir` (`catalogs` by default).

## Configuration

The Data Link service requires a configuration file config.js to be present in the current directory the service is launched from. An example configuration file `config-dist.json` is provided that can be copied to `config.json`.

Configuration Values:
 * `server`: **Server related configuration**
   * `host`: The hostname of the interface the service will bind to. Default is `localhost`
   * `port`: The port the web service will listen on. Default is 8900
   * `admin_key`: The default `admin_key` used to authenticate requests that require it.
 * `Storage`: **Storage related configuration**
  * `data_dir`: Location to store x-ray difraction images. Default is `data`.
  * `user_dir`: Location of the CCP4 Cloud user configuration directory. This is used to authenticate with user's `cloudrun_id`.
  * `catalog_dir`: Location to store data source catalogs. Default is `catalogs`.
  * `data_free_gb`: Amount of space to keep free on the `data` storage in gigabytes.
* `data_sources`: **Configuration section containing configs for each data source**
  * `pdbj`: Data source name
    * `enabled`: set to false to disable (defaults to true)
    * `rsync_size`: For data sources that have an rsync service, this can be used to extract the data sizes from the rsync repository for use in the data source catalog.
* `other`: **Other configuration options**
  * `rcsb_results`: Whether to return PDB information from rcsb from the search API endpoint. Defaults to true.

### Example configuration file

```json
{
  // server & port configuration
  "server": {
    "host": "localhost",
    "port": 8900,
    "admin_key": ""
  },
  // locations for storage
  "storage": {
    "data_dir": "data",
    "user_dir": "users",
    "catalog_dir": "catalogs",
    // amount of disk space to try keep free - older data not in use will be pruned
    "data_free_gb": 100
  },
  // data source configuration
  "data_sources": {
    "pdbj": {
      "enabled": true,
      // get the data size via rsync
      "rsync_size": true
    },
    "sbgrid": {
      "enabled": true,
      "rsync_size": true
    },
    "irrmc": {
      "enabled": true
    }
  },
  // other configuration settings
  "other": {
    // return pdb entry results from rcsb
    "rcsb_results": true
  }
}
```

## Acquiring Data



## API Authentication

Authentication for the API is handled via HTTP headers. Some API endpoints require the admin_key (configured in config.json), to be passed in the HTTP header. Requests that handle data for a user, require the cloudrun_id to be provided. All API called can be done with the admin_key set.

Example headers:

```
admin_key: PASSWORD
cloudrun_id: XXXX-XXXX-XXXX-XXXX
```

## HTTP response status codes

The API returns the following HTTP response status codes:

* `200 OK` - Indicates that the request has succeeded
* `400 Bad Request` - The request could not be understood by the server due to incorrect syntax. The client SHOULD NOT repeat the request without modifications.
* `404 Not Found` - The server can not find the requested resource.
* `405 Method Not Allowed` - The request HTTP method is known by the server but has been disabled and cannot be used for that resource.
* `500 Internal Server Error` - The server encountered an unexpected condition that prevented it from fulfilling the request.

## API End Points

### GET /api/source or GET /api/sources/*

*Does not require authentication*

Get details of all data sources. The following fields are returned.

- `description`: Details about the data source
- `url`: URL of the data source
- `catalog_size`: Number of data sets available
- `status`: `in_progress` if the catalog is currently updating, or `completed`.

Example JSON output:

```json
{
  irrmc: {
    catalog_size: 6206
    description: "Integrated Resource for Reproducibility in Macromolecular Crystallography"
    status: "completed"
    url: "https://proteindiffraction.org"
  }
  pdbj: {
    catalog_size: 100
    description: "PDBj (Protein Data Bank Japan): The Xtal Raw Data Archive (XRDA)"
    status: "completed"
    url: "https://xrda.pdbjbk1.pdbj.org/"
  }
  sbgrid: {
    catalog_size: 813
    description: "The SBGrid Data Bank"
    status: "completed"
    url: "https://data.sbgrid.org"
  }
}


```

### GET /api/sources/{id}

*Does not require authentication*

Get details of a single data source by data source id.

eg. `GET /api/sources/pdbj`

```json
{
  catalog_size: 100
  description: "PDBj (Protein Data Bank Japan): The Xtal Raw Data Archive (XRDA)"
  status: "completed"
  url: "https://xrda.pdbjbk1.pdbj.org/"
}
```

### GET "/api/sources/{id}/catalog"

*Does not require authentication*

Get a catalog of available data from data source `id` 

Currently supported data sources are `irrmc`, `pdbj` and `sbgrid`.

A data source entry is grouped by a unique identifier of the data set. The `id` may be a PDB Identifier, but it depends on the data source and how they organise their diffraction images.

The following fields are used by the data source catalog:

 * `auth`: Author of the diffraction images (not always present)
 * `date`: Date of the images in  ISO 8601 format (not always present)
 * `desc`: Description of the diffraction data.
 * `doi`: Unique Digital Object Identifier (DOI) https://www.doi.org/ (not always present)
 * `path`: Path of the data used by the data source when acquiring images.
 * `pdb`:PDB identifier for the data.
 * `size`: Size of the data in bytes.

#### pdbj example:

```json
  "5yu7": {
    "auth": "Yamazawa, R., Jiko, C., Lee, S.J., Yamashita, E.",
    "date": "2021-07-09T07:13:49.000Z",
    "desc": "CRYSTAL STRUCTURE OF EXPORTIN-5",
    "doi": "10.1016/j.str.2018.06.014",
    "path": "5yu7",
    "pdb": "5yu7",
    "size": 6208332959
  },
  "6isv": {
    "auth": "Koesoema, A.A., Sugiyama, Y., Senda, M., Senda, T., Matsuda, T.",
    "date": "2021-03-23T03:53:35.000Z",
    "desc": "Structure of acetophenone reductase from Geotrichum candidum NBRC 4597 in complex with NAD",
    "doi": "10.1007/s00253-019-10093-w",
    "path": "6isv",
    "pdb": "6isv",
    "size": 1459683150
  },
...
```

### GET "/api/sources/*/catalog"

*Requires admin_key for authentication*

Get a catalog of all available data from all data sources. This returns a catalog as above, with each catalog returned under a key with the data source name.

```json
{
  "irrmc": {
    "011884_4weq": {
      "desc": "X-ray diffraction data for the Crystal structure of NADP-dependent dehydrogenase from Sinorhizobium meliloti in complex with NADP and sulfate",
      "doi": "10.18430/M3D011",
      "path": "nysgrc/011884_4weq.tar.bz2",
      "pdb": "4weq"
    }, ...
  "sbgrid": {
    "1": {
      "date": 1428695734000,
      "desc": "X-Ray Diffraction data from Lin28A/let-7g microRNA complex, source of 3TS2 structure",
      "doi": "10.15785/SBGRID/1",
      "path": "1",
      "pdb": "3ts2",
      "size": 1698795779
    }, ...
```

### PUT /api/sources/{id}/update

*Requires admin_key for authentication*

Updates the catalog for the data source with the corresponding data source id `id`.This can take some time depending on the data source. The existing catalog is still available while the data source is being updated. It's possible to check the status of a catalog by calling the `/api/sources/{id}` API end point.

The API will return a success message if triggering the catalog update has been successful - eg for `PUT /sources/pdbj/update`

```json
{
  msg: "pdbj - Updating catalog"
  success: true
}
```

If the catalog was already updating the API will return:

```json
{
  msg: "pdbj - Catalog download already in progress"
  success: true
}
```

### PUT /api/sources/*/update

*Requires admin_key for authentication*

Updates catalogs for all data sources. If a data source is already in the process of updating it will be skipped. As with the individual source catalog update endpoint, the existing source catalogs will be available while updating. The status of all data source catalogs can be checked by calling the `/sources`API endpoint.

Here's an example response for the call

```json
{
  msg: "Updating catalog(s): pdbj, sbgrid, irrmc"
  success: true
}
```

### GET /api/search/{pdb_id}

*Does not require authentication*

Searches all data source catalogs for entries with a PDB identifier matching `pdb_id`. It also searches against the RCSB API (https://rcsb.org) to get PDB information.

The returned JSON has two keys, one with the PDB information from RCSB , and a results key with an array of matches from data sources.

eg. for `GET /api/search/7p5l`

```json
{
  pdb: {
    ... rcsb PDB API results (https://data.rcsb.org/rest/v1/core/entry/{PDBID})
  }
    results: [
    {
      desc: "X-Ray Diffraction data from Mycobacterial glucosyl-3-phosphoglycerate synthase, source of 7P5L structure"
      doi: "10.15785/SBGRID/995"
      id: "995"
      source: "sbgrid"
    }
  ]
}
```

## PUT /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Acquires data for a user from a data source. It returns a message reporting the status of the request. To get the status and progress of the data retrieval a GET request can be made against the same API Endpoint.

eg. for `PUT /api/data/jools.wills/pdbj/5aui`

`HTTP/1.1 200 OK`

```json
{
  msg: "pdbj: Acquiring jools.wills/pdbj/5aui"
  success: true
}
```

If this is called again while the data acquire is in progress, it will report

`HTTP/1.1 200 OK`

```json
{
  msg: "pdbj - Data acquire for jools.wills/pdbj/5aui already in progress"
  success: true
}
```

If the data already exists for the user, the API will return

`HTTP/1.1 200 OK`

```json
{
  msg: "pdbj: jools.wills/pdbj/5aui already exists"
  success: true
}
```

## DELETE /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Removes data for a user. Data that has `in_use` set to *true*, cannot be deleted - `in_use` must first be set to *false*.

eg. `DELETE /api/data/jools.wills/pdbj/5aui`

On success the API will return

`HTTP/1.1 200 OK`

```json
{
  msg: "pdbj: Removed 5aui for jools.wills"
  success: true
}
```

If there is a problem removing the data, the API will return. 

`HTTP/1.1 405 Method Not Allowed`

```json
{
  error: true
  msg: "pdbj: Unable to remove 5aui for jools.wills"
}
```

## PATCH /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Updates fields in the data entry for a user.

The fields to update should be passed in the request body as json. eg. `{ "in_use": false }`

Currently only supports changing `in_use` to *true* or *false*.

If successful the API will return a JSON formatted message such as:

```json
{
  msg: "Updated fields in_use"
  success: true
}
```

If the request is not valid the API will return a HTTP response error 400. eg

`HTTP/1.1 400 Bad Request`

```json
{
  error: true
  msg: "some_field is not a valid field"
}
```

or

```json
{
  error: true
  msg: "in_use should be set to true or false"
}
```

## GET /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Retrieves the details of data acquired for a user. The following fields are returned:

* `in_use`: Whether the data is in_use by a user. By default `in_use` is set to *false*, and can be changed via a PATCH API call to the same API endpoint. A data entry with `in_use` set to *true* cannot be deleted.
* `updated`: The date and time the data entry was last changed. This is in ISO 8601 format.
* `size`: The size of the data on disk. This is updated periodically during data retrieval.
* `size_s`: The size of the original source data. This may be different from the `size` even for completed data, if the source data is compressed/archived.
* `status`: The status of the data being acquired. It can be one of three values:
  * `in_progress`: The data is currently being acquired.
  * `completed`: The data acquire has been completed.
  * `failed`: The data acquire failed (eg - if there were problems retrieving the data from the data source).

eg. `GET /api/data/jools.wills/pdbj/5aui`

`HTTP/1.1 200 OK`

```json
{
  in_use: true
  updated: "2023-12-14T13:49:52.507Z"
  size: 450796173
  size_s: 450796173
  status: "completed"
}
```

If the data entry is not found an HTTP response code of 404 is returned.

eg. `GET /api/data/jools.wills/pdbj/1234`

`HTTP/1.1 404 Not Found`

```json
{
  error: true
  msg: "User data jools.wills/pdbj/1234 not found"
}
```

## GET /api/data/{user}/{source}

*Requires user's cloudrun_id or admin_key for authentication*

This returns details of all data for a user for a particular data `source`. The structure is the same as for a specific data record, but returns multiple entries with the data source `id` as the key.

eg. `GET /api/data/jools.wills/pdbj`

```json
{
  5aui: {
    in_use: true
    updated: "2023-12-14T13:49:52.507Z"
    size: 450796173
    size_s: 450796173
    status: "completed"
  }
  93: {
    in_use: false
    updated: "2023-12-14T10:23:17.771Z"
    size: 675426804
    size_s: 675426804
    status: "completed"
  }
}
```

## GET /api/data/{user}

*Requires user's cloudrun_id or admin_key for authentication*

This returns details of all data for a user. The structure is the same as for a specific data record, but returns records in a tree structure, organised by the data `source`, then the `id`.

eg. `GET /api/data/jools.wills`

`HTTP/1.1 200 OK`

```json
{
  pdbj: {
    5aui: {
      in_use: true
      updated: "2023-12-14T13:49:52.507Z"
      size: 450796173
      size_s: 450796173
      status: "completed"
    }
    93: {
      in_use: false
      updated: "2023-12-14T10:23:17.771Z"
      size: 675426804
      size_s: 675426804
      status: "completed"
    }
  }
  sbgrid: {
    2: {
      in_use: false
      updated: "2023-12-14T14:23:36.951Z"
      size: 0
      size_s: 1925243880
      status: "in_progress"
    }
  }
}
```

## GET /api/data

*Requires admin_key for authentication*

Obtains a list and status of all local data. This returns data entries organised by `user`, data `source` and `id`.

eg. `GET /api/data`

`HTTP/1.1 200 OK`

```json
{
  jools.wills: {
    pdbj: {
      5aui: {
        in_use: true
        updated: "2023-12-14T13:49:52.507Z"
        size: 450796173
        size_s: 450796173
        status: "completed"
      }
    }
    sbgrid: {
      2: {
        in_use: false
        updated: "2023-12-14T14:27:01.424Z"
        size: 1925243880
        size_s: 1925243880
        status: "completed"
      }
    }
  }
  test: {
    pdbj: {
      99: {
        in_use: false
        updated: "2023-12-14T09:29:05.023Z"
        size: 6442580763
        size_s: 6442580763
        status: "completed"
      }
    }
  }
}
```

