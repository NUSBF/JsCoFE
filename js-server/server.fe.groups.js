/*
 *  =================================================================
 *
 *    22.08.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.groups.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Group Management Module
 *       ~~~~~~~~~
 *
 *  Group functionality for user collaboration:
 *  - Users can belong to multiple groups
 *  - Group leaders can see all member projects
 *  - Groups have invitations system
 *
 *  =================================================================
 */

'use strict';

//  load system modules
const fs   = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

//  load application modules
const conf  = require('./server.configuration');
const utils = require('./server.utils');
const user  = require('./server.fe.user');
const cmd   = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(20);

// ===========================================================================

const __groupsDataFile = 'groups.json';
const __userGroupsExt  = '.groups';

// ===========================================================================

function getGroupsDataFName() {
  console.log('[DEBUG] Server - groups.js - getGroupsDataFName - Getting FE config');
  let config = conf.getFEConfig();
  
  // Handle null config or missing userDataPath
  if (!config || !config.userDataPath) {
    console.log('[DEBUG] Server - groups.js - getGroupsDataFName - Using default path due to missing config');
    // Use a default path if config is not available
    return path.join('./cofe-users', __groupsDataFile);
  }
  
  console.log('[DEBUG] Server - groups.js - getGroupsDataFName - User data path:', config.userDataPath);
  let filePath = path.join(config.userDataPath, __groupsDataFile);
  console.log('[DEBUG] Server - groups.js - getGroupsDataFName - Full file path:', filePath);
  return filePath;
}

function getUserGroupsFName(loginData) {
  console.log('[DEBUG] Server - groups.js - getUserGroupsFName - Getting FE config for user:', loginData.login);
  let config = conf.getFEConfig();
  
  // Handle null config or missing userDataPath
  if (!config || !config.userDataPath) {
    console.log('[DEBUG] Server - groups.js - getUserGroupsFName - Using default path due to missing config');
    // Use a default path if config is not available
    return path.join('./cofe-users', loginData.login + __userGroupsExt);
  }
  
  console.log('[DEBUG] Server - groups.js - getUserGroupsFName - User data path:', config.userDataPath);
  let filePath = path.join(config.userDataPath, loginData.login + __userGroupsExt);
  console.log('[DEBUG] Server - groups.js - getUserGroupsFName - Full file path:', filePath);
  return filePath;
}

function generateGroupId() {
  return 'group_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();
}

function generateInviteCode() {
  return crypto.randomBytes(16).toString('hex');
}

// ===========================================================================
// Group Data Management
// ===========================================================================

function readGroupsData() {
  console.log('[DEBUG] Server - groups.js - readGroupsData - Getting groups data file path');
  let groupsFile = getGroupsDataFName();
  console.log('[DEBUG] Server - groups.js - readGroupsData - Groups file path:', groupsFile);
  
  let groupsData = {
    groups: {},
    invitations: {}
  };

  console.log('[DEBUG] Server - groups.js - readGroupsData - Checking if file exists');
  if (utils.fileExists(groupsFile)) {
    console.log('[DEBUG] Server - groups.js - readGroupsData - File exists, reading data');
    let data = utils.readObject(groupsFile);
    if (data) {
      console.log('[DEBUG] Server - groups.js - readGroupsData - Data read successfully');
      groupsData = data;
    } else {
      console.error('[DEBUG] Server - groups.js - readGroupsData - Failed to read data from file');
    }
  } else {
    console.log('[DEBUG] Server - groups.js - readGroupsData - File does not exist, using default empty data');
  }

  return groupsData;
}

function writeGroupsData(groupsData) {
  console.log('[DEBUG] Server - groups.js - writeGroupsData - Getting groups data file path');
  let groupsFile = getGroupsDataFName();
  console.log('[DEBUG] Server - groups.js - writeGroupsData - Groups file path:', groupsFile);
  
  console.log('[DEBUG] Server - groups.js - writeGroupsData - Writing data to file');
  try {
    let result = utils.writeObject(groupsFile, groupsData);
    console.log('[DEBUG] Server - groups.js - writeGroupsData - Write result:', result);
    return result;
  } catch (error) {
    console.error('[DEBUG] Server - groups.js - writeGroupsData - Error writing file:', error.message, error.stack);
    return false;
  }
}

