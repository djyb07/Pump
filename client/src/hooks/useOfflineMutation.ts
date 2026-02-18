import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';

/**
 * useOfflineMutation Hook
 *
 * Provides a mutation function that:
 * - Online: sends the request immediately via apiClient.
 * - Offline: queues the request payload in localStorage for later sync.
 *
 * Queue processing triggers:
 * 1. On mount — if navigator.onLine is true (catches refreshes while online with pending items).
 * 2. On `online` event — when connectivity is restored.
 *
 * Queue processing rules (FIFO):
 * - 4xx errors: discard the item (client error, won't fix itself on retry) and continue.
 * - 5xx / Network errors: stop processing and keep remaining items for next attempt.
 */

const SYNC_QUEUE_KEY = 'pump_syncQueue';

interface QueuedMutation {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: unknown;
    timestamp: number;
}

function getQueue(): QueuedMutation[] {
    try {
        const raw = localStorage.getItem(SYNC_QUEUE_KEY);
        return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: QueuedMutation[]): void {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineMutation() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(() => getQueue().length);
    const isSyncingRef = useRef(false);

    /**
     * Process the queue in strict FIFO order.
     * - 4xx → discard & continue
     * - 5xx / network error → stop & retain for next attempt
     */
    const processQueue = useCallback(async () => {
        if (isSyncingRef.current) return;
        const queue = getQueue();
        if (queue.length === 0) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        let processed = 0;

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];

            try {
                await apiClient.request({
                    url: item.url,
                    method: item.method,
                    data: item.data,
                });
                processed++;
            } catch (error: unknown) {
                const status =
                    error instanceof Object && 'response' in error
                        ? (error as { response?: { status?: number } }).response?.status
                        : undefined;

                if (status !== undefined && status >= 400 && status < 500) {
                    // 4xx — client error, discard this item and continue
                    console.warn(
                        `[SyncQueue] Discarding item ${item.id} (${item.method} ${item.url}) — ${status} client error`,
                    );
                    processed++;
                    continue;
                }

                // 5xx or network error — stop processing, keep remaining items
                console.warn(
                    `[SyncQueue] Stopping at item ${item.id} (${item.method} ${item.url}) — server/network error`,
                );
                break;
            }
        }

        // Remove processed items from the front of the queue
        const remaining = queue.slice(processed);
        saveQueue(remaining);
        setPendingCount(remaining.length);

        isSyncingRef.current = false;
        setIsSyncing(false);
    }, []);

    // Trigger sync on mount (if online) and on `online` event
    useEffect(() => {
        if (navigator.onLine) {
            processQueue();
        }

        const handleOnline = () => {
            processQueue();
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [processQueue]);

    /**
     * Execute a mutation. Sends immediately if online, otherwise queues it.
     */
    const mutate = useCallback(
        async <T = unknown>(
            url: string,
            method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            data?: unknown,
        ): Promise<T | null> => {
            if (navigator.onLine) {
                const response = await apiClient.request<T>({ url, method, data });
                return response.data;
            }

            // Offline — queue the mutation
            const queue = getQueue();
            const newItem: QueuedMutation = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                url,
                method,
                data,
                timestamp: Date.now(),
            };
            queue.push(newItem);
            saveQueue(queue);
            setPendingCount(queue.length);

            console.info(`[SyncQueue] Queued mutation: ${method} ${url}`);
            return null;
        },
        [],
    );

    return { mutate, isSyncing, pendingCount };
}
