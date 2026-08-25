<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    // The default primary key 'id' will be used, no need to specify it
    protected $table = 'companies';

    protected $fillable = [
        'name',
        'company_id', // You can keep this if it's a separate field
        'still_active',
    ];

    // Define relationships
    public function assignments()
    {
        return $this->hasMany(CompanyAssignment::class, 'company_id', 'company_id');
    }

    public function partners()
    {
        return $this->hasManyThrough(Partner::class, CompanyAssignment::class, 'company_id', 'uuid', 'company_id', 'partner_id');
    }
}
