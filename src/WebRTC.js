/*
	https://webrtc.org/
	https://www.w3.org/TR/webrtc/
	https://developer.mozilla.org/pt-BR/docs/Web/API/WebRTC_API
	https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/
*/

class WebRTC {

	#room;

	#id;
	#RTCAnswerOptions;
	#RTCConfiguration;
	#RTCOfferOptions;
	#stream;

	#onBeforeSendOffer;
	#onBeforeSendAnswer;
	#onBeforeCreateOffer;
	#onBeforeCreateAnswer;
	#onCallback;
	#onSignaler;
	#onOpen;
	#onDataChannel;
	#onMessage;
	#onClose;
	#onError;

	#participants;

	constructor(room, {
		id = null,
		RTCAnswerOptions,
		RTCConfiguration,
		RTCOfferOptions,
		stream = null,
		onBeforeSendAnswer = (participantId, e) => console.log('beforeSendAnswer', participantId, e),
		onBeforeSendOffer = (participantId, e) => console.log('beforeSendOffer', participantId, e),
		onBeforeCreateAnswer = (participantId, e) => console.log('beforeCreateAnswer', participantId, e),
		onBeforeCreateOffer = (participantId, e) => console.log('beforeCreateOffer', participantId, e),
		onCallback = (participantId, e) => console.log('callback', participantId, e),
		onClose = (participantId, e) => console.log('close', participantId, e),
		onDataChannel = (participantId, e) => console.log('dataChannel', participantId, e),
		onError = (participantId, e) => console.log('error', participantId, e),
		onMessage = (participantId, e) => console.log('message', participantId, e),
		onOpen = (participantId, e) => console.log('open', participantId, e),
		onSignaler = e => console.log('signaler', e)
	} = {}) {

		this.room = room;

		this.#id = id || crypto.randomUUID();
		this.RTCAnswerOptions = RTCAnswerOptions;
		this.RTCConfiguration = RTCConfiguration;
		this.RTCOfferOptions = RTCOfferOptions;
		this.stream = stream;


		if (!(onBeforeSendAnswer instanceof Function)) {

			throw new TypeError('Unsupported onBeforeSendAnswer');

		} else if (!(onBeforeSendOffer instanceof Function)) {

			throw new TypeError('Unsupported onBeforeSendOffer');

		} else if (!(onBeforeCreateAnswer instanceof Function)) {

			throw new TypeError('Unsupported onBeforeCreateAnswer');

		} else if (!(onBeforeCreateOffer instanceof Function)) {

			throw new TypeError('Unsupported onBeforeCreateOffer');

		} else if (!(onCallback instanceof Function)) {

			throw new TypeError('Unsupported onCallback');

		} else if (!(onClose instanceof Function)) {

			throw new TypeError('Unsupported onClose');

		} else if (!(onDataChannel instanceof Function)) {

			throw new TypeError('Unsupported onDataChannel');

		} else if (!(onError instanceof Function)) {

			throw new TypeError('Unsupported onError');

		} else if (!(onOpen instanceof Function)) {

			throw new TypeError('Unsupported onOpen');

		} else if (!(onMessage instanceof Function)) {

			throw new TypeError('Unsupported onMessage');

		} else if (!(onSignaler instanceof Function)) {

			throw new TypeError('Unsupported onSignaler');

		}


		this.#onBeforeSendAnswer = onBeforeSendAnswer;
		this.#onBeforeSendOffer = onBeforeSendOffer;
		this.#onBeforeCreateAnswer = onBeforeCreateAnswer;
		this.#onBeforeCreateOffer = onBeforeCreateOffer;
		this.#onCallback = onCallback;
		this.#onClose = onClose;
		this.#onDataChannel = onDataChannel;
		this.#onError = onError;
		this.#onOpen = onOpen;
		this.#onMessage = onMessage;
		this.#onSignaler = onSignaler;


		this.#participants = {};

	}

	get room() { return this.#room; };
	get id() { return this.#id; };
	get stream() { return this.#stream; }
	get RTCConfiguration() { return this.#RTCConfiguration; }
	get RTCOfferOptions() { return this.#RTCOfferOptions; }
	get RTCAnswerOptions() { return this.#RTCAnswerOptions; }
	get participants() { return Object.keys(this.#participants); }

}