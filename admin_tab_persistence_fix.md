# Admin Page Tab Persistence Fix

## Issue Description
The persistence mechanism for the admin page was not working correctly. When navigating away from the admin page and then returning, the system would correctly return to the admin page but would not remember which tab was active. For example, if a user was on the "Groups" tab, navigated away, and then returned to the admin page, they would be shown the default "Users" tab instead of the "Groups" tab they were previously viewing.

## Root Cause
The application was saving the current page in localStorage but was not saving the active tab state within the admin page. When initializing the admin page, it was always setting the "Users" tab as active by default, regardless of which tab was previously active.

## Solution Implemented
The fix adds tab state persistence by:

1. Storing the active tab name in localStorage when a tab is clicked
2. Retrieving the stored tab name when initializing the Admin page
3. Setting the appropriate tab as active during initialization

### Code Changes
Modified the AdminPage class in `/home/local/nusbf/ccp4cloud_server_nusbf/jscofe/js-client/cofe.page_admin.js`:

```javascript
// Get the last active tab from localStorage
let activeTabName = localStorage.getItem('adminActiveTab') || 'Users';

// Create all tabs, setting the active one based on stored preference
this.usersTab  = this.tabs.addTab('Users', activeTabName === 'Users');
this.groupsTab = this.tabs.addTab('Groups', activeTabName === 'Groups');
// etc.

// Set up tab change listener to save the active tab
this.tabs.setTabChangeListener((ui) => {
  const tabName = $(ui.newTab).text().trim();
  localStorage.setItem('adminActiveTab', tabName);
});
```

## Testing
The fix has been tested by:
1. Navigating to the admin page
2. Selecting the "Groups" tab
3. Navigating away from the admin page
4. Returning to the admin page
5. Verifying that the "Groups" tab is still active

The tab state persistence works correctly, and the active tab is remembered even after navigating away from the admin page.

## Benefits
- Improved user experience by maintaining the user's context when navigating between pages
- Reduced frustration for administrators who frequently switch between tabs in the admin interface
- Consistent behavior with modern web applications where state is preserved across navigation

## Deployment Notes
This change only affects the client-side JavaScript and does not require any server-side changes or database migrations. The fix can be deployed by simply updating the `cofe.page_admin.js` file.