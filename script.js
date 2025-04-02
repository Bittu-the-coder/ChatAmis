// ////////////////version 1.0.0///////////////////////
// // User Management
// let currentUser = null;
// let users = [];
// let chats = [];
// let currentChat = null;
// let unsubscribeChats = null;
// let unsubscribeMessages = null;

// // Check if user is logged in
// document.addEventListener('DOMContentLoaded', () => {
//   // Initialize Firebase from the config if it's not already initialized
//   if (!firebase.apps.length) {
//     const firebaseConfig = {

//     };
//     firebase.initializeApp(firebaseConfig);
//   }

//   // Set auth and db variables
//   const auth = firebase.auth();
//   const db = firebase.firestore();

//   // Initialize UI elements based on current page
//   initializeUIElements();

//   auth.onAuthStateChanged((user) => {
//     if (user) {
//       currentUser = {
//         id: user.uid,
//         name: user.displayName || 'User',
//         email: user.email
//       };

//       if (window.location.pathname.includes('chat.html')) {
//         initializeChat();
//       } else if (!window.location.pathname.includes('login.html') &&
//         !window.location.pathname.includes('register.html') &&
//         !window.location.pathname.includes('index.html')) {
//         window.location.href = 'chat.html';
//       }
//     } else if (!window.location.pathname.includes('login.html') &&
//       !window.location.pathname.includes('register.html') &&
//       !window.location.pathname.includes('index.html')) {
//       window.location.href = 'login.html';
//     }
//   });

//   // Login Form
//   const loginForm = document.getElementById('loginForm');
//   if (loginForm) {
//     loginForm.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const email = document.getElementById('loginEmail').value;
//       const password = document.getElementById('loginPassword').value;

//       try {
//         await auth.signInWithEmailAndPassword(email, password);
//         window.location.href = 'chat.html';
//       } catch (error) {
//         showNotification('Login failed: ' + error.message, 'error');
//       }
//     });
//   }

//   // Register Form
//   const registerForm = document.getElementById('registerForm');
//   if (registerForm) {
//     registerForm.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const name = document.getElementById('registerName').value;
//       const email = document.getElementById('registerEmail').value;
//       const password = document.getElementById('registerPassword').value;
//       const confirmPassword = document.getElementById('registerConfirmPassword').value;

//       if (password !== confirmPassword) {
//         showNotification('Passwords do not match!', 'error');
//         return;
//       }

//       try {
//         // Create user with email and password
//         const userCredential = await auth.createUserWithEmailAndPassword(email, password);

//         // Update user profile with display name
//         await userCredential.user.updateProfile({
//           displayName: name
//         });

//         // Create user document in Firestore
//         await db.collection('users').doc(userCredential.user.uid).set({
//           name: name,
//           email: email,
//           createdAt: firebase.firestore.FieldValue.serverTimestamp()
//         });

//         showNotification('Registration successful!', 'success');
//         setTimeout(() => {
//           window.location.href = 'chat.html';
//         }, 1500);
//       } catch (error) {
//         let errorMessage = 'Registration failed';
//         switch (error.code) {
//           case 'auth/email-already-in-use':
//             errorMessage = 'Email already in use';
//             break;
//           case 'auth/invalid-email':
//             errorMessage = 'Invalid email address';
//             break;
//           case 'auth/weak-password':
//             errorMessage = 'Password should be at least 6 characters';
//             break;
//           default:
//             errorMessage = error.message;
//         }
//         showNotification(errorMessage, 'error');
//       }
//     });
//   }

//   // Notification container
//   const notificationContainer = document.createElement('div');
//   notificationContainer.className = 'fixed bottom-4 right-4 z-50 space-y-2';
//   document.body.appendChild(notificationContainer);

//   // Show Notification
//   function showNotification(message, type = 'info') {
//     const notification = document.createElement('div');
//     notification.className = `px-4 py-3 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'} text-white flex items-center justify-between`;
//     notification.innerHTML = `
//       <span>${message}</span>
//       <button class="ml-4 text-white hover:text-white/70">
//         &times;
//       </button>
//     `;

