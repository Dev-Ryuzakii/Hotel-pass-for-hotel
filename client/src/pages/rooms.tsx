import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { z } from "zod";

type RoomFormValues = z.infer<typeof insertRoomSchema>;

export default function RoomsPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

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

  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/hotel/rooms"],
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      if (selectedRoom) {
        return apiRequest("PATCH", `/api/hotel/rooms/${selectedRoom.id}`, data);
      }
      return apiRequest("POST", "/api/hotel/rooms", {
        ...data,
        availableRooms: data.totalRooms,
      });
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/rooms"] });
      toast({ 
        title: "Success",
        description: selectedRoom ? "Room updated successfully" : "Room created successfully",
        variant: "default"
      });
      setIsOpen(false);
      setSelectedRoom(null);
      form.reset();
      setSelectedImages([]);
    },
    onError: (error: Error) => {
      toast({
        title: selectedRoom ? "Error updating room" : "Error creating room",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hotel/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel/rooms"] });
      toast({ 
        title: "Success",
        description: "Room deleted successfully",
        variant: "default"
      });
      setDeleteDialogOpen(false);
      setSelectedRoom(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting room",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      try {
        const response = await fetch('http://127.0.0.1:3000/api/upload/images', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Upload error response:', errorData);
          throw new Error(errorData || 'Failed to upload images');
        }
        
        const data = await response.json();
        return data.urls as string[];
      } catch (error) {
        console.error('Upload error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to upload images');
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

      await createRoomMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Error during room creation:', error);
      toast({
        title: "Error creating room",
        description: error instanceof Error ? error.message : 'Failed to create room',
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

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setSelectedImages(room.images);
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
    setIsOpen(true);
  };

  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setDeleteDialogOpen(true);
  };

  const formContent = (
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
              {selectedRoom ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            selectedRoom ? 'Update Room' : 'Create Room'
          )}
        </Button>
      </form>
    </Form>
  );

  if (isLoading) {
    return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-8">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{selectedRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                <DialogDescription>
                  {selectedRoom 
                    ? 'Edit the details of your room. All fields are required.'
                    : 'Add a new room to your hotel. All fields are required.'}
                </DialogDescription>
            </DialogHeader>
              {formContent}
          </DialogContent>
        </Dialog>
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room) => (
            <Card key={room.id} className="relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">Open menu</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                      Edit Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteRoom(room)}
                      className="text-red-600"
                    >
                      Delete Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-full h-48 bg-muted">
                {room.images?.length > 0 ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Plus className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-medium">₦{room.price.toLocaleString()}/night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span>{room.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Capacity</span>
                    <span>{room.capacity} persons</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <span>{room.availableRooms}/{room.totalRooms} rooms</span>
                </div>
                </div>
                {room.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                </div>
              </div>
                )}
              </div>
          </Card>
        ))}
      </div>
    </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room
              and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRoom && deleteRoomMutation.mutate(selectedRoom.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}