function readUserGroups(loginData) {
  console.log('[DEBUG] Server - groups.js - readUserGroups - Getting user groups file path for user:', loginData.login);
  let userGroupsFile = getUserGroupsFName(loginData);
  console.log('[DEBUG] Server - groups.js - readUserGroups - User groups file path:', userGroupsFile);
  
  let userGroups = {
    memberships: {},  // group_id -> {role, joined_date, status}
    leadership: []    // list of group_ids where user is leader
  };

  console.log('[DEBUG] Server - groups.js - readUserGroups - Checking if file exists');
  if (utils.fileExists(userGroupsFile)) {
    console.log('[DEBUG] Server - groups.js - readUserGroups - File exists, reading data');
    let data = utils.readObject(userGroupsFile);
    if (data) {
      console.log('[DEBUG] Server - groups.js - readUserGroups - Data read successfully');
      userGroups = data;
    } else {
      console.error('[DEBUG] Server - groups.js - readUserGroups - Failed to read data from file');
    }
  } else {
    console.log('[DEBUG] Server - groups.js - readUserGroups - File does not exist, using default empty data');
  }

  return userGroups;
}

function writeUserGroups(loginData, userGroups) {
  console.log('[DEBUG] Server - groups.js - writeUserGroups - Getting user groups file path for user:', loginData.login);
  let userGroupsFile = getUserGroupsFName(loginData);
  console.log('[DEBUG] Server - groups.js - writeUserGroups - User groups file path:', userGroupsFile);
  
  console.log('[DEBUG] Server - groups.js - writeUserGroups - Writing data to file');
  try {
    let result = utils.writeObject(userGroupsFile, userGroups);
    console.log('[DEBUG] Server - groups.js - writeUserGroups - Write result:', result);
    return result;
  } catch (error) {
    console.error('[DEBUG] Server - groups.js - writeUserGroups - Error writing file:', error.message, error.stack);
    return false;
  }
}

// ===========================================================================
// Group Operations
// ===========================================================================

