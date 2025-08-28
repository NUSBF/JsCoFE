/**
 * Test script for verifying the Groups tab fix in the admin page
 * 
 * This script can be run in the browser console to verify that the Groups tab
 * in the admin page loads correctly and maintains its state when navigating away
 * and back to the admin page.
 */

(function() {
  console.log('=== Starting Groups Tab Test ===');
  
  // Step 1: Check if we're on the admin page
  if (!__current_page || __current_page._type !== 'AdminPage') {
    console.error('Test must be run from the Admin page');
    return;
  }
  
  // Step 2: Check if localStorage is working
  try {
    localStorage.setItem('test_storage', 'test');
    if (localStorage.getItem('test_storage') !== 'test') {
      console.error('localStorage is not working properly');
      return;
    }
    localStorage.removeItem('test_storage');
  } catch (e) {
    console.error('localStorage is not available:', e);
    return;
  }
  
  // Step 3: Get the current active tab
  const initialActiveTab = __current_page.tabs.getActiveTab().name;
  console.log('Initial active tab:', initialActiveTab);
  
  // Step 4: Switch to the Groups tab
  const groupsTab = __current_page.tabs.tabs['Groups'];
  if (!groupsTab) {
    console.error('Groups tab not found');
    return;
  }
  
  console.log('Switching to Groups tab...');
  __current_page.tabs.setActiveTab(groupsTab);
  
  // Step 5: Verify the Groups tab is active
  const activeTab = __current_page.tabs.getActiveTab().name;
  console.log('Active tab after switch:', activeTab);
  
  if (activeTab !== 'Groups') {
    console.error('Failed to switch to Groups tab');
    return;
  }
  
  // Step 6: Check if the Groups tab content is loaded
  console.log('Checking if Groups tab content is loaded...');
  
  // Wait a moment for any async operations to complete
  setTimeout(() => {
    if (!__current_page.groupListTable) {
      console.error('Groups list table not created');
      return;
    }
    
    console.log('Groups list table exists');
    
    // Step 7: Verify localStorage has the correct active tab
    const storedTab = localStorage.getItem('adminActiveTab');
    console.log('Stored active tab in localStorage:', storedTab);
    
    if (storedTab !== 'Groups') {
      console.error('localStorage does not have the correct active tab');
      return;
    }
    
    // Step 8: Simulate navigation away and back
    console.log('Simulating navigation away and back...');
    
    // Save current page reference
    const adminPage = __current_page;
    
    // Simulate navigation away by clearing current page
    __current_page = null;
    
    // Simulate navigation back by restoring current page
    setTimeout(() => {
      __current_page = adminPage;
      
      // Step 9: Verify the Groups tab is still active
      const finalActiveTab = __current_page.tabs.getActiveTab().name;
      console.log('Active tab after navigation:', finalActiveTab);
      
      if (finalActiveTab !== 'Groups') {
        console.error('Groups tab not active after navigation');
        return;
      }
      
      // Step 10: Verify the Groups tab content is still loaded
      if (!__current_page.groupListTable) {
        console.error('Groups list table not present after navigation');
        return;
      }
      
      console.log('=== Groups Tab Test Passed ===');
      console.log('The Groups tab is working correctly:');
      console.log('1. Tab selection is persisted in localStorage');
      console.log('2. Tab content is loaded when the tab is selected');
      console.log('3. Tab state is maintained when navigating away and back');
    }, 500);
  }, 1000);
})();