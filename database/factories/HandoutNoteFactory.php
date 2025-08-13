<?php

namespace Database\Factories;

use App\Models\HandoutNote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HandoutNote>
 */
class HandoutNoteFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = HandoutNote::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['electrical', 'mechanical', 'hydraulic', 'workshop', 'utilities'];
        
        return [
            'title' => $this->faker->sentence(3, 6),
            'content' => $this->faker->paragraphs(2, true),
            'category' => $this->faker->randomElement($categories),
            'user_id' => User::factory(),
        ];
    }

    /**
     * Indicate that the note is in a specific category.
     */
    public function category(string $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
        ]);
    }

    /**
     * Indicate that the note belongs to a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
