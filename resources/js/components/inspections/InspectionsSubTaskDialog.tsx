import { InspectionSubTask } from "@/pages/inspection/show";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import InspectionsSubTasksList from "./InspectionsSubTasksList";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";

interface SubTaskFormData {
    inspection_task_id: string;
    name: string;
    description: string;
    type: 'yes_no' | 'numeric' | 'none';
    expected_value_boolean: string;
    expected_value_min: string;
    expected_value_max: string;
    unit_of_measure: string;
    errors?: Record<string, string>;
    data: SubTaskFormData;
    setData: (field: keyof SubTaskFormData, value: string) => void;
}

export default function InspectionsSubTaskDialog({ isSubTaskDialogOpen, setIsSubTaskDialogOpen, editingSubTask, handleSubTaskSubmit, subTaskForm, formError, isSubmitting }: {
    isSubTaskDialogOpen: boolean;
    setIsSubTaskDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingSubTask: InspectionSubTask | null;
    handleSubTaskSubmit: (e: React.FormEvent) => Promise<void>;
    subTaskForm: SubTaskFormData;
    formError: string | null;
    isSubmitting: boolean;
}) {
    return <Dialog open={isSubTaskDialogOpen} onOpenChange={setIsSubTaskDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-xl p-0 overflow-hidden">
            <form onSubmit={handleSubTaskSubmit} className="flex flex-col h-full">
                {/* Header with visual treatment */}
                <div className="bg-gradient-to-r from-[var(--emmo-green-primary)] to-[var(--emmo-green-secondary)] p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    Add Inspection Sub-Task
                                </DialogTitle>
                                <DialogDescription className="text-white/80 max-w-sm">
                                    Enter details for a new inspection sub-task.
                                </DialogDescription>
                            </div>
                <input
                    type="hidden"
                    name="inspection_task_id"
                    value={subTaskForm.data.inspection_task_id} />

                <div className="space-y-2 p-6 overflow-y-auto">
                    <Label htmlFor="sub-task-name">Name</Label>
                    <Input
                        id="sub-task-name"
                        name="name"
                        value={subTaskForm.data.name}
                        onChange={e => subTaskForm.setData('name', e.target.value)}
                        placeholder="Enter sub-task name"
                        required />
                    {subTaskForm.errors.name && (
                        <p className="text-sm text-red-500">{subTaskForm.errors.name}</p>
                    )}
                </div>

                <div className="space-y-2 p-6 overflow-y-auto">
                    <Label htmlFor="sub-task-description">Description (Optional)</Label>
                    <Textarea
                        id="sub-task-description"
                        name="description"
                        value={subTaskForm.data.description}
                        onChange={e => subTaskForm.setData('description', e.target.value)}
                        placeholder="Enter sub-task description"
                        rows={3} />
                    {subTaskForm.errors.description && (
                        <p className="text-sm text-red-500">{subTaskForm.errors.description}</p>
                    )}
                </div>

                <div className="space-y-2 p-6 overflow-y-auto">
                    <Label>Type</Label>
                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="type"
                                value="none"
                                checked={subTaskForm.data.type === 'none'}
                                onChange={() => subTaskForm.setData('type', 'none')}
                                className="w-4 h-4 text-[var(--emmo-green-primary)]" />
                            <span>Simple check (no value)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="type"
                                value="yes_no"
                                checked={subTaskForm.data.type === 'yes_no'}
                                onChange={() => subTaskForm.setData('type', 'yes_no')}
                                className="w-4 h-4 text-[var(--emmo-green-primary)]" />
                            <span>Yes/No Question</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="type"
                                value="numeric"
                                checked={subTaskForm.data.type === 'numeric'}
                                onChange={() => subTaskForm.setData('type', 'numeric')}
                                className="w-4 h-4 text-[var(--emmo-green-primary)]" />
                            <span>Numeric Measurement</span>
                        </label>
                    </div>
                    {subTaskForm.errors.type && (
                        <p className="text-sm text-red-500">{subTaskForm.errors.type}</p>
                    )}
                </div>

                {/* Conditional fields based on type selection */}
                {subTaskForm.data.type === 'yes_no' && (
                    <div className="space-y-2 p-6 overflow-y-auto">
                        <Label>Expected Answer</Label>
                        <div className="flex flex-col space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="expected_value_boolean"
                                    value="true"
                                    checked={subTaskForm.data.expected_value_boolean === 'true'}
                                    onChange={() => subTaskForm.setData('expected_value_boolean', 'true')}
                                    className="w-4 h-4 text-[var(--emmo-green-primary)]" />
                                <span>Pass if YES</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="expected_value_boolean"
                                    value="false"
                                    checked={subTaskForm.data.expected_value_boolean === 'false'}
                                    onChange={() => subTaskForm.setData('expected_value_boolean', 'false')}
                                    className="w-4 h-4 text-[var(--emmo-green-primary)]" />
                                <span>Pass if NO</span>
                            </label>
                        </div>
                        {subTaskForm.errors.expected_value_boolean && (
                            <p className="text-sm text-red-500">{subTaskForm.errors.expected_value_boolean}</p>
                        )}
                    </div>
                )}

                {subTaskForm.data.type === 'numeric' && (
                    <InspectionsSubTasksList subTaskForm={subTaskForm} />
                )}

                {formError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                        {formError}
                    </div>
                )}

                <DialogFooter className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSubTaskDialogOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[var(--emmo-green-primary)] hover:bg-[var(--emmo-green-secondary)]"
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : (editingSubTask ? 'Update Sub-Task' : 'Add Sub-Task')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>;
}