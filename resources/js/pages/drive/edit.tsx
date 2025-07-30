import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import InputError from '@/components/input-error';

interface Drive {
    id: number;
    name: string;
    drive_ref: string;
    location: string | null;
    notes: string | null;
    status: 'active' | 'inactive' | 'maintenance' | 'retired';
}

interface DriveEditProps {
    drive: Drive;
}

export default function DriveEdit({ drive }: DriveEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: drive.name,
        drive_ref: drive.drive_ref,
        location: drive.location || '',
        notes: drive.notes || '',
        status: drive.status,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/drives/${drive.id}`);
    };

    const breadcrumbs = [
        { title: 'Drives', href: '/drive' },
        { title: drive.name, href: `/drives/${drive.id}` },
        { title: 'Edit', href: `/drives/${drive.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Drive - ${drive.name}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Drive
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Update drive information and settings
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Edit Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Drive Information</CardTitle>
                        <CardDescription>
                            Update the basic information for {drive.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Drive Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Drive Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter drive name"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <InputError message={errors.name} />}
                            </div>

                            {/* Drive Reference */}
                            <div className="space-y-2">
                                <Label htmlFor="drive_ref">Drive Reference</Label>
                                <Input
                                    id="drive_ref"
                                    type="text"
                                    value={data.drive_ref}
                                    onChange={(e) => setData('drive_ref', e.target.value)}
                                    placeholder="Enter drive reference (e.g., DRV-123)"
                                    className={errors.drive_ref ? 'border-red-500' : ''}
                                />
                                {errors.drive_ref && <InputError message={errors.drive_ref} />}
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Enter drive location"
                                    className={errors.location ? 'border-red-500' : ''}
                                />
                                {errors.location && <InputError message={errors.location} />}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select drive status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="retired">Retired</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <InputError message={errors.status} />}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Enter any additional notes about this drive"
                                    rows={4}
                                    className={errors.notes ? 'border-red-500' : ''}
                                />
                                {errors.notes && <InputError message={errors.notes} />}
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
