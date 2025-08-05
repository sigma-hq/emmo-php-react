import { InspectionSubTask } from "@/pages/inspection/show";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";

interface EditSubTaskResultDialogProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    subTask: InspectionSubTask | null;
    onSuccess?: () => void;
}

export default function EditSubTaskResultDialog({ 
    isOpen, 
    setIsOpen, 
    subTask, 
    onSuccess 
}: EditSubTaskResultDialogProps) {
    const [formData, setFormData] = useState({
        value_boolean: false,
        value_numeric: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form data when subTask changes
    useEffect(() => {
        if (subTask) {
            setFormData({
                value_boolean: subTask.recorded_value_boolean ?? false,
                value_numeric: subTask.recorded_value_numeric?.toString() ?? '',
                notes: subTask.notes ?? ''
            });
        }
    }, [subTask]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subTask) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const data = {
                sub_task_type: subTask.type,
                value_boolean: subTask.type === 'yes_no' ? formData.value_boolean : null,
                value_numeric: subTask.type === 'numeric' ? parseFloat(formData.value_numeric) : null,
                notes: formData.notes
            };

            router.put(route('api.inspection-sub-tasks.update-result', subTask.id), data, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsOpen(false);
                    onSuccess?.();
                },
                onError: (errors) => {
                    setError('Failed to update result. Please try again.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (err) {
            setError('An unexpected error occurred.');
            setIsSubmitting(false);
        }
    };

    if (!subTask) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                        <DialogTitle className="text-2xl font-bold mb-2">
                            Edit Recorded Result
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Update the recorded result for: {subTask.name}
                        </DialogDescription>
                    </div>

                    <div className="space-y-4 p-6 overflow-y-auto">
                        {/* Current recorded value display */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Current Recorded Value
                            </Label>
                            <div className="text-sm text-gray-600">
                                {subTask.type === 'yes_no' && subTask.recorded_value_boolean !== null && (
                                    <span className={`font-medium ${subTask.recorded_value_boolean ? 'text-green-600' : 'text-red-600'}`}>
                                        {subTask.recorded_value_boolean ? 'Yes' : 'No'}
                                    </span>
                                )}
                                {subTask.type === 'numeric' && subTask.recorded_value_numeric !== null && (
                                    <span className="font-medium text-blue-600">
                                        {subTask.recorded_value_numeric} {subTask.unit_of_measure || ''}
                                    </span>
                                )}
                                {subTask.type === 'none' && (
                                    <span className="font-medium text-gray-600">Completed</span>
                                )}
                            </div>
                        </div>

                        {/* New value input */}
                        {subTask.type === 'yes_no' && (
                            <div className="space-y-2">
                                <Label>New Recorded Value</Label>
                                <div className="flex flex-col space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="value_boolean"
                                            value="true"
                                            checked={formData.value_boolean === true}
                                            onChange={() => setFormData(prev => ({ ...prev, value_boolean: true }))}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span>Yes</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="value_boolean"
                                            value="false"
                                            checked={formData.value_boolean === false}
                                            onChange={() => setFormData(prev => ({ ...prev, value_boolean: false }))}
                                            className="w-4 h-4 text-blue-500"
                                        />
                                        <span>No</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {subTask.type === 'numeric' && (
                            <div className="space-y-2">
                                <Label htmlFor="value_numeric">New Recorded Value</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="value_numeric"
                                        type="number"
                                        step="any"
                                        value={formData.value_numeric}
                                        onChange={(e) => setFormData(prev => ({ ...prev, value_numeric: e.target.value }))}
                                        placeholder="Enter numeric value"
                                        className="flex-1"
                                    />
                                    {subTask.unit_of_measure && (
                                        <span className="text-sm text-gray-500 whitespace-nowrap">
                                            {subTask.unit_of_measure}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any additional notes about this result..."
                                rows={3}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-gray-100 p-4 flex justify-end gap-3 bg-gray-50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Result'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 