/**
 * @typedef {Object} Message
 * @property {string} sender
 * @property {string} text
 * @property {Date=} timestamp
 * @property {string=} id
 */

/**
 * @typedef {Object} Memory
 * @property {string} mem_id
 * @property {string} context
 * @property {string[]} tags
 */


/**
 * @typedef {Object} Chat
 * @property {string} userId
 * @property {string} chatId
 * @property {string} name
 * @property {Message[]} messages
 * @property {Memory[]} memory
 * @property {Date} createdAt
 */


/**
 * Example chat document in MongoDB:

 * {
  userId: "user123",
  chatId: "chat456",
  name: "Project X Notes",
  messages: [
    {
      id: "msg789",
      sender: "user",
      text: "Hi there!",
      timestamp: ISODate("2025-06-27T10:45:00Z") // Optional
    }
  ],
  memory: [ // Optional, default is []
    {
      mem_id: "mem001",
      context: "Remember to check budget before meetings.",
      tags: ["budget", "meetings"]
    },
    ...
  ],
  createdAt: ISODate("2025-06-27T10:43:00Z") 
}

 **/



/**
 * @typedef {Object} PendingMessage
 * @property {string} userId
 * @property {string} chatId
 * @property {string} id
 * @property {string} text
 * @property {string} sender
 * @property {Date} timestamp
 */



/**
 * @typedef {Object} UserAuth
 * @property {string} email
 * @property {string} password
 */