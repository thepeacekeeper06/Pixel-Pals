import type { SyncEventPayload } from '../types';

// --- ACTION REQUIRED ---
// Go to https://www.pubnub.com/ to get your free API keys.
const PUBLISH_KEY = "YOUR_PUBLISH_KEY_HERE"; // Replace with your PubNub Publish Key
const SUBSCRIBE_KEY = "YOUR_SUBSCRIBE_KEY_HERE"; // Replace with your PubNub Subscribe Key

declare global {
    interface Window {
        PubNub: any;
    }
}

let pubnub: any = null;
let currentChannel: string | null = null;
const pubnubListener = {
    message: (messageEvent: any) => {
        const payload = messageEvent.message as SyncEventPayload;
        // Dispatch a global custom event that React components can listen to.
        // This decouples the components from the sync service.
        window.dispatchEvent(new CustomEvent('sync-event', { detail: payload }));
    }
};

const initPubNub = () => {
    if (!window.PubNub) {
        console.error("PubNub SDK not loaded!");
        return false;
    }
    if (!PUBLISH_KEY.startsWith('pub-c-') || !SUBSCRIBE_KEY.startsWith('sub-c-')) {
        console.warn("PubNub API keys are not set in services/syncService.ts. Real-time features will be disabled.");
        return false;
    }
    pubnub = new window.PubNub({
        publishKey: PUBLISH_KEY,
        subscribeKey: SUBSCRIBE_KEY,
        uuid: `pixel-pals-user-${Math.random().toString(36).substring(7)}`
    });
    return true;
};

export const syncService = {
    init: () => {
        if (!pubnub) {
            initPubNub();
        }
    },
    connect: (roomId: string) => {
        if (!pubnub) {
            console.error("PubNub not initialized. Cannot connect.");
            return;
        }
        if (currentChannel) {
            pubnub.unsubscribe({ channels: [currentChannel] });
        }
        currentChannel = `pixel-pals-room-${roomId.toUpperCase()}`;

        pubnub.subscribe({
            channels: [currentChannel]
        });
        
        pubnub.removeListener(pubnubListener);
        pubnub.addListener(pubnubListener);
    },
    disconnect: () => {
        if (pubnub && currentChannel) {
            pubnub.unsubscribe({ channels: [currentChannel] });
            pubnub.removeListener(pubnubListener);
            currentChannel = null;
        }
    },
    sendEvent: (event: SyncEventPayload) => {
        if (!pubnub || !currentChannel) {
            console.error("Sync service not connected to a room.");
            return;
        }
        pubnub.publish({
            channel: currentChannel,
            message: event
        });
    }
};