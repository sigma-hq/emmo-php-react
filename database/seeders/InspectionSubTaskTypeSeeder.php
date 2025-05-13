<?php

namespace Database\Seeders;

use App\Models\InspectionSubTask;
use App\Models\InspectionTask;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InspectionSubTaskTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find existing subtasks or tasks to use
        $tasks = InspectionTask::take(3)->get();
        
        if ($tasks->isEmpty()) {
            $this->command->info('No inspection tasks found. Please create tasks first.');
            return;
        }
        
        foreach ($tasks as $index => $task) {
            // Check if the task has subtasks
            $existingSubtasks = $task->subTasks;
            
            if ($existingSubtasks->isEmpty()) {
                // Create new subtasks with different types
                $this->createSubtasksForTask($task);
            } else {
                // Update some existing subtasks
                $this->updateExistingSubtasks($existingSubtasks);
            }
        }
        
        $this->command->info('Inspection subtask types updated successfully!');
    }
    
    /**
     * Create new subtasks with different types for a task.
     */
    private function createSubtasksForTask(InspectionTask $task): void
    {
        // Create a yes/no type subtask
        InspectionSubTask::create([
            'inspection_task_id' => $task->id,
            'name' => 'Check if equipment is powered off',
            'description' => 'Verify the equipment has been completely powered down before proceeding',
            'type' => 'yes_no',
            'expected_value_boolean' => true,
            'status' => 'pending',
            'sort_order' => 1,
        ]);
        
        // Create a numeric type subtask
        InspectionSubTask::create([
            'inspection_task_id' => $task->id,
            'name' => 'Measure ambient temperature',
            'description' => 'Record the temperature in the vicinity of the equipment',
            'type' => 'numeric',
            'expected_value_min' => 15.0,
            'expected_value_max' => 30.0,
            'unit_of_measure' => '°C',
            'status' => 'pending',
            'sort_order' => 2,
        ]);
        
        // Create a standard "none" type subtask
        InspectionSubTask::create([
            'inspection_task_id' => $task->id,
            'name' => 'Document any visible damage',
            'description' => 'Take notes of any visible issues with the equipment',
            'type' => 'none',
            'status' => 'pending',
            'sort_order' => 3,
        ]);
    }
    
    /**
     * Update existing subtasks with different types.
     */
    private function updateExistingSubtasks($subtasks): void
    {
        foreach ($subtasks as $index => $subtask) {
            if ($index % 3 === 0) {
                // Update to yes/no type
                $subtask->update([
                    'type' => 'yes_no',
                    'expected_value_boolean' => $index % 2 === 0, // Alternate true/false
                    'expected_value_min' => null,
                    'expected_value_max' => null,
                    'unit_of_measure' => null,
                ]);
            } else if ($index % 3 === 1) {
                // Update to numeric type
                $subtask->update([
                    'type' => 'numeric',
                    'expected_value_boolean' => null,
                    'expected_value_min' => 20.0,
                    'expected_value_max' => 100.0,
                    'unit_of_measure' => ($index % 2 === 0) ? 'psi' : 'mm',
                ]);
            } else {
                // Leave as "none" type
                $subtask->update([
                    'type' => 'none',
                    'expected_value_boolean' => null,
                    'expected_value_min' => null,
                    'expected_value_max' => null,
                    'unit_of_measure' => null,
                ]);
            }
        }
    }
}
