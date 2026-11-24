import { Order } from "../models/Order.js";
import { getMarketQuote } from "../services/marketDataServices.js";
import { priceConditionMet } from "../services/orderServices.js";
import { enqueueOrder } from "./scheduler.js";

// LIMIT and STOP_LOSS orders wait as OPEN. Every few seconds this checks their prices,
// and when an order's price is reached it goes back to PENDING and into the queue.
const CHECK_EVERY_MS = 3000;

let timer = null;
let checking = false;

async function checkOpenOrders() {
  // A slow check must not overlap the next one.
  if (checking) {
    return;
  }

  checking = true;

  try {
    const openOrders = await Order.find({
      status: "OPEN"
    });

    // One quote per symbol, not one per order.
    const priceBySymbol = {};

    for (const order of openOrders) {
      if (priceBySymbol[order.symbol] === undefined) {
        try {
          const quote = await getMarketQuote(order.symbol);
          priceBySymbol[order.symbol] = Math.round(quote.price * 100);
        } catch (error) {
          priceBySymbol[order.symbol] = null;
        }
      }

      const pricePaise = priceBySymbol[order.symbol];

      if (!pricePaise || !priceConditionMet(order, pricePaise)) {
        continue;
      }

      // Only one process may move it back: the update matches only while it is still OPEN.
      const triggeredOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: "OPEN"
        },
        {
          status: "PENDING"
        },
        {
          returnDocument: "after"
        }
      );

      if (triggeredOrder) {
        await enqueueOrder(triggeredOrder);
        console.log(`Trigger: ${triggeredOrder.orderType} ${triggeredOrder.side} ${triggeredOrder.symbol} reached its price, queued again`);
      }
    }
  } catch (error) {
    console.error("Trigger watcher error:", error.message);
  } finally {
    checking = false;
  }
}

export function startTriggerWatcher() {
  timer = setInterval(checkOpenOrders, CHECK_EVERY_MS);
}

export function stopTriggerWatcher() {
  clearInterval(timer);
}
