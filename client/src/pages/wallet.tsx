import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import { ArrowUpRight, ArrowDownLeft, History, Wallet, Building2 } from "lucide-react";

interface Transaction {
  id: number;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  description: string;
}

interface BankAccount {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

export default function WalletPage() {
  const { hotel } = useAuth();
  const { toast } = useToast();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/hotel/wallet/transactions"],
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const fetchBankAccounts = async () => {
    try {
      setIsLoadingBanks(true);
      const response = await apiRequest("GET", "/api/hotel/bank-accounts");
      const data = (await response.json()) as BankAccount[];
      setBankAccounts(data);
      if (data.length > 0) {
        setBankAccount(data[0].account_number);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bank accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return apiRequest("POST", "/api/hotel/withdrawals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/withdrawals"] });
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
        variant: "default",
      });
      setWithdrawDialogOpen(false);
      setAmount("");
      setBankAccount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    if (!hotel) {
      toast({
        title: "Unauthenticated",
        description: "Please sign in again to perform this action",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > Number(hotel.walletBalance)) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({ amount: numAmount });
  };

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-100/80 min-h-screen p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Wallet</h1>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/settings"}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Manage Bank Accounts
              </Button>
              <Button 
                onClick={() => {
                  fetchBankAccounts();
                  setWithdrawDialogOpen(true);
                }}
                disabled={!hotel.bankAccountNumber}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Withdraw Funds
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Current Balance</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatAmount(Number(hotel.walletBalance))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Available for withdrawal
                </p>
                {!hotel.bankAccountNumber && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Add your bank account details in settings to enable withdrawals
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {transaction.type === "deposit" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            transaction.type === "deposit"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {transaction.type === "deposit" ? "+" : "-"}
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No transactions yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>
                Enter the amount you want to withdraw to your bank account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (NGN)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Available balance: {formatAmount(Number(hotel.walletBalance))}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account</Label>
                <Select 
                  value={bankAccount} 
                  onValueChange={setBankAccount}
                  disabled={isLoadingBanks}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.account_number} value={account.account_number}>
                        {account.bank_name} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankAccounts.length === 0 && !isLoadingBanks && (
                  <p className="text-sm text-yellow-600">
                    No bank accounts found. Add one in settings.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleWithdraw}
                disabled={isLoadingBanks || bankAccounts.length === 0}
              >
                Withdraw
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
