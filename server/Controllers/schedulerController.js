import { getSchedulingMetrics } from "../services/metricsServices.js";

export async function getMetrics(req, res) {
  try {
    let minutes = 60;

    if (req.query.minutes !== undefined) {
      minutes = Number(req.query.minutes);
    }

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return res.status(400).json({
        message: "minutes must be a positive number"
      });
    }

    const metrics = await getSchedulingMetrics(minutes);

    return res.status(200).json({
      minutes: minutes,
      metrics: metrics
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to calculate scheduling metrics"
    });
  }
}
