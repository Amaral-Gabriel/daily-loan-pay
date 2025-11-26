import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Plus } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const loansQuery = trpc.loans.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{APP_TITLE}</h1>
          <p className="text-gray-600 mb-8">Manage your daily loan payments with ease</p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Loans</h2>
          <p className="text-gray-600">Manage your active loans and make daily payments</p>
        </div>

        {loansQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : loansQuery.data && loansQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loansQuery.data.map((loan) => (
              <Card
                key={loan.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLocation(`/loan/${loan.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">Loan #{loan.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${parseFloat(loan.totalAmount as any).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-xl font-semibold text-red-600">
                        ${parseFloat(loan.remainingAmount as any).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Daily Payment</p>
                      <p className="text-lg font-semibold text-blue-600">
                        ${parseFloat(loan.dailyAmount as any).toFixed(2)}
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(parseFloat(loan.paidAmount as any) / parseFloat(loan.totalAmount as any)) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {((parseFloat(loan.paidAmount as any) / parseFloat(loan.totalAmount as any)) * 100).toFixed(1)}% paid
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">No active loans</p>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Request a Loan
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
