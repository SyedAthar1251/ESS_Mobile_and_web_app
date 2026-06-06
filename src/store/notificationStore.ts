import { create } from "zustand";
import { getNotificationList, markNotificationAsRead, NotificationItem } from "../services/notification.service";

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  lastUpdated: number;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  selectedNotification: NotificationItem | null;
  readNames: Set<string>;

  fetchNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationName: string) => Promise<void>;
  markAllAsRead: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  clearAll: () => void;
  selectNotification: (notification: NotificationItem | null) => void;
}

const STORAGE_KEY = "ess_read_notifications";

function loadReadNames(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function persistReadNames(names: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...names]));
  } catch {
    // ignore
  }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  lastUpdated: 0,
  pollingIntervalId: null,
  selectedNotification: null,
  readNames: loadReadNames(),

  fetchNotifications: async () => {
    try {
      const response = await getNotificationList();
      const apiItems = response.data || [];
      const { readNames } = get();
      const merged = apiItems.map((n) => {
        const key = String(n.name);
        if (readNames.has(key)) {
          return { ...n, read: 1 };
        }
        return n;
      });
      set({
        notifications: merged,
        unreadCount: merged.filter((n) => n.read === 0).length,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      console.error("[NotificationStore] Failed to fetch:", error);
    }
  },

  refreshNotifications: async () => {
    set({ loading: true });
    try {
      const response = await getNotificationList();
      const apiItems = response.data || [];
      const { readNames } = get();
      const merged = apiItems.map((n) => {
        const key = String(n.name);
        if (readNames.has(key)) {
          return { ...n, read: 1 };
        }
        return n;
      });
      set({
        notifications: merged,
        unreadCount: merged.filter((n) => n.read === 0).length,
        lastUpdated: Date.now(),
        loading: false,
      });
    } catch (error: any) {
      console.error("[NotificationStore] Failed to refresh:", error);
      set({ loading: false });
    }
  },

  markAsRead: async (notificationName: string) => {
    const { notifications, readNames } = get();
    const key = String(notificationName);

    try {
      await markNotificationAsRead(key);
      const updated = notifications.map((n) =>
        String(n.name) === key ? { ...n, read: 1 } : n
      );
      const newReadNames = new Set(readNames);
      newReadNames.add(key);
      persistReadNames(newReadNames);
      set({
        notifications: updated,
        unreadCount: updated.filter((n) => n.read === 0).length,
        readNames: newReadNames,
      });
    } catch (err) {
      console.error("[NotificationStore] Failed to mark as read:", err);
    }
  },

  markAllAsRead: () => {
    const { notifications, readNames } = get();
    const updated = notifications.map((n) => ({ ...n, read: 1 }));
    const newReadNames = new Set(readNames);
    notifications.forEach((n) => newReadNames.add(String(n.name)));
    persistReadNames(newReadNames);
    set({
      notifications: updated,
      unreadCount: 0,
      readNames: newReadNames,
    });

    updated.forEach((n) => {
      markNotificationAsRead(String(n.name)).catch((err) => {
        console.error("[NotificationStore] Failed to mark all as read:", err);
      });
    });
  },

  startPolling: () => {
    const existing = get().pollingIntervalId;
    if (existing) return;

    const id = setInterval(() => {
      const { pollingIntervalId } = get();
      if (!pollingIntervalId) return;
      get().fetchNotifications();
    }, 30000);

    set({ pollingIntervalId: id });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  clearAll: () => {
    get().stopPolling();
    localStorage.removeItem(STORAGE_KEY);
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      lastUpdated: 0,
      selectedNotification: null,
      readNames: new Set(),
    });
  },

  selectNotification: (notification: NotificationItem | null) => {
    if (notification) {
      const { notifications } = get();
      const latest = notifications.find((n) => n.name === notification.name) || notification;
      set({ selectedNotification: latest });
    } else {
      set({ selectedNotification: null });
    }
  },
}));
