import {
  POLICIES,
  getSchedulingPolicy,
  setSchedulingPolicy
} from "../scheduler/scheduler.js";
import { getSchedulingMetrics } from "../services/metricsServices.js";

export async function getPolicy(req, res) {
  try {
    const policy = await getSchedulingPolicy();

    return res.status(200).json({
      policy: policy,
      policies: POLICIES
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to read scheduling policy"
    });
  }
}

export async function changePolicy(req, res) {
  try {
    const policy = req.body.policy;

    if (!POLICIES.includes(policy)) {
      return res.status(400).json({
        message: "policy must be FCFS, PRIORITY or ROUND_ROBIN"
      });
    }

    await setSchedulingPolicy(policy);

    return res.status(200).json({
      message: `Scheduling policy changed to ${policy}`,
      policy: policy
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to change scheduling policy"
    });
  }
}

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
