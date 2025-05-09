/**
 * @typedef {'sales' | 'operator' | 'factory' | 'admin'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} name
 * @property {UserRole} role
 * @property {string} [department]
 */

/**
 * @typedef {'received' | 'dyeing' | 'dyeing_complete' | 'conning' | 'conning_complete' | 'packing' | 'packed'} OrderStatus
 */

/**
 * @type {Object.<OrderStatus, string>}
 */
export const ORDER_STATUS_LABELS = {
	received: "Received",
	dyeing: "Dyeing",
	dyeing_complete: "Dyeing Complete",
	conning: "Conning",
	conning_complete: "Conning Complete",
	packing: "Packing",
	packed: "Packed",
};

/**
 * @typedef {Object} StatusUpdate
 * @property {OrderStatus} status
 * @property {string} timestamp
 * @property {string} updatedBy
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} sdyNumber
 * @property {string} date
 * @property {string} partyName
 * @property {string} deliveryParty
 * @property {string} salespersonId
 * @property {string} denier
 * @property {string} slNumber
 * @property {OrderStatus} currentStatus
 * @property {StatusUpdate[]} statusHistory
 */