//     notification.querySelector('button').addEventListener('click', () => {
//       notification.remove();
//     });

//     notificationContainer.appendChild(notification);

//     // Auto remove after 5 seconds
//     setTimeout(() => {
//       notification.remove();
//     }, 5000);
//   }

//   // Initialize Chat Page
//   function initializeChat() {
//     if (!currentUser) return;

//     const usernameDisplay = document.getElementById('usernameDisplay');
//     const userInitial = document.getElementById('userInitial');

//     if (usernameDisplay) usernameDisplay.textContent = currentUser.name;
//     if (userInitial) userInitial.textContent = currentUser.name.charAt(0).toUpperCase();

//     // Load users
//     loadUsers();

//     // Load chats for current user
//     loadChats();

//     // Event Listeners
//     const sendMessageBtn = document.getElementById('sendMessageBtn');
//     if (sendMessageBtn) {
//       sendMessageBtn.addEventListener('click', sendMessage);
//     }

//     const messageInput = document.getElementById('messageInput');
//     if (messageInput) {
//       messageInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') {
//           sendMessage();
//         }
//       });
//     }

//     const startChatBtn = document.getElementById('startChatBtn');
//     if (startChatBtn) {
//       startChatBtn.addEventListener('click', startNewChat);
//     }

//     const searchUserInput = document.getElementById('recipientId');
//     if (searchUserInput) {
//       searchUserInput.addEventListener('input', handleUserSearch);
//     }

//     const createGroupBtn = document.getElementById('createGroupBtn');
//     if (createGroupBtn) {
//       createGroupBtn.addEventListener('click', createGroupChat);
//     }

//     const logoutBtn = document.getElementById('logoutBtn');
//     if (logoutBtn) {
//       logoutBtn.addEventListener('click', logout);
//     }
//   }

//   // Handle User Search
//   function handleUserSearch() {
//     const searchInput = document.getElementById('recipientId');
//     const userSearchResults = document.getElementById('userSearchResults');

//     if (!searchInput || !userSearchResults) return;

//     const searchTerm = searchInput.value.trim().toLowerCase();

//     // Clear previous results if search is empty
//     if (!searchTerm) {
//       userSearchResults.innerHTML = '';
//       return;
//     }

//     // Filter users based on search term (searching in name and email)
//     const filteredUsers = users.filter(user =>
//       (user.name && user.name.toLowerCase().includes(searchTerm)) ||
//       (user.email && user.email.toLowerCase().includes(searchTerm)) ||
//       (user.id && user.id.includes(searchTerm))
//     ).filter(user => user.id !== currentUser.id);

//     // Display results
//     userSearchResults.innerHTML = '';

//     if (filteredUsers.length === 0) {
//       userSearchResults.innerHTML = '<p class="text-white/50 text-sm p-2">No users found</p>';
//       return;
//     }

//     filteredUsers.forEach(user => {
//       const userElement = document.createElement('div');
//       userElement.className = 'p-2 bg-white/10 hover:bg-white/20 rounded cursor-pointer flex items-center space-x-2';
//       userElement.innerHTML = `
//         <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-xs font-bold">
//           ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
//         </div>
//         <div>
//           <p class="text-sm font-medium">${user.name || 'Unknown'}</p>
//           <p class="text-xs text-white/70">${user.email || 'No email'}</p>
//         </div>
//       `;

//       userElement.addEventListener('click', () => {
//         // Fill the search input with the selected user's ID
//         searchInput.value = user.id;
//         // Clear the search results
//         userSearchResults.innerHTML = '';
//         // Auto-start chat with selected user
//         startNewChatWithUser(user);
//       });

//       userSearchResults.appendChild(userElement);
//     });
//   }

//   // Start Chat with Selected User
//   async function startNewChatWithUser(user) {
//     if (!user || !currentUser) return;

