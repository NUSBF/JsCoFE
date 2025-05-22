## Overview

DataLink is a web service with a RESTful API, that manages raw x-ray diffraction images for temporary storage and processing in CCP4 Cloud.

It can currently retrieve data from the following public archives:

- https://xrda.pdbj.org/ - The Xtal Raw Data Archive from the Protein Data Bank Japan (pdbj)
- https://data.sbgrid.org/ - SBGrid Data Bank from the SBGrid consortium (sbgrid)
- https://proteindiffraction.org/ - Integrated Resource for Reproducibility in Macromolecular Crystallography from the National Institute of Health (irrmc)

As well as fetching data public data repositories, the API allows CCP4 Cloud users to upload data to it, using their cloud-run ID.

In the future this will allow linking to data storage and data producing facilities, such as Diamond Light Source and in-house X-ray instruments (e.g. Bruker diffractometers).

There is commandline tool included (dl_client.js) to communicate with the API.

## Installation and Usage

The web service is written in JS and runs on node [https://nodejs.org/](https://nodejs.org/). It is developed as part of CCP4 Cloud and resides in the `js-datalink` folder on the jsCoFE repository [https://gitlab.com/CCP4/jsCoFE](https://gitlab.com/CCP4/jsCoFE).

DataLink requires some additional node modules that can be installed with `npm`. DataLink currently uses express, cheerio, https, and pino npm modules. The dependencies are included as part of CCP4 Cloud (jsCoFE) and can be installed by running `npm install` from within the `jsCoFE` or `js-datalink` directory.

The default configuration `config-dist.json` should be copied to `config.json` and edited accordingly. 

The DataLink service is started by running `./dl_server.js` or `node dl_server.js`.

### Data structure and storage

For integration with CCP4 Cloud data needs to be stored in a file system that can be accessed by both the CCP4 Cloud Frontend and Number Crunchers. It also needs be available for any computing resource that is utilised by the Number Crunchers.

CCP4 Cloud communicates with the DataLink service via the API. The API returns JSON formatted data.

For authentication the DataLink service requires access to the CCP4 Cloud Front End user directory. The DataLink service checks if a user exists, and makes sure a valid Cloud Run ID is provided in the API request.

Data is stored in the following structure:

```txt
data/
  user/
    source/
      id/
```

Data is stored by `user`, then data `source`, and the `id` of the data. e.g. `example_user/pdbj/8cqm`.

To keep track of the data, the system stores catalog files for each user as JSON. By default these are stored in a users subfolder under the configured `catalog_dir` but can also be kept with the data and stored in the data `user` folder as `catalog.json`. The catalog files are loaded by the DataLink service on start-up.

Data source catalogs for public data repositories are stored in the configured `catalog_dir` (`catalogs` by default).

To manage storage space, DataLink managed data can be pruned if the free space is less than a configured amount or if data is older than a configured age (in days). Data that is marked in use will not be removed if older than the configured age, but will be removed if free space is lower than the configuration allows.

DataLink also has the capability of pruning data from external data sources not managed by DataLink, so long as it's stored in subfolders under `username`. Data pruning for external data will only happen for data older than `data_max_days`. It will not be scanned for removal if free space goes below the configured threshold.

## Configuration

The DataLink service requires a configuration file config.js to be present in the current directory the service is launched from. An example configuration file `config-dist.json` is provided that can be copied to `config.json`.

Configuration Values:
 * `server`: **Server related configuration**
   * `host`: The hostname of the interface the service will bind to. Default is `localhost`
   * `port`: The port the web service will listen on. Default is 8100
   * `ssl`: Set to true to enable ssl/https. ssl_key and ssl_cert must be provided. Defaults to false.
   * `ssl_key`: Path to ssl key for https.
   * `ssl_cert`: Path to ssl certificate for https.
   * `request_timeout_secs`: Sets the timeout value in seconds for receiving requests from the client. Defaults to 1800.
   * `admin_key`: The default `admin_key` used to authenticate requests that require it.
 * `storage`: **Storage related configuration**
  * `data_dir`: Location to store x-ray difraction images. Default is `data`.
  * `user_dir`: Location of the CCP4 Cloud user configuration directory. This is used to authenticate with user's `cloudrun_id`.
  * `catalog_dir`: Location to store data source catalogs. Default is `catalogs`.
  * `catalogs_with_data`: Set to true to store the user catalogs along with the data. Default is `false`.
  * `data_free_gb`: Amount of space to keep free on the `data` storage in gigabytes. This only applies to data managed by DataLink.
  * `data_max_days`: Maximum number of days to keep data. This option is applied to data managed by DataLink as well as data from external sources that is stored in the DataLink structure under `data_dir`. Defaults is `60`.
  * `data_prune_mins`: How often the data pruning job will run in minutes. Default is `30`.

* `data_sources`: **Configuration section containing configs for each data source**
  * `pdbj`: Data source name
    * `enabled`: set to false to disable. Default is `true`.
    * `rsync_size`: For data sources that have an rsync service, this can be used to extract the data sizes from the rsync repository for use in the data source catalog.
  * `upload`: Data source for data uploaded to DataLink.
    * `enabled`: Set to false to disable. Default is `true`.
    * `limit_mb`: Limit in Megabytes for each uploaded data set. Default is `20000`.
* `other`: **Other configuration options**
  * `rcsb_results`: Whether to return PDB information from rcsb from the search API endpoint. Defaults to false.

### Example configuration file

An example configuration file is included in the repository `config-dist.json`.

## Commandline tool

A commandline tool `dl_client.js` is included for communicating with the API. The commandline tool allows calling the API functions detailed below.

The client can be run with `./dl_client.js` or `node dl_client.js`. It has no 3rd party library dependencies so should work from a vanilla node install.

```
Usage: dl_client.js [options] <action> -- [...list of files/directories]

Arguments:
  action                 sources, catalog/catalogue, search, fetch, status, update, remove, upload, stats

Options:
  --url <url>            URL of the Data Link API including port eg http://localhost:8100/api
  --cloudrun_id <id>     CCP4 Cloud cloudrun_id for <user> used to authenticate
  --admin_key <key>      Data Link admin_key used to authenticate
  --user <user>          User to manage data for
  --source <source>      Data Source to use
  --id <id>              id of entries
  --field <field>        Used for actions <search> and <update> to select field to search or update
  --value <value>        Used for action <search> and <update> for value to search for or set field to
  --progress             Output progress during upload
  -h, --help             display help for command
```

The tool will output the JSON returned by the API.

When using the `upload` action, files/directories to upload to DataLink should be provided after a `--` parameter.

eg.

```
./dl_client.js --url http://localhost:8100/api --user USERNAME --cloudrun_id xxxx-xxxx-xxxx-xxxx --source test --id test1 upload -- /PATH/TO/FILES_OR_DIRECTORY
```

Multiple paths can be provided (space separated)

## API Authentication

Authentication for the API is handled via HTTP headers. Some API endpoints require the admin_key (configured in config.json), to be passed in the HTTP header. Requests that handle data for a user, require the cloudrun_id to be provided. The admin_key allows all API calls to be made.

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
* `503 Service Unavailable` - The server is not ready to handle the request.

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
  "pdbj": {
    "description": "PDBj (Protein Data Bank Japan): The Xtal Raw Data Archive (XRDA)",
    "url": "https://xrda.pdbj.org/",
    "catalog_size": 131,
    "catalog_status": "completed"
  },
  "sbgrid": {
    "description": "The SBGrid Data Bank",
    "url": "https://data.sbgrid.org",
    "catalog_size": 824,
    "catalog_status": "completed"
  },
  "irrmc": {
    "description": "Integrated Resource for Reproducibility in Macromolecular Crystallography",
    "url": "https://proteindiffraction.org",
    "catalog_size": 6375,
    "catalog_status": "completed"
  }
}
```

### GET /api/sources/{id}

*Does not require authentication*

Get details of a single data source by data source id.

eg. `GET /api/sources/pdbj`

```json
{
  "description": "PDBj (Protein Data Bank Japan): The Xtal Raw Data Archive (XRDA)",
  "url": "https://xrda.pdbj.org/",
  "catalog_size": 131,
  "catalog_status": "completed"
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
 * `name`: Name/Description of the diffraction data.
 * `doi`: Unique Digital Object Identifier (DOI) https://www.doi.org/ (not always present)
 * `path`: Path of the data used by the data source when fetching images.
 * `pdb`:PDB identifier for the data.
 * `size`: Size of the data in bytes.

#### pdbj example:

```json
{
...
  "5yu7": {
    "path": "5yu7",
    "pdb": "5yu7",
    "doi": "10.1016/j.str.2018.06.014",
    "name": "CRYSTAL STRUCTURE OF EXPORTIN-5",
    "auth": "Yamazawa, R., Jiko, C., Lee, S.J., Yamashita, E.",
    "date": "2021-07-09T07:13:49.000Z",
    "size": 6208332959
  },
  "6l46": {
    "path": "6l46",
    "pdb": "6l46",
    "doi": "10.1073/pnas.1918125117",
    "name": "High-resolution neutron and X-ray joint refined structure of copper-containing nitrite reductase from Geobacillus thermodenitrificans",
    "auth": "Fukuda, Y., Hirano, Y., Kusaka, K., Inoue, T., Tamada, T.",
    "date": "2021-12-21T06:42:22.000Z",
    "size": 8946509720
  },
...
}
```

### GET "/api/sources/*/catalog"

*Does not require authentication*

Get a catalog of all available data from all data sources. This returns a catalog as above, with each catalog returned under a key with the data source name.

```json
{
  "irrmc": {
    "011884_4weq": {
      "name": "X-ray diffraction data for the Crystal structure of NADP-dependent dehydrogenase from Sinorhizobium meliloti in complex with NADP and sulfate",
      "doi": "10.18430/M3D011",
      "path": "nysgrc/011884_4weq.tar.bz2",
      "pdb": "4weq"
    }, ...
  "sbgrid": {
    "1": {
      "date": 1428695734000,
      "name": "X-Ray Diffraction data from Lin28A/let-7g microRNA complex, source of 3TS2 structure",
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
  "msg": "pdbj - Updating catalog"
  "success": true
}
```

If the catalog was already updating the API will return:

```json
{
  "msg": "pdbj - Catalog download already in progress"
  "success": true
}
```

### PUT /api/sources/*/update

*Requires admin_key for authentication*

Updates catalogs for all data sources. If a data source is already in the process of updating it will be skipped. As with the individual source catalog update endpoint, the existing source catalogs will be available while updating. The status of all data source catalogs can be checked by calling the `/sources`API endpoint.

Here's an example response for the call

```json
{
  "msg": "Updating catalog(s): pdbj, sbgrid, irrmc"
  "success": true
}
```

### GET /api/search/{pdb_id} *Deprecated - please use newer search query below*

*Does not require authentication*

Searches all data source catalogs for entries with a PDB identifier matching `pdb_id`. It also searches against the RCSB API (https://rcsb.org) to get PDB information.

Returns the same results as the newer search call detailed here:

### GET /api/search/?q={search}&f={field}

*Does not require authentication*

Searches all data source catalogs with `field` matching `search`. Currently supports searching the `pdb` identifier and the `doi` (Digital Object Identifier).
If left empty, the field parameter defaults to 'pdb'.
It also optionally query against the RCSB API (https://rcsb.org) to get PDB information for the search.

The returned JSON has two keys, one with the PDB information from RCSB, and a results key with an array of matches from data sources.

eg. for `GET /api/search/7p5l`

```json
{
  "pdb": {
    ... rcsb PDB API results (https://data.rcsb.org/rest/v1/core/entry/{PDBID})
  }
  "results": [
    {
      "source": "sbgrid",
      "id": "995",
      "doi": "10.15785/sbgrid/995",
      "name": "X-Ray Diffraction data from Mycobacterial glucosyl-3-phosphoglycerate synthase, source of 7P5L structure",
      "pdb": "7p5l"
    }
  ]
}
```

## PUT /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Fetches data for a user from a data source. It returns a message reporting the status of the request. To get the status and progress of the data retrieval a GET request can be made against the same API Endpoint.

The data is downloaded to the configured data folder, stored in username/source/id. Once the data has been fetched, it will be unpacked (if possible).

eg. for `PUT /api/data/example_user/pdbj/5aui`

`HTTP/1.1 200 OK`

```json
{
  "msg": "pdbj: Fetching example_user/pdbj/5aui"
  "success": true
}
```

If this is called again while the data fetch is in progress, it will report

`HTTP/1.1 200 OK`

```json
{
  "msg": "pdbj - Data fetch for example_user/pdbj/5aui already in progress"
  "success": true
}
```

If the data already exists for the user, the API will return

`HTTP/1.1 200 OK`

```json
{
  "msg": "pdbj: example_user/pdbj/5aui already exists"
  "success": true
}
```

If the `id` cannot be found in the data source catalog, the API will return

`HTTP/1.1 404 Not Found`

```
{
  "error": true
  "msg": "pdbj - 12345 not found in catalog"
}
```

If the data source requested doesn't currently have a catalog (eg. on first run), the API will return

`HTTP/1.1 503 Service Unavailable`

```json
{
  "error": true
  "msg": "sbgrid - data source catalog not ready"
}
```

## DELETE /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Removes data for a user. Data that has `in_use` set to *true*, cannot be deleted - `in_use` must first be set to *false*.

eg. `DELETE /api/data/example_user/pdbj/5aui`

On success the API will return

`HTTP/1.1 200 OK`

```json
{
  "msg": "pdbj: Removed 5aui for example_user"
  "success": true
}
```

If there is a problem removing the data, the API will return. 

`HTTP/1.1 405 Method Not Allowed`

```json
{
  "error": true
  "msg": "pdbj: Unable to remove 5aui for example_user"
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
  "msg": "Updated fields in_use"
  "success": true
}
```

If the request is not valid the API will return a HTTP response error 400. eg

`HTTP/1.1 400 Bad Request`

```json
{
  "error": true
  "msg": "some_field is not a valid field"
}
```

or

```json
{
  "error": true
  "msg": "in_use should be set to true or false"
}
```

## GET /api/data/{user}/{source}/{id}

*Requires user's cloudrun_id or admin_key for authentication*

Retrieves the details of data fetched for a user. The following fields are returned:

* `updated`: The date and time the data entry was last changed. This is in ISO 8601 format.
* `size`: The size of the data on disk. This is updated periodically during data retrieval.
* `size_s`: The size of the original source data. This may be different from the `size` even for completed data, if the source data is compressed/archived.
* `in_use`: Whether the data is in_use by a user. By default `in_use` is set to *false*, and can be changed via a PATCH API call to the same API endpoint. A data entry with `in_use` set to *true* cannot be deleted.
* `status`: The status of the data being fetched. It can be one of three values:
  * `in_progress`: The data is currently being fetched.
  * `completed`: The data fetch has been completed.
  * `failed`: The data fetch failed (eg - if there were problems retrieving the data from the data source).
* `name`: Name of the entry
* `doi`: Unique Digital Object Identifier of the data (Prefix https://www.doi.org/ to it to access).
* `user`: Username of the user (as in the request)
* `source`: Name of the data source (as in the request)
* `id`: ID of the data (as in the request)
* `dir`: Storage location of the data

eg. `GET /api/data/example_user/pdbj/5aui`

`HTTP/1.1 200 OK`

```json
{
  "updated": "2024-06-27T16:23:13.593Z",
  "size": 450796173
  "size_s": 450796173
  "in_use": false,
  "status": "completed"
  "pdb": "5aui",
  "name": "Crystal structure of Ferredoxin from Thermosynechococcus elongatus",
  "doi": "10.1021/acs.biochem.5b00601",
  "user": "example_user",
  "source": "pdbj",
  "id": "5aui",
  "dir": "example_user/pdbj/5aui"
}

```

If the data entry is not found an HTTP response code of 404 is returned.

eg. `GET /api/data/example_user/pdbj/1234`

`HTTP/1.1 404 Not Found`

```json
{
  "error": true
  "msg": "User data example_user/pdbj/1234 not found"
}
```

## GET /api/data/{user}/{source}

*Requires user's cloudrun_id or admin_key for authentication*

This returns details of all data for a user for a particular data `source`. The structure is the same as for a specific data record, but returns multiple entries with the data source `id` as the key.

eg. `GET /api/data/example_user/pdbj`

```json
{
  "93": {
    ... same fields as above
  },
  "5aui": {
    ... same fields as above
  }
}
```

## GET /api/data/{user}

*Requires user's cloudrun_id or admin_key for authentication*

This returns details of all data for a user. The structure is the same as for a specific data record, but returns records in a tree structure, organised by the data `source`, then the `id`.

eg. `GET /api/data/example_user`

`HTTP/1.1 200 OK`

```json
{
  "irrmc": {
    "3i44": {
      ... same fields as above
    }
  },
  "pdbj": {
    "93": {
      ... same fields as above
    },
    "5aui": {
      ... same fields as above
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
  "example_user": {
    "pdbj": {
      "5aui": {
        ... same fields as above
      }
    }
    "sbgrid": {
      "2": {
        ... same fields as above
      }
    }
  }
  "another_user": {
    "pdbj": {
      "99": {
        ... same fields as above
      }
    }
  }
}
```

## POST /api/data/{user}/{source}/{id}/upload

*Requires user's cloudrun_id or admin_key for authentication*

This call requires data to be sent as multipart/formdata. The `filename` in the POST data should contain the relative path for storage if sending a directory structure. Multiple Content-Disposition sections can be included.

Multiple files can also be sent as a compressed archive, which will be depacked after upload.

Note that all paths and filenames are sanitized and absolute paths will be converted to relative.

The commandline tool `dl_client.js` can be used to easily upload data via the DataLink API.

eg. `POST /api/data/example_user/test/test1/upload`

`HTTP/1.1 200 OK`

```json
{
  "success": true,
  "msg": "Added files to example_user/test/test1"
}

```

## GET /api/stats

Gets some information about the data managed by DataLink.

eg. `GET /api/stats`

`HTTP/1.1 200 OK`

```json
{
  "data_stats": {
    "users": 4,
    "entries": 10,
    "size": 82437651053,
    "size_gb": "82.44",
    "free_space": "434237149184",
    "free_space_gb": "434.24",
    "usable_space": 334237149184,
    "usable_space_gb": "334.24"
  }
}
```