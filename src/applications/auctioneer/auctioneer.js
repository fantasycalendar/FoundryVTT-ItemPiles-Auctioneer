import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import AuctioneerShell from "./auctioneer-shell.svelte";
import * as lib from "../../lib.js";
import CONSTANTS from "~/constants.js";

export default class Auctioneer extends SvelteApplication {

	static ID = "item-piles-bankers";

	constructor(options, dialogOptions) {
		super({
			id: `${Auctioneer.ID}-${options.auctioneer?.id}-${randomID()}`,
			title: options.auctioneer.name,
			...options,
		}, dialogOptions);
		this.actor = options.auctioneer;
	}

	onDropData(data){
		return this.store.onDropData(data);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			svelte: {
				class: AuctioneerShell,
				target: document.body,
			},
			classes: ["app window-app sheet item-piles-auctioneer"],
			zIndex: 100,
			width: 1000,
			height: CONSTANTS.AUCTION_UI_HEIGHT,
			closeOnSubmit: false,
			focusAuto: false,
		});
	}

	get store() {
		return this.svelte.applicationShell.store;
	}

	static async show(options = {}, dialogData = {}) {
		const app = lib.getActiveApps(`${Auctioneer.ID}-${options.auctioneer.id}`, true);
		if (app) {
			app.render(false, { focus: true });
			return;
		}
		return new Promise((resolve) => {
			options.resolve = resolve;
			new this(options, dialogData).render(true, { focus: true });
		})
	}



	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		const canConfigure = game.user.isGM;
		if (canConfigure) {
			buttons = [
				{
					label: !game.settings.get("item-piles", "hideActorHeaderText") ? "ITEM-PILES.HUD.Configure" : "",
					class: "item-piles-configure-pile",
					icon: "fas fa-box-open",
					onclick: () => {
						game.itempiles.API.showItemPileConfig(this.actor);
					}
				},
			].concat(buttons);
		}
		return buttons
	}

}
