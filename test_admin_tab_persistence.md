# Testing Admin Tab Persistence

## Test Procedure

1. Log in to the CCP4 Cloud application
2. Navigate to the Admin page
3. Click on the "Groups" tab
4. Navigate away from the Admin page (e.g., to Projects page)
5. Return to the Admin page
6. Verify that the "Groups" tab is still active

## Expected Results

- When returning to the Admin page, the "Groups" tab should be automatically selected
- The tab state should persist even after refreshing the page or closing and reopening the browser

## Technical Implementation

The fix implements tab state persistence by:

1. Storing the active tab name in localStorage when a tab is clicked:
   ```javascript
   this.tabs.setTabChangeListener((ui) => {
     const tabName = $(ui.newTab).text().trim();
     localStorage.setItem('adminActiveTab', tabName);
   });
   ```

2. Retrieving the stored tab name when initializing the Admin page:
   ```javascript
   let activeTabName = localStorage.getItem('adminActiveTab') || 'Users';
   ```

3. Setting the appropriate tab as active during initialization:
   ```javascript
   this.usersTab  = this.tabs.addTab('Users', activeTabName === 'Users');
   this.groupsTab = this.tabs.addTab('Groups', activeTabName === 'Groups');
   // etc.
   ```

This ensures that the active tab state is preserved across page navigations and browser sessions.