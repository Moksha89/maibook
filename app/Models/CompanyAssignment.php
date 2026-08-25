<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyAssignment extends Model
{
    use HasFactory;
    // Define the table name if it's not following Laravel's naming convention
    protected $table = 'company_assignments';

  public $timestamps = false;

   // Set the primary key if different from 'id'
    protected $primaryKey = 'id';

    // Indicate if the IDs are auto-incrementing
    public $incrementing = true;

    // Define the key type
    protected $keyType = 'int';

    
        protected $fillable =[

'partner_id',
'company_id',
'timestamp',
    ];

    

    // Define the relationship between CompanyAssignment and Partner
    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id', 'uuid');
    }

    // Define the relationship between CompanyAssignment and Company (optional if needed)
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }
}