function createGroup(loginData, requestData, callback_func) {
  console.log('[DEBUG] Server - groups.js - createGroup function called');
  
  // Define groupData at the function scope level so it's available throughout the function
  let groupData;
  
  try {
    log.standard(1, `Received create group request from ${loginData.login}: ${JSON.stringify(requestData)}`);
    
    // Validate request data
    if (!requestData) {
      console.error('[DEBUG] Server - groups.js - Failed: request data is null or undefined');
      log.error(1, `Failed to create group: request data is null or undefined`);
      callback_func(new cmd.Response(cmd.fe_retcode.wrongRequest, 'Invalid request data', ''));
      return;
    }
    
    console.log('[DEBUG] Server - groups.js - Request data validation passed');
    
    // Extract group data from request, handling both direct properties and nested under requestType
    groupData = {
      name: requestData.name || (requestData.requestType === 'createGroup' && requestData.name),
      description: requestData.description || '',
      max_members: parseInt(requestData.max_members) || 50
    };
    
    console.log('[DEBUG] Server - groups.js - Extracted group data:', JSON.stringify(groupData));
    
    // If name is missing, log error and return
    if (!groupData.name) {
      console.error('[DEBUG] Server - groups.js - Failed: missing name in request data');
      log.error(1, `Failed to create group: missing name in request data`);
      callback_func(new cmd.Response(cmd.fe_retcode.wrongRequest, 'Group name is required', ''));
      return;
    }
    
    console.log('[DEBUG] Server - groups.js - Group name validation passed');
    log.standard(1, `Creating group: ${groupData.name} by ${loginData.login}`);
  } catch (error) {
    console.error('[DEBUG] Server - groups.js - Exception in createGroup:', error.message);
    log.error(1, `Exception in createGroup: ${error.message}`);
    callback_func(new cmd.Response(cmd.fe_retcode.errors, 'Internal server error', ''));
    return;
  }

  console.log('[DEBUG] Server - groups.js - Reading existing groups data');
  let groupsData = readGroupsData();
  console.log('[DEBUG] Server - groups.js - Groups data read successfully');
  
  console.log('[DEBUG] Server - groups.js - Generating new group ID');
  let groupId = generateGroupId();
  console.log('[DEBUG] Server - groups.js - Generated group ID:', groupId);

  // Check if group name already exists
  console.log('[DEBUG] Server - groups.js - Checking if group name already exists');
  for (let gid in groupsData.groups) {
    if (groupsData.groups[gid].name === groupData.name) {
      console.error('[DEBUG] Server - groups.js - Failed: Group name already exists');
      callback_func(new cmd.Response(cmd.fe_retcode.existingLogin, 'Group name already exists', ''));
      return;
    }
  }
  console.log('[DEBUG] Server - groups.js - Group name is unique');

  // Create new group
  console.log('[DEBUG] Server - groups.js - Creating new group object');
  groupsData.groups[groupId] = {
    id: groupId,
    name: groupData.name,
    description: groupData.description || '',
    created_by: loginData.login,
    created_date: Date.now(),
    status: 'active',
    max_members: groupData.max_members || 50,
    members: {}
  };
  console.log('[DEBUG] Server - groups.js - New group object created');

  // Add creator as leader
  console.log('[DEBUG] Server - groups.js - Adding creator as leader');
  groupsData.groups[groupId].members[loginData.login] = {
    role: 'leader',
    joined_date: Date.now(),
    status: 'active',
    added_by: loginData.login
  };
  console.log('[DEBUG] Server - groups.js - Creator added as leader');

  // Update user's group membership
  console.log('[DEBUG] Server - groups.js - Reading user groups data');
  let userGroups = readUserGroups(loginData);
  console.log('[DEBUG] Server - groups.js - User groups data read successfully');
  
  console.log('[DEBUG] Server - groups.js - Updating user membership');
  userGroups.memberships[groupId] = {
    role: 'leader',
    joined_date: Date.now(),
    status: 'active'
  };
  userGroups.leadership.push(groupId);
  console.log('[DEBUG] Server - groups.js - User membership updated');

  try {
    console.log('[DEBUG] Server - groups.js - Writing groups data to disk');
    let groupsWriteSuccess = writeGroupsData(groupsData);
    console.log('[DEBUG] Server - groups.js - Groups data write result:', groupsWriteSuccess);
    
    console.log('[DEBUG] Server - groups.js - Writing user groups data to disk');
    let userGroupsWriteSuccess = writeUserGroups(loginData, userGroups);
    console.log('[DEBUG] Server - groups.js - User groups data write result:', userGroupsWriteSuccess);
    
    if (groupsWriteSuccess && userGroupsWriteSuccess) {
      console.log('[DEBUG] Server - groups.js - Group created successfully');
      log.standard(2, `Group created successfully: ${groupId}`);
      callback_func(new cmd.Response(cmd.fe_retcode.ok, 'Group created successfully', {
        group_id: groupId,
        group: groupsData.groups[groupId]
      }));
    } else {
      console.error('[DEBUG] Server - groups.js - Failed to write data to disk');
      log.error(1, `Failed to create group: ${groupData.name} - Error writing data`);
      callback_func(new cmd.Response(cmd.fe_retcode.writeError, 'Failed to create group: Error writing data to disk', ''));
    }
  } catch (error) {
    console.error('[DEBUG] Server - groups.js - Exception while finalizing group creation:', error.message, error.stack);
    log.error(1, `Exception while finalizing group creation: ${error.message}`);
    callback_func(new cmd.Response(cmd.fe_retcode.errors, 'Failed to create group: Internal server error', ''));
  }
}

