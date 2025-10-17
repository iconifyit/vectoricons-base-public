const { deepFreeze } = require('../../utils/index.js');

/**
 * @module Event System
 * @fileoverview Event - Immutable event wrapper with metadata for pub/sub system.
 *
 * Event class provides a standardized envelope for event data with timestamp,
 * actor information, and trace IDs for distributed tracing.
 */

class Event {
    constructor(name, data) {
        this.name         = name;
        this.timestamp    = new Date().toISOString(); 
        this.actor        = 'user'; 
        this.user_id      = null;
        this.trace_id     = null;
        this.data         = deepFreeze(data || {});
    }

    static create(name, data) {
        return new Event(name, data);
    }

    static fromPayload(payload) {
        const event = new Event(payload.name, payload.data);
        event.timestamp = payload.timestamp;
        event.actor     = payload.actor;
        event.user_id   = payload.user_id;
        event.trace_id  = payload.trace_id;
        return event;
    }

    toPayload() {
        return deepFreeze({
            name        : this.name,
            timestamp   : this.timestamp,
            actor       : this.actor,
            user_id     : this.user_id,
            trace_id    : this.trace_id,
            data        : this.data
        });
    }

    getName() {
        return this.name;
    }

    getTimestamp() {
        return this.timestamp;
    }

    getActor() {
        return this.actor;
    }

    getUserId() {
        return this.user_id;
    }

    getTraceId() {
        return this.trace_id;
    }

    getData() {
        return this.data;
    }

    setName(name) {
        this.name = name;
    }

    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }

    setActor(actor) {
        this.actor = actor;
    }

    setUserId(user_id) {
        this.user_id = user_id;
    }

    setTraceId(trace_id) {
        this.trace_id = trace_id;
    }

    setData(data) {
        this.data = data;
    }

    toString() {
        return JSON.stringify(this.toPayload());
    }
}

module.exports = Event;