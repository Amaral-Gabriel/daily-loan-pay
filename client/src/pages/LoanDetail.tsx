import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LoanDetailProps {
  params: { loanId: string };
}

export default function LoanDetail({ params }: LoanDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const loanId = parseInt(params.loanId);
  const [pollingInterval, setPollingInterval] = useState<number | false>(false);

  const loanQuery = trpc.loans.getDetails.useQuery(
    { loanId },
    { enabled: isAuthenticated }
  );

  const paymentStatusQuery = trpc.payments.getDailyStatus.useQuery(
    { loanId },
    { enabled: isAuthenticated, refetchInterval: pollingInterval }
  );

  const generatePaymentMutation = trpc.payments.generateDaily.useMutation({
    onSuccess: () => {
      toast.success("Payment QR Code generated!");
      setPollingInterval(5000);
      paymentStatusQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate payment");
    },
  });

  const handleGeneratePayment = async () => {
    await generatePaymentMutation.mutateAsync({ loanId });
  };

  const handleCopyPixKey = () => {
    if (paymentStatusQuery.data?.pixKey) {
      navigator.clipboard.writeText(paymentStatusQuery.data.pixKey);
      toast.success("PIX key copied to clipboard!");
    }
  };

  const handleStopPolling = () => {
    setPollingInterval(false);
  };

  if (loanQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!loanQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Loan not found</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Back to Loans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loan = loanQuery.data;
  const payment = paymentStatusQuery.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Loans
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Loan #{loan.id} Details
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${loan.totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Payment</p>
                <p className="text-2xl font-semibold text-blue-600">
                  ${loan.dailyAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${loan.paidAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining Amount</p>
                <p className="text-2xl font-semibold text-red-600">
                  ${loan.remainingAmount.toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${loan.progressPercentage}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {loan.progressPercentage.toFixed(1)}% paid
                </p>
              </div>
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm">
                  <span className="text-gray-600">Days Elapsed:</span>
                  <span className="font-semibold ml-2">{loan.daysElapsed}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-semibold ml-2">{loan.daysRemaining}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loan.status !== "active" ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">
                    This loan is {loan.status === "paid_off" ? "paid off" : "overdue"}
                  </p>
                  <p className="text-sm text-gray-500">
                    No payment needed at this time
                  </p>
                </div>
              ) : !payment ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No payment generated for today
                  </p>
                  <Button
                    onClick={handleGeneratePayment}
                    disabled={generatePaymentMutation.isPending}
                    className="w-full"
                  >
                    {generatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Payment"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Amount Due Today</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${loan.dailyAmount.toFixed(2)}
                    </p>
                  </div>

                  {payment.pixQrCode && (
                    <div className="flex justify-center py-4">
                      <img
                        src={payment.pixQrCode}
                        alt="PIX QR Code"
                        className="w-48 h-48 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  {payment.pixKey && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">PIX Key (Copy & Paste)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={payment.pixKey}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                        />
                        <Button
                          onClick={handleCopyPixKey}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          payment.status === "confirmed"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm font-semibold capitalize">
                        {payment.status}
                      </span>
                    </div>
                  </div>

                  {payment.status === "confirmed" ? (
                    <Button
                      onClick={handleStopPolling}
                      variant="outline"
                      className="w-full"
                    >
                      Payment Confirmed
                    </Button>
                  ) : (
                    <Button
                      onClick={() => paymentStatusQuery.refetch()}
                      variant="outline"
                      className="w-full gap-2"
                      disabled={paymentStatusQuery.isFetching}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          paymentStatusQuery.isFetching ? "animate-spin" : ""
                        }`}
                      />
                      Check Status
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
