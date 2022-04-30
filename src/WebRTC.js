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


		this.#onSignaler({room: room, fromId: this.#id, toId: 'broadcast', data: { type: 'invite' }});

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

}