//     if (user.id === currentUser.id) {
//       showNotification('You cannot chat with yourself', 'warning');
//       return;
//     }

//     // Check if chat already exists
//     const existingChat = await findExistingChat([currentUser.id, user.id]);

//     if (existingChat) {
//       openChat(existingChat.id, user.name, user.name.charAt(0).toUpperCase());
//     } else {
//       // Create new chat
//       try {
//         const chatRef = await db.collection('chats').add({
//           participants: [currentUser.id, user.id],
//           isGroup: false,
//           createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//           lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
//           lastMessage: null,
//           unreadCount: 0
//         });

//         openChat(chatRef.id, user.name, user.name.charAt(0).toUpperCase());
//       } catch (error) {
//         showNotification('Failed to create chat: ' + error.message, 'error');
//       }
//     }
//   }

//   // Load Users
//   async function loadUsers() {
//     try {
//       const snapshot = await db.collection('users').get();
//       users = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//     } catch (error) {
//       showNotification('Failed to load users: ' + error.message, 'error');
//     }
//   }

//   // Load Chats with real-time updates
//   function loadChats() {
//     if (!currentUser) return;

//     const chatList = document.getElementById('chatList');
//     if (!chatList) return;

//     if (unsubscribeChats) unsubscribeChats();

//     unsubscribeChats = db.collection('chats')
//       .where('participants', 'array-contains', currentUser.id)
//       .orderBy('lastUpdated', 'desc')
//       .onSnapshot(snapshot => {
//         chatList.innerHTML = '';

//         snapshot.forEach(doc => {
//           const chat = {
//             id: doc.id,
//             ...doc.data()
//           };

//           // For direct chats, find the other participant
//           let chatName, chatInitial, isGroup = false;

//           if (chat.isGroup) {
//             chatName = chat.groupName;
//             chatInitial = chat.groupName.charAt(0).toUpperCase();
//             isGroup = true;
//           } else {
//             const otherUserId = chat.participants.find(id => id !== currentUser.id);
//             const otherUser = users.find(u => u.id === otherUserId);

//             if (!otherUser) return;

//             chatName = otherUser.name;
//             chatInitial = otherUser.name.charAt(0).toUpperCase();
//           }

//           const chatElement = document.createElement('div');
//           chatElement.className = 'p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all border border-white/5 flex justify-between items-center';
//           chatElement.innerHTML = `
//             <div class="flex items-center space-x-2 flex-1">
//               <div class="w-8 h-8 rounded-full ${isGroup ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-400 to-blue-500'} flex items-center justify-center text-xs font-bold">
//                 ${chatInitial}
//               </div>
//               <div class="flex-1 min-w-0">
//                 <p class="font-medium text-sm truncate">${chatName}</p>
//                 <p class="text-xs text-white/50 truncate">${chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}</p>
//               </div>
//             </div>
//             ${chat.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">${chat.unreadCount}</span>` : ''}
//           `;

//           chatElement.addEventListener('click', () => {
//             openChat(chat.id, chatName, chatInitial, chat.isGroup);
//           });

//           chatList.appendChild(chatElement);
//         });
//       }, error => {
//         showNotification('Failed to load chats: ' + error.message, 'error');
//       });
//   }

//   // Start New Chat
//   async function startNewChat() {
//     const recipientIdInput = document.getElementById('recipientId');
//     if (!recipientIdInput) return;

//     const recipientId = recipientIdInput.value.trim();

//     if (!recipientId) {
//       showNotification('Please select a user', 'warning');
//       return;
//     }

//     if (recipientId === currentUser.id) {
//       showNotification('You cannot chat with yourself', 'warning');
//       return;
//     }

//     const recipient = users.find(u => u.id === recipientId);
//     if (!recipient) {
//       showNotification('User not found', 'error');
//       return;
//     }

//     // Check if chat already exists
//     const existingChat = await findExistingChat([currentUser.id, recipientId]);

