import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function Settings() {
  const { hotel } = useAuth();

  if (!hotel) return null;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-lg">{hotel.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{hotel.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-lg">{hotel.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="text-lg">{hotel.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">City</label>
              <p className="text-lg">{hotel.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-lg">{format(new Date(hotel.createdAt), 'PPP')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
