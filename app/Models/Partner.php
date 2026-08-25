<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasFactory;

    protected $table = 'partners';
    protected $primaryKey = 'id';
 public $timestamps = false;
    protected $fillable = [
        'uuid',
        'name',
        'balance',
        'still_active',
    ];

    // Define relationships if necessary
    public function transactionsAsSender()
    {
        // Adjusted to match 'name_id' in the Transaction model
        return $this->hasMany(Transaction::class, 'name_id', 'id'); // Assuming name_id relates to the sender's id
    }

    public function transactionsAsReceiver()
    {
        // Adjusted to match 'product_id' in the Transaction model
        return $this->hasMany(Transaction::class, 'product_id', 'id'); // Assuming product_id relates to the receiver's id
    }

    public function assignments()
    {
        return $this->hasMany(CompanyAssignment::class, 'partner_id', 'id');
    }


public static function findByUuid($uuid)
    {
        return self::where('uuid', $uuid)->first();
    }

    
}
