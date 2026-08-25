<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCompanyAccess extends Model
{
    use HasFactory;

    protected $table = 'user_company_access'; // Specify the table name if different

    public $timestamps = false;

    // Specify fillable columns to allow mass assignment
    protected $fillable = [
        'user_id',
        'company_id',
        'access_level',
    ];

    // You can define any relationships here if needed

     // Define the relationship between CompanyAssignment and Partner
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Define the relationship between CompanyAssignment and Company (optional if needed)
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }
}
