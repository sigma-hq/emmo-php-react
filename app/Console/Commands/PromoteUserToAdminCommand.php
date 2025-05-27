<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteUserToAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:promote-admin {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote an existing user to admin role';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email') ?? $this->ask('Enter the email of the user to promote');
        
        // Find the user
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return Command::FAILURE;
        }
        
        if ($user->role === 'admin') {
            $this->info("User '{$user->name}' is already an admin.");
            return Command::SUCCESS;
        }
        
        // Promote the user to admin
        $user->role = 'admin';
        $user->save();
        
        $this->info("User '{$user->name}' has been promoted to admin!");
        $this->table(
            ['Name', 'Email', 'Role'],
            [[$user->name, $user->email, $user->role]]
        );
        
        return Command::SUCCESS;
    }
} 