function getUserGroups(loginData, callback_func) {
  let userGroups = readUserGroups(loginData);
  let groupsData = readGroupsData();

  let result = {
    memberships: [],
    leadership: []
  };

  // Get detailed info for user's groups
  for (let groupId in userGroups.memberships) {
    if (groupsData.groups[groupId]) {
      let group = groupsData.groups[groupId];
      result.memberships.push({
        group_id: groupId,
        name: group.name,
        description: group.description,
        role: userGroups.memberships[groupId].role,
        joined_date: userGroups.memberships[groupId].joined_date,
        member_count: Object.keys(group.members).length,
        created_by: group.created_by
      });

      if (userGroups.memberships[groupId].role === 'leader') {
        result.leadership.push(groupId);
      }
    }
  }

  callback_func(new cmd.Response(cmd.fe_retcode.ok, '', result));
}

function inviteToGroup(loginData, inviteData, callback_func) {
  log.standard(1, `Inviting ${inviteData.email} to group ${inviteData.group_id} by ${loginData.login}`);

  let groupsData = readGroupsData();
  let userGroups = readUserGroups(loginData);

  // Check if user is leader of the group
  if (!userGroups.leadership.includes(inviteData.group_id)) {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Only group leaders can invite members', ''));
    return;
  }

  let group = groupsData.groups[inviteData.group_id];
  if (!group) {
    callback_func(new cmd.Response(cmd.fe_retcode.notFound, 'Group not found', ''));
    return;
  }

  // Check if already a member
  for (let member in group.members) {
    let memberData = user.getUserLoginData(member);
    if (memberData && memberData.email === inviteData.email) {
      callback_func(new cmd.Response(cmd.fe_retcode.existingLogin, 'User is already a group member', ''));
      return;
    }
  }

  // Create invitation
  let inviteId = generateInviteCode();
  groupsData.invitations[inviteId] = {
    id: inviteId,
    group_id: inviteData.group_id,
    inviter: loginData.login,
    invitee_email: inviteData.email,
    role: inviteData.role || 'member',
    status: 'pending',
    created_date: Date.now(),
    expires_date: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };

  if (writeGroupsData(groupsData)) {
    log.standard(2, `Invitation created: ${inviteId}`);
    callback_func(new cmd.Response(cmd.fe_retcode.ok, 'Invitation sent', {
      invitation_id: inviteId,
      invitation_code: inviteId
    }));
  } else {
    log.error(1, `Failed to create invitation for ${inviteData.email}`);
    callback_func(new cmd.Response(cmd.fe_retcode.writeError, 'Failed to create invitation', ''));
  }
}

function acceptInvitation(loginData, inviteCode, callback_func) {
  log.standard(1, `${loginData.login} accepting invitation: ${inviteCode}`);

  let groupsData = readGroupsData();
  let invitation = groupsData.invitations[inviteCode];

  if (!invitation) {
    callback_func(new cmd.Response(cmd.fe_retcode.notFound, 'Invitation not found', ''));
    return;
  }

  if (invitation.status !== 'pending') {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Invitation already processed', ''));
    return;
  }

  if (Date.now() > invitation.expires_date) {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Invitation has expired', ''));
    return;
  }

  let group = groupsData.groups[invitation.group_id];
  if (!group) {
    callback_func(new cmd.Response(cmd.fe_retcode.notFound, 'Group not found', ''));
    return;
  }

  // Check if user email matches invitation
  let userData = user.getUserData(loginData);
  if (!userData || userData.email !== invitation.invitee_email) {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Invitation email does not match your account', ''));
    return;
  }

  // Add user to group
  group.members[loginData.login] = {
    role: invitation.role,
    joined_date: Date.now(),
    status: 'active',
    added_by: invitation.inviter
  };

  // Update user's groups
  let userGroups = readUserGroups(loginData);
  userGroups.memberships[invitation.group_id] = {
    role: invitation.role,
    joined_date: Date.now(),
    status: 'active'
  };

  if (invitation.role === 'leader') {
    userGroups.leadership.push(invitation.group_id);
  }

  // Mark invitation as accepted
  invitation.status = 'accepted';
  invitation.response_date = Date.now();

  if (writeGroupsData(groupsData) && writeUserGroups(loginData, userGroups)) {
    log.standard(2, `User ${loginData.login} joined group ${group.name}`);
    callback_func(new cmd.Response(cmd.fe_retcode.ok, 'Successfully joined group', {
      group: group
    }));
  } else {
    log.error(1, `Failed to accept invitation: ${inviteCode}`);
    callback_func(new cmd.Response(cmd.fe_retcode.writeError, 'Failed to join group', ''));
  }
}

