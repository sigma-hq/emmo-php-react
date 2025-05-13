import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React from "react";

interface SubTaskFormData {
    data: {
        expected_value_min: string;
        expected_value_max: string;
        unit_of_measure: string;
    };
    errors: {
        expected_value_min?: string;
        expected_value_max?: string;
        unit_of_measure?: string;
    };
    setData: (field: string, value: string) => void;
}

interface InspectionsSubTasksListProps {
    subTaskForm: SubTaskFormData;
}

export default function InspectionsSubTasksList({ subTaskForm }: InspectionsSubTasksListProps): React.ReactNode {
    return <>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="sub-task-min">Minimum Value</Label>
                <Input
                    id="sub-task-min"
                    type="number"
                    name="expected_value_min"
                    value={subTaskForm.data.expected_value_min}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => subTaskForm.setData('expected_value_min', e.target.value)}
                    placeholder="Min value"
                    step="any" />
                {subTaskForm.errors.expected_value_min && (
                    <p className="text-sm text-red-500">{subTaskForm.errors.expected_value_min}</p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="sub-task-max">Maximum Value</Label>
                <Input
                    id="sub-task-max"
                    type="number"
                    name="expected_value_max"
                    value={subTaskForm.data.expected_value_max}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => subTaskForm.setData('expected_value_max', e.target.value)}
                    placeholder="Max value"
                    step="any" />
                {subTaskForm.errors.expected_value_max && (
                    <p className="text-sm text-red-500">{subTaskForm.errors.expected_value_max}</p>
                )}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="sub-task-unit">Unit of Measure</Label>
            <Input
                id="sub-task-unit"
                name="unit_of_measure"
                value={subTaskForm.data.unit_of_measure}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => subTaskForm.setData('unit_of_measure', e.target.value)}
                placeholder="e.g., mm, °C, kg" />
            {subTaskForm.errors.unit_of_measure && (
                <p className="text-sm text-red-500">{subTaskForm.errors.unit_of_measure}</p>
            )}
        </div>
    </>;
}
