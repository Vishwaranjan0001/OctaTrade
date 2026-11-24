import {
  getNotifications,
  markAllNotificationsRead,
  clearNotifications
} from "../services/notificationServices.js";

export async function getMyNotifications(req, res) {
  try {
    const notifications = await getNotifications(req.userId);

    return res.status(200).json({
      notifications: notifications
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to retrieve notifications"
    });
  }
}

export async function readAllMyNotifications(req, res) {
  try {
    await markAllNotificationsRead(req.userId);

    return res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to update notifications"
    });
  }
}

export async function clearMyNotifications(req, res) {
  try {
    await clearNotifications(req.userId);

    return res.status(200).json({
      message: "Notifications cleared"
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to clear notifications"
    });
  }
}