function getGroupMembers(loginData, groupId, callback_func) {
  let userGroups = readUserGroups(loginData);

  // Check if user is member of the group
  if (!userGroups.memberships[groupId]) {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Access denied', ''));
    return;
  }

  let groupsData = readGroupsData();
  let group = groupsData.groups[groupId];

  if (!group) {
    callback_func(new cmd.Response(cmd.fe_retcode.notFound, 'Group not found', ''));
    return;
  }

  let members = [];
  for (let memberLogin in group.members) {
    let memberData = user.getUserLoginData(memberLogin);
    if (memberData) {
      members.push({
        login: memberLogin,
        name: memberData.name,
        email: memberData.email,
        role: group.members[memberLogin].role,
        joined_date: group.members[memberLogin].joined_date,
        status: group.members[memberLogin].status
      });
    }
  }

  callback_func(new cmd.Response(cmd.fe_retcode.ok, '', {
    group: {
      id: groupId,
      name: group.name,
      description: group.description
    },
    members: members
  }));
}

// ===========================================================================
// Project Access for Group Leaders
// ===========================================================================

function getAccessibleProjects(loginData, callback_func) {
  let userGroups = readUserGroups(loginData);
  let groupsData = readGroupsData();

  let accessibleProjects = [];

  // Get projects from group members if user is a leader
  for (let groupId of userGroups.leadership) {
    let group = groupsData.groups[groupId];
    if (group) {
      for (let memberLogin in group.members) {
        if (memberLogin !== loginData.login) {  // Don't include own projects
          try {
            // Get member's projects - this would need to integrate with existing project system
            // For now, we'll return the structure needed
            accessibleProjects.push({
              owner: memberLogin,
              group_id: groupId,
              group_name: group.name,
              access_level: 'read',
              access_type: 'group_leader'
            });
          } catch (error) {
            log.warning(1, `Failed to get projects for member ${memberLogin}: ${error.message}`);
          }
        }
      }
    }
  }

  callback_func(new cmd.Response(cmd.fe_retcode.ok, '', {
    accessible_projects: accessibleProjects
  }));
}

