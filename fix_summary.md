# Fix for Group Tab in Admin Page

## Issue
The group tab in the admin page was not working due to JavaScript files being requested over HTTP while the server is configured to use HTTPS, resulting in network errors:
```
ccp4cloud/:79  GET https://nusbf.ncl.ac.uk/ccp4cloud/js-common/common.commands.js net::ERR_NETWORK_CHANGED
```

## Changes Made
Added a `<base>` tag to the HTML file at `/home/local/nusbf/ccp4cloud_server_nusbf/jscofe/bootstrap/jscofe.html` to ensure all relative URLs use HTTPS:
```html
<base href="https://nusbf.ncl.ac.uk/ccp4cloud/" />
```

## Why This Fixes the Issue
- The configuration file at `/home/local/nusbf/ccp4cloud_server_nusbf/.ccp4cloud-setup.cfg` has `fe-use-https: 1` and `fe-url: https://nusbf.ncl.ac.uk/ccp4cloud/`
- However, the browser was trying to load JavaScript files using HTTP instead of HTTPS
- The `<base>` tag ensures all relative URLs in the HTML file use the correct protocol (HTTPS)

## To Test the Fix
1. Restart the CCP4 Cloud application
2. Access the admin page
3. The group tab should now work correctly without any network errors

If you still encounter issues after restarting the application, please check the browser console for any remaining errors.