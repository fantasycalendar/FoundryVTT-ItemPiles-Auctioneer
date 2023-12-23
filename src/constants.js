const module_name = "item_piles_auctioneer";
const module_path = `modules/${module_name}/`;

const CONSTANTS = {

	MODULE_NAME: module_name,
	PATH: module_path,
	FLAG: `flags.${module_name}`,
	DELETE_FLAG: `flags.-=${module_name}`,

	ITEM_PILES_MODULE: "item-piles",

	USER_AUCTIONEER_FLAGS: "user-auctioneer",
	AUCTIONS_FLAG: "auctions",
	BIDS_FLAG: "bids",
	BUYOUTS_FLAG: "buyouts",
	LOGS_FLAG: "logs",

	AUCTIONS_FULL_FLAG: `flags.${module_name}.auctions`,
	BIDS_FULL_FLAG: `flags.${module_name}.bids`,
	BUYOUTS_FULL_FLAG: `flags.${module_name}.buyouts`,
	LOGS_FULL_FLAG: `flags.${module_name}.logs`,

	AUCTIONEER: "auctioneer",

	AUCTION_UI_HEIGHT: 612,

	/**
	 * @typedef {Object} ActorFlagDefaults
	 * @property {boolean} auctioneerClosed
	 * @property {number} auctionFee
	 * @property {string} auctionDeposit
	 * @property {boolean} allowSecondaryCurrencies
	 * @property {boolean} enableMinimumBid
	 * @property {boolean} enableReserveLimit
	 * @property {boolean} visibleTimeLeft
	 * @property {string} auctionBidVisibility
	 * @property {string} reserveLimitVisibility
	 * @property {AuctionTimeType} timeType
	 * @property {string} minTimeLimit
	 * @property {string} maxTimeLimit
	 * @property {Item/boolean} entryItem
	 * @property {boolean} displayEntryItem
	 * @property {boolean} showActorName
	 * @property {Actor/boolean} owner
	 */
	ACTOR_DEFAULTS: {
		auctioneerClosed: false,
		showActorName: true,
		auctionFee: "@finalAuctionCost * 0.05",
		auctionDeposit: "@itemCost * 0.05",
		allowSecondaryCurrencies: true,
		enableMinimumBid: false,
		enableReserveLimit: false,
		visibleTimeLeft: false,
		allowBankerVaults: true,
		auctionBidVisibility: "user",
		reserveLimitVisibility: "visible",
		timeType: "realTime",
		minTimeLimit: "12hours",
		maxTimeLimit: "2days",
		entryItem: false,
		displayEntryItem: false,
		owner: false,
	},

	AUCTION_TIME_LIMITS: {
		"30minutes": "30 Minutes",
		"1hours": "1 Hour",
		"2hours": "2 Hours",
		"4hours": "4 Hours",
		"12hours": "12 Hours",
		"1days": "1 Day",
		"2days": "2 Days",
		"4days": "4 Days",
		"7days": "7 Days",
		"14days": "14 Days",
		"1months": "1 Month",
		"2months": "2 Months",
		"3months": "3 Months",
	},

	DEFAULTS: {
		/**
		 * @typedef {Object} Auction
		 * @property {String} id
		 * @property {String} userId
		 * @property {String} uuid
		 * @property {String} actorUuid
		 * @property {Object} item
		 * @property {String} startPrice
		 * @property {String} buyoutPrice
		 * @property {String} minBidPrice
		 * @property {String} reservePrice
		 * @property {String} depositPrice
		 * @property {Number} quantity
		 * @property {String} bidVisibility
		 * @property {Number} date
		 * @property {Number} expiryDate
		 */
		AUCTION: {
			id: "",
			userId: "",
			uuid: "AUCTIONID-AUCTIONEERUUID-USERUUID",
			actorUuid: "",
			itemData: {},
			startPrice: "",
			buyoutPrice: "",
			minBidPrice: "",
			reservePrice: "",
			depositPrice: "",
			quantity: 1,
			bidVisibility: "visible",
			reserveLimitVisibility: "visible",
			claimed: false,
			gmClaimed: false,
			cancelled: false,
			date: 0,
			expiryDate: 0,
			claimedDate: 0
		},
		/**
		 * @typedef {Object} Bid
		 * @property {String} id
		 * @property {String} userId
		 * @property {String} auctionUuid
		 * @property {Number} price
		 * @property {Number} date
		 */
		BID: {
			id: "",
			userId: "",
			auctionUuid: "",
			actorUuid: "",
			price: "",
			date: 0,
			claimedDate: 0,
			claimed: false
		},
		/**
		 * @typedef {Object} Buyout
		 * @property {String} id
		 * @property {String} userId
		 * @property {String} auctionUuid
		 * @property {Number} price
		 * @property {Number} date
		 */
		BUYOUT: {
			id: "",
			userId: "",
			auctionUuid: "",
			actorUuid: "",
			price: "",
			date: 0,
			claimedDate: 0,
			claimed: false
		},
	}
}

/**
 * @typedef AuctionTimeTypeKey
 * @type {{SIMPLE_CALENDAR: string, REAL_TIME: string}}
 */
CONSTANTS.AUCTION_TIME_TYPE_KEYS = {
	REAL_TIME: "realTime",
	SIMPLE_CALENDAR: "simpleCalendar"
}

/**
 * @typedef AuctionTimeType
 * @property {Object<{AuctionTimeTypeKey, string}>}
 */
CONSTANTS.AUCTION_TIME_TYPE = {
	[CONSTANTS.AUCTION_TIME_TYPE_KEYS.REAL_TIME]: "Real Time",
	[CONSTANTS.AUCTION_TIME_TYPE_KEYS.SIMPLE_CALENDAR]: "Simple Calendar"
}

