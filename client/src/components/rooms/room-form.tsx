import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Room } from "@shared/schema";
import { insertRoomSchema, roomTypes, amenityOptions } from "@shared/schema";
import type { z } from "zod";

interface RoomFormProps {
  room?: Room | null;
  onSuccess: () => void;
}

type FormData = z.infer<typeof insertRoomSchema>;

export default function RoomForm({ room, onSuccess }: RoomFormProps) {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: room
      ? {
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          price: room.price,
          description: room.description,
          amenities: room.amenities,
          images: room.images,
          totalRooms: room.totalRooms,
          availableRooms: room.availableRooms,
          isAvailable: room.isAvailable,
        }
      : {
          name: "",
          type: "Standard",
          capacity: 2,
          price: 100,
          description: "",
          amenities: [],
          images: [],
          totalRooms: 1,
          availableRooms: 1,
          isAvailable: true,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        location: data.type,
        price: data.price,
        amenities: data.amenities,
        description: data.description,
        bedrooms: data.totalRooms,
        bathrooms: data.availableRooms > 0 ? data.availableRooms : 1,
        maxGuests: data.capacity,
        images: data.images?.map((url) => ({ url })),
      };

      if (room) {
        return apiRequest("PATCH", `/api/hotel/properties/${room.id}`, payload);
      }
      return apiRequest("POST", "/api/hotel/properties", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/properties"] });
      toast({ title: `Room ${room ? "updated" : "created"} successfully` });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileReaders: Promise<string>[] = [];

    // Convert each file to Base64
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
      });

      reader.readAsDataURL(file);
      fileReaders.push(promise);
    }

    // Update form state with Base64 images
    Promise.all(fileReaders).then((base64Images) => {
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, ...base64Images]);
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amenities"
          render={() => (
            <FormItem>
              <FormLabel>Amenities</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {amenityOptions.map((amenity) => (
                  <FormField
                    key={amenity}
                    control={form.control}
                    name="amenities"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={amenity}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(amenity)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, amenity])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== amenity)
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {amenity}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Images</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display uploaded images */}
        {form.watch("images")?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.watch("images").map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Uploaded ${index}`}
                className="w-24 h-24 object-cover rounded"
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="totalRooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Rooms</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availableRooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Rooms</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : room ? "Update Room" : "Create Room"}
        </Button>
      </form>
    </Form>
  );
}