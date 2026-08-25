<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'user_id',
        'email',
        'password',
        'username',
        'phone',
        'country',
        'country_code',
        'otp_auth_enables',
        'has_admin_priviledges',
        'is_admin',
        'is_employee',
        'companies_acess',
        'is_manager',
        'employee_tab',
        'backup_tab',
        'first_device_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];


// Define the relationship to user_company_access
    public function companyAccess(): HasMany // Corrected return type
    {
        return $this->hasMany(UserCompanyAccess::class, 'user_id', 'id');
    }





}
