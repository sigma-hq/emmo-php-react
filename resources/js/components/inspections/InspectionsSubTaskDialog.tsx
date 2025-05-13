import { InspectionSubTask } from "@/pages/inspection/show";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import InspectionsSubTasksList from "./InspectionsSubTasksList";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";

export default function InspectionsSubTaskDialog({ isSubTaskDialogOpen, setIsSubTaskDialogOpen, editingSubTask, handleSubTaskSubmit, subTaskForm, formError, isSubmitting }: {
    isSubTaskDialogOpen: boolean;
    setIsSubTaskDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingSubTask: InspectionSubTask | null;
    handleSubTaskSubmit: (e: React.FormEvent) => Promise<void>;
    subTaskForm: any; // TODO: Replace with proper type
    formError: string | null;
    isSubmitting: boolean;
}) {
    return <Dialog open={isSubTaskDialogOpen} onOpenChange={setIsSubTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingSubTask ? 'Edit Sub-Task' : 'Add Sub-Task'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubTaskSubmit} className="space-y-4 py-2">
                <input
                    type="hidden"
                    name="inspection_task_id"
                    value={subTaskForm.data.inspection_task_id} />

                <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="space-y-2">
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
                    <div className="space-y-2">
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

                <DialogFooter>
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