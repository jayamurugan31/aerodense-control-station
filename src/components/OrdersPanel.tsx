import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export interface Order {
  id: string;
  packageType: string;
  weight: string;
  pickup: string;
  delivery: string;
  status: "Pending" | "Approved" | "In Flight" | "Delivered";
}

const statusColor: Record<Order["status"], string> = {
  Pending: "bg-aero-warning/15 text-aero-warning border-aero-warning/30",
  Approved: "bg-primary/15 text-primary border-primary/30",
  "In Flight": "bg-aero-cyan/15 text-aero-cyan border-aero-cyan/30",
  Delivered: "bg-aero-success/15 text-aero-success border-aero-success/30",
};

interface OrdersPanelProps {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  selectedOrderId?: string;
  onAddOrder?: (order: Order) => void;
}

const OrdersPanel = ({ orders, onSelectOrder, selectedOrderId, onAddOrder }: OrdersPanelProps) => {
  const generateOrder = async (addOrder: (order: Order) => void) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content: "Generate a realistic drone delivery order. Return only JSON with fields: packageType, weight (e.g. '2.5 kg'), pickup, delivery. Make it varied and realistic."
            },
            {
              role: "user",
              content: "Generate a new delivery order"
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate order");
      }

      const data = await response.json();
      const orderData = JSON.parse(data.choices[0].message.content);

      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-4)}`,
        packageType: orderData.packageType,
        weight: orderData.weight,
        pickup: orderData.pickup,
        delivery: orderData.delivery,
        status: "Pending",
      };

      addOrder(newOrder);
    } catch (error) {
      console.error("Failed to generate order:", error);
    }
  };
  return (
    <div className="aero-panel flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Incoming Orders</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{orders.length} orders</span>
          {onAddOrder && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateOrder(onAddOrder)}
              className="h-6 px-2 text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generate
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelectOrder?.(order)}
            className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors ${
              selectedOrderId === order.id ? "bg-secondary/70" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-primary font-semibold">{order.id}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor[order.status]}`}>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-foreground font-medium">{order.packageType}</p>
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>{order.weight}</span>
              <span>{order.pickup} → {order.delivery}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrdersPanel;