function deleteGroup(loginData, requestData, callback_func) {
  // Define groupId at the function scope level
  let groupId;
  
  try {
    log.standard(1, `Received delete group request from ${loginData.login}: ${JSON.stringify(requestData)}`);
    
    // Validate request data
    if (!requestData) {
      log.error(1, `Failed to delete group: request data is null or undefined`);
      callback_func(new cmd.Response(cmd.fe_retcode.wrongRequest, 'Invalid request data', ''));
      return;
    }
    
    // Extract group ID from request, handling both direct property and nested under requestType
    groupId = requestData.groupId || (requestData.requestType === 'deleteGroup' && requestData.groupId);
    
    // If groupId is missing, log error and return
    if (!groupId) {
      log.error(1, `Failed to delete group: missing groupId in request data`);
      callback_func(new cmd.Response(cmd.fe_retcode.wrongRequest, 'Group ID is required', ''));
      return;
    }
    
    log.standard(1, `Deleting group: ${groupId} by ${loginData.login}`);
  } catch (error) {
    log.error(1, `Exception in deleteGroup: ${error.message}`);
    callback_func(new cmd.Response(cmd.fe_retcode.errors, 'Internal server error', ''));
    return;
  }

  let groupsData = readGroupsData();
  let group = groupsData.groups[groupId];

  if (!group) {
    callback_func(new cmd.Response(cmd.fe_retcode.notFound, 'Group not found', ''));
    return;
  }

  // Check if user is admin or group creator
  let isAdmin = loginData.role === 'admin'; // Assume role is available in loginData
  let isCreator = group.created_by === loginData.login;

  if (!isAdmin && !isCreator) {
    callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Only administrators or group creators can delete groups', ''));
    return;
  }

  let memberCount = Object.keys(group.members).length;
  log.standard(2, `Removing ${memberCount} members from group ${group.name}`);

  // Remove group membership from all users
  for (let memberLogin in group.members) {
    try {
      let memberLoginData = { login: memberLogin };
      let userGroups = readUserGroups(memberLoginData);

      // Remove group from user's memberships
      if (userGroups.memberships[groupId]) {
        delete userGroups.memberships[groupId];
      }

      // Remove from leadership if present
      let leaderIndex = userGroups.leadership.indexOf(groupId);
      if (leaderIndex > -1) {
        userGroups.leadership.splice(leaderIndex, 1);
      }

      // Write updated user groups
      writeUserGroups(memberLoginData, userGroups);

    } catch (error) {
      log.warning(1, `Failed to remove group membership for user ${memberLogin}: ${error.message}`);
    }
  }

  // Remove all invitations for this group
  for (let inviteId in groupsData.invitations) {
    if (groupsData.invitations[inviteId].group_id === groupId) {
      delete groupsData.invitations[inviteId];
    }
  }

  // Delete the group
  delete groupsData.groups[groupId];

  try {
    if (writeGroupsData(groupsData)) {
      log.standard(2, `Group ${group.name} deleted successfully. ${memberCount} members removed.`);
      callback_func(new cmd.Response(cmd.fe_retcode.ok, 'Group deleted successfully', {
        deleted_group_id: groupId,
        members_removed: memberCount
      }));
    } else {
      log.error(1, `Failed to write groups data after deleting group: ${groupId}`);
      callback_func(new cmd.Response(cmd.fe_retcode.writeError, 'Failed to delete group: Error writing data to disk', ''));
    }
  } catch (error) {
    log.error(1, `Exception while finalizing group deletion: ${error.message}`);
    callback_func(new cmd.Response(cmd.fe_retcode.errors, 'Failed to delete group: Internal server error', ''));
  }
}

function getAllGroups(loginData, callback_func) {
  log.standard(1, `Getting all groups for user: ${loginData.login}, role: ${loginData.role}`);
  
  // Read all groups data
  let groupsData = readGroupsData();
  
  // If user is admin, return all groups
  if (loginData.role === 'admin') {
    log.standard(2, `Admin user ${loginData.login} - returning all groups`);
    callback_func(new cmd.Response(cmd.fe_retcode.ok, '', {
      groups: groupsData.groups
    }));
    return;
  }
  
  // For non-admin users, return only groups they belong to
  let userGroups = readUserGroups(loginData);
  let accessibleGroups = {};
  
  // Add groups the user is a member of
  for (let groupId in userGroups.memberships) {
    if (groupsData.groups[groupId]) {
      accessibleGroups[groupId] = groupsData.groups[groupId];
    }
  }
  
  log.standard(2, `User ${loginData.login} - returning ${Object.keys(accessibleGroups).length} accessible groups`);
  callback_func(new cmd.Response(cmd.fe_retcode.ok, '', {
    groups: accessibleGroups
  }));
}

