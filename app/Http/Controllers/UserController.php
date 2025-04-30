<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        // Count total users to handle first admin creation
        $totalUsers = User::count();
        
        $users = User::when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
        
        return Inertia::render('users', [
            'users' => $users,
            'isFirstUser' => $totalUsers === 0,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $totalUsers = User::count();
        
        // Base validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];
        
        // If this is the first user, make them an admin regardless of what was selected
        if ($totalUsers === 0) {
            $validated = $request->validate($rules);
            $validated['role'] = 'admin';
        } else {
            // For subsequent users, validate the role field
            $rules['role'] = ['required', Rule::in(['admin', 'operator'])];
            $validated = $request->validate($rules);
        }
        
        // Always hash the password
        $validated['password'] = Hash::make($validated['password']);
        
        $user = User::create($validated);
        
        return redirect()->route('users')->with('success', 'User created successfully');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        return Inertia::render('user/show', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        // Basic validation for required fields
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'operator'])],
        ]);
        
        // Check if current user is trying to change their own admin status
        $currentUser = auth()->user();
        if ($currentUser->id === $user->id && $currentUser->isAdmin() && $validated['role'] !== 'admin') {
            return redirect()->back()->with('error', 'You cannot remove your own admin privileges');
        }
        
        // Ensure there's at least one admin user in the system
        if ($user->isAdmin() && $validated['role'] !== 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->back()->with('error', 'Cannot remove the last admin user');
            }
        }
        
        // Only update password if provided
        if ($request->filled('password')) {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);
            
            $validated['password'] = Hash::make($request->password);
        }
        
        $user->update($validated);
        
        return redirect()->route('users')->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('users')->with('error', 'You cannot delete your own account');
        }
        
        // Prevent deleting the last admin
        if ($user->isAdmin()) {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->route('users')->with('error', 'Cannot delete the last admin user');
            }
        }
        
        $user->delete();
        
        return redirect()->route('users')->with('success', 'User deleted successfully');
    }
}