//     if (existingChat) {
//       openChat(existingChat.id, recipient.name, recipient.name.charAt(0).toUpperCase());
//     } else {
//       // Create new chat
//       try {
//         const chatRef = await db.collection('chats').add({
//           participants: [currentUser.id, recipientId],
//           isGroup: false,
//           createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//           lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
//           lastMessage: null,
//           unreadCount: 0
//         });

//         openChat(chatRef.id, recipient.name, recipient.name.charAt(0).toUpperCase());
//       } catch (error) {
//         showNotification('Failed to create chat: ' + error.message, 'error');
//       }
//     }
//   }

//   // Create Group Chat
//   async function createGroupChat() {
//     const groupNameInput = document.getElementById('groupNameInput');
//     const groupMembersInput = document.getElementById('groupMembersInput');

//     if (!groupNameInput || !groupMembersInput) return;

//     const groupName = groupNameInput.value.trim();
//     const memberIds = groupMembersInput.value.trim().split(',').map(id => id.trim());

//     if (!groupName) {
//       showNotification('Please enter a group name', 'warning');
//       return;
//     }

//     if (memberIds.length < 2) {
//       showNotification('Please add at least 2 members', 'warning');
//       return;
//     }

//     // Add current user to members if not already included
//     if (!memberIds.includes(currentUser.id)) {
//       memberIds.push(currentUser.id);
//     }

//     // Verify all members exist
//     const invalidMembers = memberIds.filter(id => !users.some(u => u.id === id));
//     if (invalidMembers.length > 0) {
//       showNotification(`Invalid user IDs: ${invalidMembers.join(', ')}`, 'error');
//       return;
//     }

//     try {
//       const chatRef = await db.collection('chats').add({
//         participants: memberIds,
//         isGroup: true,
//         groupName: groupName,
//         groupAdmin: currentUser.id,
//         createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//         lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
//         lastMessage: null,
//         unreadCount: 0
//       });

//       // Clear inputs
//       groupNameInput.value = '';
//       groupMembersInput.value = '';

//       openChat(chatRef.id, groupName, groupName.charAt(0).toUpperCase(), true);
//     } catch (error) {
//       showNotification('Failed to create group: ' + error.message, 'error');
//     }
//   }

//   // Find existing direct chat between users
//   async function findExistingChat(participants) {
//     try {
//       const snapshot = await db.collection('chats')
//         .where('participants', 'array-contains', participants[0])
//         .where('isGroup', '==', false)
//         .get();

//       for (const doc of snapshot.docs) {
//         const chat = doc.data();
//         if (chat.participants.length === 2 &&
//           chat.participants.includes(participants[0]) &&
//           chat.participants.includes(participants[1])) {
//           return { id: doc.id, ...chat };
//         }
//       }
//       return null;
//     } catch (error) {
//       console.error('Error finding existing chat:', error);
//       return null;
//     }
//   }

//   // Open Chat with real-time message updates
//   function openChat(chatId, chatName, chatInitial, isGroup = false) {
//     const messagesContainer = document.getElementById('messagesContainer');
//     const recipientName = document.getElementById('recipientName');
//     const recipientInitial = document.getElementById('recipientInitial');

//     if (!messagesContainer || !recipientName || !recipientInitial) return;

//     if (unsubscribeMessages) unsubscribeMessages();

//     currentChat = {
//       id: chatId,
//       name: chatName,
//       isGroup: isGroup
//     };

//     // Update UI
//     recipientName.textContent = chatName;
//     recipientInitial.textContent = chatInitial;

//     // Mark as read
//     db.collection('chats').doc(chatId).update({
//       unreadCount: 0
//     });

//     // Load messages with real-time updates
//     unsubscribeMessages = db.collection('chats').doc(chatId)
//       .collection('messages')
//       .orderBy('timestamp', 'asc')
//       .onSnapshot(snapshot => {
//         messagesContainer.innerHTML = '';

