import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/confirmation/$orderId")({
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDownloadQR = async () => {
    if (!order) return;

    const ticketData = {
      orderId: orderId,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.lineTotal).toFixed(2),
      })),
      total: parseFloat(order.totalPrice).toFixed(2),
      orderType: order.orderType,
      payment: paymentLabels[order.paymentMethod] ?? order.paymentMethod,
      status: order.orderStatus,
      email: order.customerEmail ?? "",
    };

    const qrString = JSON.stringify(ticketData, null, 2);

    try {
      const url = await QRCode.toDataURL(qrString);

      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${order.orderNumber}.png`;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your order...</p>
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground mb-2">
            Order Not Found
          </p>
          <p className="text-muted-foreground mb-6">
            We couldn't find that order. It may have been removed or the link is
            invalid.
          </p>
          <Link to="/order">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const paymentLabels = {
    cash: "Cash at Pickup",
    credit: "Credit Card at Pickup",
    debit: "Debit Card at Pickup",
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
            <CheckCircle
              size={44}
              className="text-green-500 dark:text-green-400"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground mt-2">
            Order{" "}
            <span className="font-semibold text-foreground">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Status banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 flex items-center gap-3 mb-5">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Please show this confirmation at pickup
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-background rounded-xl shadow-sm border p-6 mb-4">
          <h2 className="font-semibold text-base mb-4 text-foreground">
            Items Ordered
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.orderItemId}
                className="flex justify-between text-sm"
              >
                <span className="text-foreground">
                  {item.name}{" "}
                  <span className="text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </span>
                <span className="font-medium text-foreground">
                  ${parseFloat(item.lineTotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-base text-foreground">
            <span>Total</span>
            <span>${parseFloat(order.totalPrice).toFixed(2)}</span>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-background rounded-xl shadow-sm border p-6 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Type</span>
            <span className="font-medium text-foreground capitalize">
              {order.orderType.replace("-", " ")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium text-foreground">
              {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-amber-600 capitalize">
              {order.orderStatus}
            </span>
          </div>
          {order.dateCreated && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Placed</span>
              <span className="font-medium text-foreground">
                {formatDateTime(order.dateCreated)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scheduled Pickup</span>
            <span className="font-medium text-foreground">
              {order.scheduledTime
                ? formatDateTime(order.scheduledTime)
                : "As soon as ready"}
            </span>
          </div>
          {order.customerEmail && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">
                {order.customerEmail}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleDownloadQR}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 mb-4"
        >
          Download Ticket
        </Button>
        <Link to="/order">
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2">
            Order Again
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
