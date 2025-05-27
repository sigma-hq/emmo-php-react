<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-admin {name?} {email?} {password?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name') ?? $this->ask('Enter the admin name');
        $email = $this->argument('email') ?? $this->ask('Enter the admin email');
        $password = $this->argument('password') ?? $this->secret('Enter the admin password');
        
        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ]);
        
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }
        
        // Create the admin user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);
        
        $this->info("Admin user '{$user->name}' created successfully!");
        $this->table(
            ['Name', 'Email', 'Role'],
            [[$user->name, $user->email, $user->role]]
        );
        
        return Command::SUCCESS;
    }
} 