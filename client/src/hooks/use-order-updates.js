import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";

const rejectionMessages = {
  INSUFFICIENT_FUNDS: "not enough balance",
  INSUFFICIENT_HOLDING: "not enough shares",
  HOLDING_NOT_FOUND: "you do not own this stock",
  WALLET_NOT_FOUND: "wallet not found",
  QUOTE_UNAVAILABLE: "price not available",
  INVALID_QUOTE: "price not available",
  EXECUTION_ERROR: "something went wrong"
};

function useOrderUpdates() {
  const token = useAppStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io({ auth: { token } });

    socket.on("order:update", (order) => {
      const title = `${order.side} ${order.quantity} ${order.symbol}`;

      if (order.status === "COMPLETED") {
        toast.success(`${title} executed`);
      } else {
        toast.error(`${title} rejected: ${rejectionMessages[order.rejectionReason] || "unknown reason"}`);
      }

      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}

export {
  useOrderUpdates
};
