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

	AUCTIONEER: "auctioneer",

	AUCTION_UI_HEIGHT: 612,

	/**
	 * @typedef {Object} ActorFlagDefaults
	 * @property {number} auctionFee
	 * @property {boolean} allowSecondaryCurrencies
	 * @property {boolean} enableMinimumBid
	 * @property {boolean} enableReserveLimit
	 * @property {string} auctionBidVisibility
	 * @property {string} reserveLimitVisibility
	 * @property {AuctionTimeType} timeType
	 * @property {string} minTimeLimit
	 * @property {string} maxTimeLimit
	 */
	ACTOR_DEFAULTS: {
		auctionFee: 5,
		allowSecondaryCurrencies: true,
		enableMinimumBid: false,
		enableReserveLimit: false,
		auctionBidVisibility: "user",
		reserveLimitVisibility: "visible",
		timeType: "realTime",
		minTimeLimit: "12hours",
		maxTimeLimit: "2days",
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
		 * @property {String} uuid
		 * @property {String} ownerActorUuid
		 * @property {Object} item
		 * @property {Number} startPrice
		 * @property {Number} buyoutPrice
		 * @property {Number} quantity
		 * @property {String} bidVisibility
		 * @property {Number} date
		 * @property {Number} expiryDate
		 */
		AUCTION: {
			id: "",
			uuid: "AUCTIONID-AUCTIONEERUUID-USERUUID",
			actorUuid: "",
			itemData: {},
			startPrice: "",
			buyoutPrice: "",
			minBidPrice: "",
			reservePrice: "",
			quantity: 1,
			bidVisibility: "visible",
			reserveLimitVisibility: "visible",
			claimed: false,
			cancelled: false,
			date: 0,
			expiryDate: 0,
			claimedDate: 0
		},
		/**
		 * @typedef {Object} Bid
		 * @property {String} id
		 * @property {String} auctionUuid
		 * @property {Number} price
		 * @property {Number} date
		 */
		BID: {
			id: "",
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
		 * @property {String} auctionUuid
		 * @property {Number} price
		 * @property {Number} date
		 */
		BUYOUT: {
			id: "",
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
	auctionFee: {
		title: "Auction Fee",
		label: "This is the percentage cut the auctioneer takes of any successful auction.",
		type: Number,
		value: CONSTANTS.ACTOR_DEFAULTS.auctionFee
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
	entryItem: {
		title: "Entry Item",
		label: "Doesn't work yet.",
		type: Item,
		value: {}
	}
};

export default CONSTANTS;
