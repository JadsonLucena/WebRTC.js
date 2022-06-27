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


		this.signalInvite();

	}

	get room() { return this.#room; };
	get id() { return this.#id; };
	get stream() { return this.#stream; }
	get RTCConfiguration() { return this.#RTCConfiguration; }
	get RTCOfferOptions() { return this.#RTCOfferOptions; }
	get RTCAnswerOptions() { return this.#RTCAnswerOptions; }
	get participants() { return Object.keys(this.#participants); }

	set room(room) {

		if (!['string', 'number'].includes(typeof room)) {

			throw new TypeError('Unsupported Room');

		}

		this.#room = room;

	}

	set stream(stream) {

		if (stream && !(stream instanceof MediaStream)) {

			throw new TypeError('Unsupported Stream');

		}

		this.#stream = stream;

	}

	set RTCConfiguration({ // https://www.w3.org/TR/webrtc/#rtcconfiguration-dictionary
		bundlePolicy = 'balanced', //max-compat
		certificates = [],
		iceCandidatePoolSize = 0,
		iceServers = [], // https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
		iceTransportPolicy = 'all',
		rtcpMuxPolicy = 'require',
		sdpSemantics = 'unified-plan' // https://webrtc.org/getting-started/unified-plan-transition-guide
	} = {}) {

		this.#RTCConfiguration = { bundlePolicy, certificates, iceCandidatePoolSize, iceServers, iceTransportPolicy, rtcpMuxPolicy, sdpSemantics };

	}

	set RTCOfferOptions({ // https://www.w3.org/TR/webrtc/#dictionary-rtcofferoptions-members
		iceRestart = false, // To restart ICE on an active connection
		offerToReceiveAudio = true, // legacy property
		offerToReceiveVideo = true, // legacy property
		voiceActivityDetection = true // Send audio data when there's actually something to broadcast
	} = {}) {

		this.#RTCOfferOptions = { iceRestart, offerToReceiveAudio, offerToReceiveVideo, voiceActivityDetection };

	}

	set RTCAnswerOptions({ // https://www.w3.org/TR/webrtc/#dictionary-rtcofferansweroptions-members
		iceRestart = false,
		voiceActivityDetection = true
	} = {}) {

		this.#RTCAnswerOptions = { iceRestart, voiceActivityDetection };

	}

	signalInvite(participantId = 'broadcast') {

		this.#onSignaler({room: this.#room, fromId: this.#id, toId: participantId, data: { type: 'invite' }});

	}

	#createOffer(participantId, RTCOfferOptions = this.#RTCOfferOptions) {

		return this.#participants[participantId].pc.createOffer(RTCOfferOptions).then(offer => {

			return this.#participants[participantId].pc.setLocalDescription(offer).then(async () => {

				await this.#onBeforeSendOffer(participantId, {
					connectionState: this.#participants[participantId].pc.connectionState,
					iceConnectionState: this.#participants[participantId].pc.iceConnectionState,
					iceGatheringState: this.#participants[participantId].pc.iceGatheringState,
					signalingState: this.#participants[participantId].pc.signalingState
				});

				this.#onSignaler({room: this.#room, fromId: this.#id, toId: participantId, data: this.#participants[participantId].pc.localDescription});

			}).catch(e => this.#onError(participantId, e));

		}).catch(e => this.#onError(participantId, e));

	}

	close(participantId) {

		this.#participants[participantId].pc.close();

		return delete this.#participants[participantId];

	}

	// https://www.w3.org/TR/webrtc/#dom-rtcofferoptions-icerestart
	restart(participantId, RTCOfferOptions = this.#RTCOfferOptions) {

		return Boolean(this.#createOffer(participantId, Object.assign(RTCOfferOptions, {iceRestart: true})));

		// this.#onSignaler({room: room, fromId: this.#id, toId: participantId, data: { type: 'invite' }});

		// return this.close(participantId);

	}

	#createPeerConnection(participantId) {

		if (!(participantId in this.#participants)) {

			let peer = {
				pc: new RTCPeerConnection(this.#RTCConfiguration),
				dc: {}
			};

			// connection.onaddstream = e => this.#onCallback(participantId, e);
			peer.pc.onconnectionstatechange = e => {

				this.#onCallback(participantId, e);

				switch (e.target.connectionState) {
					case 'new':

						// Connecting...

					break;
					case 'connecting':

						// Connecting...

					break;
					case 'connected':

						this.#onOpen(participantId, e);

					break;
					case 'disconnected':

						// Disconnecting...

					break;
					case 'failed':

						this.#onError(participantId, e);

						if (e.target.iceConnectionState == 'disconnected' && e.target.iceGatheringState == 'complete' ) {

							this.close(participantId);

							this.#onClose(participantId, e);

						}

					break;
					case 'closed':

						this.close(participantId);

						this.#onClose(participantId, e);

					break;
				}

			};
			peer.pc.ondatachannel = e => {

				this.#onCallback(participantId, e);

				peer.dc[e.channel.label] = e.channel;
				peer.dc[e.channel.label].onopen = e => this.#onDataChannel(participantId, e);
				peer.dc[e.channel.label].onmessage = e => this.#onMessage(participantId, e);
				peer.dc[e.channel.label].onerror = e => this.#onDataChannel(participantId, e);
				peer.dc[e.channel.label].onclosing = e => this.#onDataChannel(participantId, e);
				peer.dc[e.channel.label].onclose = e => this.#onDataChannel(participantId, e);

			};
			peer.pc.onicecandidate = e => {

				this.#onCallback(participantId, e);

				if (e.candidate) {

					this.#onSignaler({room: this.#room, fromId: this.#id, toId: participantId, data: e.candidate});

				}

			};
			peer.pc.onicecandidateerror = e => {

				this.#onError(participantId, e);

				if (e.errorCode >= 300 && e.errorCode <= 699) {
					/*
						STUN errors are in the range 300-699. See RFC 5389, section 15.6
						for a list of codes. TURN adds a few more error codes; see
						RFC 5766, section 15 for details.
					*/
				} else if (e.errorCode >= 700 && e.errorCode <= 799) {
					/*
						Server could not be reached; a specific error number is
						provided but these are not yet specified.
					*/
				}

			};
			peer.pc.oniceconnectionstatechange = e => {

				this.#onCallback(participantId, e);

				switch (e.target.iceConnectionState) {
					case 'new':

					break;
					case 'checking':

					break;
					case 'connected':

					break;
					case 'completed':

					break;
					case 'disconnected':

					break;
					case 'failed':

						if ('restartIce' in e.target) {

							e.target.restartIce();

						} else { // backwards compatibility

							this.#createOffer(participantId, Object.assign(this.#RTCOfferOptions, {iceRestart: true}));

						}

					break;
					case 'closed':

					break;
				}

			};
			peer.pc.onicegatheringstatechange = e => this.#onCallback(participantId, e);
			peer.pc.onnegotiationneeded = async e => {

				this.#onCallback(participantId, e);

				switch (e.target.iceGatheringState) {
					case 'new':

						/*for (let track of (this.#stream ? this.#stream.getTracks() : [])) {

							await this.addTrack(participantId, track, this.#stream);

						}

						await this.#onBeforeCreateOffer(participantId, {
							connectionState: this.#participants[participantId].pc.connectionState,
							iceConnectionState: this.#participants[participantId].pc.iceConnectionState,
							iceGatheringState: this.#participants[participantId].pc.iceGatheringState,
							signalingState: this.#participants[participantId].pc.signalingState
						});

						this.#createOffer(participantId, this.#RTCOfferOptions);*/

					break;
					default:

						this.#createOffer(participantId, Object.assign(this.#RTCOfferOptions, {iceRestart: true}));

				}

			};
			peer.pc.onsignalingstatechange = e => this.#onCallback(participantId, e);
			peer.pc.ontrack = e => this.#onCallback(participantId, e);

			return peer;

		} else {

			return this.#participants[participantId];

		}

	}

	addTrack(participantId, mediaStreamTrack, mediaStream = null) {

		let transceiver = this.#participants[participantId].pc.getTransceivers().find(transceiver => transceiver.receiver.track?.kind == mediaStreamTrack.kind && !transceiver.sender.track);

		if (transceiver) { // reuse transceivers

			transceiver.direction = 'sendrecv';

			if ('setStreams' in transceiver.sender && mediaStream) {

				transceiver.sender.setStreams(mediaStream);

			}

			return transceiver.sender.replaceTrack(mediaStreamTrack);

		} else {

			try {

				return Promise.resolve(this.#participants[participantId].pc.addTrack(mediaStreamTrack, mediaStream));

			} catch (err) {

				return Promise.reject(err);

			}

		}

	}

	replaceTrack(participantId, trackId, mediaStreamTrack) {

		let sender = this.#participants[participantId].pc.getSenders().find(sender => sender.track?.id == trackId);

		if (!sender) {

			return Promise.reject(new ReferenceError('trackId not found'));

		}

		return sender.replaceTrack(mediaStreamTrack);

	}

	removeTrack(participantId, trackId) {

		let sender = this.#participants[participantId].pc.getSenders().find(sender => sender.track?.id == trackId);

		if (!sender) {

			throw new ReferenceError('trackId not found');

		}

		this.#participants[participantId].pc.removeTrack(sender);

		return !Boolean(this.#participants[participantId].pc.getSenders().find(sender => sender.track?.id == trackId));

	}

	// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
	async signaler({room, fromId, toId, data}) {

		if (room == this.#room && fromId != this.#id && (toId == this.#id || toId == 'broadcast')) {

			switch (data.type) {
				case 'invite':

					this.#participants[fromId] = this.#createPeerConnection(fromId);

					for (let track of (this.#stream ? this.#stream.getTracks() : [])) {

						await this.addTrack(fromId, track, this.#stream);

					}

					await this.#onBeforeCreateOffer(fromId, {
						connectionState: this.#participants[fromId].pc.connectionState,
						iceConnectionState: this.#participants[fromId].pc.iceConnectionState,
						iceGatheringState: this.#participants[fromId].pc.iceGatheringState,
						signalingState: this.#participants[fromId].pc.signalingState
					});

					await this.#createOffer(fromId, this.#RTCOfferOptions);

				break;
				case 'offer':

					if (fromId in this.#participants) {

						if (this.#participants[fromId].pc.signalingState == 'have-local-offer') { // Deals with competition between two pairs

							if (this.#id < fromId) {

								await this.#participants[fromId].pc.setLocalDescription({type: 'rollback'}).catch(e => this.#onError(fromId, e));

								if (this.#participants[fromId].pc.signalingState != 'stable') {

									this.close(fromId);
									this.#participants[fromId] = this.#createPeerConnection(fromId);

								}

							} else {

								return null;

							}

						}

					} else {

						this.#participants[fromId] = this.#createPeerConnection(fromId);

					}

					await this.#participants[fromId].pc.setRemoteDescription(data).then(async () => {

						if (this.#participants[fromId].pc.iceGatheringState == 'new') { // don't set the tracks on a restartIce

							for (let track of (this.#stream ? this.#stream.getTracks() : [])) {

								await this.addTrack(fromId, track, this.#stream);

							}

						}

						await this.#onBeforeCreateAnswer(fromId, {
							connectionState: this.#participants[fromId].pc.connectionState,
							iceConnectionState: this.#participants[fromId].pc.iceConnectionState,
							iceGatheringState: this.#participants[fromId].pc.iceGatheringState,
							signalingState: this.#participants[fromId].pc.signalingState
						});

						this.#participants[fromId].pc.createAnswer(this.#RTCAnswerOptions).then(answer => {

							this.#participants[fromId].pc.setLocalDescription(answer).then(async () => {

								await this.#onBeforeSendAnswer(fromId, {
									connectionState: this.#participants[fromId].pc.connectionState,
									iceConnectionState: this.#participants[fromId].pc.iceConnectionState,
									iceGatheringState: this.#participants[fromId].pc.iceGatheringState,
									signalingState: this.#participants[fromId].pc.signalingState
								});

								this.#onSignaler({room: this.#room, fromId: this.#id, toId: fromId, data: this.#participants[fromId].pc.localDescription});

							}).catch(e => this.#onError(fromId, e));

						}).catch(e => this.#onError(fromId, e));

					}).catch(e => this.#onError(fromId, e));


				break;
				case 'answer':

					if (this.#participants[fromId].pc.signalingState == 'have-local-offer') {

						await this.#participants[fromId].pc.setRemoteDescription(data).catch(e => this.#onError(fromId, e));

					}

				break;
				default: // icecandidate

					await this.#participants[fromId].pc.addIceCandidate(data).catch(e => this.#onError(fromId, e));

			}

		}

	}

	addTransceiver(participantId, trackOrKind, { // https://www.w3.org/TR/webrtc/#dictionary-rtcrtptransceiverinit-members
		direction = 'sendrecv',
		sendEncodings = [{ // https://www.w3.org/TR/webrtc/#rtcrtpencodingparameters
			active: true,
			// maxBitrate: undefined, // 44100 * 1000
			// scaleResolutionDownBy: 1.0
		}],
		streams = this.#stream ? [this.#stream] : []
	} = {}) {

		return Boolean(this.#participants[participantId].pc.addTransceiver(trackOrKind, { direction, sendEncodings, streams }));

	}

	getTransceivers(participantId) {

		return this.#participants[participantId].pc.getTransceivers().map(transceiver => {

			return {
				direction: transceiver.direction,
				mid: transceiver.mid,
				stopped: transceiver.stopped,
				sender: {
					dtmf: transceiver.sender?.dtmf,
					parameters: {
						codecs: transceiver.sender?.getParameters()?.codecs,
						encodings: transceiver.sender?.getParameters()?.encodings?.map(encoding => {
		
							return Object.assign({
								'active': encoding.active,
								'maxBitrate': encoding.maxBitrate
							}, transceiver.sender?.track?.kind == 'video' ? {
								'scaleResolutionDownBy': encoding.scaleResolutionDownBy
							} : {});
		
						})
					},
					track: transceiver.sender?.track
				},
				receiver: {
					dtmf: transceiver.receiver?.dtmf,
					parameters: {
						codecs: transceiver.receiver?.getParameters()?.codecs,
						encodings: transceiver.receiver?.getParameters()?.encodings?.map(encoding => {
		
							return Object.assign({
								'active': encoding.active,
								'maxBitrate': encoding.maxBitrate
							}, transceiver.receiver?.track?.kind == 'video' ? {
								'scaleResolutionDownBy': encoding.scaleResolutionDownBy
							} : {});
		
						})
					},
					track: transceiver.receiver?.track
				}
				
			};

		});

	}

	stopTransceiver(participantId, mid) {

		let transceiver = this.#participants[participantId].pc.getTransceivers().find(transceiver => transceiver.mid == mid);

		if (!transceiver) {

			throw new ReferenceError('mid not found');

		}

		transceiver.stop();

		return transceiver.direction == 'stopped';

	}

	// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/WebRTC_codecs#customizing_the_codec_list
	setCodecPreferences(participantId, kind, RTCRtpCodecCapability = [{
		// https://www.w3.org/TR/webrtc/#rtcrtpcodeccapability
	}]) {

		if (!['audio', 'video'].includes(kind)) {

			throw new TypeError('Unsupported kind');

		} else if (!Array.isArray(RTCRtpCodecCapability) || !RTCRtpCodecCapability.every(RTCRtpCodecCapability => typeof RTCRtpCodecCapability == 'object' && !['mimeType', 'clockRate', 'channels', 'sdpFmtpLine'].every(attr => !(attr in RTCRtpCodecCapability)))) {

			throw new TypeError('Unsupported RTCRtpCodecCapability');

		}


		let transceivers = this.#participants[participantId].pc.getTransceivers().filter(transceiver => transceiver.sender.track?.kind == kind);

		if (transceivers.length == 0) {

			throw new ReferenceError('kind not found');

		}

		let allCodecs = RTCRtpSender.getCapabilities('video').codecs.concat(RTCRtpReceiver.getCapabilities('video').codecs).map(codec => JSON.stringify(codec)).filter((codec, index, arr) => arr.indexOf(codec) == index).map(codec => JSON.parse(codec));
		let preferredCodecs = RTCRtpCodecCapability.map(dictionary => allCodecs.filter(codecCapability => {

			if ('mimeType' in dictionary && dictionary.mimeType != codecCapability.mimeType) return false;
			else if ('clockRate' in dictionary && dictionary.clockRate != codecCapability.clockRate) return false;
			else if ('channels' in dictionary && dictionary.channels != codecCapability.channels) return false;
			else if ('sdpFmtpLine' in dictionary && dictionary.sdpFmtpLine != codecCapability.sdpFmtpLine) return false;

			return true;

		})).reduce((acc, cur) => acc.concat(cur), []);

		if (preferredCodecs.length == 0) {

			return false;

		}

		let otherCodecs = allCodecs.filter(codec => preferredCodecs.indexOf(codec) == -1);

		transceivers.forEach(transceiver => transceiver.setCodecPreferences(preferredCodecs.concat(otherCodecs)));

		// if (this.#participants[participantId].pc.iceGatheringState == 'complete') {
		if (this.#participants[participantId].pc.iceGatheringState != 'new') {

			if ('restartIce' in this.#participants[participantId].pc) {

				this.#participants[participantId].pc.restartIce();

			} else { // backwards compatibility

				this.#createOffer(participantId, Object.assign(this.#RTCOfferOptions, {iceRestart: true}));

			}

		}

		return true;

	}

	setEncodings(participantId, trackId, { // https://www.w3.org/TR/webrtc/#rtcrtpencodingparameters
		active = true,
		maxBitrate = undefined, // 44100 * 1000
		scaleResolutionDownBy = 1.0
	}, index = 0) {

		let sender = this.#participants[participantId].pc.getSenders().find(sender => sender.track?.id == trackId);

		if (!sender) {

			return Promise.reject(new ReferenceError('trackId not found'));

		}

		const paramsSender = sender.getParameters();
		if (paramsSender.encodings?.length) paramsSender.encodings = [{}]; // Firefox workaround!

		paramsSender.encodings[index].active = active;

		if (maxBitrate) {

			paramsSender.encodings[index].maxBitrate = maxBitrate;

		} else {

			delete paramsSender.encodings[index].maxBitrate;

		}

		if (sender.track?.kind == 'video') {

			if (scaleResolutionDownBy != 1.0) {

				paramsSender.encodings[index].scaleResolutionDownBy = scaleResolutionDownBy;

			} else {

				delete paramsSender.encodings[index].scaleResolutionDownBy;

			}

		}

		return sender.setParameters(paramsSender);

	}

	createDataChannel(participantId, label, { // https://www.w3.org/TR/webrtc/#dictionary-rtcdatachannelinit-members
		binaryType = 'blob', // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/binaryType
		id = undefined,
		maxPacketLifeTime = undefined,
		maxRetransmits = undefined,
		negotiated = false,
		ordered = true,
		protocol = ''
	} = {}) {

		if (!['blob', 'arraybuffer'].includes(binaryType)) {

			throw new TypeError('Unsupported binaryType');

		}


		this.#participants[participantId].dc[label] = this.#participants[participantId].pc.createDataChannel(label, { id, maxPacketLifeTime, maxRetransmits, negotiated, ordered, protocol });
		this.#participants[participantId].dc[label].onopen = e => this.#onDataChannel(participantId, e);
		this.#participants[participantId].dc[label].onmessage = e => this.#onMessage(participantId, e);
		this.#participants[participantId].dc[label].onerror = e => this.#onDataChannel(participantId, e);
		this.#participants[participantId].dc[label].onclosing = e => this.#onDataChannel(participantId, e);
		this.#participants[participantId].dc[label].onclose = e => this.#onDataChannel(participantId, e);


		try {

			this.#participants[participantId].dc[label].binaryType = binaryType;

		} catch(err) {

			console.error(err);

		}


		return Boolean(this.#participants[participantId].dc[label]);

	}

	sendMessage(participantId, label, data) {

		if (this.#participants[participantId].dc[label].readyState == 'open') {

			this.#participants[participantId].dc[label].send(data);

			return true;

		} else {

			return false;

		}

	}

	closeDataChannel(participantId, label) {

		this.#participants[participantId].dc[label].close();

		return delete this.#participants[participantId].dc[label];

	}

	/*
		https://w3c.github.io/webrtc-stats/
		https://www.w3.org/TR/webrtc/#sec.stats-model
	*/
	async getStats(participantId, mediaStreamTrack = null, humanReadable = false) {

		let raw = await this.#participants[participantId].pc.getStats(mediaStreamTrack);

		return humanReadable ? raw.then(lines => { // human-readable

			let stats = {
				local: {
					network: {
						iceServer: null,
						ip: null,
						port: null,
						protocol: null,
						type: null
					},

					availableIncomingBitrate: null,
					availableOutgoingBitrate: null,
					bytesDiscardedOnSend: null,
					bytesReceived: null,
					bytesSent: null,
					circuitBreakerTriggerCount: null,
					consentExpiredTimestamp: null,
					consentRequestBytesSent: null,
					consentRequestsSent: null,
					currentRoundTripTime: null,
					firstRequestTimestamp: null,
					lastPacketReceivedTimestamp: null,
					lastPacketSentTimestamp: null,
					lastRequestTimestamp: null,
					lastResponseTimestamp: null,
					packetsDiscardedOnSend: null,
					packetsReceived: null,
					packetsSent: null,
					requestBytesSent: null,
					requestsReceived: null,
					requestsSent: null,
					responseBytesSent: null,
					responsesReceived: null,
					responsesSent: null,
					retransmissionsReceived: null,
					retransmissionsSent: null,
					state: null,
					totalRoundTripTime: null,

					inbound: {
						audio: {
							tracks: [],
							codec: {},

							averageRtcpInterval: {},
							burstDiscardCount: {},
							burstDiscardRate: {},
							burstLossCount: {},
							burstLossRate: {},
							burstPacketsDiscarded: {},
							burstPacketsLost: {},
							bytesReceived: {},
							estimatedPlayoutTimestamp: {},
							fecPacketsDiscarded: {},
							fecPacketsReceived: {},
							gapDiscardRate: {},
							gapLossRate: {},
							headerBytesReceived: {},
							jitter: {},
							jitterBufferDelay: {},
							jitterBufferEmittedCount: {},
							lastPacketReceivedTimestamp: {},
							nackCount: {},
							packetsDiscarded: {},
							packetsDuplicated: {},
							packetsFailedDecryption: {},
							packetsLost: {},
							packetsReceived: {},
							packetsRepaired: {},
							perDscpPacketsReceived: {},
							ssrc: {},
							totalProcessingDelay: {},

							audioLevel: {},
							concealedSamples: {},
							concealmentEvents: {},
							insertedSamplesForDeceleration: {},
							removedSamplesForAcceleration: {},
							samplesDecodedWithCelt: {},
							samplesDecodedWithSilk: {},
							silentConcealedSamples: {},
							totalAudioEnergy: {},
							totalSamplesDecoded: {},
							totalSamplesDuration: {},
							totalSamplesReceived: {},
							voiceActivityFlag: {},

						},
						video: {
							tracks: [],
							codec: {},

							averageRtcpInterval: {},
							burstDiscardCount: {},
							burstDiscardRate: {},
							burstLossCount: {},
							burstLossRate: {},
							burstPacketsDiscarded: {},
							burstPacketsLost: {},
							bytesReceived: {},
							estimatedPlayoutTimestamp: {},
							fecPacketsDiscarded: {},
							fecPacketsReceived: {},
							gapDiscardRate: {},
							gapLossRate: {},
							headerBytesReceived: {},
							jitter: {},
							jitterBufferDelay: {},
							jitterBufferEmittedCount: {},
							lastPacketReceivedTimestamp: {},
							nackCount: {},
							packetsDiscarded: {},
							packetsDuplicated: {},
							packetsFailedDecryption: {},
							packetsLost: {},
							packetsReceived: {},
							packetsRepaired: {},
							perDscpPacketsReceived: {},
							ssrc: {},
							totalProcessingDelay: {},

							firCount: {},
							frameBitDepth: {},
							frameHeight: {},
							framesDecoded: {},
							framesDropped: {},
							framesPerSecond: {},
							framesReceived: {},
							frameWidth: {},
							fullFramesLost: {},
							keyFramesDecoded: {},
							partialFramesLost: {},
							pliCount: {},
							qpSum: {},
							sliCount: {},
							totalDecodeTime: {},
							totalInterFrameDelay: {},
							totalSquaredInterFrameDelay: {},

						}
					},
					outbound: {
						audio: {
							tracks: [],
							codec: {},

							averageRtcpInterval: {},
							bytesDiscardedOnSend: {},
							fecPacketsSent: {},
							headerBytesSent: {},
							lastPacketSentTimestamp: {},
							nackCount: {},
							packetsDiscardedOnSend: {},
							perDscpPacketsSent: {},
							retransmittedPacketsSent: {},
							retransmittedBytesSent: {},
							targetBitrate: {},
							totalPacketSendDelay: {},

							samplesEncodedWithSilk: {},
							samplesEncodedWithCelt: {},
							totalSamplesSent: {},
							voiceActivityFlag: {},

						},
						video: {
							tracks: [],
							codec: {},

							averageRtcpInterval: {},
							bytesDiscardedOnSend: {},
							fecPacketsSent: {},
							headerBytesSent: {},
							lastPacketSentTimestamp: {},
							nackCount: {},
							packetsDiscardedOnSend: {},
							perDscpPacketsSent: {},
							retransmittedPacketsSent: {},
							retransmittedBytesSent: {},
							targetBitrate: {},
							totalPacketSendDelay: {},

							firCount: {},
							frameBitDepth: {},
							frameHeight: {},
							frameWidth: {},
							framesDiscardedOnSend: {},
							framesEncoded: {},
							framesPerSecond: {},
							framesSent: {},
							hugeFramesSent: {},
							keyFramesEncoded: {},
							pliCount: {},
							qpSum: {},
							qualityLimitationDurations: {},
							qualityLimitationReason: {},
							qualityLimitationResolutionChanges: {},
							sliCount: {},
							totalEncodedBytesTarget: {},
							totalEncodeTime: {},

						}
					}
				},
				remote: {
					network: {
						iceServer: null,
						ip: null,
						port: null,
						protocol: null,
						type: null
					},

					inbound: {
						audio: {
							tracks: [],
							codec: {},

							burstDiscardCount: {},
							burstDiscardRate: {},
							burstLossCount: {},
							burstLossRate: {},
							burstPacketsDiscarded: {},
							burstPacketsLost: {},
							fractionLost: {},
							gapDiscardRate: {},
							gapLossRate: {},
							jitter: {},
							packetsDiscarded: {},
							packetsLost: {},
							packetsReceived: {},
							packetsRepaired: {},
							reportsReceived: {},
							roundTripTime: {},
							roundTripTimeMeasurements: {},
							ssrc: {},
							totalRoundTripTime: {},

						},
						video: {
							tracks: [],
							codec: {},

							burstDiscardCount: {},
							burstDiscardRate: {},
							burstLossCount: {},
							burstLossRate: {},
							burstPacketsDiscarded: {},
							burstPacketsLost: {},
							fractionLost: {},
							gapDiscardRate: {},
							gapLossRate: {},
							jitter: {},
							packetsDiscarded: {},
							packetsLost: {},
							packetsReceived: {},
							packetsRepaired: {},
							reportsReceived: {},
							roundTripTime: {},
							roundTripTimeMeasurements: {},
							ssrc: {},
							totalRoundTripTime: {},

							framesDropped: {},
							partialFramesLost: {},
							fullFramesLost: {},

						}
					},
					outbound: {
						audio: {
							tracks: [],
							codec: {},

							bytesSent: {},
							packetsSent: {},
							remoteTimestamp: {},
							reportsSent: {},
							ssrc: {},

						},
						video: {
							tracks: [],
							codec: {},

							bytesSent: {},
							packetsSent: {},
							remoteTimestamp: {},
							reportsSent: {},
							ssrc: {},

						}
					}

				},
				timestamp: Date.now()
			}

			lines.forEach(line => {

				switch (line.type) {
					case 'local-candidate':

						stats.local.network.iceServer = line.candidateType == 'host' ? 'localhost' : (line.candidateType == 'relay' ? 'TURN' : 'STUN');
						stats.local.network.ip = line.ip;
						stats.local.network.port = line.port;
						stats.local.network.protocol = line.protocol;
						if ('networkType' in line) stats.local.network.type = line.networkType;

						stats.timestamp = line.timestamp;

					break;
					case 'remote-candidate':

						stats.remote.network.iceServer = line.candidateType == 'host' ? 'localhost' : (line.candidateType == 'relay' ? 'TURN' : 'STUN');
						stats.remote.network.ip = line.ip;
						stats.remote.network.port = line.port;
						stats.remote.network.protocol = line.protocol;
						if ('networkType' in line) stats.remote.network.type = line.networkType;

					break;
					case 'candidate-pair':

						if ('availableIncomingBitrate' in line) stats.local.availableIncomingBitrate = line.availableIncomingBitrate;
						if ('availableOutgoingBitrate' in line) stats.local.availableOutgoingBitrate = line.availableOutgoingBitrate;
						if ('bytesDiscardedOnSend' in line) stats.local.bytesDiscardedOnSend = line.bytesDiscardedOnSend;
						if ('bytesReceived' in line) stats.local.bytesReceived = line.bytesReceived;
						if ('bytesSent' in line) stats.local.bytesSent = line.bytesSent;
						if ('circuitBreakerTriggerCount' in line) stats.local.circuitBreakerTriggerCount = line.circuitBreakerTriggerCount;
						if ('consentExpiredTimestamp' in line) stats.local.consentExpiredTimestamp = line.consentExpiredTimestamp;
						if ('consentRequestBytesSent' in line) stats.local.consentRequestBytesSent = line.consentRequestBytesSent;
						if ('consentRequestsSent' in line) stats.local.consentRequestsSent = line.consentRequestsSent;
						if ('currentRoundTripTime' in line) stats.local.currentRoundTripTime = line.currentRoundTripTime;
						if ('firstRequestTimestamp' in line) stats.local.firstRequestTimestamp = line.firstRequestTimestamp;
						if ('lastPacketReceivedTimestamp' in line) stats.local.lastPacketReceivedTimestamp = line.lastPacketReceivedTimestamp;
						if ('lastPacketSentTimestamp' in line) stats.local.lastPacketSentTimestamp = line.lastPacketSentTimestamp;
						if ('lastRequestTimestamp' in line) stats.local.lastRequestTimestamp = line.lastRequestTimestamp;
						if ('lastResponseTimestamp' in line) stats.local.lastResponseTimestamp = line.lastResponseTimestamp;
						if ('packetsDiscardedOnSend' in line) stats.local.packetsDiscardedOnSend = line.packetsDiscardedOnSend;
						if ('packetsReceived' in line) stats.local.packetsReceived = line.packetsReceived;
						if ('packetsSent' in line) stats.local.packetsSent = line.packetsSent;
						if ('requestBytesSent' in line) stats.local.requestBytesSent = line.requestBytesSent;
						if ('requestsReceived' in line) stats.local.requestsReceived = line.requestsReceived;
						if ('requestsSent' in line) stats.local.requestsSent = line.requestsSent;
						if ('responseBytesSent' in line) stats.local.responseBytesSent = line.responseBytesSent;
						if ('responsesReceived' in line) stats.local.responsesReceived = line.responsesReceived;
						if ('responsesSent' in line) stats.local.responsesSent = line.responsesSent;
						if ('retransmissionsReceived' in line) stats.local.retransmissionsReceived = line.retransmissionsReceived;
						if ('retransmissionsSent' in line) stats.local.retransmissionsSent = line.retransmissionsSent;
						if ('state' in line) stats.local.state = line.state;
						if ('totalRoundTripTime' in line) stats.local.totalRoundTripTime = line.totalRoundTripTime;

					break;
					case 'transport':

						if ('bytesSent' in line) stats.local.bytesSent = line.bytesSent;
						if ('bytesReceived' in line) stats.local.bytesReceived = line.bytesReceived;
						if ('packetsSent' in line) stats.local.packetsSent = line.packetsSent;
						if ('packetsReceived' in line) stats.local.packetsReceived = line.packetsReceived;

					break;
					case 'inbound-rtp':

						stats.local.inbound[line.kind].tracks.push(line.id);

						if ('averageRtcpInterval' in line) stats.local.inbound[line.kind].averageRtcpInterval[line.id] = line.averageRtcpInterval;
						if ('burstDiscardCount' in line) stats.local.inbound[line.kind].burstDiscardCount[line.id] = line.burstDiscardCount;
						if ('burstDiscardRate' in line) stats.local.inbound[line.kind].burstDiscardRate[line.id] = line.burstDiscardRate;
						if ('burstLossCount' in line) stats.local.inbound[line.kind].burstLossCount[line.id] = line.burstLossCount;
						if ('burstLossRate' in line) stats.local.inbound[line.kind].burstLossRate[line.id] = line.burstLossRate;
						if ('burstPacketsDiscarded' in line) stats.local.inbound[line.kind].burstPacketsDiscarded[line.id] = line.burstPacketsDiscarded;
						if ('burstPacketsLost' in line) stats.local.inbound[line.kind].burstPacketsLost[line.id] = line.burstPacketsLost;
						if ('bytesReceived' in line) stats.local.inbound[line.kind].bytesReceived[line.id] = line.bytesReceived;
						if ('estimatedPlayoutTimestamp' in line) stats.local.inbound[line.kind].estimatedPlayoutTimestamp[line.id] = line.estimatedPlayoutTimestamp;
						if ('fecPacketsDiscarded' in line) stats.local.inbound[line.kind].fecPacketsDiscarded[line.id] = line.fecPacketsDiscarded;
						if ('fecPacketsReceived' in line) stats.local.inbound[line.kind].fecPacketsReceived[line.id] = line.fecPacketsReceived;
						if ('gapDiscardRate' in line) stats.local.inbound[line.kind].gapDiscardRate[line.id] = line.gapDiscardRate;
						if ('gapLossRate' in line) stats.local.inbound[line.kind].gapLossRate[line.id] = line.gapLossRate;
						if ('headerBytesReceived' in line) stats.local.inbound[line.kind].headerBytesReceived[line.id] = line.headerBytesReceived;
						if ('jitter' in line) stats.local.inbound[line.kind].jitter[line.id] = line.jitter;
						if ('jitterBufferDelay' in line) stats.local.inbound[line.kind].jitterBufferDelay[line.id] = line.jitterBufferDelay;
						if ('jitterBufferEmittedCount' in line) stats.local.inbound[line.kind].jitterBufferEmittedCount[line.id] = line.jitterBufferEmittedCount;
						if ('lastPacketReceivedTimestamp' in line) stats.local.inbound[line.kind].lastPacketReceivedTimestamp[line.id] = line.lastPacketReceivedTimestamp;
						if ('nackCount' in line) stats.local.inbound[line.kind].nackCount[line.id] = line.nackCount;
						if ('packetsDiscarded' in line) stats.local.inbound[line.kind].packetsDiscarded[line.id] = line.packetsDiscarded;
						if ('packetsDuplicated' in line) stats.local.inbound[line.kind].packetsDuplicated[line.id] = line.packetsDuplicated;
						if ('packetsFailedDecryption' in line) stats.local.inbound[line.kind].packetsFailedDecryption[line.id] = line.packetsFailedDecryption;
						if ('packetsLost' in line) stats.local.inbound[line.kind].packetsLost[line.id] = line.packetsLost;
						if ('packetsReceived' in line) stats.local.inbound[line.kind].packetsReceived[line.id] = line.packetsReceived;
						if ('packetsRepaired' in line) stats.local.inbound[line.kind].packetsRepaired[line.id] = line.packetsRepaired;
						if ('perDscpPacketsReceived' in line) stats.local.inbound[line.kind].perDscpPacketsReceived[line.id] = line.perDscpPacketsReceived;
						if ('ssrc' in line) stats.local.inbound[line.kind].ssrc[line.id] = line.ssrc;
						if ('totalProcessingDelay' in line) stats.local.inbound[line.kind].totalProcessingDelay[line.id] = line.totalProcessingDelay;

						if (line.kind == 'audio') {

							if ('codecId' in line) {

								stats.local.inbound.audio.codec[line.id] = lines.get(line.codecId);
								stats.local.inbound.audio.codec[line.id] = {
									channels: stats.local.inbound.audio.codec[line.id].channels,
									clockRate: stats.local.inbound.audio.codec[line.id].clockRate,
									id: stats.local.inbound.audio.codec[line.id].id,
									mimeType: stats.local.inbound.audio.codec[line.id].mimeType,
									payloadType: stats.local.inbound.audio.codec[line.id].payloadType,
									sdpFmtpLine: stats.local.inbound.audio.codec[line.id].sdpFmtpLine
								};

							}

							if ('audioLevel' in line) stats.local.inbound.audio.audioLevel[line.id] = line.audioLevel;
							if ('concealedSamples' in line) stats.local.inbound.audio.concealedSamples[line.id] = line.concealedSamples;
							if ('concealmentEvents' in line) stats.local.inbound.audio.concealmentEvents[line.id] = line.concealmentEvents;
							if ('insertedSamplesForDeceleration' in line) stats.local.inbound.audio.insertedSamplesForDeceleration[line.id] = line.insertedSamplesForDeceleration;
							if ('removedSamplesForAcceleration' in line) stats.local.inbound.audio.removedSamplesForAcceleration[line.id] = line.removedSamplesForAcceleration;
							if ('samplesDecodedWithCelt' in line) stats.local.inbound.audio.samplesDecodedWithCelt[line.id] = line.samplesDecodedWithCelt;
							if ('samplesDecodedWithSilk' in line) stats.local.inbound.audio.samplesDecodedWithSilk[line.id] = line.samplesDecodedWithSilk;
							if ('silentConcealedSamples' in line) stats.local.inbound.audio.silentConcealedSamples[line.id] = line.silentConcealedSamples;
							if ('totalAudioEnergy' in line) stats.local.inbound.audio.totalAudioEnergy[line.id] = line.totalAudioEnergy;
							if ('totalSamplesDecoded' in line) stats.local.inbound.audio.totalSamplesDecoded[line.id] = line.totalSamplesDecoded;
							if ('totalSamplesDuration' in line) stats.local.inbound.audio.totalSamplesDuration[line.id] = line.totalSamplesDuration;
							if ('totalSamplesReceived' in line) stats.local.inbound.audio.totalSamplesReceived[line.id] = line.totalSamplesReceived;
							if ('voiceActivityFlag' in line) stats.local.inbound.audio.voiceActivityFlag[line.id] = line.voiceActivityFlag;

						} else if (line.kind == 'video') {

							if ('codecId' in line) {

								stats.local.inbound.video.codec[line.id] = lines.get(line.codecId);
								stats.local.inbound.video.codec[line.id] = {
									clockRate: stats.local.inbound.video.codec[line.id].clockRate,
									id: stats.local.inbound.video.codec[line.id].id,
									mimeType: stats.local.inbound.video.codec[line.id].mimeType,
									payloadType: stats.local.inbound.video.codec[line.id].payloadType,
									sdpFmtpLine: stats.local.inbound.video.codec[line.id].sdpFmtpLine
								};

							}

							if ('firCount' in line) stats.local.inbound.video.firCount[line.id] = line.firCount;
							if ('frameBitDepth' in line) stats.local.inbound.video.frameBitDepth[line.id] = line.frameBitDepth;
							if ('frameHeight' in line) stats.local.inbound.video.frameHeight[line.id] = line.frameHeight;
							if ('framesDecoded' in line) stats.local.inbound.video.framesDecoded[line.id] = line.framesDecoded;
							if ('framesDropped' in line) stats.local.inbound.video.framesDropped[line.id] = line.framesDropped;
							if ('framesPerSecond' in line) stats.local.inbound.video.framesPerSecond[line.id] = line.framesPerSecond;
							if ('framesReceived' in line) stats.local.inbound.video.framesReceived[line.id] = line.framesReceived;
							if ('frameWidth' in line) stats.local.inbound.video.frameWidth[line.id] = line.frameWidth;
							if ('fullFramesLost' in line) stats.local.inbound.video.fullFramesLost[line.id] = line.fullFramesLost;
							if ('keyFramesDecoded' in line) stats.local.inbound.video.keyFramesDecoded[line.id] = line.keyFramesDecoded;
							if ('partialFramesLost' in line) stats.local.inbound.video.partialFramesLost[line.id] = line.partialFramesLost;
							if ('pliCount' in line) stats.local.inbound.video.pliCount[line.id] = line.pliCount;
							if ('qpSum' in line) stats.local.inbound.video.qpSum[line.id] = line.qpSum;
							if ('sliCount' in line) stats.local.inbound.video.sliCount[line.id] = line.sliCount;
							if ('totalDecodeTime' in line) stats.local.inbound.video.totalDecodeTime[line.id] = line.totalDecodeTime;
							if ('totalInterFrameDelay' in line) stats.local.inbound.video.totalInterFrameDelay[line.id] = line.totalInterFrameDelay;
							if ('totalSquaredInterFrameDelay' in line) stats.local.inbound.video.totalSquaredInterFrameDelay[line.id] = line.totalSquaredInterFrameDelay;

						}

					break;
					case 'outbound-rtp':

						stats.local.outbound[line.kind].tracks.push(line.id);

						if ('averageRtcpInterval' in line) stats.local.outbound[line.kind].averageRtcpInterval[line.id] = line.averageRtcpInterval;
						if ('bytesDiscardedOnSend' in line) stats.local.outbound[line.kind].bytesDiscardedOnSend[line.id] = line.bytesDiscardedOnSend;
						if ('fecPacketsSent' in line) stats.local.outbound[line.kind].fecPacketsSent[line.id] = line.fecPacketsSent;
						if ('headerBytesSent' in line) stats.local.outbound[line.kind].headerBytesSent[line.id] = line.headerBytesSent;
						if ('lastPacketSentTimestamp' in line) stats.local.outbound[line.kind].lastPacketSentTimestamp[line.id] = line.lastPacketSentTimestamp;
						if ('nackCount' in line) stats.local.outbound[line.kind].nackCount[line.id] = line.nackCount;
						if ('packetsDiscardedOnSend' in line) stats.local.outbound[line.kind].packetsDiscardedOnSend[line.id] = line.packetsDiscardedOnSend;
						if ('perDscpPacketsSent' in line) stats.local.outbound[line.kind].perDscpPacketsSent[line.id] = line.perDscpPacketsSent;
						if ('retransmittedPacketsSent' in line) stats.local.outbound[line.kind].retransmittedPacketsSent[line.id] = line.retransmittedPacketsSent;
						if ('retransmittedBytesSent' in line) stats.local.outbound[line.kind].retransmittedBytesSent[line.id] = line.retransmittedBytesSent;
						if ('targetBitrate' in line) stats.local.outbound[line.kind].targetBitrate[line.id] = line.targetBitrate;
						if ('totalPacketSendDelay' in line) stats.local.outbound[line.kind].totalPacketSendDelay[line.id] = line.totalPacketSendDelay;

						if (line.kind == 'audio') {

							if ('codecId' in line) {

								stats.local.outbound.audio.codec[line.id] = lines.get(line.codecId);
								stats.local.outbound.audio.codec[line.id] = {
									channels: stats.local.outbound.audio.codec[line.id].channels,
									clockRate: stats.local.outbound.audio.codec[line.id].clockRate,
									id: stats.local.outbound.audio.codec[line.id].id,
									mimeType: stats.local.outbound.audio.codec[line.id].mimeType,
									payloadType: stats.local.outbound.audio.codec[line.id].payloadType,
									sdpFmtpLine: stats.local.outbound.audio.codec[line.id].sdpFmtpLine
								};

							}

							if ('samplesEncodedWithSilk' in line) stats.local.outbound.audio.samplesEncodedWithSilk[line.id] = line.samplesEncodedWithSilk;
							if ('samplesEncodedWithCelt' in line) stats.local.outbound.audio.samplesEncodedWithCelt[line.id] = line.samplesEncodedWithCelt;
							if ('totalSamplesSent' in line) stats.local.outbound.audio.totalSamplesSent[line.id] = line.totalSamplesSent;
							if ('voiceActivityFlag' in line) stats.local.outbound.audio.voiceActivityFlag[line.id] = line.voiceActivityFlag;

						} else if (line.kind == 'video') {

							if ('codecId' in line) {

								stats.local.outbound.video.codec[line.id] = lines.get(line.codecId);
								stats.local.outbound.video.codec[line.id] = {
									clockRate: stats.local.outbound.video.codec[line.id].clockRate,
									id: stats.local.outbound.video.codec[line.id].id,
									mimeType: stats.local.outbound.video.codec[line.id].mimeType,
									payloadType: stats.local.outbound.video.codec[line.id].payloadType,
									sdpFmtpLine: stats.local.outbound.video.codec[line.id].sdpFmtpLine
								};

							}

							if ('firCount' in line) stats.local.outbound.video.firCount[line.id] = line.firCount;
							if ('frameBitDepth' in line) stats.local.outbound.video.frameBitDepth[line.id] = line.frameBitDepth;
							if ('frameHeight' in line) stats.local.outbound.video.frameHeight[line.id] = line.frameHeight;
							if ('frameWidth' in line) stats.local.outbound.video.frameWidth[line.id] = line.frameWidth;
							if ('framesDiscardedOnSend' in line) stats.local.outbound.video.framesDiscardedOnSend[line.id] = line.framesDiscardedOnSend;
							if ('framesEncoded' in line) stats.local.outbound.video.framesEncoded[line.id] = line.framesEncoded;
							if ('framesPerSecond' in line) stats.local.outbound.video.framesPerSecond[line.id] = line.framesPerSecond;
							if ('framesSent' in line) stats.local.outbound.video.framesSent[line.id] = line.framesSent;
							if ('hugeFramesSent' in line) stats.local.outbound.video.hugeFramesSent[line.id] = line.hugeFramesSent;
							if ('keyFramesEncoded' in line) stats.local.outbound.video.keyFramesEncoded[line.id] = line.keyFramesEncoded;
							if ('pliCount' in line) stats.local.outbound.video.pliCount[line.id] = line.pliCount;
							if ('qpSum' in line) stats.local.outbound.video.qpSum[line.id] = line.qpSum;
							if ('qualityLimitationDurations' in line) stats.local.outbound.video.qualityLimitationDurations[line.id] = line.qualityLimitationDurations;
							if ('qualityLimitationReason' in line) stats.local.outbound.video.qualityLimitationReason[line.id] = line.qualityLimitationReason;
							if ('qualityLimitationResolutionChanges' in line) stats.local.outbound.video.qualityLimitationResolutionChanges[line.id] = line.qualityLimitationResolutionChanges;
							if ('sliCount' in line) stats.local.outbound.video.sliCount[line.id] = line.sliCount;
							if ('totalEncodedBytesTarget' in line) stats.local.outbound.video.totalEncodedBytesTarget[line.id] = line.totalEncodedBytesTarget;
							if ('totalEncodeTime' in line) stats.local.outbound.video.totalEncodeTime[line.id] = line.totalEncodeTime;

						}

					break;
					case 'remote-inbound-rtp':

						stats.remote.inbound[line.kind].tracks.push(line.id);

						if ('burstDiscardCount' in line) stats.remote.inbound[line.kind].burstDiscardCount[line.id] = line.burstDiscardCount;
						if ('burstDiscardRate' in line) stats.remote.inbound[line.kind].burstDiscardRate[line.id] = line.burstDiscardRate;
						if ('burstLossCount' in line) stats.remote.inbound[line.kind].burstLossCount[line.id] = line.burstLossCount;
						if ('burstLossRate' in line) stats.remote.inbound[line.kind].burstLossRate[line.id] = line.burstLossRate;
						if ('burstPacketsDiscarded' in line) stats.remote.inbound[line.kind].burstPacketsDiscarded[line.id] = line.burstPacketsDiscarded;
						if ('burstPacketsLost' in line) stats.remote.inbound[line.kind].burstPacketsLost[line.id] = line.burstPacketsLost;
						if ('fractionLost' in line) stats.remote.inbound[line.kind].fractionLost[line.id] = line.fractionLost;
						if ('gapDiscardRate' in line) stats.remote.inbound[line.kind].gapDiscardRate[line.id] = line.gapDiscardRate;
						if ('gapLossRate' in line) stats.remote.inbound[line.kind].gapLossRate[line.id] = line.gapLossRate;
						if ('jitter' in line) stats.remote.inbound[line.kind].jitter[line.id] = line.jitter;
						if ('packetsDiscarded' in line) stats.remote.inbound[line.kind].packetsDiscarded[line.id] = line.packetsDiscarded;
						if ('packetsLost' in line) stats.remote.inbound[line.kind].packetsLost[line.id] = line.packetsLost;
						if ('packetsReceived' in line) stats.remote.inbound[line.kind].packetsReceived[line.id] = line.packetsReceived;
						if ('packetsRepaired' in line) stats.remote.inbound[line.kind].packetsRepaired[line.id] = line.packetsRepaired;
						if ('reportsReceived' in line) stats.remote.inbound[line.kind].reportsReceived[line.id] = line.reportsReceived;
						if ('roundTripTime' in line) stats.remote.inbound[line.kind].roundTripTime[line.id] = line.roundTripTime;
						if ('roundTripTimeMeasurements' in line) stats.remote.inbound[line.kind].roundTripTimeMeasurements[line.id] = line.roundTripTimeMeasurements;
						if ('ssrc' in line) stats.remote.inbound[line.kind].ssrc[line.id] = line.ssrc;
						if ('totalRoundTripTime' in line) stats.remote.inbound[line.kind].totalRoundTripTime[line.id] = line.totalRoundTripTime;

						if (line.kind == 'audio') {

							if ('codecId' in line) {

								stats.remote.inbound.audio.codec[line.id] = lines.get(line.codecId);
								stats.remote.inbound.audio.codec[line.id] = {
									channels: stats.remote.inbound.audio.codec[line.id].channels,
									clockRate: stats.remote.inbound.audio.codec[line.id].clockRate,
									id: stats.remote.inbound.audio.codec[line.id].id,
									mimeType: stats.remote.inbound.audio.codec[line.id].mimeType,
									payloadType: stats.remote.inbound.audio.codec[line.id].payloadType,
									sdpFmtpLine: stats.remote.inbound.audio.codec[line.id].sdpFmtpLine
								};

							}

						} else if (line.kind == 'video') {

							if ('codecId' in line) {

								stats.remote.inbound.video.codec[line.id] = lines.get(line.codecId);
								stats.remote.inbound.video.codec[line.id] = {
									clockRate: stats.remote.inbound.video.codec[line.id].clockRate,
									id: stats.remote.inbound.video.codec[line.id].id,
									mimeType: stats.remote.inbound.video.codec[line.id].mimeType,
									payloadType: stats.remote.inbound.video.codec[line.id].payloadType,
									sdpFmtpLine: stats.remote.inbound.video.codec[line.id].sdpFmtpLine
								};

							}

							if ('framesDropped' in line) stats.remote.inbound.video.framesDropped[line.id] = line.framesDropped;
							if ('partialFramesLost' in line) stats.remote.inbound.video.partialFramesLost[line.id] = line.partialFramesLost;
							if ('fullFramesLost' in line) stats.remote.inbound.video.fullFramesLost[line.id] = line.fullFramesLost;

						}

					break;
					case 'remote-outbound-rtp':

						stats.remote.outbound[line.kind].tracks.push(line.id);

						if ('bytesSent' in line) stats.remote.outbound[line.kind].bytesSent[line.id] = line.bytesSent;
						if ('packetsSent' in line) stats.remote.outbound[line.kind].packetsSent[line.id] = line.packetsSent;
						if ('remoteTimestamp' in line) stats.remote.outbound[line.kind].remoteTimestamp[line.id] = line.remoteTimestamp;
						if ('reportsSent' in line) stats.remote.outbound[line.kind].reportsSent[line.id] = line.reportsSent;
						if ('ssrc' in line) stats.remote.outbound[line.kind].ssrc[line.id] = line.ssrc;

						if (line.kind == 'audio') {

							if ('codecId' in line) {

								stats.remote.outbound.audio.codec[line.id] = lines.get(line.codecId);
								stats.remote.outbound.audio.codec[line.id] = {
									channels: stats.remote.outbound.audio.codec[line.id].channels,
									clockRate: stats.remote.outbound.audio.codec[line.id].clockRate,
									id: stats.remote.outbound.audio.codec[line.id].id,
									mimeType: stats.remote.outbound.audio.codec[line.id].mimeType,
									payloadType: stats.remote.outbound.audio.codec[line.id].payloadType,
									sdpFmtpLine: stats.remote.outbound.audio.codec[line.id].sdpFmtpLine
								};

							}

						} else if (line.kind == 'video') {

							if ('codecId' in line) {

								stats.remote.outbound.video.codec[line.id] = lines.get(line.codecId);
								stats.remote.outbound.video.codec[line.id] = {
									clockRate: stats.remote.outbound.video.codec[line.id].clockRate,
									id: stats.remote.outbound.video.codec[line.id].id,
									mimeType: stats.remote.outbound.video.codec[line.id].mimeType,
									payloadType: stats.remote.outbound.video.codec[line.id].payloadType,
									sdpFmtpLine: stats.remote.outbound.video.codec[line.id].sdpFmtpLine
								};

							}

						}

					break;
				}

			});

			// if (stats.local.totalRoundTripTime && stats.local.responsesReceived) stats.local.averageRoundTripTime = stats.local.totalRoundTripTime / stats.local.responsesReceived;
			// if (stats.local.packetsSent && stats.local.packetsReceived) stats.local.fractionLost = (stats.local.packetsSent - stats.local.packetsReceived) / stats.local.packetsSent; // if fractionLost is > 0.3, we have probably found the culprit

			return stats;

		}) : raw; 

	}

}