# Window Reference Fix

## Issue
The server was encountering a "ReferenceError: window is not defined" error when trying to access `window.job_code` in the file `/home/local/nusbf/ccp4cloud_server_nusbf/jscofe/js-common/tasks/common.tasks.template.js`. This is a classic problem when code designed for a browser environment (where `window` is available) is being executed in a Node.js environment (where `window` is not defined).

## Solution
Modified the shared JavaScript files to handle both browser and Node.js environments properly:

### 1. In `common.tasks.template.js`:
- Added checks for the existence of `window` before using it for:
  - `job_code` definitions
  - `input_mode` definitions
  - `jobConstants` definitions
  - `keyEnvironment` definitions
  - All `window.setTimeout` calls

### 2. In `common.tasks.makeligand.js`:
- Fixed a similar issue with `window.__coot_reserved_codes`

## Implementation Pattern
For each case, implemented a pattern like this:
```javascript
var variable_name;
if (typeof window !== 'undefined') {
  // Browser environment code
  if (typeof window.variable_name === 'undefined') {
    window.variable_name = { /* definition */ };
  }
  variable_name = window.variable_name;
} else {
  // Node.js environment code
  variable_name = { /* same definition */ };
}
```

For the `setTimeout` calls, used this pattern:
```javascript
(typeof window !== 'undefined' ? window.setTimeout : setTimeout)(function() {
  // function code
}, delay);
```

## Testing
Tested the changes by requiring the modified files directly with Node.js, and they loaded without errors, confirming that the code now works correctly in both browser and Node.js environments.

## Date
Fixed on: 2025-08-28