//         snapshot.forEach(doc => {
//           const message = doc.data();
//           addMessageToUI(message);
//         });

//         // Scroll to bottom
//         messagesContainer.scrollTop = messagesContainer.scrollHeight;
//       }, error => {
//         showNotification('Failed to load messages: ' + error.message, 'error');
//       });
//   }

//   // Add message to UI
//   function addMessageToUI(message) {
//     const messagesContainer = document.getElementById('messagesContainer');
//     if (!messagesContainer) return;

//     const isCurrentUser = message.sender === currentUser.id;
//     const senderName = isCurrentUser ? 'You' :
//       (currentChat.isGroup ? users.find(u => u.id === message.sender)?.name || 'Unknown' : '');

//     const messageElement = document.createElement('div');
//     messageElement.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} message`;

//     messageElement.innerHTML = `
//       <div class="max-w-xs md:max-w-md ${isCurrentUser ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-white/10'} p-3 rounded-lg ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}">
//         ${currentChat.isGroup && !isCurrentUser ? `<p class="text-xs font-semibold mb-1 ${isCurrentUser ? 'text-white/90' : 'text-purple-300'}">${senderName}</p>` : ''}
//         <p class="text-sm">${message.text}</p>
//         <p class="text-xs ${isCurrentUser ? 'text-white/80' : 'text-white/50'} mt-1 text-right">${formatTime(message.timestamp)}</p>
//       </div>
//     `;

//     messagesContainer.appendChild(messageElement);
//   }

//   // Send Message
//   async function sendMessage() {
//     const messageInput = document.getElementById('messageInput');
//     if (!messageInput) return;

//     if (!currentChat || !messageInput.value.trim()) return;

//     const messageText = messageInput.value;

//     try {
//       // Add message to subcollection
//       await db.collection('chats').doc(currentChat.id).collection('messages').add({
//         text: messageText,
//         sender: currentUser.id,
//         timestamp: firebase.firestore.FieldValue.serverTimestamp()
//       });

//       // Update chat last message and timestamp
//       await db.collection('chats').doc(currentChat.id).update({
//         lastMessage: {
//           text: messageText,
//           sender: currentUser.id,
//           timestamp: firebase.firestore.FieldValue.serverTimestamp()
//         },
//         lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
//         unreadCount: firebase.firestore.FieldValue.increment(1)
//       });

//       // Clear input
//       messageInput.value = '';
//     } catch (error) {
//       showNotification('Failed to send message: ' + error.message, 'error');
//     }
//   }

//   // Format Time
//   function formatTime(timestamp) {
//     if (!timestamp) return '';

//     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   }

//   // Logout
//   function logout() {
//     if (unsubscribeChats) unsubscribeChats();
//     if (unsubscribeMessages) unsubscribeMessages();

//     auth.signOut().then(() => {
//       currentUser = null;
//       window.location.href = 'login.html';
//     }).catch(error => {
//       showNotification('Logout failed: ' + error.message, 'error');
//     });
//   }

//   // Request Notification Permission
//   if ('Notification' in window) {
//     Notification.requestPermission().then(permission => {
//       if (permission === 'granted') {
//         console.log('Notification permission granted');
//       }
//     });
//   }

//   // Show desktop notification
//   function showDesktopNotification(title, body) {
//     if ('Notification' in window && Notification.permission === 'granted') {
//       new Notification(title, { body });
//     }
//   }

//   // Initialize UI elements based on current page
//   function initializeUIElements() {
//     // This function ensures we don't try to access elements that don't exist on the current page
//   }
// });















////////////// version 1.0.2///////////////////////
// User Management

