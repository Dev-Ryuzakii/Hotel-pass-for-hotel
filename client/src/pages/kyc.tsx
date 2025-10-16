import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import KycUpload from "@/components/hotel/kyc-upload";
import { Hotel } from "@shared/schema";

interface HotelWithKyc extends Hotel {
  kycStatus?: string;
}

export default function KycPage() {
  const { data: hotel, isLoading } = useQuery<HotelWithKyc>({
    queryKey: ["/api/hotel"],
  });

  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (hotel?.kycStatus) {
      setKycStatus(hotel.kycStatus);
    }
  }, [hotel]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your KYC verification to comply with regulatory requirements
          </p>
        </div>

        {kycStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {kycStatus === "APPROVED" && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Verification Approved</span>
                  </>
                )}
                {kycStatus === "PENDING" && (
                  <>
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span>Verification Pending</span>
                  </>
                )}
                {kycStatus === "REJECTED" && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>Verification Rejected</span>
                  </>
                )}
                {!["APPROVED", "PENDING", "REJECTED"].includes(kycStatus || "") && (
                  <span>Verification Status</span>
                )}
              </CardTitle>
              <CardDescription>
                {kycStatus === "APPROVED" && "Your KYC documents have been verified successfully."}
                {kycStatus === "PENDING" && "Your KYC documents are under review. This may take 1-3 business days."}
                {kycStatus === "REJECTED" && "Your KYC documents were rejected. Please upload new documents."}
                {!["APPROVED", "PENDING", "REJECTED"].includes(kycStatus || "") && 
                  "Complete your KYC verification to start accepting bookings."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={kycStatus === "APPROVED" ? "default" : kycStatus === "PENDING" ? "secondary" : "destructive"}>
                {kycStatus}
              </Badge>
            </CardContent>
          </Card>
        )}

        <KycUpload />
      </div>
    </div>
  );
}