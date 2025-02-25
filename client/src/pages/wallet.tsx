import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { WalletTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function WalletPage() {
  const { hotel } = useAuth();
  const { toast } = useToast();

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/hotel/wallet/transactions"],
  });

  const initiateWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/hotel/wallet/withdraw");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/wallet/transactions"] });
      toast({ title: "Withdrawal initiated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to initiate withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hotel) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Wallet</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₦{Number(hotel.walletBalance).toLocaleString()}</div>
            {hotel.bankAccountNumber ? (
              <Button
                onClick={() => initiateWithdrawalMutation.mutate()}
                disabled={initiateWithdrawalMutation.isPending || Number(hotel.walletBalance) === 0}
                className="mt-4"
              >
                {initiateWithdrawalMutation.isPending ? "Processing..." : "Withdraw to Bank Account"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">
                Add your bank account details in settings to enable withdrawals
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div>Loading transactions...</div>
            ) : !transactions?.length ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.createdAt), 'PPp')}
                      </TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="capitalize">{transaction.status}</TableCell>
                      <TableCell className="text-right">
                        ₦{Number(transaction.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