function updateUserGroupMembership(loginData, requestData, callback_func) {
  console.log('[DEBUG] Server - groups.js - updateUserGroupMembership function called');

  try {
    log.standard(1, `Received update user group membership request from ${loginData.login}: ${JSON.stringify(requestData)}`);

    // Validate request data
    if (!requestData || !requestData.targetUser) {
      log.error(1, `Failed to update user groups: missing target user`);
      callback_func(new cmd.Response(cmd.fe_retcode.wrongRequest, 'Target user is required', ''));
      return;
    }

    let targetUser = requestData.targetUser;
    let newGroups = requestData.groups || []; // Array of {group_id, role}

    // Check if requesting user has permission (admin only)
    // Read user data to get the role since loginData doesn't include role information
    const user = require('./server.fe.user');
    let uData = user.readUserData(loginData);
    if (!uData) {
      log.error(1, `Failed to read user data for admin check: ${loginData.login}`);
      callback_func(new cmd.Response(cmd.fe_retcode.readError, 'Cannot verify admin privileges', ''));
      return;
    }

    const ud = require('../js-common/common.data_user');
    if (uData.role !== ud.role_code.admin) {
      log.error(1, `Non-admin user ${loginData.login} (role: ${uData.role}) attempted to update user group memberships`);
      callback_func(new cmd.Response(cmd.fe_retcode.accessDenied, 'Only administrators can update user group memberships', ''));
      return;
    }

    console.log('[DEBUG] Server - groups.js - Updating groups for user:', targetUser);
    console.log('[DEBUG] Server - groups.js - New groups:', JSON.stringify(newGroups));

    // Read current data
    let groupsData = readGroupsData();
    let targetUserLoginData = { login: targetUser };
    let currentUserGroups = readUserGroups(targetUserLoginData);

    // Remove user from all current groups
    for (let groupId in currentUserGroups.memberships) {
      if (groupsData.groups[groupId] && groupsData.groups[groupId].members[targetUser]) {
        delete groupsData.groups[groupId].members[targetUser];
      }
    }

    // Reset user's group data
    currentUserGroups.memberships = {};
    currentUserGroups.leadership = [];

    // Add user to new groups
    for (let groupInfo of newGroups) {
      let groupId = groupInfo.group_id;
      let role = groupInfo.role || 'member';

      if (groupsData.groups[groupId]) {
        // Add to group
        groupsData.groups[groupId].members[targetUser] = {
          role: role,
          joined_date: Date.now(),
          status: 'active',
          added_by: loginData.login
        };

        // Update user's membership
        currentUserGroups.memberships[groupId] = {
          role: role,
          joined_date: Date.now(),
          status: 'active'
        };

        // Add to leadership if role is leader
        if (role === 'leader') {
          currentUserGroups.leadership.push(groupId);
        }
      }
    }

    // Write updated data
    let groupsWriteSuccess = writeGroupsData(groupsData);
    let userGroupsWriteSuccess = writeUserGroups(targetUserLoginData, currentUserGroups);

    if (groupsWriteSuccess && userGroupsWriteSuccess) {
      log.standard(2, `User ${targetUser} group memberships updated successfully`);
      callback_func(new cmd.Response(cmd.fe_retcode.ok, 'User group memberships updated successfully', {
        user: targetUser,
        groups: newGroups
      }));
    } else {
      log.error(1, `Failed to write group membership data for user: ${targetUser}`);
      callback_func(new cmd.Response(cmd.fe_retcode.writeError, 'Failed to update user group memberships', ''));
    }

  } catch (error) {
    console.error('[DEBUG] Server - groups.js - Exception in updateUserGroupMembership:', error.message);
    log.error(1, `Exception in updateUserGroupMembership: ${error.message}`);
    callback_func(new cmd.Response(cmd.fe_retcode.errors, 'Internal server error', ''));
  }
}

// ===========================================================================
// Exports
// ===========================================================================

module.exports.createGroup         = createGroup;
module.exports.deleteGroup         = deleteGroup;
module.exports.getAllGroups        = getAllGroups;
module.exports.getUserGroups       = getUserGroups;
module.exports.inviteToGroup       = inviteToGroup;
module.exports.acceptInvitation    = acceptInvitation;
module.exports.getGroupMembers     = getGroupMembers;
module.exports.getAccessibleProjects = getAccessibleProjects;
module.exports.updateUserGroupMembership = updateUserGroupMembership;
module.exports.readUserGroups      = readUserGroups;
module.exports.readGroupsData      = readGroupsData;