let currentUser = null;
let users = [];
let chats = [];
let currentChat = null;
let unsubscribeChats = null;
let unsubscribeMessages = null;

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase from the config if it's not already initialized
  if (!firebase.apps.length) {
    const firebaseConfig = {

    };
    firebase.initializeApp(firebaseConfig);
  }

  // Set auth and db variables
  const auth = firebase.auth();
  const db = firebase.firestore();

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

    // Load users and then chats
    loadUsers().then(() => {
      loadChats(); // This was missing
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

    // Fix: Create a user search results container if it doesn't exist
    const searchUserInput = document.getElementById('recipientId');
    if (searchUserInput) {
      // Create the user search results container if it doesn't exist
      let userSearchResults = document.getElementById('userSearchResults');
      if (!userSearchResults) {
        userSearchResults = document.createElement('div');
        userSearchResults.id = 'userSearchResults';
        userSearchResults.className = 'absolute z-20 bg-purple-800/70 backdrop-blur-lg w-full mt-1 rounded-lg max-h-48 overflow-y-auto';
        searchUserInput.parentNode.style.position = 'relative';
        searchUserInput.parentNode.appendChild(userSearchResults);
      }

      searchUserInput.addEventListener('input', handleUserSearch);
    }

    const createGroupBtn = document.getElementById('createGroupBtn');
    if (createGroupBtn) {
      createGroupBtn.addEventListener('click', createGroupChat);
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

    // if (filteredUsers.length === 0) {
    //   userSearchResults.innerHTML = '<p class="text-white/50 text-sm p-2 mt-10">No users found</p>';
    //   return;
    // }

    filteredUsers.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'p-2 bg-white/10 hover:bg-white/20 rounded cursor-pointer flex items-center space-x-2';
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

  // Start Chat with Selected User
  async function startNewChatWithUser(user) {
    if (!user || !currentUser) return;

    if (user.id === currentUser.id) {
      showNotification('You cannot chat with yourself', 'warning');
      return;
    }

    // Check if chat already exists
    const existingChat = await findExistingChat([currentUser.id, user.id]);

    if (existingChat) {
      openChat(existingChat.id, user.name, user.name.charAt(0).toUpperCase());
    } else {
      // Create new chat
      try {
        const chatRef = await db.collection('chats').add({
          participants: [currentUser.id, user.id],
          isGroup: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessage: null,
          unreadCount: 0
        });

        openChat(chatRef.id, user.name, user.name.charAt(0).toUpperCase());
      } catch (error) {
        showNotification('Failed to create chat: ' + error.message, 'error');
      }
    }
  }

  // Load Users
  async function loadUsers() {
    try {
      const snapshot = await db.collection('users').get();
      users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return users;
    } catch (error) {
      showNotification('Failed to load users: ' + error.message, 'error');
      return [];
    }
  }

  // Load Chats with real-time updates
  function loadChats() {
    if (!currentUser) return;

    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    if (unsubscribeChats) unsubscribeChats();

    unsubscribeChats = db.collection('chats')
      .where('participants', 'array-contains', currentUser.id)
      .orderBy('lastUpdated', 'desc')
      .onSnapshot(snapshot => {
        chatList.innerHTML = '';
        chats = []; // Reset chats array

        snapshot.forEach(doc => {
          const chat = {
            id: doc.id,
            ...doc.data()
          };
          chats.push(chat);

          // For direct chats, find the other participant
          let chatName, chatInitial, isGroup = false;

          if (chat.isGroup) {
            chatName = chat.groupName;
            chatInitial = chat.groupName.charAt(0).toUpperCase();
            isGroup = true;
          } else {
            const otherUserId = chat.participants.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);

            if (!otherUser) {
              // If user not found in our cache, try to fetch it
              db.collection('users').doc(otherUserId).get().then(userDoc => {
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  users.push({ id: userDoc.id, ...userData });
                  updateChatList();
                }
              });
              chatName = 'User';
              chatInitial = 'U';
            } else {
              chatName = otherUser.name;
              chatInitial = otherUser.name.charAt(0).toUpperCase();
            }
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
          ${chat.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">${chat.unreadCount}</span>` : ''}
        `;

          chatElement.addEventListener('click', () => {
            openChat(chat.id, chatName, chatInitial, chat.isGroup);
          });

          chatList.appendChild(chatElement);
        });
      }, error => {
        showNotification('Failed to load chats: ' + error.message, 'error');
      });
  }

  // Helper function to update chat list after fetching user data
  function updateChatList() {
    if (unsubscribeChats) unsubscribeChats();
    loadChats();
  }

  // Update the loadUsers function to properly fetch and handle users
  async function loadUsers() {
    try {
      const usersList = document.createElement('div');
      usersList.id = 'usersList';
      usersList.className = 'mt-4 space-y-2';

      // Add a header for the users list
      const usersHeader = document.createElement('h3');
      usersHeader.className = 'font-semibold text-sm text-white/80 mb-2';
      usersHeader.textContent = 'Registered Users';

      // Find the spot to insert users list (after the chat creation form)
      const startChatSection = document.querySelector('#startChatBtn').closest('div').parentElement;
      startChatSection.appendChild(document.createElement('hr'));
      startChatSection.appendChild(usersHeader);
      startChatSection.appendChild(usersList);

      // Get users from Firestore
      const snapshot = await db.collection('users').get();
      users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Display users in the sidebar
      displayUsersList(users);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users: ' + error.message, 'error');
    }
  }

  // New function to display users in the sidebar
  function displayUsersList(usersList) {
    const usersListElement = document.getElementById('usersList');
    if (!usersListElement) return;

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

  // Fix the startNewChatWithUser function to handle errors better
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
        // Create new chat
        const chatRef = await db.collection('chats').add({
          participants: [currentUser.id, user.id],
          isGroup: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessage: null,
          unreadCount: 0
        });

        showNotification('Chat started with ' + user.name, 'success');
        openChat(chatRef.id, user.name, user.name.charAt(0).toUpperCase());
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      showNotification('Failed to create chat: ' + error.message, 'error');
    }
  }

  // Update the findExistingChat function to be more robust
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

  // Start New Chat
  async function startNewChat() {
    const recipientIdInput = document.getElementById('recipientId');
    if (!recipientIdInput) return;

    const recipientId = recipientIdInput.value.trim();

    if (!recipientId) {
      showNotification('Please select a user', 'warning');
      return;
    }

    if (recipientId === currentUser.id) {
      showNotification('You cannot chat with yourself', 'warning');
      return;
    }

    // Check if the recipient ID exists in our users array
    const recipient = users.find(u => u.id === recipientId || u.email === recipientId);

    if (!recipient) {
      // If user not found, try to fetch it directly from Firestore
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
          // Try to find a user by email if the input looks like an email
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
        showNotification('Error finding user: ' + error.message, 'error');
      }
    } else {
      startNewChatWithUser(recipient);
    }
  }

  // Create Group Chat
  async function createGroupChat() {
    const groupNameInput = document.getElementById('groupNameInput');
    const groupMembersInput = document.getElementById('groupMembersInput');

    if (!groupNameInput || !groupMembersInput) return;

    const groupName = groupNameInput.value.trim();
    const memberIds = groupMembersInput.value.trim().split(',').map(id => id.trim());

    if (!groupName) {
      showNotification('Please enter a group name', 'warning');
      return;
    }

    if (memberIds.length < 2) {
      showNotification('Please add at least 2 members', 'warning');
      return;
    }

    // Add current user to members if not already included
    if (!memberIds.includes(currentUser.id)) {
      memberIds.push(currentUser.id);
    }

    // Verify all members exist
    const invalidMembers = memberIds.filter(id => !users.some(u => u.id === id));
    if (invalidMembers.length > 0) {
      showNotification(`Invalid user IDs: ${invalidMembers.join(', ')}`, 'error');
      return;
    }

    try {
      const chatRef = await db.collection('chats').add({
        participants: memberIds,
        isGroup: true,
        groupName: groupName,
        groupAdmin: currentUser.id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: null,
        unreadCount: 0
      });

      // Clear inputs
      groupNameInput.value = '';
      groupMembersInput.value = '';

      openChat(chatRef.id, groupName, groupName.charAt(0).toUpperCase(), true);
    } catch (error) {
      showNotification('Failed to create group: ' + error.message, 'error');
    }
  }

  // Find existing direct chat between users
  async function findExistingChat(participants) {
    try {
      const snapshot = await db.collection('chats')
        .where('participants', 'array-contains', participants[0])
        .where('isGroup', '==', false)
        .get();

      for (const doc of snapshot.docs) {
        const chat = doc.data();
        if (chat.participants.length === 2 &&
          chat.participants.includes(participants[0]) &&
          chat.participants.includes(participants[1])) {
          return { id: doc.id, ...chat };
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing chat:', error);
      return null;
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

    currentChat = {
      id: chatId,
      name: chatName,
      isGroup: isGroup
    };

    // Update UI
    recipientName.textContent = chatName;
    recipientInitial.textContent = chatInitial;
    if (recipientStatus) {
      recipientStatus.textContent = isGroup ? 'Group Chat' : 'Online';
    }

    // Mark as read
    db.collection('chats').doc(chatId).update({
      unreadCount: 0
    }).catch(error => {
      console.log("Error updating unread count:", error);
    });

    // Show loading message
    messagesContainer.innerHTML = '<div class="text-center py-8 text-white/50"><p>Loading messages...</p></div>';

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
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            addMessageToUI(change.doc.data());
          }
        });

        // Scroll to bottom
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }, error => {
        showNotification('Failed to load messages: ' + error.message, 'error');
        messagesContainer.innerHTML = '<div class="text-center py-8 text-white/50"><p>Failed to load messages</p></div>';
      });
  }

  // Add message to UI
  function addMessageToUI(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const isCurrentUser = message.sender === currentUser.id;
    const senderUser = users.find(u => u.id === message.sender);
    const senderName = isCurrentUser ? 'You' :
      (senderUser ? senderUser.name : 'Unknown User');

    const messageElement = document.createElement('div');
    messageElement.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} message`;

    messageElement.innerHTML = `
      <div class="max-w-xs md:max-w-md ${isCurrentUser ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-white/10'} p-3 rounded-lg ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}">
        ${currentChat.isGroup && !isCurrentUser ? `<p class="text-xs font-semibold mb-1 ${isCurrentUser ? 'text-white/90' : 'text-purple-300'}">${senderName}</p>` : ''}
        <p class="text-sm">${message.text}</p>
        <p class="text-xs ${isCurrentUser ? 'text-white/80' : 'text-white/50'} mt-1 text-right">${formatTime(message.timestamp)}</p>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
  }

  // Send Message
  async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const messageText = messageInput.value.trim();
    if (!currentChat || !messageText) return;

    try {
      // Add message to subcollection
      const messageRef = await db.collection('chats').doc(currentChat.id)
        .collection('messages')
        .add({
          text: messageText,
          sender: currentUser.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

      // Update chat last message and timestamp
      await db.collection('chats').doc(currentChat.id).update({
        lastMessage: {
          text: messageText,
          sender: currentUser.id,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        // Increment unread count for all participants except current user
        [`unreadCount.${currentUser.id}`]: 0,
        ...Object.fromEntries(
          currentChat.participants
            .filter(id => id !== currentUser.id)
            .map(id => [`unreadCount.${id}`, firebase.firestore.FieldValue.increment(1)])
        )
      });

      // Clear input
      messageInput.value = '';
    } catch (error) {
      showNotification('Failed to send message: ' + error.message, 'error');
    }
  }

  // Format Time
  function formatTime(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  // Request Notification Permission
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }

  // Show desktop notification
  function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // Initialize UI elements based on current page
  function initializeUIElements() {
    // This function ensures we don't try to access elements that don't exist on the current page
  }
});