CONSTANTS.VISIBILITY_KEYS = {
	USER: "user",
	VISIBLE: "visible",
	HIDDEN: "hidden"
}

CONSTANTS.BID_VISIBILITY_LABELS = {
	[CONSTANTS.VISIBILITY_KEYS.USER]: "Players can choose",
	[CONSTANTS.VISIBILITY_KEYS.VISIBLE]: "Always visible bids",
	[CONSTANTS.VISIBILITY_KEYS.HIDDEN]: "Always blind bids"
}

CONSTANTS.BID_VISIBILITY_UI_LABELS = {
	[CONSTANTS.VISIBILITY_KEYS.VISIBLE]: "Visible",
	[CONSTANTS.VISIBILITY_KEYS.HIDDEN]: "Blind"
}

CONSTANTS.RESERVE_VISIBILITY_LABELS = {
	[CONSTANTS.VISIBILITY_KEYS.USER]: "Players can choose",
	[CONSTANTS.VISIBILITY_KEYS.VISIBLE]: "Always visible reserve",
	[CONSTANTS.VISIBILITY_KEYS.HIDDEN]: "Always hidden reserve"
}

CONSTANTS.AUCTIONEER_SETTINGS = {
	auctioneerClosed: {
		title: "Closed",
		label: "This setting determines whether the auctioneer is closed or open.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.auctioneerClosed
	},
	showActorName: {
		title: "Display Character Name",
		label: "This setting determines whether the names displayed on auctions and bids should be the character names rather than the user names.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.showActorName
	},
	auctionFee: {
		title: "Auction Fee Formula",
		label: "This is the percentage of the total sell price that the auctioneer takes as a cut from any successful auction.",
		type: String,
		value: CONSTANTS.ACTOR_DEFAULTS.auctionFee
	},
	auctionDeposit: {
		title: "Deposit Fee Formula",
		label: "This is the formula to calculate the price that someone must pay to put up an auction. This is returned to the creator of the auction if the auction is successful, but kept by the auctioneer if failed",
		type: String,
		value: CONSTANTS.ACTOR_DEFAULTS.auctionDeposit
	},
	auctionBidVisibility: {
		title: "Bid Visibility",
		label: "This configures whether the user has control over the visibility of bids on their auctions, or whether it is forced to be visible or blind.",
		type: String,
		options: CONSTANTS.BID_VISIBILITY_LABELS,
		value: CONSTANTS.ACTOR_DEFAULTS.auctionBidVisibility
	},
	allowSecondaryCurrencies: {
		title: "Allow Secondary Currencies",
		label: "This determines whether the auctioneer accepts secondary currencies for its auctions",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.allowSecondaryCurrencies
	},
	visibleTimeLeft: {
		title: "Show full time left",
		label: "When enabled, instead of 'very long' or 'short' strings for auction duration, this will show an exact amount of time left before auctions expire.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.visibleTimeLeft
	},
	enableMinimumBid: {
		title: "Enable Minimum Bid Limit",
		label: "When enabled, players can set a minimum bid amount on an auction that each bid must have to be placed on it.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.enableMinimumBid
	},
	enableReserveLimit: {
		title: "Enable Reserve Limit",
		label: "When enabled, players can set a minimum amount their auction must reach before being sold; if the auction's fails to reach this amount, the auction fails and is returned to the owner.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.enableReserveLimit
	},
	reserveLimitVisibility: {
		title: "Reserve Limit Visibility",
		label: "This configures whether the user has control over the visibility of the reserve limit, or whether it is forced to be visible or hidden.",
		type: String,
		options: CONSTANTS.RESERVE_VISIBILITY_LABELS,
		value: CONSTANTS.ACTOR_DEFAULTS.reserveLimitVisibility
	},
	timeType: {
		title: "Time Tracking Type",
		label: "This determines what tracks the time of auctions of this auctioneer.",
		type: String,
		options: CONSTANTS.AUCTION_TIME_TYPE,
		value: CONSTANTS.ACTOR_DEFAULTS.timeType
	},
	minTimeLimit: {
		title: "Minimum Time Limit",
		label: "This determines what the shortest duration an auction can run for.",
		type: String,
		options: CONSTANTS.AUCTION_TIME_LIMITS,
		value: CONSTANTS.ACTOR_DEFAULTS.minTimeLimit
	},
	maxTimeLimit: {
		title: "Maximum Time Limit",
		label: "This determines what the longest duration an auction can run for.",
		type: String,
		options: CONSTANTS.AUCTION_TIME_LIMITS,
		value: CONSTANTS.ACTOR_DEFAULTS.maxTimeLimit
	},
	allowBankerVaults: {
		title: "Allow banker vault impersonation",
		label: "When enabled, this allows users to impersonate the vaults connected to bankers when interacting with the auctioneer. They can buy and sell items with it.",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.allowBankerVaults
	},
	entryItem: {
		title: "Entry Item",
		label: "This configures an item that the character must possess in their inventory in order to access the auction house.",
		type: Item,
		value: CONSTANTS.ACTOR_DEFAULTS.entryItem
	},
	displayEntryItem: {
		title: "Display Entry Item",
		label: "This determines whether the auctioneer accepts secondary currencies for its auctions",
		type: Boolean,
		value: CONSTANTS.ACTOR_DEFAULTS.displayEntryItem
	},
	owner: {
		title: "Owner",
		label: "This configures whether a character owns this auctioneer or not. All auction fees and deposit fees are sent to this character's inventory when a GM logs on.",
		type: Actor,
		value: CONSTANTS.ACTOR_DEFAULTS.owner
	},
};

export default CONSTANTS;
