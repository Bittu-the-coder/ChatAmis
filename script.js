////////////// version 1.0.4/////////////////////
// User Management
let currentUser = null;
let users = [];
let chats = [];
let currentChat = null;
let unsubscribeChats = null;
let unsubscribeMessages = null;

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  // Load Firebase config from the existing config.js
  // Note: Since config.js uses ES modules and the main file uses script tags,
  // we'll access the config through the window object set in firebase-config.js

  const auth = window.auth;
  const db = window.db;

  // Initialize UI elements based on current page
  initializeUIElements();

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email
      };

      if (window.location.pathname.includes('chat.html')) {
        initializeChat();
      } else if (!window.location.pathname.includes('login.html') &&
        !window.location.pathname.includes('register.html') &&
        !window.location.pathname.includes('index.html')) {
        window.location.href = 'chat.html';
      }
    } else if (!window.location.pathname.includes('login.html') &&
      !window.location.pathname.includes('register.html') &&
      !window.location.pathname.includes('index.html')) {
      window.location.href = 'login.html';
    }
  });

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'chat.html';
      } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
      }

      try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // Update user profile with display name
        await userCredential.user.updateProfile({
          displayName: name
        });

        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Registration successful!', 'success');
        setTimeout(() => {
          window.location.href = 'chat.html';
        }, 1500);
      } catch (error) {
        let errorMessage = 'Registration failed';
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Email already in use';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          default:
            errorMessage = error.message;
        }
        showNotification(errorMessage, 'error');
      }
    });
  }

  // Notification container
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2';
  document.body.appendChild(notificationContainer);

  // Show Notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `px-4 py-3 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'} text-white flex items-center justify-between`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-white/70">
        &times;
      </button>
    `;

    notification.querySelector('button').addEventListener('click', () => {
      notification.remove();
    });

    notificationContainer.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Initialize Chat Page
  function initializeChat() {
    if (!currentUser) return;

    const usernameDisplay = document.getElementById('usernameDisplay');
    const userInitial = document.getElementById('userInitial');

    if (usernameDisplay) usernameDisplay.textContent = currentUser.name;
    if (userInitial) userInitial.textContent = currentUser.name.charAt(0).toUpperCase();

    // First load users, then load chats
    loadUsers().then(() => {
      loadChats();
    });

    // Event Listeners
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
      sendMessageBtn.addEventListener('click', sendMessage);
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    const startChatBtn = document.getElementById('startChatBtn');
    if (startChatBtn) {
      startChatBtn.addEventListener('click', startNewChat);
    }

    // Create a user search results container if it doesn't exist
    const searchUserInput = document.getElementById('recipientId');
    if (searchUserInput) {
      let userSearchResults = document.getElementById('userSearchResults');
      if (!userSearchResults) {
        userSearchResults = document.createElement('div');
        userSearchResults.id = 'userSearchResults';
        userSearchResults.className = 'absolute z-20 bg-purple-800/70 backdrop-blur-lg w-full mt-12 rounded-lg max-h-48 overflow-y-auto overflow-x-hidden';
        searchUserInput.parentNode.style.position = 'relative';
        searchUserInput.parentNode.appendChild(userSearchResults);
      }

      searchUserInput.addEventListener('input', handleUserSearch);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  // Handle User Search
  function handleUserSearch() {
    const searchInput = document.getElementById('recipientId');
    let userSearchResults = document.getElementById('userSearchResults');

    // Create the search results container if it doesn't exist
    if (!userSearchResults) {
      userSearchResults = document.createElement('div');
      userSearchResults.id = 'userSearchResults';
      userSearchResults.className = 'absolute z-20 bg-purple-800/70 backdrop-blur-lg w-full mt-1 rounded-lg max-h-48 overflow-y-auto';
      searchInput.parentNode.style.position = 'relative';
      searchInput.parentNode.appendChild(userSearchResults);
    }

    if (!searchInput || !userSearchResults) return;

    const searchTerm = searchInput.value.trim().toLowerCase();

    // Clear previous results if search is empty
    if (!searchTerm) {
      userSearchResults.innerHTML = '';
      return;
    }

    // Filter users based on search term (searching in name and email)
    const filteredUsers = users.filter(user =>
      (user.name && user.name.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.id && user.id.includes(searchTerm))
    ).filter(user => user.id !== currentUser.id);

    // Display results
    userSearchResults.innerHTML = '';

    filteredUsers.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'p-2 bg-white/10 hover:bg-white/20 rounded cursor-pointer flex items-center space-x-2 ';
      userElement.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-xs font-bold">
          ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <p class="text-sm font-medium">${user.name || 'Unknown'}</p>
          <p class="text-xs text-white/70">${user.email || 'No email'}</p>
        </div>
      `;

      userElement.addEventListener('click', () => {
        // Fill the search input with the selected user's ID
        searchInput.value = user.id;
        // Clear the search results
        userSearchResults.innerHTML = '';
        // Auto-start chat with selected user
        startNewChatWithUser(user);
      });

      userSearchResults.appendChild(userElement);
    });
  }

  // Load Users
  async function loadUsers() {
    try {
      const snapshot = await db.collection('users').get();
      users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Display users in the sidebar
      displayUsersList(users);

      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users: ' + error.message, 'error');
      return [];
    }
  }

  // Display users in the sidebar
  function displayUsersList(usersList) {
    // Make sure the usersList container exists in the DOM
    let usersListElement = document.getElementById('usersList');
    if (!usersListElement) {
      // Create the users list container if it doesn't exist
      usersListElement = document.createElement('div');
      usersListElement.id = 'usersList';
      usersListElement.className = 'mt-4 space-y-2';

      // Add a header for the users list
      const usersHeader = document.createElement('h3');
      usersHeader.className = 'font-semibold text-sm text-white/80 mb-2';
      usersHeader.textContent = 'Registered Users';

      // Find the sidebar to insert users list
      const sidebar = document.querySelector('.w-full.md\\:w-80');
      if (sidebar) {
        sidebar.appendChild(document.createElement('hr'));
        sidebar.appendChild(usersHeader);
        sidebar.appendChild(usersListElement);
      }
    }

    // Clear the users list
    usersListElement.innerHTML = '';

    // Filter out current user
    const otherUsers = usersList.filter(user => user.id !== currentUser.id);

    if (otherUsers.length === 0) {
      const noUsers = document.createElement('p');
      noUsers.className = 'text-white/50 text-xs';
      noUsers.textContent = 'No other users found';
      usersListElement.appendChild(noUsers);
      return;
    }

    otherUsers.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer flex items-center space-x-2 transition-all';

      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

      userElement.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-xs font-bold">
        ${initial}
      </div>
      <div class="overflow-hidden">
        <p class="text-sm font-medium truncate">${user.name || 'Unknown'}</p>
        <p class="text-xs text-white/70 truncate">${user.email || 'No email'}</p>
      </div>
    `;

      userElement.addEventListener('click', () => {
        startNewChatWithUser(user);
      });

      usersListElement.appendChild(userElement);
    });
  }

  // Load Chats with real-time updates - IMPROVED VERSION TO REMOVE DUPLICATION
  function loadChats() {
    if (!currentUser) return;

    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    if (unsubscribeChats) unsubscribeChats();

    try {
      unsubscribeChats = db.collection('chats')
        .where('participants', 'array-contains', currentUser.id)
        .onSnapshot(snapshot => {
          chatList.innerHTML = '';
          chats = []; // Reset chats array

          // Use a Map to track unique chats by participant combinations
          const uniqueChats = new Map();

          // Process all chat documents
          snapshot.forEach(doc => {
            const chat = {
              id: doc.id,
              ...doc.data()
            };

            // Create a unique key based on sorted participants to avoid duplicates
            const participantsKey = chat.participants.sort().join('-');

            // Only add if we haven't seen this participant combination before
            // or update if this has a more recent lastUpdated timestamp
            if (!uniqueChats.has(participantsKey) ||
              (chat.lastUpdated && chat.lastUpdated.seconds > uniqueChats.get(participantsKey).lastUpdated?.seconds)) {
              uniqueChats.set(participantsKey, chat);
            }
          });

          // Convert Map values to array and sort by lastUpdated
          const allChats = Array.from(uniqueChats.values()).sort((a, b) => {
            if (!a.lastUpdated) return 1;
            if (!b.lastUpdated) return -1;
            return b.lastUpdated.seconds - a.lastUpdated.seconds;
          });

          // Process the deduplicated and sorted chats
          allChats.forEach(chat => {
            chats.push(chat);

            let chatName, chatInitial, isGroup = false;

            if (chat.isGroup) {
              chatName = chat.groupName;
              chatInitial = chat.groupName.charAt(0).toUpperCase();
              isGroup = true;
            } else {
              const otherUserId = chat.participants.find(id => id !== currentUser.id);
              const otherUser = users.find(u => u.id === otherUserId);

              if (!otherUser) {
                db.collection('users').doc(otherUserId).get().then(userDoc => {
                  if (userDoc.exists) {
                    const userData = userDoc.data();
                    users.push({ id: userDoc.id, ...userData });
                    updateChatList();
                  }
                }).catch(error => {
                  console.error("Error fetching user:", error);
                });
                chatName = 'User';
                chatInitial = 'U';
              } else {
                chatName = otherUser.name;
                chatInitial = otherUser.name.charAt(0).toUpperCase();
              }
            }

            let unreadCount = 0;
            if (chat.unreadCount && chat.unreadCount[currentUser.id]) {
              unreadCount = chat.unreadCount[currentUser.id];
            }

            const chatElement = document.createElement('div');
            chatElement.className = 'p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all border border-white/5 flex justify-between items-center';
            chatElement.innerHTML = `
            <div class="flex items-center space-x-2 flex-1">
              <div class="w-8 h-8 rounded-full ${isGroup ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-400 to-blue-500'} flex items-center justify-center text-xs font-bold">
                ${chatInitial}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">${chatName}</p>
                <p class="text-xs text-white/50 truncate">${chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}</p>
              </div>
            </div>
            ${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">${unreadCount}</span>` : ''}
          `;

            chatElement.addEventListener('click', () => {
              openChat(chat.id, chatName, chatInitial, isGroup);
            });

            chatList.appendChild(chatElement);
          });
        }, error => {
          console.error('Error loading chats:', error);
          showNotification('Failed to load chats: ' + error.message, 'error');
        });
    } catch (error) {
      console.error('Error setting up chat listener:', error);
      showNotification('Error loading chats: ' + error.message, 'error');
    }
  }

  // Helper function to update chat list after fetching user data
  function updateChatList() {
    if (unsubscribeChats) unsubscribeChats();
    loadChats();
  }

  // Find existing direct chat between users
  async function findExistingChat(participants) {
    try {
      // Query for chats where the current user is a participant
      const snapshot = await db.collection('chats')
        .where('participants', 'array-contains', currentUser.id)
        .where('isGroup', '==', false)
        .get();

      // Check if any of these chats also contain the other user
      for (const doc of snapshot.docs) {
        const chat = doc.data();
        const otherParticipantId = participants[1];

        if (chat.participants.includes(otherParticipantId)) {
          return { id: doc.id, ...chat };
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing chat:', error);
      showNotification('Error finding chat: ' + error.message, 'error');
      return null;
    }
  }

  // Start new chat with user
  async function startNewChatWithUser(user) {
    if (!user || !currentUser) return;

    if (user.id === currentUser.id) {
      showNotification('You cannot chat with yourself', 'warning');
      return;
    }

    try {
      // Check if chat already exists
      const existingChat = await findExistingChat([currentUser.id, user.id]);

      if (existingChat) {
        openChat(existingChat.id, user.name, user.name.charAt(0).toUpperCase());
      } else {
        // Create new chat with proper unreadCount structure
        const unreadCount = {};
        unreadCount[currentUser.id] = 0;
        unreadCount[user.id] = 0;

        const chatRef = await db.collection('chats').add({
          participants: [currentUser.id, user.id],
          isGroup: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessage: null,
          unreadCount: unreadCount
        });

        showNotification('Chat started with ' + user.name, 'success');
        openChat(chatRef.id, user.name, user.name.charAt(0).toUpperCase());
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      showNotification('Failed to create chat: ' + error.message, 'error');
    }
  }

  // Start New Chat from input
  async function startNewChat() {
    const recipientIdInput = document.getElementById('recipientId');
    if (!recipientIdInput) return;

    const recipientId = recipientIdInput.value.trim();

    if (!recipientId) {
      showNotification('Please enter a user ID or email', 'warning');
      return;
    }

    if (recipientId === currentUser.id) {
      showNotification('You cannot chat with yourself', 'warning');
      return;
    }

    // Check if the recipient ID exists in our users array
    const recipient = users.find(u => u.id === recipientId || u.email === recipientId);

    if (!recipient) {
      // If user not found by ID, try to fetch it directly from Firestore
      try {
        const userDoc = await db.collection('users').doc(recipientId).get();
        if (userDoc.exists) {
          const userData = {
            id: userDoc.id,
            ...userDoc.data()
          };
          users.push(userData); // Add to our local cache
          startNewChatWithUser(userData);
        } else {
          // If not found by ID, try to find by email
          if (recipientId.includes('@')) {
            const userQuery = await db.collection('users').where('email', '==', recipientId).get();
            if (!userQuery.empty) {
              const userDoc = userQuery.docs[0];
              const userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
              users.push(userData); // Add to our local cache
              startNewChatWithUser(userData);
            } else {
              showNotification('User not found', 'error');
            }
          } else {
            showNotification('User not found', 'error');
          }
        }
      } catch (error) {
        console.error('Error finding user:', error);
        showNotification('Error finding user: ' + error.message, 'error');
      }
    } else {
      startNewChatWithUser(recipient);
    }
  }

  // Open Chat with real-time message updates
  function openChat(chatId, chatName, chatInitial, isGroup = false) {
    const messagesContainer = document.getElementById('messagesContainer');
    const recipientName = document.getElementById('recipientName');
    const recipientInitial = document.getElementById('recipientInitial');
    const recipientStatus = document.getElementById('recipientStatus');

    if (!messagesContainer || !recipientName || !recipientInitial) return;

    if (unsubscribeMessages) unsubscribeMessages();

    // Store basic chat info immediately
    currentChat = {
      id: chatId,
      name: chatName,
      isGroup: isGroup,
      participants: []  // Will be populated from the chat data
    };

    // Update UI immediately
    recipientName.textContent = chatName;
    recipientInitial.textContent = chatInitial;
    if (recipientStatus) {
      recipientStatus.textContent = isGroup ? 'Group Chat' : 'Online';
    }

    // Show loading message
    messagesContainer.innerHTML = '<div class="text-center py-8 text-white/50"><p>Loading messages...</p></div>';

    // Get chat data
    db.collection('chats').doc(chatId).get().then(doc => {
      if (doc.exists) {
        const chatData = doc.data();

        // Update current chat with complete info
        currentChat.participants = chatData.participants || [];

        // Only attempt to update unreadCount if the structure exists
        if (chatData.unreadCount) {
          // Use set with merge to avoid overwriting other fields
          db.collection('chats').doc(chatId).set({
            unreadCount: {
              [currentUser.id]: 0
            }
          }, { merge: true }).catch(error => {
            console.error("Error updating unread count:", error);
          });
        } else {
          // If unreadCount doesn't exist, create it with an empty object
          const unreadCount = {};
          unreadCount[currentUser.id] = 0;
          db.collection('chats').doc(chatId).update({
            unreadCount: unreadCount
          }).catch(error => {
            console.error("Error creating unread count:", error);
          });
        }

        // Load messages with real-time updates
        unsubscribeMessages = db.collection('chats').doc(chatId)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .onSnapshot(snapshot => {
            if (snapshot.empty) {
              messagesContainer.innerHTML = '<div class="text-center py-8 text-white/50"><p>No messages yet. Start the conversation!</p></div>';
              return;
            }

            messagesContainer.innerHTML = '';
            snapshot.forEach(doc => {
              addMessageToUI(doc.data());
            });

            // Scroll to bottom
            setTimeout(() => {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
          }, error => {
            console.error('Error loading messages:', error);
            showNotification('Failed to load messages: ' + error.message, 'error');
            messagesContainer.innerHTML = '<div class="text-center py-8 text-white/50"><p>Failed to load messages</p></div>';
          });
      } else {
        showNotification('Chat not found', 'error');
      }
    }).catch(error => {
      console.error('Error opening chat:', error);
      showNotification('Error opening chat: ' + error.message, 'error');
    });
  }

  // Add message to UI
  function addMessageToUI(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer || !message) return;

    const isCurrentUser = message.sender === currentUser.id;
    const senderUser = users.find(u => u.id === message.sender);
    const senderName = isCurrentUser ? 'You' : (senderUser ? senderUser.name : 'Unknown User');

    const messageElement = document.createElement('div');
    messageElement.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} message`;

    const timestamp = message.timestamp ? formatTime(message.timestamp) : 'Now';

    messageElement.innerHTML = `
      <div class="max-w-xs md:max-w-md ${isCurrentUser ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-white/10'} p-3 rounded-lg ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}">
        ${currentChat.isGroup && !isCurrentUser ? `<p class="text-xs font-semibold mb-1 ${isCurrentUser ? 'text-white/90' : 'text-purple-300'}">${senderName}</p>` : ''}
        <p class="text-sm">${message.text}</p>
        <p class="text-xs ${isCurrentUser ? 'text-white/80' : 'text-white/50'} mt-1 text-right">${timestamp}</p>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
  }

  // Send Message
  async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !currentChat) return;

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    try {
      // Clear input right away for better UX
      const textToSend = messageText;
      messageInput.value = '';

      // Prepare message data
      const messageData = {
        text: textToSend,
        sender: currentUser.id,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Add message to subcollection
      await db.collection('chats').doc(currentChat.id)
        .collection('messages')
        .add(messageData);

      // Prepare chat update data
      const updateData = {
        lastMessage: messageData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Handle unreadCount updates
      if (currentChat.participants && currentChat.participants.length > 0) {
        // Create unreadCount object if it doesn't exist in our update
        if (!updateData.unreadCount) {
          updateData.unreadCount = {};
        }

        // Set current user's unread count to 0
        updateData.unreadCount[currentUser.id] = 0;

        // Increment unread count for other participants
        for (const participantId of currentChat.participants) {
          if (participantId !== currentUser.id) {
            // Use Firestore's increment operator
            updateData.unreadCount[participantId] = firebase.firestore.FieldValue.increment(1);
          }
        }

        // Use set with merge to avoid permissions issues
        await db.collection('chats').doc(currentChat.id).set(updateData, { merge: true });
      } else {
        // If participants is missing or empty, just update without unreadCount
        await db.collection('chats').doc(currentChat.id).update(updateData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showNotification('Failed to send message: ' + error.message, 'error');
    }
  }

  // Format Time
  function formatTime(timestamp) {
    if (!timestamp) return 'Now';

    let date;
    try {
      // Handle Firestore timestamp
      date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown time';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Logout
  function logout() {
    if (unsubscribeChats) unsubscribeChats();
    if (unsubscribeMessages) unsubscribeMessages();

    auth.signOut().then(() => {
      currentUser = null;
      window.location.href = 'login.html';
    }).catch(error => {
      showNotification('Logout failed: ' + error.message, 'error');
    });
  }

  // Initialize UI elements based on current page
  function initializeUIElements() {
    // This function ensures we don't try to access elements that don't exist on the current page
    // We could add more page-specific initialization here
  }
});