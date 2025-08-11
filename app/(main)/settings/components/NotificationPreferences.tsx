export function NotificationPreferences() {
  // Replace with your actual notification logic
  return (
    <div className="flex flex-col gap-2 py-2">
      <span>Notifications</span>
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked />
        Email Notifications
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" />
        Push Notifications
      </label>
    </div>
  );
} 