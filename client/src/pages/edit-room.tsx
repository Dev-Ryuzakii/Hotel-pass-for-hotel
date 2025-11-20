import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertRoomSchema, roomTypes, amenityOptions } from "@shared/schema";
import type { Room } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { uploadPropertyImages } from "@/lib/hotelService";

type RoomFormValues = z.infer<typeof insertRoomSchema>;

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [initialImages, setInitialImages] = useState<string[]>([]);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: {
      name: "",
      type: "Standard",
      price: 0,
      capacity: 1,
      description: "",
      totalRooms: 1,
      availableRooms: 1,
      amenities: [],
      images: [],
      isAvailable: true,
    },
  });

  // Fetch room details
  const { data: room, isLoading: isRoomLoading } = useQuery<Room>({
    queryKey: [`/api/hotel/properties/${id}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/hotel/properties/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Set form values when room data is loaded
  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        description: room.description,
        totalRooms: room.totalRooms,
        availableRooms: room.availableRooms,
        amenities: room.amenities,
        images: room.images,
        isAvailable: room.isAvailable,
      });
      setSelectedImages(room.images);
      setInitialImages(room.images);
    }
  }, [room, form]);

  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      const payload = {
        name: data.name,
        location: data?.type ?? "Unknown Location",
        price: data.price,
        amenities: data.amenities,
        description: data.description,
        bedrooms: data.totalRooms,
        bathrooms: data.availableRooms > 0 ? data.availableRooms : 1,
        maxGuests: data.capacity,
        images: data.images?.map((url) => ({ url })),
      };

      return apiRequest("PATCH", `/api/hotel/properties/${id}`, payload);
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/properties"] });
      queryClient.invalidateQueries({ queryKey: [`/api/hotel/properties/${id}`] });
      toast({ 
        title: "Success",
        description: "Room updated successfully",
        variant: "default"
      });
      setLocation(`/rooms/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating room",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      try {
        const response = await uploadPropertyImages(formData);
        const data = response.data as {
          success?: boolean;
          data?: { url: string }[];
          message?: string;
        };

        if (!data?.success || !Array.isArray(data.data)) {
          throw new Error(data?.message ?? "Failed to upload images");
        }

        return data.data.map((image) => image.url);
      } catch (error) {
        console.error("Upload error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to upload images");
      }
    },
    onError: (error) => {
      toast({
        title: "Error uploading images",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (selectedImages.length + files.length > 15) {
      toast({
        title: "Error",
        description: "Maximum 15 images allowed",
        variant: "destructive"
      });
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImages(prev => {
          const newImages = [...prev, result];
          // Update form's images field
          form.setValue('images', newImages);
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: RoomFormValues) => {
    if (selectedImages.length < 3) {
      toast({
        title: "Error",
        description: "Please upload at least 3 images",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload new images if they are base64
      const newImages = selectedImages.filter(img => img.startsWith('data:'));
      const existingImages = selectedImages.filter(img => !img.startsWith('data:'));
      
      let uploadedImageUrls: string[] = [];
      if (newImages.length > 0) {
        try {
          // Convert base64 to Files
          const files = await Promise.all(
            newImages.map(async (base64, index) => {
              const res = await fetch(base64);
              const blob = await res.blob();
              return new File([blob], `room-image-${index}.jpg`, { type: 'image/jpeg' });
            })
          );
          
          uploadedImageUrls = await uploadImagesMutation.mutateAsync(files);
        } catch (error) {
          console.error('Error uploading images:', error);
          toast({
            title: "Error uploading images",
            description: error instanceof Error ? error.message : 'Failed to upload images',
            variant: "destructive"
          });
          return;
        }
      }

      // Combine existing URLs with newly uploaded URLs
      const finalImageUrls = [...existingImages, ...uploadedImageUrls];
      
      // Update form data with final image URLs
      const updatedData = {
        ...data,
        images: finalImageUrls,
      };

      // Update form's images field
      form.setValue('images', finalImageUrls);

      await updateRoomMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Error during room update:', error);
      toast({
        title: "Error updating room",
        description: error instanceof Error ? error.message : 'Failed to update room',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update form's images field
      form.setValue('images', newImages);
      return newImages;
    });
  };

  if (isRoomLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <p className="text-muted-foreground">The requested room could not be found.</p>
          <Button onClick={() => setLocation("/rooms")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation(`/rooms/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Room Details
          </Button>
          <h1 className="text-2xl font-bold">Edit Room</h1>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Deluxe Suite" {...field} />
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
                    <FormLabel>Room Type</FormLabel>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Night (₦)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="totalRooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Rooms</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the room and its features..."
                        className="min-h-[100px]"
                        {...field}
                      />
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
                    <div className="grid grid-cols-2 gap-2">
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
              <div>
                <FormLabel>Images (Min: 3, Max: 15)</FormLabel>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Room ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {selectedImages.length < 15 && (
                    <div className="relative w-full h-24 border-2 border-dashed rounded-md flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                {form.formState.errors.images && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.images.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  'Update Room'
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </>
  );
}