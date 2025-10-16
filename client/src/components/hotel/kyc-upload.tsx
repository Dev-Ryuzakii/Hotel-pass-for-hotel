import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadKycDocument } from "@/lib/hotelService";
import { useAuth } from "@/hooks/use-auth";

export default function KycUpload() {
  const { hotel } = useAuth();
  const { toast } = useToast();
  const [document, setDocument] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("ID_CARD");
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return uploadKycDocument(formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "KYC document uploaded successfully",
      });
      setDocument(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload KYC document",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document) {
      toast({
        title: "Error",
        description: "Please select a document to upload",
        variant: "destructive",
      });
      return;
    }

    if (!hotel) {
      toast({
        title: "Error",
        description: "You must be logged in to upload documents",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("document", document);
    formData.append("documentType", documentType);
    
    uploadMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Document Upload</CardTitle>
        <CardDescription>Upload your identification documents for verification</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="ID_CARD">ID Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVERS_LICENSE">Driver's License</option>
              <option value="BUSINESS_REGISTRATION">Business Registration</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document">Document File</Label>
            <Input
              id="document"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setDocument(files[0]);
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: JPG, PNG, PDF. Max size: 5MB
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isUploading || !document}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}